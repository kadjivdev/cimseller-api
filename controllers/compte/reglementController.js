import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import path, { dirname } from 'path';
import fs from 'fs';
import { reglementValidation } from '../../database/validations/compte/reglementValidation.js';
import { fileURLToPath } from 'url';
import { error } from 'console';

const formatData = (recu) => ({
    ...recu,
    preuve: recu.preuve ? `${process.env.BASE_URL}/public/uploads/${recu.preuve}` : null
})

const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'uploads')

const deletePreuve = async (reglement) => {
    console.log("Suppression de la preuve du recu :", reglement)
    try {
        if (!reglement || !reglement.preuve) return
        await fs.promises.unlink(path.join(UPLOADS_DIR, reglement.preuve))
    } catch (error) {
        console.log("Error de suppression de la preuve du réglement :", reglement)
    }
}

const formatClient = (client) => {
    let approvisionnementAmount = client.approvisionnements?.reduce((a, appro) => (a + appro.montant), 0) ?? 0;
    let reglementAmount = client.reglements?.reduce((a, regle) => (a + regle.montant), 0) ?? 0;
    let solde = approvisionnementAmount - reglementAmount

    return {
        ...client,
        approvisionnementAmount,
        reglementAmount,
        solde
    }
};

// Get all réglements from the database and log them
const getReglements = async (req, res) => {
    console.log("Getting réglements")

    try {
        const reglements = await prisma.reglement.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                //  relations
                vente: {
                    select: {
                        id: true,
                        code: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        raison_sociale: true
                    }
                },
                compteBancaire: {
                    select: {
                        id: true,
                        intitule: true,
                        numero: true
                    }
                },
                createdBy: {
                    select: {
                        fullname: true,
                    }
                },
                validatedBy: {
                    select: {
                        fullname: true,
                    }
                },
                typeDetailRecu: {
                    select: {
                        name: true
                    }
                }
            }
        });

        console.log("Reglements recuperes avec succès!")
        res.json(reglements.map(formatData));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch reglements' });
        throw error;
    }
};

// create a new reglement in the database and log the result
const createReglement = async (req, res) => {
    console.log('Début d\'insertion des reglements:', req.body); // Log the incoming request body
    let user = req.user?.user

    try {
        const result = await prisma.$transaction(async (tx) => {
            // validation
            const last = await tx.reglement.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true }
            });
            const resultReglement = reglementValidation.safeParse({ ...req.body, code: `REG-00${last?.id ? (last?.id + 1) : 1}` });

            console.log("resultReglement :", resultReglement.data)

            if (!resultReglement.success) {
                throw { errorStatus: 400, payLoad: { errors: resultReglement.error.format() } }
            }

            // traitement du vente
            let vente = null
            if (resultReglement.data?.venteId) {
                vente = await tx.vente.findFirst({
                    where: { id: resultReglement.data?.venteId, deletedAt: null }
                });
            }

            if (!vente) {
                throw { errorStatus: 404, payLoad: { error: 'Cette vente n\'existe pas' } }
            }

            if (!vente.validatedAt || !vente.validatedById || vente.statutId != 2) {
                throw { errorStatus: 404, payLoad: { error: 'Cette vente n\'est pas validée' } }
            }

            if (resultReglement.data?.clientId != vente.clientId) {
                throw { errorStatus: 400, payLoad: { error: "Le client choisi ne correspond pas à celui à qui appartient la vente." } }
            }

            // traitement du client
            const client = await tx.client.findFirst({
                where: { id: resultReglement.data?.clientId, deletedAt: null },
                include: {
                    oldDette: true,
                    approvisionnements: {
                        where: { NOT: { validatedAt: null } },
                    },
                    reglements: {
                        where: { NOT: { validatedAt: null } },
                    },
                }
            });

            if (!client) {
                throw { errorStatus: 404, payLoad: { error: 'Ce client n\'existe pas' } }
            }

            // traitement du compte bancaire
            if (resultReglement.data?.compteBancaireId) {
                let compteBancaire = await tx.compteBancaire.findFirst({
                    where: { id: resultReglement.data?.compteBancaireId, deletedAt: null }
                });

                if (!compteBancaire) {
                    throw { errorStatus: 404, payLoad: { error: 'Ce compte bancaire n\'existe pas' } }
                }
            }

            // traitement du type detail recu
            if (resultReglement.data?.typeDetailRecuId) {
                let typeDetailRecu = await tx.typeDetailRecuCommande.findFirst({
                    where: { id: resultReglement.data?.typeDetailRecuId, deletedAt: null }
                });

                if (!typeDetailRecu) {
                    throw { errorStatus: 404, payLoad: { error: 'Ce type de détail de reçu n\'existe pas' } }
                }
            }

            // traitement du reference
            if (resultReglement.data?.reference) {
                let reglement = await tx.reglement.findFirst({
                    where: { reference: resultReglement.data?.reference, deletedAt: null }
                });

                if (reglement) {
                    throw { errorStatus: 409, payLoad: { error: 'Cette référence existe déjà' } }
                }
            }

            /**
             * verification du contournement du solde ancien
             * on verifie si le client avait une dette ancienne
             * si oui on verifie si le user a choisi de contourner la dette ancienne
             *  */
            let clientOldDette = client?.oldDette?.dette - client?.oldDette?.solved
            if (clientOldDette > 0 && !req.body?.deblocDette) {
                throw { errorStatus: 400, payLoad: { error: `Le Client ${client.raison_sociale} dispose d'une dette ancienne de ${clientOldDette.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} Fcfa. Veuillez vous rendre sur son compte pour régler cette ancienne dette d'abord.` } }
            }

            // insertion du reglement de la base de données et log du résultat
            const newReglement = await tx.reglement.create({
                data: {
                    ...resultReglement.data,
                    preuve: req.file?.filename,
                    createdById: user?.id
                },
            });

            console.log("Fin d'insertion des règlements")

            return newReglement
        })
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to create reglement:', error);

        res.status(error.errorStatus).json(error.payLoad);
        throw error;
    }
};

// update a reglement in the database and log the result
const updateReglement = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    try {
        const result = await prisma.$transaction(async (tx) => {
            // found
            const reglementFound = await tx.reglement.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            })
            if (!reglementFound) return res.status(400).json({ error: " Cet reglement n'existe pas!" })
            if (reglementFound.validatedAt) return res.status(400).json({ error: 'Cet reglement est déjà validé' });

            // validation (réutiliser les champs existants si non envoyés dans le body)
            const resultReglement = reglementValidation.safeParse({
                ...reglementFound,
                ...req.body,
            })

            if (!resultReglement.success) {
                return res.status(400).json({
                    errors: resultReglement.error.format()
                });
            }

            // traitement de la vente
            let vente = null
            if (resultReglement.data?.venteId) {
                vente = await tx.vente.findFirst({
                    where: { id: resultReglement.data?.venteId }
                });
            }

            if (!vente) {
                return res.status(404).json({ error: 'Cette vente n\'existe pas' });
            }

            if (!vente.createdAt) {
                return res.status(404).json({ error: 'Cette vente n\'est pas validée' });
            }

            // traitement du client
            let client = await tx.client.findFirst({
                where: { id: resultReglement.data?.clientId },
                include: {
                    oldDette: true,
                    approvisionnements: {
                        where: { NOT: { validatedAt: null } },
                    },
                    reglements: {
                        where: { NOT: { validatedAt: null } },
                    },
                }
            });

            if (!client) {
                return res.status(404).json({ error: 'Ce client n\'existe pas' });
            }

            const clientFormated = formatClient(client)

            if (clientFormated?.solde < resultReglement?.data?.montant) {
                throw { errorStatus: 400, payLoad: { error: `Le solde ${clientFormated?.solde?.toLocaleString({ minimumFractionDigits: 2 })} du client est insuffisant par rapport au reglement de ${reglementFound?.data?.montant}` } }
            }

            if (vente?.montant < resultReglement?.data?.montant) {
                throw { errorStatus: 400, payLoad: { error: `Le montant ${vente?.montant?.toLocaleString({ minimumFractionDigits: 2 })} de la vente est insuffisant par rapport au reglement de ${reglementFound?.data?.montant}` } }
            }

            // traitement du compte bancaire
            if (resultReglement.data?.compteBancaireId) {
                let compteBancaire = await tx.compteBancaire.findFirst({
                    where: { id: resultReglement.data?.compteBancaireId }
                });

                if (!compteBancaire) {
                    return res.status(404).json({ error: 'Ce compte bancaire n\'existe pas' });
                }
            }

            // traitement du type detail recu
            if (resultReglement.data?.typeDetailRecuId) {
                let typeDetailRecu = await tx.typeDetailRecuCommande.findFirst({
                    where: { id: resultReglement.data?.typeDetailRecuId }
                });

                if (!typeDetailRecu) {
                    return res.status(404).json({ error: 'Ce type de détail de reçu n\'existe pas' });
                }
            }

            // traitement du reference
            if (resultReglement.data?.reference) {
                let reglement = await tx.reglement.findFirst({
                    where: { reference: resultReglement.data?.reference, deletedAt: null, NOT: { id: parseInt(id) } }
                });

                if (reglement) {
                    return res.status(409).json({ error: 'Cette référence existe déjà' });
                }
            }

            /**
            * verification du contournement du solde ancien
            * on verifie si le client avait une dette ancienne
            * si oui on verifie si le user a choisi de contourner la dette ancienne
            *  */
            let clientOldDette = client?.oldDette?.dette - client?.oldDette?.solved
            if (clientOldDette > 0 && !req.body?.deblocDette) {
                return res.status(400).json({ error: `Le Client ${client.raison_sociale} dispose d'une dette ancienne de ${clientOldDette.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} Fcfa. Veuillez vous rendre sur son compte pour régler cette ancienne dette d'abord.` })
            }

            // modification du reglement de la base de données et log du résultat
            const updatedReglement = await tx.reglement.update({
                where: { id: parseInt(id), deletedAt: null },
                data: {
                    ...resultReglement.data,
                    preuve: req.file?.filename,
                },
            });

            console.log("Update de reglement effectué avec succès!")
            return updatedReglement
        })
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to create reglement:', error);
        res.status(error.errorStatus).json(error.payLoad);
    }
};

// valider un reglement from the database and log the result
const validerReglement = async (req, res) => {
    console.log("Début de validation d'un reglement :", req.body)
    await prisma.$transaction(async (tx) => {
        const { id } = req.params;

        // if (!req.body?.validationComment) {
        //     return res.status(400).json({ error: 'Le commentaire de validation est requis' });
        // }

        try {
            let reglementFound = await tx.reglement.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!reglementFound) return res.status(404).json({ error: 'Reglement non trouvé' });

            if (reglementFound.validatedAt) return res.status(400).json({ error: 'Cet reglement est déjà validé' });

            // traitement du client
            let client = await tx.client.findFirst({
                where: { id: reglementFound?.clientId },
            });

            // validation du reglement de la base de données et log du résultat
            await tx.reglement.update({
                where: { id: parseInt(id), deletedAt: null },
                data: {
                    validatedAt: new Date(),
                    validationComment: req.body?.validationComment,
                    validatedById: req.user?.user?.id
                }
            });

            // suppression de la preuve du reçu
            await deletePreuve(reglementFound)

            console.log("Fin de validation de reglement")
            res.status(200).json({ message: 'Reglement validé avec succès!' });
        } catch (error) {
            console.error('Failed to validate reglement:', error);
            res.status(500).json({ error: 'Erreure de validation de l\'reglement' });
        }
    })
};

// delete un reglement from the database and log the result
const deleteReglement = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;
        try {
            let reglementFound = await tx.reglement.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!reglementFound) return res.status(404).json({ error: 'Reglement non trouvé' });
            if (reglementFound.validatedAt) return res.status(400).json({ error: 'Cet reglement est déjà validé' });

            // suppression du reglement de la base de données et log du résultat
            await tx.reglement.update({
                where: { id: parseInt(id), deletedAt: null },
                data: { deletedAt: new Date() }
            });

            // suppression de la preuve du reçu
            await deletePreuve(reglementFound)

            res.status(200).json({ message: 'Reglement supprimé avec succès!' });
        } catch (error) {
            console.error('Failed to delete reglement:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la commande reçu' });
        }
    })
};

export { getReglements, createReglement, updateReglement, validerReglement, deleteReglement };
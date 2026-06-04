import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import path, { dirname } from 'path';
import fs from 'fs';
import { reglementValidation } from '../../database/validations/compte/reglementValidation.js';
import { fileURLToPath } from 'url';

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

// Get all réglements from the database and log them
const getReglements = async (req, res) => {
    console.log("Getting réglements")

    try {
        const reglements = await prisma.reglement.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                //  relations
                vente: true,
                client: true,
                compteBancaire: true,
                createdBy: {
                    select: {
                        fullname: true,
                        email: true
                    }
                },
                validatedBy: {
                    select: {
                        fullname: true,
                        email: true
                    }
                },
                typeDetailRecu: true
            }
        });

        res.json(reglements.map(formatData));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch reglements' });
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

// create a new reglement in the database and log the result
const createReglement = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body
    let user = req.user?.user

    await prisma.$transaction(async (tx) => {
        try {
            // validation
            const last = await tx.reglement.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true }
            });
            const resultReglement = reglementValidation.safeParse({ ...req.body, code: `REG-00${last?.id ? (last?.id + 1) : 1}` });

            console.log("resultReglement :", resultReglement.data)

            if (!resultReglement.success) {
                return res.status(400).json({
                    errors: resultReglement.error.format()
                });
            }

            // traitement du vente
            if (resultReglement.data?.venteId) {
                let vente = await tx.vente.findFirst({
                    where: { id: resultReglement.data?.venteId, deletedAt: null }
                });

                if (!vente) {
                    return res.status(404).json({ error: 'Cette vente n\'existe pas' });
                }

                if (!vente.validatedAt) {
                    return res.status(404).json({ error: 'Cette vente n\'est pas validée' });
                }
            }


            // traitement du client
            if (resultReglement.data?.clientId) {
                let client = await tx.client.findFirst({
                    where: { id: resultReglement.data?.clientId, deletedAt: null }
                });

                if (!client) {
                    return res.status(404).json({ error: 'Ce client n\'existe pas' });
                }
            }

            // traitement du compte bancaire
            if (resultReglement.data?.compteBancaireId) {
                let compteBancaire = await tx.compteBancaire.findFirst({
                    where: { id: resultReglement.data?.compteBancaireId, deletedAt: null }
                });

                if (!compteBancaire) {
                    return res.status(404).json({ error: 'Ce compte bancaire n\'existe pas' });
                }
            }

            // traitement du type detail recu
            if (resultReglement.data?.typeDetailRecuId) {
                let typeDetailRecu = await tx.typeDetailRecuCommande.findFirst({
                    where: { id: resultReglement.data?.typeDetailRecuId, deletedAt: null }
                });

                if (!typeDetailRecu) {
                    return res.status(404).json({ error: 'Ce type de détail de reçu n\'existe pas' });
                }
            }

            // traitement du reference
            if (resultReglement.data?.reference) {
                let reglement = await tx.reglement.findFirst({
                    where: { reference: resultReglement.data?.reference, deletedAt: null }
                });

                if (reglement) {
                    return res.status(409).json({ error: 'Cette référence existe déjà' });
                }
            }

            // insertion du reglement de la base de données et log du résultat
            const newReglement = await tx.reglement.create({
                data: {
                    ...resultReglement.data,
                    preuve: req.file?.filename,
                    createdById: user?.id
                },
            });

            res.status(201).json(newReglement);
        } catch (error) {
            console.error('Failed to create reglement:', error);

            res.status(500).json({ error: error.message || 'Failed to create reglement' });
            throw error;
        }
    })
};

// update a reglement in the database and log the result
const updateReglement = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
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
            if (resultReglement.data?.venteId) {
                let vente = await tx.vente.findFirst({
                    where: { id: resultReglement.data?.venteId }
                });

                if (!vente) {
                    return res.status(404).json({ error: 'Cette vente n\'existe pas' });
                }

                if (!vente.createdAt) {
                    return res.status(404).json({ error: 'Cette vente n\'est pas validée' });
                }
            }

            // traitement du client
            if (resultReglement.data?.clientId) {
                let client = await tx.client.findFirst({
                    where: { id: resultReglement.data?.clientId }
                });

                if (!client) {
                    return res.status(404).json({ error: 'Ce client n\'existe pas' });
                }
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

            // modification du reglement de la base de données et log du résultat
            const updatedReglement = await tx.reglement.update({
                where: { id: parseInt(id), deletedAt: null },
                data: {
                    ...resultReglement.data,
                    preuve: req.file?.filename,
                },
            });

            res.status(201).json(updatedReglement);
        } catch (error) {
            console.error('Failed to create reglement:', error);

            res.status(500).json({ error: error.message || 'Failed to create reglement' });
            throw error;
        }
    })
};

// valider un reglement from the database and log the result
const validerReglement = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;

        if (!req.body?.validationComment) {
            return res.status(400).json({ error: 'Le commentaire de validation est requis' });
        }

        try {
            let reglementFound = await tx.reglement.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!reglementFound) return res.status(404).json({ error: 'Reglement non trouvé' });

            if (reglementFound.validatedAt) return res.status(400).json({ error: 'Cet reglement est déjà validé' });

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
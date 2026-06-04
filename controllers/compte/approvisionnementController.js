import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import path, { dirname } from 'path';
import fs from 'fs';
import { approvisionnementValidation } from '../../database/validations/compte/approvisionnementValidation.js';
import { fileURLToPath } from 'url';

const formatData = (recu) => ({
    ...recu,
    preuve: recu.preuve ? `${process.env.BASE_URL}/public/uploads/${recu.preuve}` : null
})

const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'uploads')

const deletePreuve = async (approvisionnement) => {
    console.log("Suppression de la preuve du recu :", approvisionnement)
    try {
        if (!approvisionnement || !approvisionnement.preuve) return
        await fs.promises.unlink(path.join(UPLOADS_DIR, approvisionnement.preuve))
    } catch (error) {
        console.log("Error de suppression de la preuve de l'approvisionnement :", approvisionnement)
    }
}

// Get all approvisionnements from the database and log them
const getApprovisionnements = async (req, res) => {
    console.log("Getting approvisionnements")

    try {
        const approvisionnements = await prisma.approvisionnement.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                //  relations
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

        res.json(approvisionnements.map(formatData));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch approvisionnements' });
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

// create a new approvisionnement in the database and log the result
const createApprovisionnement = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body
    let user = req.user?.user

    await prisma.$transaction(async (tx) => {
        try {
            // validation
            const last = await tx.approvisionnement.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true }
            });
            const resultApprovisionnement = approvisionnementValidation.safeParse({ ...req.body, code: `APR-00${last?.id ? (last?.id + 1) : 1}` });

            console.log("resultApprovisionnement :", resultApprovisionnement.data)

            if (!resultApprovisionnement.success) {
                return res.status(400).json({
                    errors: resultApprovisionnement.error.format()
                });
            }

            // traitement du client
            if (resultApprovisionnement.data?.clientId) {
                let client = await tx.client.findFirst({
                    where: { id: resultApprovisionnement.data?.clientId, deletedAt: null }
                });

                if (!client) {
                    return res.status(404).json({ error: 'Ce client n\'existe pas' });
                }
            }

            // traitement du compte bancaire
            if (resultApprovisionnement.data?.compteBancaireId) {
                let compteBancaire = await tx.compteBancaire.findFirst({
                    where: { id: resultApprovisionnement.data?.compteBancaireId, deletedAt: null }
                });

                if (!compteBancaire) {
                    return res.status(404).json({ error: 'Ce compte bancaire n\'existe pas' });
                }
            }

            // traitement du type detail recu
            if (resultApprovisionnement.data?.typeDetailRecuId) {
                let typeDetailRecu = await tx.typeDetailRecuCommande.findFirst({
                    where: { id: resultApprovisionnement.data?.typeDetailRecuId, deletedAt: null }
                });

                if (!typeDetailRecu) {
                    return res.status(404).json({ error: 'Ce type de détail de reçu n\'existe pas' });
                }
            }

            // traitement du reference
            if (resultApprovisionnement.data?.reference) {
                let appro = await tx.approvisionnement.findFirst({
                    where: { reference: resultApprovisionnement.data?.reference, deletedAt: null }
                });

                if (appro) {
                    return res.status(409).json({ error: 'Cette référence existe déjà' });
                }
            }

            // insertion de la commande reçu
            const newApprovsionnement = await tx.approvisionnement.create({
                data: {
                    ...resultApprovisionnement.data,
                    preuve: req.file?.filename,
                    createdById: user?.id
                },
            });

            res.status(201).json(newApprovsionnement);
        } catch (error) {
            console.error('Failed to create approvisionnement:', error);

            res.status(500).json({ error: error.message || 'Failed to create approvisionnement' });
            throw error;
        }
    })
};

// update a approvisionnement in the database and log the result
const updateApprovisionnement = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
            // found
            const approvisionnementFound = await tx.approvisionnement.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            })
            if (!approvisionnementFound) return res.status(400).json({ error: " Cet approvisionnement n'existe pas!" })
            if (approvisionnementFound.validatedAt) return res.status(400).json({ error: 'Cet approvisionnement est déjà validé' });

            // validation (réutiliser les champs existants si non envoyés dans le body)
            const resultApprovisionnement = approvisionnementValidation.safeParse({
                ...approvisionnementFound,
                ...req.body,
            })

            if (!resultApprovisionnement.success) {
                return res.status(400).json({
                    errors: resultApprovisionnement.error.format()
                });
            }

            // traitement du client
            if (resultApprovisionnement.data?.clientId) {
                let client = await tx.client.findFirst({
                    where: { id: resultApprovisionnement.data?.clientId }
                });

                if (!client) {
                    return res.status(404).json({ error: 'Ce client n\'existe pas' });
                }
            }

            // traitement du compte bancaire
            if (resultApprovisionnement.data?.compteBancaireId) {
                let compteBancaire = await tx.compteBancaire.findFirst({
                    where: { id: resultApprovisionnement.data?.compteBancaireId }
                });

                if (!compteBancaire) {
                    return res.status(404).json({ error: 'Ce compte bancaire n\'existe pas' });
                }
            }

            // traitement du type detail recu
            if (resultApprovisionnement.data?.typeDetailRecuId) {
                let typeDetailRecu = await tx.typeDetailRecuCommande.findFirst({
                    where: { id: resultApprovisionnement.data?.typeDetailRecuId }
                });

                if (!typeDetailRecu) {
                    return res.status(404).json({ error: 'Ce type de détail de reçu n\'existe pas' });
                }
            }

            // traitement du reference
            if (resultApprovisionnement.data?.reference) {
                let appro = await tx.approvisionnement.findFirst({
                    where: { reference: resultApprovisionnement.data?.reference, deletedAt: null, NOT: { id: parseInt(id) } }
                });

                if (appro) {
                    return res.status(409).json({ error: 'Cette référence existe déjà' });
                }
            }

            // modification de l'approvisionnement de la base de données et log du résultat
            const updatedApprovisionnement = await tx.approvisionnement.update({
                where: { id: parseInt(id), deletedAt: null },
                data: {
                    ...resultApprovisionnement.data,
                    preuve: req.file?.filename,
                },
            });

            res.status(201).json(updatedApprovisionnement);
        } catch (error) {
            console.error('Failed to create approvisionnement:', error);

            res.status(500).json({ error: error.message || 'Failed to create approvisionnement' });
            throw error;
        }
    })
};

// valider un approvsionnement from the database and log the result
const validerApprovisionnement = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;

        if (!req.body?.validationComment) {
            return res.status(400).json({ error: 'Le commentaire de validation est requis' });
        }

        try {
            let approvisionnementFound = await tx.approvisionnement.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!approvisionnementFound) return res.status(404).json({ error: 'Approvisionnement non trouvé' });

            if (approvisionnementFound.validatedAt) return res.status(400).json({ error: 'Cet approvisionnement est déjà validé' });

            // validation de l'approvisionnement de la base de données et log du résultat
            await tx.approvisionnement.update({
                where: { id: parseInt(id), deletedAt: null },
                data: {
                    validatedAt: new Date(),
                    validationComment: req.body?.validationComment,
                    validatedById: req.user?.user?.id
                }
            });

            // suppression de la preuve du reçu
            await deletePreuve(approvisionnementFound)

            res.status(200).json({ message: 'Approvisionnement validé avec succès!' });
        } catch (error) {
            console.error('Failed to validate approvisionnement:', error);
            res.status(500).json({ error: 'Erreure de validation de l\'approvisionnement' });
        }
    })
};

// delete un approvsionnement from the database and log the result
const deleteApprovisionnement = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;
        try {
            let approvisionnementFound = await tx.approvisionnement.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!approvisionnementFound) return res.status(404).json({ error: 'Approvisionnement non trouvé' });
            if (approvisionnementFound.validatedAt) return res.status(400).json({ error: 'Cet approvisionnement est déjà validé' });

            // suppression de l'approvisionnement de la base de données et log du résultat
            await tx.approvisionnement.update({
                where: { id: parseInt(id), deletedAt: null },
                data: { deletedAt: new Date() }
            });

            // suppression de la preuve du reçu
            await deletePreuve(approvisionnementFound)

            res.status(200).json({ message: 'Approvisionnement supprimé avec succès!' });
        } catch (error) {
            console.error('Failed to delete approvisionnement:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la commande reçu' });
        }
    })
};

export { getApprovisionnements, createApprovisionnement, updateApprovisionnement, validerApprovisionnement, deleteApprovisionnement };
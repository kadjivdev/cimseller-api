import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import path, { dirname } from 'path';
import fs from 'fs';
import { commandeRecuValidation } from '../../database/validations/commande/commandeRecuValidation.js';
import { fileURLToPath } from 'url';

const formatData = (recu) => ({
    ...recu,
    preuve: recu.preuve ? `${process.env.BASE_URL}/public/uploads/${recu.preuve}` : null
})

const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'uploads')

const deletePreuve = async (recu) => {
    console.log("Suppression de la preuve du recu :", recu)
    try {
        if (!recu || !recu.preuve) return
        await fs.promises.unlink(path.join(UPLOADS_DIR, recu.preuve))
    } catch (error) {
        console.log("Error de suppression de la preuve du recu :", recu)
    }
}

// Get all commandeRecus from the database and log them
const getCommandeRecus = async (req, res) => {
    console.log("Getting commandeRecus")

    try {
        const commandeRecus = await prisma.commandeRecu.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                //  relations
                commande: true,
                createdBy: true,
                versements: true
            }
        });

        res.json(commandeRecus.map(formatData));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch commandeRecus' });
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

// create a new commandeRecu in the database and log the result
const createCommandeRecu = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body
    let user = req.user?.user

    await prisma.$transaction(async (tx) => {
        try {
            // validation
            const last = await tx.commandeRecu.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true }
            });
            const resultCommandeRecu = commandeRecuValidation.safeParse({ ...req.body, code: `BCR-00${last?.id ? (last?.id + 1) : 1}` });

            console.log("resultCommandeRecu :", resultCommandeRecu.data)

            if (!resultCommandeRecu.success) {
                return res.status(400).json({
                    errors: resultCommandeRecu.error.format()
                });
            }

            // traitement du commande
            if (resultCommandeRecu.data?.commandeId) {
                let commande = await tx.commande.findFirst({
                    where: { id: resultCommandeRecu.data?.commandeId, deletedAt: null }
                });

                if (!commande) {
                    return res.status(404).json({ error: 'Cette commande n\'existe pas' });
                }
            }

            // traitement de la reference
            if (resultCommandeRecu.data?.reference) {
                let recu = await prisma.commandeRecu.findFirst({
                    where: { reference: resultCommandeRecu.data?.reference }
                });

                if (recu) {
                    return res.status(404).json({ error: 'Cette reference existe déjà' });
                }
            }

            // insertion de la commande reçu
            const newCommandeRecu = await tx.commandeRecu.create({
                data: {
                    ...resultCommandeRecu.data,
                    preuve: req.file?.filename,
                    createdById: user?.id
                },
            });

            res.status(201).json(newCommandeRecu);
        } catch (error) {
            console.error('Failed to create commande recu:', error);

            res.status(500).json({ error: error.message || 'Failed to create commande recu' });
            throw error;
        }
    })
};

// update a commandeRecu in the database and log the result
const updateCommandeRecu = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
            // found
            const commandeRecuFound = await tx.commandeRecu.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            })
            if (!commandeRecuFound) return res.status(400).json({ error: " Cette commande reçu n'existe pas!" })

            // validation (réutiliser les champs existants si non envoyés dans le body)
            const resultCommandeRecu = commandeRecuValidation.safeParse({
                ...commandeRecuFound,
                ...req.body,
            })

            console.log("resultCommandeRecu :", resultCommandeRecu)
            if (!resultCommandeRecu.success) {
                return res.status(400).json({
                    errors: resultCommandeRecu.error.format()
                });
            }

            // traitement de la commande
            if (resultCommandeRecu.data?.commandeId) {
                let commande = await tx.commande.findFirst({
                    where: { id: resultCommandeRecu.data?.commandeId, deletedAt: null }
                });

                if (!commande) {
                    return res.status(404).json({ error: 'Cette commande n\'existe pas' });
                }
            }

            // traitement de la reference
            if (resultCommandeRecu.data?.reference) {
                let recu = await tx.commandeRecu.findFirst({
                    where: {
                        reference: resultCommandeRecu.data?.reference,
                        NOT: { id: parseInt(id) },
                    }
                });

                if (recu) {
                    return res.status(409).json({ error: 'Cette reference existe d2jà' });
                }
            }

            // suppression de l'ancienne preuve lorsqu'une nouvelle preuve entre
            if (req.file) {
                await deletePreuve(commandeRecuFound)
            }

            // modification de la commande reçu
            const updatedCommandeRecu = await tx.commandeRecu.update({
                where: { id: parseInt(id), deletedAt: null },
                data: {
                    ...resultCommandeRecu.data,
                    preuve: req.file?.filename,
                },
            });

            res.status(201).json(updatedCommandeRecu);
        } catch (error) {
            console.error('Failed to create commande reçu:', error);

            res.status(500).json({ error: error.message || 'Failed to create commande reçu' });
            throw error;
        }
    })
};

// delete une commande recu
const deleteCommandeRecu = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;
        try {
            let commandeRecuFound = await tx.commandeRecu.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!commandeRecuFound) return res.status(404).json({ error: 'Commande reçu non trouvé' });

            // suppression de la commande reçu de la base de données et log du résultat
            await tx.commandeRecu.update({
                where: { id: parseInt(id), deletedAt: null },
                data: { deletedAt: new Date() }
            });

            // suppression de la preuve du reçu
            await deletePreuve(commandeRecuFound)

            res.status(200).json({ message: 'Commande reçu supprimé avec succès!' });
        } catch (error) {
            console.error('Failed to delete commande reçu:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la commande reçu' });
        }
    })
};

export { getCommandeRecus, createCommandeRecu, updateCommandeRecu, deleteCommandeRecu };
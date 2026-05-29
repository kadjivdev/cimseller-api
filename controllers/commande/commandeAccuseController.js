import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { commandeAccuseValidation } from "../../database/validations/commande/commandeAccuseValidation.js";
import { fileURLToPath } from 'url';

const formatData = (accuse) => ({
    ...accuse,
    preuve: accuse.preuve ? `${process.env.BASE_URL}/public/uploads/${accuse.preuve}` : null
})

const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..','..', 'public', 'uploads')

const deletePreuve = async (accuse) => {
    console.log("Suppression de la preuve de l'accuse :", accuse)
    try {
        if (!accuse || !accuse.preuve) return
        await fs.promises.unlink(path.join(UPLOADS_DIR, accuse.preuve))
    } catch (error) {
        console.log("Error de suppression de la preuve du accuse :", accuse)
    }
}

// Get all commandeAccuse from the database and log them
const getCommandeAccuses = async (req, res) => {
    console.log("Getting commandeAccuses")

    try {
        const commandeAccuses = await prisma.commandeAccuses.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                commande: true,
                typeDocument: true,
            }
        });

        res.json(commandeAccuses.map(formatData));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch commandeAccuses' });
        throw error;
    }
};

// create a new commandeAccuse in the database and log the result
const createCommandeAccuse = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    await prisma.$transaction(async (tx) => {
        try {
            // validation
            const last = await tx.commandeAccuses.findFirst({
                orderBy: { id: 'desc' },
                where: { deletedAt: null },
                select: { id: true }
            });
            const resultCommandeAccuse = commandeAccuseValidation.safeParse({
                ...req.body,
                code: `BCA-00${last?.id ? (last?.id + 1) : 1}`
            });

            if (!resultCommandeAccuse.success) {
                return res.status(400).json({
                    errors: resultCommandeAccuse.error.format()
                });
            }

            // traitement de la commande
            if (resultCommandeAccuse.data?.commandeId) {
                const commande = await tx.commande.findFirst({
                    where: { id: resultCommandeAccuse.data.commandeId, deletedAt: null },
                    select: { id: true },
                });

                if (!commande) {
                    return res.status(404).json({ error: 'Cette commande n\'existe pas' });
                }
            }

            // traitement du type de document
            if (resultCommandeAccuse.data?.typeDocumentId) {
                const type = await tx.typeDocument.findFirst({
                    where: { id: resultCommandeAccuse.data?.typeDocumentId },
                    select: { id: true },
                });

                if (!type) {
                    return res.status(404).json({ error: 'Ce type de document n\'existe pas' });
                }
            }

            // traitement de la reference
            if (resultCommandeAccuse.data?.reference) {
                let accuse = await tx.commandeAccuses.findFirst({
                    where: { reference: resultCommandeAccuse.data?.reference },
                });

                if (accuse) {
                    return res.status(409).json({ error: 'Cette reference existe déjà' });
                }
            }

            // insertion de l'accuse
            const newCommandeAccuse = await tx.commandeAccuses.create({
                data: {
                    ...resultCommandeAccuse.data,
                    preuve: req.file?.filename,
                },
            });

            res.status(201).json(newCommandeAccuse);
        } catch (error) {
            console.error('Failed to create commande accuse:', error);

            res.status(500).json({ error: error.message || 'Failed to create commande accuse' });
            throw error;
        }
    })
};

// update a commandeAccuse in the database and log the result
const updateCommandeAccuse = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
            // found
            const commandeAccuseFound = await tx.commandeAccuses.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            })
            if (!commandeAccuseFound) return res.status(400).json({ error: " Cet accuse de commande n'existe pas!" })

            // validation (réutiliser les champs existants si non envoyés dans le body)
            const resultCommandeAccuse = commandeAccuseValidation.safeParse({
                ...commandeAccuseFound,
                ...req.body,
            })

            console.log("resultCommandeAccuse :", resultCommandeAccuse)
            if (!resultCommandeAccuse.success) {
                return res.status(400).json({
                    errors: resultCommandeAccuse.error.format()
                });
            }

            // traitement de la commande
            if (resultCommandeAccuse.data?.commandeId) {
                const commande = await tx.commande.findFirst({
                    where: { id: resultCommandeAccuse.data.commandeId, deletedAt: null },
                    select: { id: true },
                });

                if (!commande) {
                    return res.status(404).json({ error: 'Cette commande n\'existe pas' });
                }
            }

            // traitement du type de document
            if (resultCommandeAccuse.data?.typeDocumentId) {
                const type = await tx.typeDocument.findFirst({
                    where: { id: resultCommandeAccuse.data.typeDocumentId },
                    select: { id: true },
                });

                if (!type) {
                    return res.status(404).json({ error: 'Ce type de document n\'existe pas' });
                }
            }

            // traitement de la reference
            if (resultCommandeAccuse.data?.reference) {
                let accuse = await tx.commandeAccuses.findFirst({
                    where: {
                        reference: resultCommandeAccuse.data.reference,
                        NOT: { id: parseInt(id) },
                    }
                });

                if (accuse) {
                    return res.status(409).json({ error: 'Cette reference existe déjà' });
                }
            }

            // suppression de l'ancienne preuve lorsqu'une nouvelle preuve entre
            if (req.file) {
                await deletePreuve(commandeAccuseFound)
            }

            // modification du versement
            const updatedCommandeAccuse = await tx.commandeAccuses.update({
                where: { id: parseInt(id) },
                data: {
                    ...resultCommandeAccuse.data,
                    ...(req.file ? { preuve: req.file.filename } : {}),
                },
            });

            res.status(201).json(updatedCommandeAccuse);
        } catch (error) {
            console.error('Failed to update accuse commande :', error);

            res.status(500).json({ error: error.message || 'Failed to update accuse commande' });
            throw error;
        }
    })
};

// delete du commande accuse
const deleteCommandeAccuse = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;
        try {
            let commandeAccuseFound = await tx.commandeAccuses.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!commandeAccuseFound) return res.status(404).json({ error: 'Accuse Commande non trouvé' });

            // suppression de l'accuse commande de la base de données et log du résultat
            await tx.commandeAccuses.update({
                where: { id: parseInt(id) },
                data: { deletedAt: new Date() }
            });

            // suppression de la preuve de l'accusé
            await deletePreuve(commandeAccuseFound)

            res.status(200).json({ message: 'Accusé Commande supprimé avec succès!' });
        } catch (error) {
            console.error('Failed to delete accuse commande:', error);
            res.status(500).json({ error: 'Erreure de suppresion de l\'accuse commande' });
        }
    })
};

export { getCommandeAccuses, createCommandeAccuse, updateCommandeAccuse, deleteCommandeAccuse };
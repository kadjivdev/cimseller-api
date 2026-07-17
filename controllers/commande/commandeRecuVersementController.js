import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { commandeRecuVersementValidation } from "../../database/validations/commande/commandeRecuVersementValidation.js";
import { fileURLToPath } from 'url';

const formatData = (versement) => ({
    ...versement,
    preuve: versement.preuve ? `${process.env.BASE_URL}/public/uploads/${versement.preuve}` : null
})

const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'uploads')

const deletePreuve = async (versement) => {
    console.log("Suppression de la preuve du recu :", versement)
    try {
        if (!versement || !versement.preuve) return
        await fs.promises.unlink(path.join(UPLOADS_DIR, versement.preuve))
    } catch (error) {
        console.log("Error de suppression de la preuve du versement :", versement)
    }
}

// Get all commandeRecuVersement from the database and log them
const getCommandeRecuVersements = async (req, res) => {
    console.log("Getting commandeRecuVersements")

    try {
        const commandeRecuVersements = await prisma.commandeVersementRecu.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                recu: true,
                typeDetailRecu: true,
                // updatedAt peut être invalide en BDD (ex. 0000-00-00) sur certains comptes
                compte: {
                    include: { banque: true }
                },
            }
        });

        res.json(commandeRecuVersements.map(formatData));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch commandeRecuVersements' });
        throw error;
    }
};

// create a new commandeRecuVersment in the database and log the result
const createCommandeRecuVersement = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    await prisma.$transaction(async (tx) => {
        try {
            // validation
            const last = await tx.commandeVersementRecu.findFirst({
                orderBy: { id: 'desc' },
                where: { deletedAt: null },
                select: { id: true }
            });
            const resultCommandeRecuVersement = commandeRecuVersementValidation.safeParse({ ...req.body, code: `BCRV-00${last?.id ? (last?.id + 1) : 1}` });

            if (!resultCommandeRecuVersement.success) {
                return res.status(400).json({
                    errors: resultCommandeRecuVersement.error.format()
                });
            }

            // traitement du recu
            if (resultCommandeRecuVersement.data?.recuId) {
                let recu = await tx.commandeRecu.findFirst({
                    where: { id: resultCommandeRecuVersement.data?.recuId, deletedAt: null }
                });

                if (!recu) {
                    return res.status(404).json({ error: 'Ce reçu n\'existe pas' });
                }
            }

            // traitement du compte
            if (resultCommandeRecuVersement.data?.compteId) {
                const compte = await tx.compteBancaire.findFirst({
                    where: { id: resultCommandeRecuVersement.data.compteId },
                    select: { id: true },
                });

                if (!compte) {
                    return res.status(404).json({ error: 'Ce compte n\'existe pas' });
                }
            }

            // traitement du type de detail reçu
            if (resultCommandeRecuVersement.data?.typeDetailRecuId) {
                const type = await tx.typeDetailRecuCommande.findFirst({
                    where: { id: resultCommandeRecuVersement.data.typeDetailRecuId },
                    select: { id: true },
                });

                if (!type) {
                    return res.status(404).json({ error: 'Ce type de detail reçu n\'existe pas' });
                }
            }

            const { recuId, compteId, typeDetailRecuId, code, reference, date, montant } = resultCommandeRecuVersement.data;

            // insertion du versement
            const newCommandeRecuVersmeent = await tx.commandeVersementRecu.create({
                data: {
                    recuId,
                    compteId,
                    typeDetailRecuId,
                    code,
                    reference,
                    date,
                    montant,
                    preuve: req.file?.filename,
                },
            });

            res.status(201).json(newCommandeRecuVersmeent);
        } catch (error) {
            console.error('Failed to create commande recu versmeent:', error);

            res.status(500).json({ error: error.message || 'Failed to create commande recu versement' });
            throw error;
        }
    })
};

// retrieve a commandeRecuVersement in the database and log the result
const retrieveCommandeRecuVersement = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
            // found
            const commandeRecuVersementFound = await tx.commandeVersementRecu.findFirst({
                where: { id: parseInt(id), deletedAt: null },
                include: {
                    recu: true,
                    typeDetailRecu: true,
                    compte: {
                        include: { banque: true }
                    },
                }
            })
            if (!commandeRecuVersementFound) return res.status(400).json({ error: " Ce versement n'existe pas!" })

            res.status(200).json(commandeRecuVersementFound);
        } catch (error) {
            console.error('Failed to retrieve versement commande reçu:', error);

            res.status(500).json({ error: error.message || 'Failed to update versment commande reçu' });
            throw error;
        }
    })
};

// update a commandeRecuVersement in the database and log the result
const updateCommandeRecuVersement = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
            // found
            const commandeRecuVersementFound = await tx.commandeVersementRecu.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            })
            if (!commandeRecuVersementFound) return res.status(400).json({ error: " Ce versement n'existe pas!" })

            // validation (réutiliser les champs existants si non envoyés dans le body)
            const resultCommandeRecuVersement = commandeRecuVersementValidation.safeParse({
                ...commandeRecuVersementFound,
                ...req.body,
            })

            console.log("resultCommandeRecuVersement :", resultCommandeRecuVersement)
            if (!resultCommandeRecuVersement.success) {
                return res.status(400).json({
                    errors: resultCommandeRecuVersement.error.format()
                });
            }

            // traitement du recu
            if (resultCommandeRecuVersement.data?.recuId) {
                let recu = await tx.commandeRecu.findFirst({
                    where: { id: resultCommandeRecuVersement.data?.recuId, deletedAt: null }
                });

                if (!recu) {
                    return res.status(404).json({ error: 'Ce reçu n\'existe pas' });
                }
            }

            // traitement du compte
            if (resultCommandeRecuVersement.data?.compteId) {
                const compte = await tx.compteBancaire.findFirst({
                    where: { id: resultCommandeRecuVersement.data?.compteId },
                    select: { id: true },
                });

                if (!compte) {
                    return res.status(404).json({ error: 'Ce compte n\'existe pas' });
                }
            }

            // traitement du type de detail reçu
            if (resultCommandeRecuVersement.data?.typeDetailRecuId) {
                const type = await tx.typeDetailRecuCommande.findFirst({
                    where: { id: resultCommandeRecuVersement.data.typeDetailRecuId },
                    select: { id: true },
                });

                if (!type) {
                    return res.status(404).json({ error: 'Ce type de detail reçu n\'existe pas' });
                }
            }

            // traitement de la reference
            if (resultCommandeRecuVersement.data?.reference) {
                let commande = await tx.commandeVersementRecu.findFirst({
                    where: {
                        reference: resultCommandeRecuVersement.data?.reference,
                        NOT: { id: parseInt(id) },
                    }
                });

                if (commande) {
                    return res.status(409).json({ error: 'Cette reference existe déjà' });
                }
            }

            // suppression de l'ancienne preuve lorsqu'une nouvelle preuve entre
            if (req.file) {
                await deletePreuve(commandeRecuVersementFound)
            }

            const { recuId, compteId, typeDetailRecuId, code, reference, date, montant } = resultCommandeRecuVersement.data;

            // modification du versement
            const updatedCommandeVersementRecu = await tx.commandeVersementRecu.update({
                where: { id: parseInt(id) },
                data: {
                    recuId,
                    compteId,
                    typeDetailRecuId,
                    code,
                    reference,
                    date,
                    montant,
                    ...(req.file ? { preuve: req.file.filename } : {}),
                },
            });

            res.status(201).json(updatedCommandeVersementRecu);
        } catch (error) {
            console.error('Failed to update versement commande reçu:', error);

            res.status(500).json({ error: error.message || 'Failed to update versment commande reçu' });
            throw error;
        }
    })
};

// delete du versement commande recu
const deleteCommandeRecuVersement = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;
        try {
            let commandeRecuVersementFound = await tx.commandeVersementRecu.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!commandeRecuVersementFound) return res.status(404).json({ error: 'Versement Commande reçu non trouvé' });

            // suppression du versement commande reçu de la base de données et log du résultat
            await tx.commandeVersementRecu.update({
                where: { id: parseInt(id) },
                data: { deletedAt: new Date() }
            });

            // suppression de la preuve du reçu
            await deletePreuve(commandeRecuVersementFound)

            res.status(200).json({ message: 'Versement Commande reçu supprimé avec succès!' });
        } catch (error) {
            console.error('Failed to delete commande reçu:', error);
            res.status(500).json({ error: 'Erreure de suppresion du versement commande reçu' });
        }
    })
};

export { getCommandeRecuVersements, retrieveCommandeRecuVersement, createCommandeRecuVersement, updateCommandeRecuVersement, deleteCommandeRecuVersement };
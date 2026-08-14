import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { comptabilityValidation } from '../../database/validations/vente/comptabilityValidation.js';

// Get all comptabilités from the database and log them
const getComptabilities = async (req, res) => {
    console.log("Getting comptabilités")

    try {
        const comptabilites = await prisma.venteComptability.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                //  relations
                vente: true,
                sender: {
                    select: {
                        fullname: true,
                        email: true
                    }
                },
            }
        });

        res.json(comptabilites);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch comptabilités' });
        throw error;
    }
};

// create a new comptability in the database and log the result
const createComptability = async (req, res) => {
    console.log('Début d\'envoie de vente à al comptabilité body:', req.body); // Log the incoming request body

    let user = req.user?.user

    try {
        const result = await prisma.$transaction(async (tx) => {
            // validation
            const resultComptability = comptabilityValidation.safeParse({ ...req.body });
            console.log("resultComptability :", resultComptability.data)

            if (!resultComptability.success) {
                throw { errorStatus: 400, payLoad: { errors: resultComptability.error.format() } }
            }

            // traitement de la vente
            const venteFound = await tx.vente.findFirst({
                where: {
                    id: resultComptability.data?.venteId, deletedAt: null,
                },
                include: { venteComptability: true } // <-- manquant
            })

            if (!venteFound) throw { errorStatus: 400, payLoad: { error: "Cette vente n'existe pas!" } }
            if (!venteFound.validatedAt) throw { errorStatus: 400, payLoad: { error: "Cette vente n'est pas validée!" } }

            console.log("venteFound.venteComptability :", venteFound.venteComptability)

            if (venteFound.venteComptability) {
                console.log("venteFound.venteComptability :", venteFound.venteComptability)
                throw { errorStatus: 400, payLoad: { error: `La vente ${venteFound.code} a déjà été comptabilisée` } }
            }

            // insertion de la comptabilité
            const newComptability = await tx.venteComptability.create({
                data: {
                    ...resultComptability.data,
                    senderToComptability: user.id,
                    comptabilizedAt: new Date(),
                    sentToComptabilityAt: new Date(),
                },
            });

            return newComptability;
        })
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to create comptability:', error);
        const status = error.errorStatus || 500;
        const payload = error.payLoad || { error: "Erreur serveur" };
        res.status(status).json(payload);
    }
};

// update a comptability in the database and log the result
const updateComptability = async (req, res) => {
    console.log('Début de traitement de la vente :', req.body); // Log the incoming request body

    let user = req.user?.user
    let { id } = req.params

    try {
        const result = await prisma.$transaction(async (tx) => {
            // found
            const comptabilityFound = await tx.venteComptability.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            })

            if (!comptabilityFound) throw { errorStatus: 400, payLoad: { error: "Cette comptabilité n'existe pas!" } }

            // validation
            const resultComptability = comptabilityValidation.safeParse({
                ...comptabilityFound,
                ...req.body,
            });

            console.log("resultComptability data :", resultComptability.data)

            if (!resultComptability.success) {
                throw { errorStatus: 400, payLoad: { errors: resultComptability.error.format() } }
            }

            // modification de la comptabilité de la base de données et log du résultat
            let { tva, aib, ttcPrice, marge, usinePrixHT, margePrice, htPrice, bruitPrice, netHorsTaxe, tvaPrice, aibPrice, prixTTC } = resultComptability.data

            const updatedComptability = await tx.venteComptability.update({
                where: { id: parseInt(id) },
                data: {
                    tva, aib, ttcPrice, marge, usinePrixHT, margePrice, htPrice, htPrice, bruitPrice, netHorsTaxe, tvaPrice, aibPrice, prixTTC,
                    treatedAt: new Date()
                },
            });

            // actualisation de la vente
            await tx.vente.update({
                where: { deletedAt: null, id: comptabilityFound.venteId },
                data: {
                    treatedById: user?.id
                }
            })

            return updatedComptability;
        })

        console.log("Vente traitée avec succès")
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to update comptability:', error);

        res.status(error.errorStatus).json(error.payLoad);
    }
};

// delete a vente comptability from the database and log the result
const deleteComptability = async (req, res) => {
    await prisma.$transaction(async (tx) => {
        const { id } = req.params;
        try {
            let venteComptabilityFound = await tx.venteComptability.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!venteComptabilityFound) return res.status(404).json({ error: 'Vente non trouvée' });

            // suppression de la vente de la base de données et log du résultat
            await tx.venteComptability.update({
                where: { id: parseInt(id) },
                data: {
                    deletedAt: new Date(),
                }
            });

            res.status(200).json({ message: 'Comptabilité de vente supprimée avec succès!' });
        } catch (error) {
            console.error('Failed to delete vente:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la vente comptabilité' });
        }
    })
};

export { getComptabilities, createComptability, updateComptability, deleteComptability };
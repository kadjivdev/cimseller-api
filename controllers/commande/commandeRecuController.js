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
                createdBy: true,
                commande: true,
            }
        });

        res.json(commandeRecus.map(formatData));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch commandeRecus' });
        throw error;
    }
};

// retrieve a commandeRecu in the database and log the result
const retrieveCommandeRecu = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
            // found
            const commandeRecuFound = await tx.commandeRecu.findFirst({
                where: { id: parseInt(id), deletedAt: null },
                include: {
                    commande: true,
                    createdBy: true,
                    versements: {
                        include: {
                            compte: true,
                            typeDetailRecu: true
                        }
                    }
                }
            })
            if (!commandeRecuFound) return res.status(400).json({ error: " Cette commande reçu n'existe pas!" })

            res.status(201).json(commandeRecuFound);
        } catch (error) {
            console.error('Failed to retrieve commande reçu:', error);

            res.status(500).json({ error: error.message || 'Failed to create commande reçu' });
            throw error;
        }
    })
};

// create a new commandeRecu in the database and log the result
const createCommandeRecu = async (req, res) => {
    console.log('Début d\'insersion de reçu', req.body);
    let user = req.user?.user;

    try {
        const result = await prisma.$transaction(async (tx) => {

            const commandeFound = await tx.commande.findFirst({
                where: { id: req.body?.commandeId, deletedAt: null },
                include: {
                    commandeDetails: true,
                    commandeRecus: true,
                }
            });

            if (!commandeFound) {
                throw { statusCode: 404, payload: { error: "Cette commande n'existe pas" } };
            }

            await tx.commandeRecu.deleteMany({
                where: { commandeId: commandeFound.id }
            });

            const qteTotalCommander = commandeFound.commandeDetails?.reduce((qte, cd) => qte + cd.qteCommande, 0) ?? 0;

            // cumul qui progresse au fil de la boucle (les anciens reçus ont été supprimés, donc on repart de 0)
            let qteCumulee = 0;
            const nouveauxRecus = [];

            for (const [index, rc] of (req.body?.recus ?? []).entries()) {
                console.log("L'index :", index);
                console.log("Le reçu :", rc);

                const last = await tx.commandeRecu.findFirst({
                    orderBy: { id: 'desc' },
                    select: { id: true }
                });

                const resultCommandeRecu = commandeRecuValidation.safeParse({
                    ...rc,
                    commandeId: commandeFound.id,
                    code: `BCR-00${last?.id ? (last.id + 1) : 1}`
                });

                if (!resultCommandeRecu.success) {
                    throw { statusCode: 422, payload: { errors: { ...resultCommandeRecu.error.format(), recus: { _errors: [`La ligne ${index + 1} est erronnée! Veuillez bien reprendre`] } } } };
                }

                if (resultCommandeRecu.data.reference) {
                    const recuExistant = await tx.commandeRecu.findFirst({
                        where: {
                            reference: resultCommandeRecu.data.reference,
                            deletedAt: null
                        }
                    });

                    if (recuExistant) {
                        throw { statusCode: 409, payload: { error: `Cette référence existe déjà (ligne ${index + 1})` } };
                    }
                }

                qteCumulee += resultCommandeRecu.data.tonnage;

                if (qteCumulee > qteTotalCommander) {
                    throw {
                        statusCode: 400,
                        payload: { error: `La quantité totale reçue (${qteCumulee}) serait supérieure à la quantité totale commandée (${qteTotalCommander})` }
                    };
                }

                const newCommandeRecu = await tx.commandeRecu.create({
                    data: {
                        ...resultCommandeRecu.data,
                        commandeId: commandeFound.id,
                        preuve: req.file?.filename,
                        createdById: user?.id
                    },
                });

                console.log("Reçu inséré");
                nouveauxRecus.push(newCommandeRecu);
            }

            console.log("Fin d'insertion des recus");
            return nouveauxRecus;
        });

        console.log("Tous les recus insérés avec succès");
        return res.status(201).json(result);

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json(error.payload);
        }
        console.error('Failed to create commande recu:', error);
        return res.status(500).json({ error: error.message || 'Failed to create commande recu' });
    }
};

// update a commandeRecu in the database and log the result
const updateCommandeRecu = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    try {
        const result = await prisma.$transaction(async (tx) => {
            // found
            const commandeRecuFound = await tx.commandeRecu.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            })
            if (!commandeRecuFound) {
                throw { errorStatus: 400, payload: { error: " Cette commande reçu n'existe pas!" } }
            }

            // validation (réutiliser les champs existants si non envoyés dans le body)
            const resultCommandeRecu = commandeRecuValidation.safeParse({
                ...commandeRecuFound,
                ...req.body,
            })

            console.log("resultCommandeRecu :", resultCommandeRecu)
            if (!resultCommandeRecu.success) {
                throw { errorStatus: 400, payload: { errors: resultCommandeRecu.error.format() } }
            }

            // traitement de la commande
            if (resultCommandeRecu.data?.commandeId) {
                let commande = await tx.commande.findFirst({
                    where: { id: resultCommandeRecu.data?.commandeId, deletedAt: null }
                });

                if (!commande) {
                    throw { errorStatus: 404, payload: { error: 'Cette commande n\'existe pas' } }
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
                    throw { errorStatus: 409, payload: { error: 'Cette reference existe d2jà' } }
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

            return updatedCommandeRecu;
        })
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to create commande reçu:', error);

        res.status(error.statusCode).json(error.payload);
    }
};

// delete une commande recu
const deleteCommandeRecu = async (req, res) => {

    try {
        const result = await prisma.$transaction(async (tx) => {
            const { id } = req.params;
            let commandeRecuFound = await tx.commandeRecu.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!commandeRecuFound) {
                throw { errorStatus: 404, payload: { error: 'Commande reçu non trouvé' } }
            }

            // suppression de la commande reçu de la base de données et log du résultat
            await tx.commandeRecu.update({
                where: { id: parseInt(id), deletedAt: null },
                data: { deletedAt: new Date() }
            });

            // suppression de la preuve du reçu
            await deletePreuve(commandeRecuFound)

            return commandeRecuFound;
        })
        res.status(200).json({ message: 'Commande reçu supprimé avec succès!' });
    } catch (error) {
        console.error('Failed to delete commande reçu:', error);
        res.status(error.errorStatus).json(error.payload);
    }
};

export { getCommandeRecus, retrieveCommandeRecu, createCommandeRecu, updateCommandeRecu, deleteCommandeRecu };
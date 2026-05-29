import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import { commandeClientValidation } from '../../database/validations/vente/commandeClientValidation.js';

// Get all command client from the database and log them
const getCommandClients = async (req, res) => {
    console.log("Getting command clients")

    try {
        const commandClients = await prisma.commandeClient.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                //  relations
                statut: true,
                type: true,
                client: true,
                createdBy: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true,
                        createdAt: true
                    }
                },
                validatedBy: true,
                ventes: true,
            }
        });

        res.json(commandClients);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch commande clients' });
        throw error;
    }
};

// create a new commandClient in the database and log the result
const createCommandClient = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let user = req.user?.user

    await prisma.$transaction(async (tx) => {
        try {
            // validation
            const last = await tx.commandeClient.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true }
            });
            const resultCommandClient = commandeClientValidation.safeParse({ ...req.body, code: `BCE-00${last?.id ? (last?.id + 1) : 1}` });

            console.log("resultCommandClient :", resultCommandClient.data)

            if (!resultCommandClient.success) {
                return res.status(400).json({
                    errors: resultCommandClient.error.format()
                });
            }

            // traitement du statut
            if (resultCommandClient.data?.statutId) {
                let statut = await tx.statutCommandeClient.findFirst({
                    where: { id: resultCommandClient.data?.statutId }
                });

                if (!statut) {
                    return res.status(404).json({ error: 'Ce statut n\'existe pas' });
                }
            }

            // traitement du type
            if (resultCommandClient.data?.typeCommandeClientId) {
                let type = await tx.typeCommandeClient.findFirst({
                    where: { id: resultCommandClient.data?.typeCommandeClientId }
                });

                if (!type) {
                    return res.status(404).json({ error: 'Ce type n\'existe pas' });
                }
            }

            // traitement du client
            if (resultCommandClient.data?.clientId) {
                let client = await tx.client.findFirst({
                    where: { id: resultCommandClient.data?.clientId }
                });

                if (!client) {
                    return res.status(404).json({ error: 'Ce client n\'existe pas' });
                }
            }

            // insertion de la commandClient
            const newCommandClient = await tx.commandeClient.create({
                data: {
                    ...resultCommandClient.data,
                    createdById: user?.id,
                },
            });

            res.status(201).json(newCommandClient);
        } catch (error) {
            console.error('Failed to create commande client:', error);

            res.status(500).json({ error: error.message || 'Failed to create commande client' });
            throw error;
        }
    })
};

// update a command client in the database and log the result
const updateCommandClient = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
            // found
            const commandClientFound = await tx.commandeClient.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            })

            if (!commandClientFound) return res.status(400).json({ error: " Cette commande client n'existe pas!" })

            if (commandClientFound.validatedAt) return res.status(400).json({ error: "Cette commande client est déjà validée" })

            // validation
            const resultCommandClient = commandeClientValidation.safeParse({
                ...commandClientFound,
                ...req.body,
            });

            if (!resultCommandClient.success) {
                return res.status(400).json({
                    errors: resultCommandClient.error.format()
                });
            }

            // traitement du statut
            if (resultCommandClient.data?.statutId) {
                let statut = await tx.statutCommandeClient.findFirst({
                    where: { id: resultCommandClient.data?.statutId }
                });

                if (!statut) {
                    return res.status(404).json({ error: 'Ce statut n\'existe pas' });
                }
            }

            // traitement du type
            if (resultCommandClient.data?.typeCommandeClientId) {
                let type = await tx.typeCommandeClient.findFirst({
                    where: { id: resultCommandClient.data?.typeCommandeClientId }
                });

                if (!type) {
                    return res.status(404).json({ error: 'Ce type n\'existe pas' });
                }
            }

            // traitement du client
            if (resultCommandClient.data?.clientId) {
                let client = await tx.client.findFirst({
                    where: { id: resultCommandClient.data?.clientId }
                });

                if (!client) {
                    return res.status(404).json({ error: 'Ce client n\'existe pas' });
                }
            }

            // modification de la commande client
            const updatedCommandClient = await tx.commandeClient.update({
                where: { id: parseInt(id) },
                data: {
                    ...resultCommandClient.data,
                },
            });

            res.status(201).json(updatedCommandClient);
        } catch (error) {
            console.error('Failed to create commande client:', error);

            res.status(500).json({ error: error.message || 'Failed to create commande client' });
            throw error;
        }
    })
};

// validate a command client
const validateCommandClient = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;

        try {
            let commandClient = await tx.commandeClient.findUnique({
                where: { id: parseInt(id), deletedAt: null },
            });

            if (!commandClient) return res.status(404).json({ error: 'Commande client non trouvée' });

            if (commandClient.validatedAt) return res.status(409).json({ error: "Cette commande client est déjà validée" })

            // validation de la programmation de la base de données et log du résultat
            await tx.commandeClient.update({
                where: { deletedAt: null, id: parseInt(id) },
                data: {
                    validatedAt: new Date(),
                    validatedById: req.user?.user?.id
                }
            });
            res.status(200).json({ message: 'Commande client validée avec succès!' });
        } catch (error) {
            console.error('Failed to delete commande client:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la commande client' });
        }
    })
};

// delete a command client
const deleteCommandClient = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;
        try {
            let commandClient = await tx.commandeClient.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!commandClient) return res.status(404).json({ error: 'commande client non trouvée' });

            if (commandClient.validatedAt) return res.status(400).json({ error: "Cette commande client est déjà validée" })

            // suppression de la commande client de la base de données et log du résultat
            await tx.commandeClient.update({
                where: { id: parseInt(id) },
                data: {
                    deletedAt: new Date(),
                }
            });
            res.status(200).json({ message: 'Commande client supprimée avec succès!' });
        } catch (error) {
            console.error('Failed to delete Commande client:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la Commande client' });
        }
    })
};

export { getCommandClients, createCommandClient, updateCommandClient, validateCommandClient, deleteCommandClient };
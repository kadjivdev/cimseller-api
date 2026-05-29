import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import { venteValidation } from '../../database/validations/vente/venteValidation.js';

// Get all ventes from the database and log them
const getVentes = async (req, res) => {
    console.log("Getting ventes")

    try {
        const ventes = await prisma.vente.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                //  relations
                commandeClient: true,
                client: true,
                produit: true,
                statut: true,
                type: true,
                reglements: true,
                venteComptabilities: true,
                reglements: true,
                treatedBy: true,
                createdBy: true,
                validatedBy: true
            }
        });

        res.json(ventes);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch ventes' });
        throw error;
    }
};

// create a new ventes in the database and log the result
const createVente = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let user = req.user?.user

    await prisma.$transaction(async (tx) => {
        try {
            // validation
            const last = await tx.vente.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true }
            });
            const resultVente = venteValidation.safeParse({ ...req.body, code: `VD-00${last?.id ? (last?.id + 1) : 1}` });

            console.log("resultVente :", resultVente.data)

            if (!resultVente.success) {
                return res.status(400).json({
                    errors: resultVente.error.format()
                });
            }

            // traitement du commande client
            if (resultVente.data?.commandClientId) {
                let commandeClient = await tx.commandeClient.findFirst({
                    where: { id: resultVente.data?.commandClientId }
                });

                if (!commandeClient) {
                    return res.status(404).json({ error: 'Cette commande client n\'existe pas' });
                }
            }

            // traitement du statut
            if (resultVente.data?.statutId) {
                let statut = await tx.statutVente.findFirst({
                    where: { id: resultVente.data?.statutId }
                });

                if (!statut) {
                    return res.status(404).json({ error: 'Ce statut de vente n\'existe pas' });
                }
            }

            // traitement du produit
            if (resultVente.data?.produitId) {
                let produit = await tx.produit.findFirst({
                    where: { id: resultVente.data?.produitId }
                });

                if (!produit) {
                    return res.status(404).json({ error: 'Ce produit n\'existe pas' });
                }
            }

            // traitement du type
            if (resultVente.data?.typeId) {
                let type = await tx.typeCommandeClient.findFirst({
                    where: { id: resultVente.data?.typeId }
                });

                if (!type) {
                    return res.status(404).json({ error: 'Ce type de commande client n\'existe pas' });
                }
            }

            // traitement du client
            if (resultVente.data?.clientId) {
                let client = await tx.client.findFirst({
                    where: { id: resultVente.data?.clientId }
                });

                if (!client) {
                    return res.status(404).json({ error: 'Ce client n\'existe pas' });
                }
            }

            // insertion de la vente
            const newVente = await tx.vente.create({
                data: {
                    ...resultVente.data,
                    createdById: user?.id,
                    statutId: resultVente.data?.statutId || 1
                },
            });

            res.status(201).json(newVente);
        } catch (error) {
            console.error('Failed to create vente:', error);

            res.status(500).json({ error: error.message || 'Failed to create vente' });
            throw error;
        }
    })
};

// update a vente in the database and log the result
const updateVente = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
            // found
            const venteFound = await tx.vente.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            })

            if (!venteFound) return res.status(400).json({ error: " Cette vente n'existe pas!" })

            if (venteFound.validatedAt) return res.status(400).json({ error: "Cette vente est déjà validée" })

            // validation
            const resultVente = venteValidation.safeParse({
                ...venteFound,
                ...req.body,
            });

            if (!resultVente.success) {
                return res.status(400).json({
                    errors: resultVente.error.format()
                });
            }

            // traitement du commande client
            if (resultVente.data?.commandClientId) {
                let commandeClient = await tx.commandeClient.findFirst({
                    where: { id: resultVente.data?.commandClientId }
                });

                if (!commandeClient) {
                    return res.status(404).json({ error: 'Cette commande client n\'existe pas' });
                }
            }

            // traitement du statut
            if (resultVente.data?.statutId) {
                let statut = await tx.statutVente.findFirst({
                    where: { id: resultVente.data?.statutId }
                });

                if (!statut) {
                    return res.status(404).json({ error: 'Ce statut de vente n\'existe pas' });
                }
            }

            // traitement du produit
            if (resultVente.data?.produitId) {
                let produit = await tx.produit.findFirst({
                    where: { id: resultVente.data?.produitId }
                });

                if (!produit) {
                    return res.status(404).json({ error: 'Ce produit n\'existe pas' });
                }
            }

            // traitement du type
            if (resultVente.data?.typeId) {
                let type = await tx.typeCommandeClient.findFirst({
                    where: { id: resultVente.data?.typeId }
                });

                if (!type) {
                    return res.status(404).json({ error: 'Ce type de commande client n\'existe pas' });
                }
            }

            // traitement du client
            if (resultVente.data?.clientId) {
                let client = await tx.client.findFirst({
                    where: { id: resultVente.data?.clientId }
                });

                if (!client) {
                    return res.status(404).json({ error: 'Ce client n\'existe pas' });
                }
            }

            // modification de la vente
            const updatedVente = await tx.vente.update({
                where: { id: parseInt(id) },
                data: {
                    ...resultVente.data,
                },
            });

            res.status(201).json(updatedVente);
        } catch (error) {
            console.error('Failed to create vente:', error);

            res.status(500).json({ error: error.message || 'Failed to create vente' });
            throw error;
        }
    })
};

// validate a vente
const validateVente = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;

        try {
            let venteFound = await tx.vente.findUnique({
                where: { id: parseInt(id), deletedAt: null },
            });

            if (!venteFound) return res.status(404).json({ error: 'vente non trouvée' });

            if (venteFound.validatedAt) return res.status(409).json({ error: "Cette vente est déjà validée" })

            // validation de la vente de la base de données et log du résultat
            await tx.vente.update({
                where: { deletedAt: null, id: parseInt(id) },
                data: {
                    validatedAt: new Date(),
                    validatedById: req.user?.user?.id
                }
            });
            res.status(200).json({ message: 'Vente validée avec succès!' });
        } catch (error) {
            console.error('Failed to delete vente:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la vente' });
        }
    })
};

// delete a vente
const deleteVente = async (req, res) => {
    await prisma.$transaction(async (tx) => {
        const { id } = req.params;
        try {
            let venteFound = await tx.vente.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!venteFound) return res.status(404).json({ error: 'Vente non trouvée' });

            if (venteFound.validatedAt) return res.status(400).json({ error: "Cette vente est déjà validée" })

            // suppression de la vente de la base de données et log du résultat
            await tx.vente.update({
                where: { id: parseInt(id) },
                data: {
                    deletedAt: new Date(),
                }
            });
            res.status(200).json({ message: 'Vente supprimée avec succès!' });
        } catch (error) {
            console.error('Failed to delete vente:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la vente' });
        }
    })
};

export { getVentes, createVente, updateVente, validateVente, deleteVente };
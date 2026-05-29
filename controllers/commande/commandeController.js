import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import { commandeValidation, commandeDetailValidation } from '../../database/validations/commande/commandeValidation.js';

// Get all commandes from the database and log them
const getCommandes = async (req, res) => {
    console.log("Getting commandes")

    try {
        const commandes = await prisma.commande.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                //  relations
                commandeDetails: true,
                commandeRecus: {
                    where: { deletedAt: null }
                },
                programmations: true,
                commandeAccuses: true,
                statut: true,
                type: true,
                fournisseur: true,
                createdBy: true,
                validatedBy: true
            }
        });

        res.json(commandes);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch commandes' });
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

// create a new commandes in the database and log the result
const createCommande = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let user = req.user?.user

    await prisma.$transaction(async (tx) => {
        try {
            // validation
            const last = await tx.commande.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true }
            });
            const resultCommande = commandeValidation.safeParse({ ...req.body, code: `BCI-00${last?.id ? (last?.id + 1) : 1}` });

            console.log("resultCommande :", resultCommande.data)

            if (!resultCommande.success) {
                return res.status(400).json({
                    errors: resultCommande.error.format()
                });
            }

            // traitement du fournisseur
            if (resultCommande.data?.fournisseurId) {
                let fournisseur = await tx.fournisseur.findFirst({
                    where: { id: resultCommande.data?.fournisseurId }
                });

                if (!fournisseur) {
                    return res.status(404).json({ error: 'Ce fournisseur n\'existe pas' });
                }
            }

            // traitement du type
            if (resultCommande.data?.typeId) {
                let type = await tx.typeCommande.findFirst({
                    where: { id: resultCommande.data?.typeId }
                });

                if (!type) {
                    return res.status(404).json({ error: 'Ce type de commande n\'existe pas' });
                }
            }

            // insertion de la commande & detail
            const newCommande = await tx.commande.create({
                data: {
                    ...resultCommande.data,
                    createdById: user?.id,
                    commandeDetails: {
                        create: {}//initiation du detail
                    }
                },
            });

            res.status(201).json(newCommande);
        } catch (error) {
            console.error('Failed to create commande:', error);

            res.status(500).json({ error: error.message || 'Failed to create commande' });
            throw error;
        }
    })
};

// update a commande in the database and log the result
const updateCommande = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
            // found
            const commandeFound = await tx.commande.findFirst({
                where: { id: parseInt(id) }
            })
            if (!commandeFound) return res.status(400).json({ error: " Cette commande n'existe pas!" })

            if (commandeFound.validatedAt) return res.status(400).json({ error: "Cette commande est déjà validée" })

            // validation

            let montant =
                (req.body?.qteCommande * req.body?.unitePrice)
                - (req.body?.remise ?? 0);

            console.log("data update :", { ...req.body, montant: montant })

            const resultCommande = commandeValidation.safeParse({ ...req.body, montant: montant });
            let resultDetail = commandeDetailValidation.safeParse(req.body)

            if (!resultCommande.success) {
                return res.status(400).json({
                    errors: resultCommande.error.format()
                });
            }

            // traitement du fournisseur
            if (resultCommande.data?.fournisseurId) {
                let fournisseur = await tx.fournisseur.findFirst({
                    where: { id: resultCommande.data?.fournisseurId }
                });

                if (!fournisseur) {
                    return res.status(404).json({ error: 'Ce fournisseur n\'existe pas' });
                }
            }

            // traitement du statut
            if (resultCommande.data?.statutId) {
                let statut = await tx.statutCommande.findFirst({
                    where: { id: resultCommande.data?.statutId }
                });

                if (!statut) {
                    return res.status(404).json({ error: 'Ce statut de commande n\'existe pas' });
                }
            }

            // traitement du type
            if (resultCommande.data?.typeId) {
                let type = await tx.typeCommande.findFirst({
                    where: { id: resultCommande.data?.typeId }
                });

                if (!type) {
                    return res.status(404).json({ error: 'Ce type de commande n\'existe pas' });
                }
            }

            // traitement du produit
            if (resultDetail.data?.productId) {
                let product = await tx.product.findFirst({
                    where: { id: resultDetail.data?.productId }
                });

                if (!product) {
                    return res.status(404).json({ error: 'Ce produit n\'existe pas' });
                }
            }

            // modification de la commande
            const updatedCommande = await tx.commande.update({
                where: { id: parseInt(id) },
                data: {
                    ...resultCommande.data,
                    commandeDetails: {
                        deleteMany: {},//suppression des anciens détails
                        create: { ...resultDetail.data }
                    }
                },
            });

            res.status(201).json(updatedCommande);
        } catch (error) {
            console.error('Failed to create commande:', error);

            res.status(500).json({ error: error.message || 'Failed to create commande' });
            throw error;
        }
    })
};

// validate a command
const validateCommande = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;

        try {
            let commandeFound = await tx.commande.findUnique({
                where: { id: parseInt(id), deletedAt: null },
                include: { commandeRecus: true }
            });


            if (!commandeFound) return res.status(404).json({ error: 'Commande non trouvée' });


            const recuCommandMontant = (commandeFound.commandeRecus ?? [])
                .filter((c) => !c.deletedAt)//non suprimés
                .reduce((total, c) => total + c.montant, 0);

            if (commandeFound.montant != null &&
                recuCommandMontant < commandeFound.montant
            ) {
                return res.status(400).json({
                    error: 'Le montant total des reçus est insuffisant pour valider la commande',
                    montantCommande: commandeFound.montant,
                    montantRecus: recuCommandMontant,
                });
            }

            if (commandeFound.validatedAt) return res.status(409).json({ error: "Cette commande est déjà validée" })

            // validation de la commande de la base de données et log du résultat
            await tx.commande.update({
                where: { deletedAt: null, id: parseInt(id) },
                data: {
                    validatedAt: new Date(),
                    validatedById: req.user?.user?.id
                }
            });
            res.status(200).json({ message: 'Commande validée avec succès!' });
        } catch (error) {
            console.error('Failed to delete commande:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la commande' });
        }
    })
};

// delete une commande
const deleteCommande = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;
        try {
            let commandeFound = await tx.commande.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!commandeFound) return res.status(404).json({ error: 'Commande non trouvée' });

            if (commandeFound.validatedAt) return res.status(400).json({ error: "Cette commande est déjà validée" })

            // suppression de la commande de la base de données et log du résultat
            await tx.commande.update({
                where: { id: parseInt(id) },
                data: {
                    deletedAt: new Date(),
                    commandeDetails: {
                        // suppression des details
                        updateMany: {
                            where: {},
                            data: {
                                deletedAt: new Date()
                            }
                        }
                    }
                }
            });
            res.status(200).json({ message: 'Commande supprimée avec succès!' });
        } catch (error) {
            console.error('Failed to delete commande:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la commande' });
        }
    })
};

export { getCommandes, createCommande, updateCommande, validateCommande, deleteCommande };
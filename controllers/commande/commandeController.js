import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import { commandeValidation, commandeDetailValidation } from '../../database/validations/commande/commandeValidation.js';

const commandFormat = (command) => {
    let qteCommander = command.commandeDetails?.reduce((qte, dt) => (qte + dt.qteCommande), 0)
    let qteProgrammer = command.programmations?.reduce((qte, dt) => (qte + dt.qteProgrammer), 0)
    return {
        ...command,
        qteCommander,
        qteProgrammer,
        stock: qteCommander - qteProgrammer
    }
}

// Get all commandes from the database and log them
const getCommandes = async (req, res) => {
    console.log("Getting commandes")

    try {
        const commandes = await prisma.commande.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                statut: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                type: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                fournisseur: {
                    select: {
                        id: true,
                        raison_sociale: true,
                    }
                },
                createdBy: {
                    select: {
                        fullname: true
                    }
                },
                validatedBy: {
                    select: {
                        fullname: true
                    }
                },
                commandeDetails: {
                    select: {
                        id: true,
                        qteCommande: true,
                        unitePrice: true,
                        remise: true,
                        product: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                programmations: {
                    where: { NOT: { validatedBy: null } },
                    select: {
                        qteProgrammer: true,
                    }
                }
            }
        });

        res.json(commandes.map(commandFormat));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch commandes' });
        throw error;
    }
};

// retrieve a commande in the database and log the result
const retrieveCommande = async (req, res) => {
    console.log('Request body:', req.body);

    let { id } = req.params;
    console.log("id :", id);

    try {
        const commandeFound = await prisma.commande.findUnique({
            where: {
                id: parseInt(id),
                deletedAt: null
            },
            include: {
                statut: true,
                type: true,
                fournisseur: true,
                createdBy: true,
                validatedBy: true,
                commandeDetails: true,
                commandeRecus: {
                    where: { deletedAt: null }
                },
                commandeAccuses: {
                    where: { deletedAt: null }
                },
                programmations: {
                    where: { deletedAt: null }
                },
            }
        });

        if (!commandeFound) {
            return res.status(404).json({ error: "Cette commande n'existe pas!" });
        }

        return res.status(200).json(commandeFound);
    } catch (error) {
        console.error('Failed to retrieve commande:', error);
        return res.status(500).json({ error: error.message || 'Failed to retrieve commande' });
    }
};

// create a new commandes in the database and log the result
const createCommande = async (req, res) => {
    console.log('Début de creation de commande:', req.body); // Log the incoming request body

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

            // traitement de la reference
            if (resultCommande.data?.reference) {
                let reference = await tx.commande.findFirst({
                    where: { reference: resultCommande.data?.reference, deletedAt: null },
                });

                if (reference) {
                    return res.status(409).json({ error: 'Cette reference existe déjà' });
                }
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
                    statutId: 1,
                    montant: 0,
                    commandeDetails: {
                        create: {}//initiation du detail
                    }
                },
            });


            console.log("Fin d'insertion de commande")
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
            if (!commandeFound) return res.status(422).json({ error: " Cette commande n'existe pas!" })
            if (commandeFound.validatedAt) return res.status(400).json({ error: "Cette commande est déjà validée" })

            // details
            if (!req.body?.details || req.body?.details?.length == 0) {
                return res.status(400).json({
                    error: "Ajouter au moins un détail"
                })
            }

            // validation
            const resultCommande = commandeValidation.safeParse({ ...req.body });
            if (!resultCommande.success) {
                return res.status(422).json({
                    errors: resultCommande.error.format()
                });
            }

            // traitement de la reference
            if (resultCommande.data?.reference) {
                let reference = await tx.commande.findFirst({
                    where: {
                        reference: resultCommande.data?.reference,
                        NOT: {
                            id: parseInt(id),
                        },
                        deletedAt: null
                    }
                });

                if (reference) {
                    return res.status(409).json({ error: 'Cette reference existe déjà' });
                }
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

            /**
             * Traitement des détails
             */
            console.log("details :", req?.body?.details)
            req?.body?.details?.forEach((ligne, index) => {
                let resultDetailCommande = commandeDetailValidation.safeParse({ ...ligne });
                if (!resultDetailCommande.success) {
                    return res.status(422).json({
                        errors: { ...resultDetailCommande.error.format(), details: { _errors: `La ligne ${index + 1} est mal insérée` } }
                    });
                }
            });

            // modification de la commande
            let montant = req?.body?.details?.reduce((sum, dt) => (sum + (dt.qteCommande * dt.unitePrice - dt.remise)), 0)

            const updatedCommande = await tx.commande.update({
                where: { id: parseInt(id) },
                data: {
                    ...resultCommande.data,
                    montant,
                    commandeDetails: {
                        deleteMany: {},//suppression des anciens détails
                        create: req?.body?.details
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

export { getCommandes, retrieveCommande, createCommande, updateCommande, validateCommande, deleteCommande };
import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import { commandeValidation, commandeDetailValidation } from '../../database/validations/commande/commandeValidation.js';
import { error } from 'console';

const commandFormat = (command) => {
    let qteCommander = command.commandeDetails?.reduce((qte, dt) => (qte + dt.qteCommande), 0)
    let qteProgrammer = command.programmations?.reduce((qte, dt) => (qte + dt.qteProgrammer), 0)

    // total des ventes effectuées
    let qteVendue = command.programmations?.reduce(
        (total, pr) => total + (pr.ventes?.reduce((qte, vente) => qte + vente.qteTotal, 0) ?? 0),
        0
    ) ?? 0;

    return {
        ...command,
        qteCommander,
        qteVendue,
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
                    include: {
                        // les ventes validées
                        ventes: {
                            where: { deletedAt: null, NOT: { validatedAt: null } }
                        },
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

// Get all validated commandes from the database and log them
const getAllValidatedCommandes = async (req, res) => {
    console.log("Getting validated commandes")

    try {
        const commandes = await prisma.commande.findMany({
            where: { deletedAt: null, NOT: { validatedAt: null } },
            orderBy: { id: 'desc' },
            include: {

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
                    }
                },
                programmations: {
                    where: { NOT: { validatedBy: null } },
                    include: { ventes: true }
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
                    where: { deletedAt: null },
                    include: {
                        commande: true,
                        zone: true,
                        statut: true,
                        camion: true,
                        chauffeur: true,
                        avaliseur: true,

                        // les ventes validées
                        ventes: {
                            where: { deletedAt: null, NOT: { validatedAt: null } }
                        },
                        createdBy: true,
                        validatedBy: true
                    }
                },
            }
        });

        if (!commandeFound) {
            return res.status(404).json({ error: "Cette commande n'existe pas!" });
        }

        let qteCommander = commandeFound.commandeDetails?.reduce((qte, dt) => (qte + dt.qteCommande), 0)
        let qteProgrammer = commandeFound.programmations?.reduce((qte, dt) => (qte + dt.qteProgrammer), 0)
        // total des ventes effectuées
        let qteVendue = commandeFound.programmations?.reduce(
            (total, pr) => total + (pr.ventes?.reduce((qte, vente) => qte + vente.qteTotal, 0) ?? 0),
            0
        ) ?? 0;

        const data = {
            ...commandeFound,
            qteCommander,
            qteProgrammer,
            qteVendue,
            stock: qteCommander - qteProgrammer
        }
        return res.status(200).json(data);
    } catch (error) {
        console.error('Failed to retrieve commande:', error);
        return res.status(500).json({ error: error.message || 'Failed to retrieve commande' });
    }
};

// create a new commandes in the database and log the result
const createCommande = async (req, res) => {
    console.log('Début de creation de commande:', req.body); // Log the incoming request body

    let user = req.user?.user

    try {
        const result = await prisma.$transaction(async (tx) => {
            // validation
            const last = await tx.commande.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true }
            });
            const resultCommande = commandeValidation.safeParse({ ...req.body, code: `BCI-00${last?.id ? (last?.id + 1) : 1}` });
            console.log("resultCommande :", resultCommande.data)

            if (!resultCommande.success) {
                throw { errorStatus: 400, playLoad: { errors: resultCommande.error.format() } }
            }

            // traitement de la reference
            if (resultCommande.data?.reference) {
                let reference = await tx.commande.findFirst({
                    where: { reference: resultCommande.data?.reference, deletedAt: null },
                });

                if (reference) {
                    throw { errorStatus: 409, playLoad: { error: 'Cette reference existe déjà' } }
                }
            }

            // traitement du fournisseur
            if (resultCommande.data?.fournisseurId) {
                let fournisseur = await tx.fournisseur.findFirst({
                    where: { id: resultCommande.data?.fournisseurId }
                });

                if (!fournisseur) {
                    throw { errorStatus: 404, playLoad: { error: 'Ce fournisseur n\'existe pas' } }
                }
            }

            // traitement du type
            if (resultCommande.data?.typeId) {
                let type = await tx.typeCommande.findFirst({
                    where: { id: resultCommande.data?.typeId }
                });

                if (!type) {
                    throw { errorStatus: 404, playLoad: { error: 'Ce type de commande n\'existe pas' } }
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
            return newCommande;
        })
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to create commande:', error);

        res.status(error.errorStatus).json(error.playLoad);
        throw error;
    }
};

// update a commande in the database and log the result
const updateCommande = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    try {
        const result = await prisma.$transaction(async (tx) => {
            // found
            const commandeFound = await tx.commande.findFirst({
                where: { id: parseInt(id) }
            })
            if (!commandeFound) {
                throw { errorStatus: 422, playLoad: { error: " Cette commande n'existe pas!" } }
            }

            if (commandeFound.validatedAt) {
                throw { errorStatus: 400, playLoad: { error: "Cette commande est déjà validée" } }
            }

            // details
            if (!req.body?.details || req.body?.details?.length == 0) {
                throw { errorStatus: 400, playLoad: { error: "Ajouter au moins un détail" } }
            }

            // validation
            const resultCommande = commandeValidation.safeParse({ ...req.body });
            if (!resultCommande.success) {
                throw { errorStatus: 422, playLoad: { errors: resultCommande.error.format() } }
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
                    throw { errorStatus: 409, playLoad: { error: 'Cette reference existe déjà' } }
                }
            }

            // traitement du fournisseur
            if (resultCommande.data?.fournisseurId) {
                let fournisseur = await tx.fournisseur.findFirst({
                    where: { id: resultCommande.data?.fournisseurId }
                });

                if (!fournisseur) {
                    throw { errorStatus: 404, playLoad: { error: 'Ce fournisseur n\'existe pas' } }
                }
            }

            // traitement du type
            if (resultCommande.data?.typeId) {
                let type = await tx.typeCommande.findFirst({
                    where: { id: resultCommande.data?.typeId }
                });

                if (!type) {
                    throw { errorStatus: 404, playLoad: { error: 'Ce type de commande n\'existe pas' } }
                }
            }

            /**
             * Traitement des détails
             */
            console.log("details :", req?.body?.details)
            req?.body?.details?.forEach((ligne, index) => {
                let resultDetailCommande = commandeDetailValidation.safeParse({ ...ligne });
                if (!resultDetailCommande.success) {
                    throw { errorStatus: 422, playLoad: { errors: { ...resultDetailCommande.error.format(), details: { _errors: `La ligne ${index + 1} est mal insérée` } } } }
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
            return updatedCommande
        })
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to create commande:', error);

        res.status(error.errorStatus).json(error.playLoad);
        throw error;
    }
};

// validate a command
const validateCommande = async (req, res) => {
    console.log("Début de validation de la commande ")

    try {
        const result = await prisma.$transaction(async (tx) => {
            const { id } = req.params;

            let commandeFound = await tx.commande.findUnique({
                where: { id: parseInt(id), deletedAt: null },
                include: {
                    commandeRecus: true,
                    commandeDetails: true,
                }
            });

            if (!commandeFound) {
                throw { errorStatus: 404, playLoad: { error: 'Commande non trouvée' } };

            }

            const recuCommandMontant = (commandeFound.commandeRecus ?? [])
                .filter((c) => !c.deletedAt)//non suprimés
                .reduce((total, c) => total + c.montant, 0);

            if (commandeFound.montant != null &&
                recuCommandMontant != commandeFound.montant
            ) {
                throw { errorStatus: 400, playLoad: { error: `Le montant total des reçus ${recuCommandMontant} est different du montant total ${commandeFound.montant} de la commande pour valider la commande` } };
            }

            if (commandeFound.validatedAt) {
                throw { errorStatus: 409, playLoad: { error: "Cette commande est déjà validée" } }
            }

            // validation de la commande de la base de données et log du résultat
            const commandValidated = await tx.commande.update({
                where: { deletedAt: null, id: parseInt(id) },
                data: {
                    validatedAt: new Date(),
                    validatedById: req.user?.user?.id
                }
            });

            console.log("Fin de validation de la commande")
            return commandValidated;
        })

        console.log("The result : ", result)
        res.status(200).json({ message: 'Commande validée avec succès!' });
    } catch (error) {
        console.log('Failed to validate commande:', error.playLoad);
        res.status(error.errorStatus).json(error.playLoad);
    }
};

// delete une commande
const deleteCommande = async (req, res) => {
    console.log("Début de suppression de la commande :", req.body)

    try {
        const result = await prisma.$transaction(async (tx) => {
            const { id } = req.params;
            let commandeFound = await tx.commande.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!commandeFound) {
                throw { errorStatus: 404, playLoad: { error: 'Commande non trouvée' } }
            }

            if (commandeFound.validatedAt) {
                throw { errorStatus: 400, playLoad: { error: "Cette commande est déjà validée" } }
            }

            // suppression de la commande de la base de données et log du résultat
            const updatedCommande = await tx.commande.update({
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

            return updatedCommande;
        })
        console.log("Commande suppriméé", updateCommande)
        res.status(200).json({ message: 'Commande supprimée avec succès!' });
    } catch (error) {
        console.error('Failed to delete commande:', error);
        res.status(error.errorStatus).json(error.playLoad);
    }
};

export { getCommandes, getAllValidatedCommandes, retrieveCommande, createCommande, updateCommande, validateCommande, deleteCommande };
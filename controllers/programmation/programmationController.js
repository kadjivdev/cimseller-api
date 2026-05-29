import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import { programmationValidation } from '../../database/validations/programmation/programmationValidation.js';

// Get all programmation from the database and log them
const getProgrammations = async (req, res) => {
    console.log("Getting progrmmations")

    try {
        const programmations = await prisma.programmation.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                //  relations
                commande: true,
                zone: true,
                statut: true,
                camion: true,
                chauffeur: true,
                avaliseur: true,
                createdBy: true,
                validatedBy: true
            }
        });

        res.json(programmations);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch programmations' });
        throw error;
    }
};

// create a new programmations in the database and log the result
const createProgrammation = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let user = req.user?.user

    await prisma.$transaction(async (tx) => {
        try {
            // validation
            const last = await tx.programmation.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true }
            });
            const resultProgrammation = programmationValidation.safeParse({ ...req.body, code: `PR-00${last?.id ? (last?.id + 1) : 1}` });

            console.log("resultProgrammation :", resultProgrammation.data)

            if (!resultProgrammation.success) {
                return res.status(400).json({
                    errors: resultProgrammation.error.format()
                });
            }

            // traitement du commande
            if (resultProgrammation.data?.commandeId) {
                let commande = await tx.commande.findFirst({
                    where: { id: resultProgrammation.data?.commandeId }
                });

                if (!commande) {
                    return res.status(404).json({ error: 'Cette commande n\'existe pas' });
                }
            }

            // traitement du statut
            if (resultProgrammation.data?.statutId) {
                let statut = await tx.statutProgrammation.findFirst({
                    where: { id: resultProgrammation.data?.statutId }
                });

                if (!statut) {
                    return res.status(404).json({ error: 'Ce statut de programmation n\'existe pas' });
                }
            }

            // traitement de la zone
            if (resultProgrammation.data?.zoneId) {
                let zone = await tx.zone.findFirst({
                    where: { id: resultProgrammation.data?.zoneId }
                });

                if (!zone) {
                    return res.status(404).json({ error: 'Cette zone de programmation n\'existe pas' });
                }
            }

            // traitement du camion
            if (resultProgrammation.data?.camionId) {
                let camion = await tx.camion.findFirst({
                    where: { id: resultProgrammation.data?.camionId }
                });

                if (!camion) {
                    return res.status(404).json({ error: 'Ce camion n\'existe pas' });
                }
            }

            // traitement du chauffeur
            if (resultProgrammation.data?.chauffeurId) {
                let chauffeur = await tx.chauffeur.findFirst({
                    where: { id: resultProgrammation.data?.chauffeurId }
                });

                if (!chauffeur) {
                    return res.status(404).json({ error: 'Ce chauffeur n\'existe pas' });
                }
            }

            // traitement de l'avaliseur
            if (resultProgrammation.data?.avaliseurId) {
                let avaliseur = await tx.avaliseurProgrammation.findFirst({
                    where: { id: resultProgrammation.data?.avaliseurId }
                });

                if (!avaliseur) {
                    return res.status(404).json({ error: 'Cet avaliseur n\'existe pas' });
                }
            }

            // verification de la qteProgrammer
            if (resultProgrammation.data?.qteProgrammer <= 0) {
                return res.status(400).json({ error: "La quantité doit depasser 0" })
            }

            /**Verification de la quantité déjà programmée 
             * sur cette commande
            */
            const programmations = await prisma.programmation.findMany({
                where: {
                    deletedAt: null,
                    commandeId: resultProgrammation.data?.commandeId
                }
            });

            const commandProgrammation = await prisma.commande.findFirst({
                where: { id: resultProgrammation.data?.commandeId },
                include: { commandeDetails: true }
            })

            //celle déjà programmée
            const qteTotalDejaProgramme = (programmations ?? [])
                .reduce((total, c) => total + c.qteProgrammer, 0);

            //celle programmée & celle entrante
            const qteTotalProgrammer = qteTotalDejaProgramme + resultProgrammation.data?.qteProgrammer;

            // celle de la commande
            const qteTotalCommande = commandProgrammation?.commandeDetails?.[0]?.qteCommande || 0

            if (qteTotalProgrammer > qteTotalCommande) {
                return res.status(400).json({
                    message: "Attention! à l'ajout de cette quantité, la quantité totale programmée dépasserait celle commandée ",
                    qteTotalCommande: qteTotalCommande,
                    qteTotalProgrammer: qteTotalProgrammer
                })
            }

            // insertion de la programmation
            const newProgrammation = await tx.programmation.create({
                data: {
                    ...resultProgrammation.data,
                    createdById: user?.id,
                },
            });

            res.status(201).json(newProgrammation);
        } catch (error) {
            console.error('Failed to create programmation:', error);

            res.status(500).json({ error: error.message || 'Failed to create programmation' });
            throw error;
        }
    })
};

// update a programmation in the database and log the result
const updateProgrammation = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
            // found
            const programmationFound = await tx.programmation.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            })

            if (!programmationFound) return res.status(400).json({ error: " Cette programmation n'existe pas!" })

            if (programmationFound.validatedAt) return res.status(400).json({ error: "Cette programmation est déjà validée" })

            // validation
            const resultProgrammation = programmationValidation.safeParse({
                ...programmationFound,
                ...req.body,
            });

            if (!resultProgrammation.success) {
                return res.status(400).json({
                    errors: resultProgrammation.error.format()
                });
            }

            // traitement du commande
            if (resultProgrammation.data?.commandeId) {
                let commande = await tx.commande.findFirst({
                    where: { id: resultProgrammation.data?.commandeId }
                });

                if (!commande) {
                    return res.status(404).json({ error: 'Cette commande n\'existe pas' });
                }
            }

            // traitement du statut
            if (resultProgrammation.data?.statutId) {
                let statut = await tx.statutProgrammation.findFirst({
                    where: { id: resultProgrammation.data?.statutId }
                });

                if (!statut) {
                    return res.status(404).json({ error: 'Ce statut de programmation n\'existe pas' });
                }
            }

            // traitement de la zone
            if (resultProgrammation.data?.zoneId) {
                let zone = await tx.zone.findFirst({
                    where: { id: resultProgrammation.data?.zoneId }
                });

                if (!zone) {
                    return res.status(404).json({ error: 'Cette zone de programmation n\'existe pas' });
                }
            }

            // traitement du camion
            if (resultProgrammation.data?.camionId) {
                let camion = await tx.zone.findFirst({
                    where: { id: resultProgrammation.data?.camionId }
                });

                if (!camion) {
                    return res.status(404).json({ error: 'Ce camion n\'existe pas' });
                }
            }

            // traitement du chauffeur
            if (resultProgrammation.data?.chauffeurId) {
                let chauffeur = await tx.chauffeur.findFirst({
                    where: { id: resultProgrammation.data?.chauffeurId }
                });

                if (!chauffeur) {
                    return res.status(404).json({ error: 'Ce chauffeur n\'existe pas' });
                }
            }

            // traitement de l'avaliseur
            if (resultProgrammation.data?.avaliseurId) {
                let avaliseur = await tx.avaliseurProgrammation.findFirst({
                    where: { id: resultProgrammation.data?.avaliseurId }
                });

                if (!avaliseur) {
                    return res.status(404).json({ error: 'Cet avaliseur n\'existe pas' });
                }
            }

            /**
             * Verification de la quantité déjà programmée 
             * sur cette commande
            */
            const programmations = await prisma.programmation.findMany({
                where: {
                    deletedAt: null,
                    commandeId: resultProgrammation.data?.commandeId,
                    id: { NOT: parseInt(id) }
                },
            });

            const command = await prisma.commande.findFirst({
                where: { id: resultProgrammation.data?.commandeId },
                include: { commandeDetails: true }
            })

            //qte déjà programmée
            const qteTotalDejaProgramme = (programmations ?? [])
                .reduce((total, c) => total + c.qteProgrammer, 0);

            //qte programmée & qte entrante
            const qteTotalProgrammer = qteTotalDejaProgramme + resultProgrammation.data?.qteProgrammer;

            // qte de la commande
            const qteTotalCommande = command?.commandeDetails?.[0]?.qteCommande || 0

            if (qteTotalProgrammer > qteTotalCommande) {
                return res.status(400).json({
                    message: "Attention! à l'ajout de cette quantité, la quantité totale programmée dépasserait celle commandée ",
                    qteTotalCommande: qteTotalCommande,
                    qteTotalProgrammer: qteTotalProgrammer
                })
            }

            // modification de la programmation
            const updatedProgrammation = await tx.programmation.update({
                where: { id: parseInt(id) },
                data: {
                    ...resultProgrammation.data,
                },
            });

            res.status(201).json(updatedProgrammation);
        } catch (error) {
            console.error('Failed to create programmation:', error);

            res.status(500).json({ error: error.message || 'Failed to create programmation' });
            throw error;
        }
    })
};

// validate a programmation
const validateProgrammation = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;

        try {
            let programmationFound = await tx.programmation.findUnique({
                where: { id: parseInt(id), deletedAt: null },
            });

            if (!programmationFound) return res.status(404).json({ error: 'Programmation non trouvée' });

            if (programmationFound.validatedAt) return res.status(409).json({ error: "Cette programmation est déjà validée" })

            // validation de la programmation de la base de données et log du résultat
            await tx.programmation.update({
                where: { deletedAt: null, id: parseInt(id) },
                data: {
                    validatedAt: new Date(),
                    validatedById: req.user?.user?.id
                }
            });
            res.status(200).json({ message: 'Programmation validée avec succès!' });
        } catch (error) {
            console.error('Failed to delete programmation:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la programmation' });
        }
    })
};

// delete a programmation
const deleteProgrammation = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;
        try {
            let programmationFound = await tx.programmation.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!programmationFound) return res.status(404).json({ error: 'Programmation non trouvée' });

            if (programmationFound.validatedAt) return res.status(400).json({ error: "Cette programmation est déjà validée" })

            // suppression de la programmation de la base de données et log du résultat
            await tx.programmation.update({
                where: { id: parseInt(id) },
                data: {
                    deletedAt: new Date(),
                }
            });
            res.status(200).json({ message: 'Programmation supprimée avec succès!' });
        } catch (error) {
            console.error('Failed to delete programmation:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la programmation' });
        }
    })
};

export { getProgrammations, createProgrammation, updateProgrammation, validateProgrammation, deleteProgrammation };
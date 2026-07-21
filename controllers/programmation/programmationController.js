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
                commande: {
                    select: {
                        id: true,
                        code: true,
                        commandeDetails: {
                            select: {
                                id: true,
                                product: true
                            }
                        }
                    }
                },
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

// retrieve a programmation in the database and log the result
const retrieveProgrammation = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
            // found
            const programmationFound = await tx.programmation.findFirst({
                where: { id: parseInt(id), deletedAt: null },
                include: {
                    commande: true,
                    zone: true,
                    statut: true,
                    camion: true,
                    chauffeur: true,
                    avaliseur: true,
                    createdBy: true,
                    validatedBy: true
                }
            })

            if (!programmationFound) return res.status(400).json({ error: "Cette programmation n'existe pas!" })

            if (programmationFound.validatedAt) return res.status(400).json({ error: "Cette programmation est déjà validée" })

            res.status(200).json(programmationFound);
        } catch (error) {
            console.error('Failed to create programmation:', error);

            res.status(500).json({ error: error.message || 'Failed to create programmation' });
            throw error;
        }
    })
};

// create a new programmations in the database and log the result
const createProgrammation = async (req, res) => {
    console.log('Insertion de programmation:', req.body); // Log the incoming request body

    let user = req.user?.user

    try {
        const result = await prisma.$transaction(async (tx) => {
            // validation
            const last = await tx.programmation.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true }
            });
            const resultProgrammation = programmationValidation.safeParse({ ...req.body, code: `PR-00${last?.id ? (last?.id + 1) : 1}` });

            console.log("resultProgrammation :", resultProgrammation.data)

            if (!resultProgrammation.success) {
                throw { errorStatus: 422, payLoad: { errors: resultProgrammation.error.format() } }
            }

            // traitement du commande
            let commande = null
            if (resultProgrammation.data?.commandeId) {
                commande = await tx.commande.findFirst({
                    where: { id: resultProgrammation.data?.commandeId },
                    include: { commandeDetails: true, programmations: true }
                });

                if (!commande) {
                    throw { errorStatus: 404, payLoad: { error: 'Cette commande n\'existe pas' } }
                }
            }

            // traitement de la zone
            if (resultProgrammation.data?.zoneId) {
                let zone = await tx.zone.findFirst({
                    where: { id: resultProgrammation.data?.zoneId }
                });

                if (!zone) {
                    throw { errorStatus: 404, payLoad: { error: 'Cette zone de programmation n\'existe pas' } }
                }
            }

            // traitement du camion
            if (resultProgrammation.data?.camionId) {
                let camion = await tx.camion.findFirst({
                    where: { id: resultProgrammation.data?.camionId }
                });

                if (!camion) {
                    throw { errorStatus: 404, payLoad: { error: 'Ce camion n\'existe pas' } }
                }
            }

            // traitement du chauffeur
            if (resultProgrammation.data?.chauffeurId) {
                let chauffeur = await tx.chauffeur.findFirst({
                    where: { id: resultProgrammation.data?.chauffeurId }
                });

                if (!chauffeur) {
                    throw { errorStatus: 404, payLoad: { error: 'Ce chauffeur n\'existe pas' } }
                }
            }

            // traitement de l'avaliseur
            if (resultProgrammation.data?.avaliseurId) {
                let avaliseur = await tx.avaliseurProgrammation.findFirst({
                    where: { id: resultProgrammation.data?.avaliseurId }
                });

                if (!avaliseur) {
                    throw { errorStatus: 404, payLoad: { error: 'Cet avaliseur n\'existe pas' } }
                }
            }

            // verification de la qteProgrammer
            if (resultProgrammation.data?.qteProgrammer <= 0) {
                throw { errorStatus: 400, payLoard: { error: "La quantité doit depasser 0" } }
            }

            /**Verification de la quantité déjà programmée 
             * sur cette commande
            */

            //celle déjà programmée
            const qteTotalDejaProgramme = (commande.programmations ?? [])
                .reduce((total, c) => total + c.qteProgrammer, 0);

            //celle programmée & celle entrante
            const qteTotalProgrammer = qteTotalDejaProgramme + resultProgrammation.data?.qteProgrammer;

            // celle de la commande
            const qteTotalCommande = commande?.commandeDetails?.
                reduce((total, detail) => (total + detail.qteCommande), 0)

            console.log("qteTotalDejaProgramme :", qteTotalDejaProgramme)
            console.log("qteTotalProgrammer :", qteTotalProgrammer)
            console.log("qteTotalCommande :", qteTotalCommande)

            if (qteTotalProgrammer > qteTotalCommande) {
                throw { errorStatus: 400, payLoad: { error: `Attention! à l'ajout de cette quantité (${resultProgrammation.data?.qteProgrammer}), la quantité totale (${qteTotalProgrammer}) programmée dépasserait celle commandée ${qteTotalCommande}` } }
            }

            // insertion de la programmation
            const newProgrammation = await tx.programmation.create({
                data: {
                    ...resultProgrammation.data,
                    createdById: user?.id,
                },
            });

            console.log("Programmation insérée avec succès!")
            return newProgrammation
        })
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to create programmation:', error);
        res.status(error.errorStatus).json(error.payLoad);
    }
};

// update a programmation in the database and log the result
const updateProgrammation = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params
    const user = req.user?.user

    try {
        const result = await prisma.$transaction(async (tx) => {

            // found programmation
            const programmationFound = await tx.programmation.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            });

            if (!programmationFound) {
                throw { errorStatus: 404, payLoad: { error: "Cette programmation n'existe pas!" } }
            }

            // validation

            const resultProgrammation = programmationValidation.safeParse({ ...req.body });

            console.log("resultProgrammation :", resultProgrammation.data)

            if (!resultProgrammation.success) {
                throw { errorStatus: 422, payLoad: { errors: resultProgrammation.error.format() } }
            }

            // traitement du commande
            let commande = null
            if (resultProgrammation.data?.commandeId) {
                commande = await tx.commande.findFirst({
                    where: { id: resultProgrammation.data?.commandeId },
                    include: { commandeDetails: true, programmations: true }
                });

                if (!commande) {
                    throw { errorStatus: 404, payLoad: { error: 'Cette commande n\'existe pas' } }
                }
            }

            // traitement de la zone
            if (resultProgrammation.data?.zoneId) {
                let zone = await tx.zone.findFirst({
                    where: { id: resultProgrammation.data?.zoneId }
                });

                if (!zone) {
                    throw { errorStatus: 404, payLoad: { error: 'Cette zone de programmation n\'existe pas' } }
                }
            }

            // traitement du camion
            if (resultProgrammation.data?.camionId) {
                let camion = await tx.camion.findFirst({
                    where: { id: resultProgrammation.data?.camionId }
                });

                if (!camion) {
                    throw { errorStatus: 404, payLoad: { error: 'Ce camion n\'existe pas' } }
                }
            }

            // traitement du chauffeur
            if (resultProgrammation.data?.chauffeurId) {
                let chauffeur = await tx.chauffeur.findFirst({
                    where: { id: resultProgrammation.data?.chauffeurId }
                });

                if (!chauffeur) {
                    throw { errorStatus: 404, payLoad: { error: 'Ce chauffeur n\'existe pas' } }
                }
            }

            // traitement de l'avaliseur
            if (resultProgrammation.data?.avaliseurId) {
                let avaliseur = await tx.avaliseurProgrammation.findFirst({
                    where: { id: resultProgrammation.data?.avaliseurId }
                });

                if (!avaliseur) {
                    throw { errorStatus: 404, payLoad: { error: 'Cet avaliseur n\'existe pas' } }
                }
            }

            // verification de la qteProgrammer
            if (resultProgrammation.data?.qteProgrammer <= 0) {
                throw { errorStatus: 400, payLoard: { error: "La quantité doit depasser 0" } }
            }

            /**Verification de la quantité déjà programmée 
             * sur cette commande
            */

            //celle déjà programmée
            console.log("filtered programmation :", commande.programmations?.filter((pr) => pr.id != id))
            const qteTotalDejaProgramme = (commande.programmations?.filter((pr) => pr.id != id) || [])
                .reduce((total, c) => total + c.qteProgrammer, 0);

            //celle programmée & celle entrante
            const qteTotalProgrammer = qteTotalDejaProgramme + resultProgrammation.data?.qteProgrammer;

            // celle de la commande
            const qteTotalCommande = commande?.commandeDetails?.
                reduce((total, detail) => (total + detail.qteCommande), 0)

            console.log("qteTotalDejaProgramme :", qteTotalDejaProgramme)
            console.log("qteTotalProgrammer :", qteTotalProgrammer)
            console.log("qteTotalCommande :", qteTotalCommande)

            if (qteTotalProgrammer > qteTotalCommande) {
                throw { errorStatus: 400, payLoad: { error: `Attention! à l'ajout de cette quantité (${resultProgrammation.data?.qteProgrammer}), la quantité totale (${qteTotalProgrammer}) programmée dépasserait celle commandée ${qteTotalCommande}` } }
            }

            // insertion de la programmation
            const newProgrammation = await tx.programmation.update({
                where: { id: parseInt(id), deletedAt: null },
                data: {
                    ...resultProgrammation.data,
                    createdById: user?.id,
                },
            });

            console.log("Programmation modifiée avec succès!")
            return newProgrammation
        })
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to create programmation:', error);
        res.status(error.errorStatus).json(error.payLoad);
    }
};

// validate a programmation
const validateProgrammation = async (req, res) => {

    try {
        const result = await prisma.$transaction(async (tx) => {
            const { id } = req.params;

            let programmationFound = await tx.programmation.findUnique({
                where: { id: parseInt(id), deletedAt: null },
            });

            if (!programmationFound) {
                throw { errorStatus: 404, payLoad: { error: 'Programmation non trouvée' } }
            }

            if (programmationFound.validatedAt) {
                throw { errorStatus: 409, payLoad: { error: "Cette programmation est déjà validée" } }
            }

            // validation de la programmation de la base de données et log du résultat
            const updatedProgrammation = await tx.programmation.update({
                where: { deletedAt: null, id: parseInt(id) },
                data: {
                    statutId: 1,
                    validatedAt: new Date(),
                    validatedById: req.user?.user?.id
                }
            });

            return updatedProgrammation
        })
        console.log("Programmation validée avec succès!")
        res.status(200).json({ message: 'Programmation validée avec succès!' });
    } catch (error) {
        console.error('Failed to delete programmation:', error);
        res.status(error.errorStatus).json(error.payLoad);
    }
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

export { getProgrammations, retrieveProgrammation, createProgrammation, updateProgrammation, validateProgrammation, deleteProgrammation };
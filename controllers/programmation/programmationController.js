import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import { programmationValidation } from '../../database/validations/programmation/programmationValidation.js';
import { generateProgrammationsPDF } from '../../services/pdfService.js';
import { error } from 'console';
import { create } from 'domain';

const formaVente = (vente) => {
    console.log('vente.preuve', vente.preuve)

    return {
        ...vente,
        preuve: vente.preuve ? `${process.env.BASE_URL}/public/uploads/${vente.preuve}` : null
    }
}

const UPLOADS_DIR = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../public/uploads'
);

async function deletePreuveFile(filename) {
    if (!filename) return;
    try {
        console.log("path du fichier à supprimer:", path.join(UPLOADS_DIR, filename))

        await fs.promises.unlink(path.join(UPLOADS_DIR, filename));
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error('Failed to delete image file:', err);
        }
    }
}

const ALLOWED_IMAGE_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

function validatePreuveFile(file, { required }) {
    if (!file) {
        return required
            ? { ok: false, error: "L'image est requise" }
            : { ok: true };
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return { ok: false, error: 'Format image invalide' };
    }
    if (file.size > MAX_IMAGE_SIZE) {
        return { ok: false, error: 'Image trop volumineuse' };
    }
    return { ok: true };
}

const toImageUrl = (filename) =>
    filename ? `${process.env.BASE_URL}/public/uploads/${filename}` : null;

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
                        fournisseur: true,
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

// Get all validated programmations from the database and log them
const getValidatedProgrammations = async (req, res) => {
    console.log("Getting validated progrmmations")

    try {
        const programmations = await prisma.programmation.findMany({
            where: { deletedAt: null, validatedById: { not: null } },
            orderBy: { id: 'desc' },
            include: {
                //  relations
                chauffeur: true,
                commande: {
                    select: {
                        id: true,
                        code: true,
                        commandeDetails: {
                            include: {
                                product: true,
                            }
                        },
                        fournisseur: true,
                    }
                },
                ventes: {
                    // seules les ventes validées
                    where: { validatedAt: { not: null } },
                    include: {
                        client: true,
                        commandeClient: {
                            include: { client: true }
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

        console.log("Les Programmations validées sont recupérées avec succès!", programmations)
        res.json(programmations);
    } catch (error) {
        console.log('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch validated programmations' });
        throw error;
    }
};

// retrieve a programmation in the database and log the result
const retrieveProgrammation = async (req, res) => {
    console.log('Début de recupération de la programmation:', req.body); // Log the incoming request body

    let { id } = req.params
    const user = req.user?.user;

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
                    validatedBy: true,
                    ventes: {
                        orderBy: { id: 'desc' },
                        where: {
                            deletedAt: null,
                            ...(user?.roleId == 5 ?//role vendeur
                                { createdById: user?.id } :// les vendeurs ne verront que leur ventes
                                {}
                            ),
                        },
                        include: {
                            programmation: true,
                            commandeClient: {
                                include: {
                                    client: true
                                }
                            },
                            client: true,
                            produit: true,
                            type: true,
                            statut: true,
                            typeFactureVente: true,
                            createdBy: true,
                            validatedBy: true,
                        }
                    }
                }
            })

            if (!programmationFound) return res.status(400).json({ error: "Cette programmation n'existe pas!" })

            let qteVendue = programmationFound?.ventes?.reduce((total, vente) => (total + vente.qteTotal), 0)

            console.log("qteVendue: ", qteVendue)
            console.log("programmationFound?.qteProgrammer :", programmationFound?.qteProgrammer)
            console.log("programmationFound?.qteProgrammer ?? 0 - qteVendue ?? 0 : ", programmationFound?.qteProgrammer - qteVendue)

            res.status(200).json({
                ...programmationFound,
                ventes: programmationFound?.ventes.map(formaVente),
                qteVendue,
                resteAvendre: (programmationFound?.qteProgrammer - qteVendue) ?? 0
            });
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
            const count = (await tx.programmation.findMany({}))?.length;
            const resultProgrammation = programmationValidation.safeParse({ ...req.body, code: `PR-00${count + 1}` });

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
            const qteTotalDejaProgramme = (commande.programmations?.filter((pr) => pr.statutId != 2) ?? [])//on considère pas les annulées
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
                include: {
                    commande: {
                        include: {
                            programmations: true,
                            commandeDetails: true
                        }
                    },
                },
            });

            if (!programmationFound) {
                throw { errorStatus: 404, payLoad: { error: 'Programmation non trouvée' } }
            }

            if (programmationFound.validatedAt) {
                throw { errorStatus: 400, payLoad: { error: "Cette programmation est déjà validée" } }
            }

            // if (!programmationFound.imprimer) {
            //     throw { errorStatus: 400, payLoad: { error: "Cette programmation n'esp pas encore imprimée" } }
            // }

            // Statut *Bon en cours de programmation*
            await tx.commande.update({
                where: { id: programmationFound?.commande.id, deletedAt: null },
                data: { statutId: 2 }//en cours de programmation
            })

            //celle déjà programmée
            const qteTotalDejaProgramme = (programmationFound?.commande?.programmations.
                filter((pr) => pr.validatedById) ?? [])//celles validées 
                .reduce((total, c) => total + c.qteProgrammer, 0);

            //celle programmée & celle entrante
            const qteTotalProgrammer = qteTotalDejaProgramme + programmationFound?.qteProgrammer;

            // celle de la commande
            const qteTotalCommande = programmationFound.commande?.commandeDetails?.
                reduce((total, detail) => (total + detail.qteCommande), 0)

            console.log("qteTotalDejaProgramme :", qteTotalDejaProgramme)
            console.log("qteTotalProgrammer :", qteTotalProgrammer)
            console.log("qteTotalCommande :", qteTotalCommande)

            // changement de statut du bon
            if (qteTotalProgrammer == qteTotalCommande || qteTotalProgrammer > qteTotalCommande) {
                await tx.commande.update({
                    where: { id: programmationFound?.commande.id },
                    data: { statutId: 3 }//programmée
                })
            }

            // validation de la programmation de la base de données et log du résultat
            const updatedProgrammation = await tx.programmation.update({
                where: { deletedAt: null, id: parseInt(id) },
                data: {
                    statutId: 1,//validée
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

// annuler une programmation
const annulerProgrammation = async (req, res) => {
    console.log("Début d'annulation du programme :", req.body)
    try {
        const { id } = req.body;
        const result = await prisma.$transaction(async (tx) => {

            let programmationFound = await tx.programmation.findUnique({
                where: { id: parseInt(id), deletedAt: null },
                include: {
                    commande: {
                        include: {
                            programmations: true,
                            commandeDetails: true
                        }
                    },
                },
            });

            if (!programmationFound) {
                throw { errorStatus: 404, payLoad: { error: 'Programmation non trouvée' } }
            }

            if (programmationFound.statutId == 2) {//annulée
                throw { errorStatus: 400, payLoad: { error: "Cette programmation est déjà annulée" } }
            }

            // validation de la programmation de la base de données et log du résultat
            const updatedProgrammation = await tx.programmation.update({
                where: { deletedAt: null, id: parseInt(id) },
                data: {
                    statutId: 2,//annulée
                }
            });

            return updatedProgrammation
        })
        console.log("Programmation annulée avec succès!")
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

            await deletePreuveFile(programmationFound.preuve);

            res.status(200).json({ message: 'Programmation supprimée avec succès!' });
        } catch (error) {
            console.error('Failed to delete programmation:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la programmation' });
        }
    })
};

// imprimer a list of programmations
const printProgrammations = async (req, res) => {
    console.log('Début d\'impression des programmation:', req.body);

    let user = req.user?.user
    let { fournisseurId, start, end } = req.body

    try {
        const result = await prisma.$transaction(async (tx) => {

            if (!fournisseurId || !start || !end) {
                throw { errorStatus: 404, payLoad: { error: "Le fournisseur et la période sont réquis!" } }
            }

            const fournisseur = await tx.fournisseur.findFirst({
                where: { deletedAt: null, id: parseInt(fournisseurId) }
            })

            if (!fournisseur) {
                throw { errorStatus: 404, payLoad: { error: "Ce fournisseur n'existe pas!" } }
            }

            // persistance de l'impression
            await tx.programmation.updateMany({
                where: {
                    imprimer: false,      // jamais imprimée dans la vague courante
                    oldImprimer: false,//les anciennes ne sont plus considéerées
                    commande: { fournisseurId: parseInt(fournisseurId) },
                    createdAt: { gte: new Date(start), lte: new Date(end) },
                    OR: [//on considère pas les annulées
                        { statutId: null },
                        { NOT: { statutId: 2 } }
                    ]
                },
                data: {
                    imprimer: true,
                    validatedAt: new Date(),
                    validatedById: user?.id
                }
            })

            return { fournisseurId, start, end }
        })

        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to print programmations:', error);
        const status = error.errorStatus || 500
        const payload = error.payLoad || { error: 'Erreur interne du serveur' }
        res.status(status).json(payload);
    }
};

// Get pdf a list of programmations
const getPdfProgrammations = async (req, res) => {
    console.log("Début de recuperation de PDF :", req)
    const { fournisseurId, start, end } = req.params

    try {
        const result = await prisma.$transaction(async (tx) => {
            const fournisseur = await tx.fournisseur.findFirst({
                where: { deletedAt: null, id: parseInt(fournisseurId) }
            })

            if (!fournisseur) {
                return res.status(404).json({ error: "Ce fournisseur n'existe pas!" })
            }

            const programmations = await tx.programmation.findMany({
                where: {
                    oldImprimer: false,//les anciennes programmes imprimées ne sont plus considéerées
                    commande: { fournisseurId: parseInt(fournisseurId) },
                    createdAt: { gte: new Date(start), lte: new Date(end) },
                    OR: [//on considère pas les annulées
                        { statutId: null },
                        { NOT: { statutId: 2 } }
                    ]
                },
                include: {
                    zone: true,
                    statut: true,
                    camion: true,
                    chauffeur: true,
                    avaliseur: true,
                    commande: {
                        include: { commandeDetails: { include: { product: true } } }
                    }
                },
            })

            console.log("Les programmes en cours d'impression :", programmations)

            // classons ces programmations dans oldImprimer
            await tx.programmation.updateMany({
                where: {
                    commande: { fournisseurId: parseInt(fournisseurId) },
                    createdAt: { gte: new Date(start), lte: new Date(end) },
                    OR: [//on considère pas les annulées
                        { statutId: null },
                        { NOT: { statutId: 2 } }
                    ]
                },
                data: {
                    oldImprimer: true,
                }
            })

            const pdfBuffer = await generateProgrammationsPDF(fournisseur, programmations, start, end);
            return pdfBuffer
        })

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=programmations.pdf');
        res.send(result);
    } catch (error) {
        console.error('Failed to generate PDF:', error);
        res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
    }
};


// actualize a programmation in the database and log the result
const actualiseProgrammation = async (req, res) => {
    console.log('Debut d\'actualisation de la programmation:', req.body); // Log the incoming request body

    const user = req.user?.user
    let { id } = req.params
    const { programId, dateSortie, bl } = req.body
    console.log("L'ID :", id)

    try {
        const result = await prisma.$transaction(async (tx) => {

            // traitement de la programmation
            let program = await tx.programmation.findFirst({
                where: {
                    id: parseInt(programId),
                    deletedAt: null
                }
            });

            if (!program) {
                throw { errorStatus: 404, payLoad: { error: 'Cette programmation n\'existe pas' } }
            }

            // traitement de la commande
            if (bl) {
                let proBl = await tx.programmation.findFirst({
                    where: { bl: bl }
                });

                if (proBl) {
                    throw { errorStatus: 409, payLoad: { error: 'Ce Bl existe déjà' } }
                }
            }

            // traitement de la date de sortie
            if (dateSortie && new Date(dateSortie) > new Date()) {
                throw { errorStatus: 400, payLoad: { error: 'La date de sortie doit être égale ou antérieure à aujourd\'hui' } }
            }

            // update de la programmation
            const newProgrammation = await tx.programmation.update({
                where: { id: parseInt(program?.id), deletedAt: null },
                data: {
                    dateSortie: new Date(dateSortie),
                    bl
                },
            });

            console.log("Programmation actualisée avec succès!")
            return newProgrammation
        })
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to actualise programmation:', error);
        res.status(error.errorStatus).json(error.payLoad);
    }
};

// livraison de programmation in the database and log the result
const livraisonProgrammation = async (req, res) => {
    const user = req.user?.user
    const { programId, dateLivraison, newBl, livraisonComment } = req.body
    const qteLivre = Number(req.body.qteLivre) // ✅ conversion unique en haut

    try {
        const preuveCheck = validatePreuveFile(req.file, { required: false });
        if (!preuveCheck.ok) {
            return res.status(400).json({ error: preuveCheck.error });
        }

        const result = await prisma.$transaction(async (tx) => {
            let program = await tx.programmation.findFirst({
                where: { id: parseInt(programId), deletedAt: null },
            });

            if (!program) {
                throw { errorStatus: 404, payLoad: { error: 'Cette programmation n\'existe pas' } }
            }

            if (program.qteLivre > program.qteProgrammer) {
                throw { errorStatus: 400, payLoad: { error: "La quantité livrée dépasse la quantité programmée" } }
            }

            if (newBl) {
                let nBl = await tx.programmation.findFirst({ where: { newBl: newBl, id: { not: parseInt(programId) } } });
                if (nBl) {
                    throw { errorStatus: 409, payLoad: { error: 'Ce newBl existe déjà' } }
                }
            }

            if (newBl != program.bl) {
                throw { errorStatus: 400, payLoad: { error: 'Ce newBl ne correspond pas au BL de la programmation.' } }
            }

            if (dateLivraison && new Date(dateLivraison) > new Date()) {
                throw { errorStatus: 400, payLoad: { error: 'La date de livraison doit être égale ou antérieure à aujourd\'hui' } }
            }

            const totalQteLivre = Number(program?.qteLivre ?? 0) + qteLivre
            const statutId = totalQteLivre < program?.qteProgrammer ? 3 : 4

            const newProgrammation = await tx.programmation.update({
                where: { id: parseInt(program?.id), deletedAt: null },
                data: {
                    dateLivraison: new Date(dateLivraison),
                    newBl,
                    livraisonComment,
                    statutId,
                    qteLivre: totalQteLivre,
                    preuve: req.file?.filename,
                },
            });

            if (newProgrammation.qteLivre > newProgrammation.qteProgrammer) {
                throw { errorStatus: 400, payLoad: { error: "La quantité livrée dépasse la quantité programmée" } }
            }

            return newProgrammation
        })
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to actualise programmation:', error);
        const status = error.errorStatus || 500
        const payload = error.payLoad || { error: 'Erreur interne du serveur' }
        res.status(status).json(payload);
    }
};

// transfert de programmation 
const transferProgrammation = async (req, res) => {
    console.log('Debut de transfert de la programmation:', req.body); // Log the incoming request body

    const user = req.user?.user
    const { programId, date, qteReste, zoneDest, observation } = req.body

    try {
        // 
        const result = await prisma.$transaction(async (tx) => {
            // traitement de la programmation
            let program = await tx.programmation.findFirst({
                where: {
                    id: parseInt(programId),
                    deletedAt: null
                },
            });

            if (!program) {
                throw { errorStatus: 404, payLoad: { error: 'Cette programmation n\'existe pas' } }
            }

            // verification des quantités
            if (program.qteLivre > 0) {
                throw { errorStatus: 400, payLoad: { error: "Cette programmation a déjà subit de livraison, vous pouvez plus la tranférer" } }
            }

            // verification de la zone
            if (program.zoneId == zoneDest) {
                throw { errorStatus: 400, payLoad: { error: "La zone de destination doit être differente de la zone source." } }
            }

            // update de la programmation
            const newProgrammation = await tx.programmation.update({
                where: { id: parseInt(program?.id), deletedAt: null },
                data: {
                    zoneId: zoneDest,
                    transfert: true,
                    transferts: {
                        create: {
                            zoneSourceId: program?.zoneId,
                            zoneDest,
                            date: new Date(date),
                            observation,
                            qteReste,
                            userId: user?.id,
                        }
                    }
                }
            });

            console.log("Transférée avec succès!")
            return newProgrammation
        })
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to transfer programmation:', error);
        res.status(error.errorStatus).json(error.payLoad);
    }
};

export {
    getProgrammations,
    getValidatedProgrammations,
    getPdfProgrammations,
    retrieveProgrammation,
    createProgrammation,
    updateProgrammation,
    validateProgrammation,
    annulerProgrammation,
    deleteProgrammation,
    printProgrammations,
    actualiseProgrammation,
    livraisonProgrammation,
    transferProgrammation
};
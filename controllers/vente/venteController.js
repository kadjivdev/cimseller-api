import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { venteValidation } from '../../database/validations/vente/venteValidation.js';

const UPLOADS_DIR = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..', '..', 'public', 'uploads'
);

const toImageUrl = (filename) =>
    filename ? `${process.env.BASE_URL}/public/uploads/${filename}` : null;

const formatVente = (vente) => {
    let reglementAmount = vente.reglements?.reduce((a, regle) => (a + regle.montant), 0) ?? 0;
    let reste = vente.montant - reglementAmount

    const data = { ...vente, reglementAmount, reste, preuve: toImageUrl(vente.preuve) }

    console.log("Data :", data)
    return {
        ...data,
    }
};

const ALLOWED_IMAGE_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
function validateImageFile(file, { required }) {
    if (!file) {
        return required ? { ok: false, error: 'Image is required' }
            : { ok: true };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return { ok: false, error: 'Invalid image type' };
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return { ok: false, error: 'Image size exceeds limit' };
    }

    return { ok: true };
}

// suppression de la preuve
async function deleteImageFile(filename) {
    if (filename) {
        const imagePath = path.join(UPLOADS_DIR, filename);
        await fs.promises.unlink(imagePath).catch((err) => {
            console.error('Failed to delete image:', err);
        });
    }
}

// Get all ventes from the database and log them
const getVentes = async (req, res) => {
    console.log("Getting ventes")

    try {
        const ventes = await prisma.vente.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                //  relations
                // commandeClient: true,
                client: {
                    select: {
                        id: true,
                        raison_sociale: true
                    }
                },
                produit: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                statut: true,
                type: true,
                typeFactureVente: true,
                venteComptability: true,

                createdBy: {
                    select: {
                        fullname: true,
                        email: true,
                        createdAt: true
                    }
                },
                validatedBy: {
                    select: {
                        fullname: true,
                        email: true,
                        createdAt: true
                    }
                }
            }
        });

        res.json(ventes);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch ventes' });
        throw error;
    }
};

// Get all validated ventes from the database and log them
const getValidatedVentes = async (req, res) => {
    console.log("Getting validated ventes")

    try {
        const ventes = await prisma.vente.findMany({
            where: { statutId: 2, deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                reglements: {
                    where: { deletedAt: null }
                }
            }
        });

        res.json(ventes.map(formatVente));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch validated ventes' });
        throw error;
    }
};

// create a new ventes in the database and log the result
const createVente = async (req, res) => {
    console.log('Request body:', req.body);
    let user = req.user?.user;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const imageCheck = validateImageFile(req.file, { required: false });
            if (!imageCheck.ok) {
                throw { errorStatus: 400, payLoad: { error: imageCheck.error } };
            }

            const last = await tx.vente.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true }
            });
            const resultVente = venteValidation.safeParse({
                ...req.body,
                code: `VD-00${last?.id ? (last.id + 1) : 1}`
            });

            if (!resultVente.success) {
                throw { errorStatus: 422, payLoad: { errors: resultVente.error.format() } };
            }

            // ⚠️ on sort clientCommanderId AVANT de spread dans vente.create,
            // sinon Prisma renvoie une erreur "Unknown argument" (crash catch)
            const { clientCommanderId, commandClientId, ...venteData } = resultVente.data;

            if (commandClientId) {
                const commandeClient = await tx.commandeClient.findFirst({
                    where: { id: commandClientId }
                });
                if (!commandeClient) {
                    throw { errorStatus: 404, payLoad: { error: 'Cette commande client n\'existe pas' } };
                }
            }

            if (resultVente.data?.produitId) {
                const produit = await tx.produit.findFirst({ where: { id: resultVente.data.produitId } });
                if (!produit) throw { errorStatus: 404, payLoad: { error: 'Ce produit n\'existe pas' } };
            }

            if (resultVente.data?.typeId) {
                const type = await tx.typeCommandeClient.findFirst({ where: { id: resultVente.data.typeId } });
                if (!type) throw { errorStatus: 404, payLoad: { error: 'Ce type de commande client n\'existe pas' } };
            }

            if (resultVente.data?.typeFactureVenteId) {
                const typeFactureVente = await tx.typeFactureVente.findFirst({ where: { id: resultVente.data.typeFactureVenteId } });
                if (!typeFactureVente) throw { errorStatus: 404, payLoad: { error: 'Ce type de facture de vente n\'existe pas' } };
            }

            if (resultVente.data?.clientId) {
                const client = await tx.client.findFirst({ where: { id: resultVente.data.clientId } });
                if (!client) throw { errorStatus: 404, payLoad: { error: 'Ce client n\'existe pas' } };
            }

            let commandeClient = null;
            if (commandClientId) {
                commandeClient = await tx.commandeClient.findFirst({ where: { id: commandClientId } });
            }

            // ⚠️ parenthésage corrigé : ?? a une précédence très basse,
            // sans parenthèses le transport était totalement ignoré du calcul
            const montant = resultVente.data?.montant
                ? resultVente.data.montant
                : ((resultVente.data?.unitePrice ?? 0) * (resultVente.data?.qteTotal ?? 0))
                - (resultVente.data?.remise ?? 0)
                + ((resultVente.data?.qteTotal ?? 0) * (resultVente.data?.transport ?? 0));

            if (!commandeClient) {
                const lastCmd = await tx.commandeClient.findFirst({
                    orderBy: { id: 'desc' },
                    select: { id: true }
                });

                commandeClient = await tx.commandeClient.create({
                    data: {
                        code: `CMD-00${lastCmd?.id ? (lastCmd.id + 1) : 1}`,
                        clientId: clientCommanderId,
                        validatedById: user?.id,
                        validatedAt: new Date(),
                        date: new Date(),
                        montant,
                        typeCommandeClientId: resultVente.data?.typeId,
                    }
                });
            }

            const newVente = await tx.vente.create({
                data: {
                    ...venteData,
                    commandClientId: commandeClient?.id,
                    montant,
                    createdById: user?.id,
                    statutId: 1,
                    preuve: req.file ? req.file.filename : null
                },
            });

            return newVente;
        });

        res.status(201).json(result);
    } catch (error) {
        // ⚠️ garde-fou : si l'erreur n'a pas errorStatus/payLoad (ex: erreur Prisma
        // native), on retombe sur un 500 générique au lieu de crasher le process
        const status = error?.errorStatus ?? 500;
        const payload = error?.payLoad ?? { error: 'Erreur interne du serveur' };

        console.error('Code:', status);
        console.error('Failed to create vente:', error);

        return res.status(status).json(payload);
    }
};

// retrieve a vente in the database and log the result
const retrieveVente = async (req, res) => {
    console.log('Début de recupération de la vente:', req.body); // Log the incoming request body

    let { id } = req.params

    try {
        const result = await prisma.$transaction(async (tx) => {
            // found
            const venteFound = await tx.vente.findFirst({
                where: { id: parseInt(id), deletedAt: null },
                include: {
                    commandeClient: true,
                    client: true,
                    produit: true,
                    statut: true,
                    type: true,
                    typeFactureVente: true,
                    reglements: true,
                    venteComptability: true,
                    reglements: {
                        // where: { validatedAt: { not: null } },
                        include: {
                            createdBy: true,
                            validatedBy: true,
                            typeDetailRecu: true,
                            compteBancaire: true,
                            client: true
                        }
                    },
                    treatedBy: {
                        select: {
                            fullname: true,
                            email: true,
                            createdAt: true
                        }
                    },
                    createdBy: {
                        select: {
                            fullname: true,
                            email: true,
                            createdAt: true
                        }
                    },
                    validatedBy: {
                        select: {
                            fullname: true,
                            email: true,
                            createdAt: true
                        }
                    }
                }
            })

            if (!venteFound) throw { errorStatus: 400, payLoad: { error: " Cette vente n'existe pas!" } }

            console.log("Vente found", venteFound)
            return venteFound
        })
        res.status(201).json(result);
    } catch (error) {
        console.error('Failed to create vente:', error);
        res.status(error.errorStatus).json(error.payLoad);
    }
};

// update a vente in the database and log the result
const updateVente = async (req, res) => {
    console.log('Request body:', req.body);
    // ou plus simple, dans un fichier à part :

    const { id } = req.params;
    const user = req.user?.user;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const imageCheck = validateImageFile(req.file, { required: false });
            if (!imageCheck.ok) {
                throw { errorStatus: 400, payLoad: { error: imageCheck.error } };
            }

            const venteFound = await tx.vente.findFirst({
                where: { id: parseInt(id), deletedAt: null },
                include: { commandeClient: true }
            });

            if (!venteFound) {
                throw { errorStatus: 400, payLoad: { error: "Cette vente n'existe pas!" } };
            }
            if (venteFound.validatedAt) {
                throw { errorStatus: 400, payLoad: { error: "Cette vente est déjà validée! Vous ne pouvez plus la modifier" } };
            }

            // merge avec l'existant pour permettre un update partiel
            const resultVente = venteValidation.safeParse({
                ...venteFound,
                ...req.body,
            });

            if (!resultVente.success) {
                throw { errorStatus: 422, payLoad: { errors: resultVente.error.format() } };
            }

            // retrieving data
            const { clientCommanderId, commandClientId, code, statutId, ...venteData } = resultVente.data;

            if (commandClientId) {
                const commandeClientExists = await tx.commandeClient.findFirst({ where: { id: commandClientId } });
                if (!commandeClientExists) {
                    throw { errorStatus: 404, payLoad: { error: 'Cette commande client n\'existe pas' } };
                }
            }

            if (resultVente.data?.statutId) {
                const statut = await tx.statutVente.findFirst({ where: { id: resultVente.data?.statutId } });
                if (!statut) throw { errorStatus: 404, payLoad: { error: 'Ce statut de vente n\'existe pas' } };
            }

            if (resultVente.data?.produitId) {
                const produit = await tx.produit.findFirst({ where: { id: resultVente.data.produitId } });
                if (!produit) throw { errorStatus: 404, payLoad: { error: 'Ce produit n\'existe pas' } };
            }

            if (resultVente.data?.typeId) {
                const type = await tx.typeCommandeClient.findFirst({ where: { id: resultVente.data.typeId } });
                if (!type) throw { errorStatus: 404, payLoad: { error: 'Ce type de commande client n\'existe pas' } };
            }

            if (resultVente.data?.typeFactureVenteId) {
                const typeFactureVente = await tx.typeFactureVente.findFirst({ where: { id: resultVente.data.typeFactureVenteId } });
                if (!typeFactureVente) throw { errorStatus: 404, payLoad: { error: 'Ce type de facture de vente n\'existe pas' } };
            }

            if (resultVente.data?.clientId) {
                const client = await tx.client.findFirst({ where: { id: resultVente.data.clientId } });
                if (!client) throw { errorStatus: 404, payLoad: { error: 'Ce client n\'existe pas' } };
            }

            const montant = resultVente.data?.montant
                ? resultVente.data.montant
                : ((resultVente.data?.unitePrice ?? 0) * (resultVente.data?.qteTotal ?? 0))
                - (resultVente.data?.remise ?? 0)
                + ((resultVente.data?.qteTotal ?? 0) * (resultVente.data?.transport ?? 0));

            // on met à jour la commandeClient EXISTANTE liée à cette vente (pas par clientId, qui n'est pas unique)
            if (venteFound.commandeClient) {
                await tx.commandeClient.update({
                    where: { id: venteFound.commandeClient.id },
                    data: {
                        montant,
                        typeCommandeClientId: resultVente.data?.typeId,
                        clientId: resultVente.data?.clientId,
                    }
                });
            }

            console.log(" just before updating Vente : ", venteData)
            const updatedVente = await tx.vente.update({
                where: { id: parseInt(id), deletedAt: null },
                data: {
                    ...venteData,
                    montant,
                    preuve: req.file ? req.file.filename : venteFound.preuve,
                    ...(commandClientId ? { commandeClient: { connect: { id: commandClientId } } } : {}),
                },
            });

            return updatedVente;
        });

        res.status(200).json(result);
    } catch (error) {
        const status = error?.errorStatus ?? 500;
        const payload = error?.payLoad ?? { error: 'Erreur interne du serveur' };

        console.error('Code:', status);
        console.error('Failed to update vente:', error);

        return res.status(status).json(payload);
    }
};

// validate a vente
const validateVente = async (req, res) => {
    console.log("Début de validation", req.body)

    try {
        const result = await prisma.$transaction(async (tx) => {
            const { id } = req.params;

            let venteFound = await tx.vente.findUnique({
                where: { id: parseInt(id), deletedAt: null },
            });

            if (!venteFound) throw { errorStatus: 404, payLoad: { error: 'vente non trouvée' } };

            if (venteFound.validatedAt) throw { errorStatus: 409, payLoad: { error: "Cette vente est déjà validée" } }

            // validation de la vente de la base de données et log du résultat
            const updateVente = await tx.vente.update({
                where: { deletedAt: null, id: parseInt(id) },
                data: {
                    validatedAt: new Date(),
                    validatedById: req.user?.user?.id,
                    statutId: 2
                }
            });

            console.log("Validation éffectuée avec succès!")
            return updateVente;
        })
        res.status(200).json({ message: 'Vente validée avec succès!' });
    } catch (error) {
        console.error('Failed to delete vente:', error);
        res.status(error.errorStatus).json(error.payload);
    }
};

// delete a vente
const deleteVente = async (req, res) => {
    console.log("Début de suppression de la vente", req.body)

    try {
        const result = await prisma.$transaction(async (tx) => {
            const { id } = req.params;
            let venteFound = await tx.vente.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!venteFound) throw { errorStatus: 404, payLoad: { error: 'Vente non trouvée' } };

            if (venteFound.validatedAt) throw { errorStatus: 400, payLoad: { error: "Cette vente est déjà validée" } }

            // suppression de la vente de la base de données et log du résultat
            await tx.vente.update({
                where: { id: parseInt(id) },
                data: {
                    deletedAt: new Date(),
                }
            });

            // suppression de la preuve
            await deleteImageFile(venteFound.preuve);

            return "vente supprimée";
        })
        res.status(200).json({ message: 'Vente supprimée avec succès!' });
    } catch (error) {
        console.error('Failed to delete vente:', error);
        res.status(error.errorStatus).json(error.payLoad);
    }
};

export { getVentes, getValidatedVentes, retrieveVente, createVente, updateVente, validateVente, deleteVente };
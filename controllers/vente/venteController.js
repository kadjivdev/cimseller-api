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

const formatVente = (vente) => ({
    ...vente,
    preuve: toImageUrl(vente.preuve),
});

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
                commandeClient: true,
                client: true,
                produit: true,
                statut: true,
                type: true,
                typeFactureVente: true,
                reglements: true,
                venteComptability: true,
                reglements: true,
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
            // validation de l'image
            const imageCheck = validateImageFile(req.file, { required: false });
            if (!imageCheck.ok) {
                return res.status(400).json({ error: imageCheck.error });
            }

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

            // traitement du type de facture
            if (resultVente.data?.typeFactureVenteId) {
                let typeFactureVente = await tx.typeFactureVente.findFirst({
                    where: { id: resultVente.data?.typeFactureVenteId }
                });

                if (!typeFactureVente) {
                    return res.status(404).json({ error: 'Ce type de facture de vente n\'existe pas' });
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

            /**Attachement de bon de commande client */
            let commandeClient = null;
            if (resultVente.data?.commandClientId) {
                commandeClient = await tx.commandeClient.findFirst({
                    where: { id: resultVente.data?.commandClientId }
                });
            }

            if (!commandeClient) {
                // on le crée seulement si le clientId est présent dans la requête, pour éviter de créer des commandes clients sans client associé
                const last = await tx.commandeClient.findFirst({
                    orderBy: { id: 'desc' },
                    select: { id: true }
                });

                commandeClient = await tx.commandeClient.create({
                    data: {
                        code: `CMD-00${last?.id ? (last?.id + 1) : 1}`,
                        clientId: resultVente.data?.clientId,
                        validatedById: user?.id,
                        validatedAt: new Date(),
                        date: new Date(),
                        montant: resultVente.data?.unitePrice * resultVente.data?.qteTotal,
                        typeCommandeClientId: resultVente.data?.typeId,
                    }
                });
            }
            
            console.log("commandeClient :", commandeClient)

            // insertion de la vente
            const newVente = await tx.vente.create({
                data: {
                    ...resultVente.data,
                    commandClientId: commandeClient?.id,
                    montant: resultVente.data?.unitePrice * resultVente.data?.qteTotal,
                    createdById: user?.id,
                    statutId: resultVente.data?.statutId || 1,
                    preuve: req.file ? req.file.filename : null
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
        const imageCheck = validateImageFile(req.file, { required: false });
        if (!imageCheck.ok) {
            return res.status(400).json({ error: imageCheck.error });
        }

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

            // traitement du type de facture
            if (resultVente.data?.typeFactureVenteId) {
                let typeFactureVente = await tx.typeFactureVente.findFirst({
                    where: { id: resultVente.data?.typeFactureVenteId }
                })
            };

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
                    montant: resultVente.data?.unitePrice * resultVente.data?.qteTotal,
                    preuve: req.file ? req.file.filename : venteFound.preuve,
                    commandeClient:{
                        update: {
                            montant: resultVente.data?.unitePrice * resultVente.data?.qteTotal,
                            typeCommandeClientId: resultVente.data?.typeId,
                            clientId: resultVente.data?.clientId
                        }
                    }
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

            // suppression de la preuve
            await deleteImageFile(venteFound.preuve);

            res.status(200).json({ message: 'Vente supprimée avec succès!' });
        } catch (error) {
            console.error('Failed to delete vente:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la vente' });
        }
    })
};

export { getVentes, createVente, updateVente, validateVente, deleteVente };
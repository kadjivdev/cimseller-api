import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import path, { dirname } from 'path';
import fs from 'fs';
import { updateVenteValidation } from '../../database/validations/demande/updateVenteValidation.js';
import { fileURLToPath } from 'url';

const formatData = (recu) => ({
    ...recu,
    preuve: recu.preuve ? `${process.env.BASE_URL}/public/uploads/${recu.preuve}` : null
})

const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'uploads')

const deletePreuve = async (demande) => {
    console.log("Update de la preuve du recu :", demande)
    try {
        if (!demande || !demande.preuve) return
        await fs.promises.unlink(path.join(UPLOADS_DIR, demande.preuve))
    } catch (error) {
        console.log("Error de Update de la preuve de la demande :", demande)
    }
}

// Get all demandes from the database and log them
const getDemandes = async (req, res) => {
    console.log("Getting demandes")

    try {
        const demandes = await prisma.demandeModificationVente.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                //  relations
                client: true,
                vente: true,
                createdBy: {
                    select: {
                        fullname: true,
                        email: true
                    }
                },
                validatedBy: {
                    select: {
                        fullname: true,
                        email: true
                    }
                },
            }
        });

        res.json(demandes.map(formatData));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch demandes' });
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

// create a new demandes in the database and log the result
const createDemande = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body
    let user = req.user?.user

    await prisma.$transaction(async (tx) => {
        try {
            // validation
            const last = await tx.demandeModificationVente.findFirst({
                orderBy: { id: 'desc' },
                select: { id: true }
            });
            const resultDemande = updateVenteValidation.safeParse({ ...req.body, code: `DDV-00${last?.id ? (last?.id + 1) : 1}` });

            console.log("resultDemande :", resultDemande.data)

            if (!resultDemande.success) {
                return res.status(400).json({
                    errors: resultDemande.error.format()
                });
            }

            // traitement de la vente
            if (resultDemande.data?.venteId) {
                let vente = await tx.vente.findFirst({
                    where: { id: resultDemande.data?.venteId, deletedAt: null }
                });

                if (!vente) {
                    return res.status(404).json({ error: 'Cette vente n\'existe pas' });
                }
            }

            // traitement de la vente
            if (resultDemande.data?.venteId) {
                let vente = await tx.vente.findFirst({
                    where: { id: resultDemande.data?.venteId, deletedAt: null }
                });

                if (!vente) {
                    return res.status(404).json({ error: 'Cette vente n\'existe pas' });
                }

                if (!vente.validatedAt) {
                    return res.status(400).json({ error: 'Cette vente n\'est pas encore validée' });
                }
            }

            // traitement du client
            if (resultDemande.data?.clientId) {
                let client = await tx.client.findFirst({
                    where: { id: resultDemande.data?.clientId, deletedAt: null }
                });

                if (!client) {
                    return res.status(404).json({ error: 'Ce client n\'existe pas' });
                }
            }

            // insertion de la demande
            const newDemande = await tx.demandeModificationVente.create({
                data: {
                    ...resultDemande.data,
                    preuve: req.file?.filename,
                    createdById: user?.id
                },
            });

            res.status(201).json(newDemande);
        } catch (error) {
            console.error('Failed to create demande:', error);

            res.status(500).json({ error: error.message || 'Failed to create demande' });
            throw error;
        }
    })
};

// update a demande in the database and log the result
const updateDemande = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params

    await prisma.$transaction(async (tx) => {
        try {
            // found
            const demandeFound = await tx.demandeModificationVente.findFirst({
                where: { id: parseInt(id), deletedAt: null }
            })
            if (!demandeFound) return res.status(400).json({ error: "Cette demande de modification de vente n'existe pas!" })
            if (demandeFound.validatedAt) return res.status(400).json({ error: 'Cette demande est déjà validée' });

            // validation (réutiliser les champs existants si non envoyés dans le body)
            const resultDemande = updateVenteValidation.safeParse({
                ...demandeFound,
                ...req.body,
            })

            if (!resultDemande.success) {
                return res.status(400).json({
                    errors: resultDemande.error.format()
                });
            }

             // traitement de la vente
            if (resultDemande.data?.venteId) {
                let vente = await tx.vente.findFirst({
                    where: { id: resultDemande.data?.venteId, deletedAt: null }
                });

                if (!vente) {
                    return res.status(404).json({ error: 'Cette vente n\'existe pas' });
                }

                if (!vente.validatedAt) {
                    return res.status(400).json({ error: 'Cette vente n\'est pas encore validée' });
                }
            }

            // traitement du client
            if (resultDemande.data?.clientId) {
                let client = await tx.client.findFirst({
                    where: { id: resultDemande.data?.clientId, deletedAt: null }
                });

                if (!client) {
                    return res.status(404).json({ error: 'Ce client n\'existe pas' });
                }
            }

            // modification de la demande de modification de vente de la base de données et log du résultat
            const updatedDemande = await tx.demandeModificationVente.update({
                where: { id: parseInt(id), deletedAt: null },
                data: {
                    ...resultDemande.data,
                    preuve: req.file?.filename,
                },
            });

            res.status(201).json(updatedDemande);
        } catch (error) {
            console.error('Failed to create demande:', error);

            res.status(500).json({ error: error.message || 'Failed to create demande' });
            throw error;
        }
    })
};

// valider une demande de modification de vente from the database and log the result
const validerDemande = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;

        try {
            let demandeFound = await tx.demandeModificationVente.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!demandeFound) return res.status(404).json({ error: 'Demande non trouvée' });

            if (demandeFound.validatedAt) return res.status(400).json({ error: 'Cette demande est déjà validée' });

            // validation de la demande de modification de vente de la base de données et log du résultat
            await tx.demandeModificationVente.update({
                where: { id: parseInt(id), deletedAt: null },
                data: {
                    validatedAt: new Date(),
                    validatedById: req.user?.user?.id
                }
            });

            // Update de la preuve du reçu
            await deletePreuve(demandeFound)

            res.status(200).json({ message: 'Demande validée avec succès!' });
        } catch (error) {
            console.error('Failed to validate demande:', error);
            res.status(500).json({ error: 'Erreure de validation de la demande' });
        }
    })
};

// delete une demande de modification de vente from the database and log the result
const deleteDemande = async (req, res) => {

    await prisma.$transaction(async (tx) => {
        const { id } = req.params;
        try {
            let demandeFound = await tx.demandeModificationVente.findUnique({
                where: { id: parseInt(id), deletedAt: null }
            });
            if (!demandeFound) return res.status(404).json({ error: 'Demande non trouvée' });
            if (demandeFound.validatedAt) return res.status(400).json({ error: 'Cette demande est déjà validée' });

            // Update de la demande de modification de vente de la base de données et log du résultat
            await tx.demandeModificationVente.update({
                where: { id: parseInt(id), deletedAt: null },
                data: { deletedAt: new Date() }
            });

            // Update de la preuve du reçu
            await deletePreuve(demandeFound)

            res.status(200).json({ message: 'Demande supprimée avec succès!' });
        } catch (error) {
            console.error('Failed to delete demande:', error);
            res.status(500).json({ error: 'Erreure de suppresion de la commande reçu' });
        }
    })
};

export { getDemandes, createDemande, updateDemande, validerDemande, deleteDemande };
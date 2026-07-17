import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../config/prisma.js';
import { compteBancaireValidation } from '../../database/validations/tools/compteBancaireValidation.js';

// get all comptes
const getCompteBancaires = async (req, res) => {
    try {
        const compteBancaire = await prisma.compteBancaire.findMany({
            where: { deletedAt: null },
            include: {
                banque: true,
            },
            orderBy: { id: 'desc' },
        });

        res.json(compteBancaire);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch compte bancaire' });
    }
};

// Retrieve a compte
const retrieveCompteBancaires = async (req, res) => {
    let id = parseInt(req.body?.id) ?? null
    try {
        const compteBancaire = await prisma.compteBancaire.findUnique({
            where: { id: id, deletedAt: null },
            include: {
                banque: true,
                versements: true,
                reglements: true,
                approvisionnements: true
            },
            orderBy: { id: 'desc' },
        });

        if (!compteBancaire) {
            return res.json(400).json({ error: "Ce compte bancaire n'existe pas!" })
        }

        res.json(compteBancaire);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch compte bancaire' });
    }
};

// Inserer un compte bancaire
const createCompteBancaire = async (req, res) => {
    console.log("Début d'insertion de compte bancaire :", req.body)
    try {

        await prisma.$transaction(async (tx) => {
            const result = compteBancaireValidation.safeParse({
                ...req.body,
            });

            if (!result.success) {
                return res.status(402).json({
                    errors: result.error.format(),
                });
            }

            if (result.data?.intitule) {
                const existing = await prisma.compteBancaire.findFirst({
                    where: { intitule: result.data.intitule, deletedAt: null },
                });

                if (existing) {
                    return res.status(409).json({ error: 'Cet intitulé existe déjà' });
                }
            }

            if (result.data?.numero) {
                const existing = await prisma.compteBancaire.findFirst({
                    where: { numero: result.data.numero, deletedAt: null },
                });

                if (existing) {
                    return res.status(409).json({ error: 'Ce numero bancaire existe déjà' });
                }
            }


            if (result.data?.banqueId) {
                const banque = await prisma.banque.findFirst({
                    where: { id: result.data.banqueId, deletedAt: null },
                });

                if (!banque) {
                    return res.status(404).json({ error: 'Cette banque n\' existe pas' });
                }
            }

            const newCompteBancaire = await tx.compteBancaire.create({
                data: { ...result.data },
            });

            res.status(201).json(newCompteBancaire);
        })
    } catch (error) {
        console.error('Failed to create compte bancaire:', error);
        res.status(500).json({ error: error.message || 'Failed to create compte bancaire' });
    }
};

// Update an accout
const updateCompteBancaire = async (req, res) => {
    let { id } = req.params;

    try {
        await prisma.$transaction(async (tx) => {
            let compteBancaireFound = await prisma.compteBancaire.findUnique({ where: { id: parseInt(id) } })
            if (!compteBancaireFound) return res.status(404).json({ error: "Cette zone n'existe pas!" })

            const result = compteBancaireValidation.safeParse({
                ...req.body,
            });

            if (!result.success) {
                return res.status(402).json({
                    errors: result.error.format(),
                });
            }

            if (result.data?.intitule) {
                const existing = await prisma.compteBancaire.findFirst({
                    where: { NOT: { id: parseInt(id) }, intitule: result.data.intitule, deletedAt: null },
                });

                if (existing) {
                    return res.status(409).json({ error: 'Cet intitulé existe déjà' });
                }
            }

            if (result.data?.numero) {
                const existing = await prisma.compteBancaire.findFirst({
                    where: {NOT: { id: parseInt(id) }, numero: result.data.numero, deletedAt: null },
                });

                if (existing) {
                    return res.status(409).json({ error: 'Ce numero bancaire existe déjà' });
                }
            }


            if (result.data?.banqueId) {
                const banque = await prisma.banque.findFirst({
                    where: { id: result.data.banqueId, deletedAt: null },
                });

                if (!banque) {
                    return res.status(404).json({ error: 'Cette banque n\' existe pas' });
                }
            }

            const updatedCompteBancaire = await tx.compteBancaire.update({
                where: { id: parseInt(id) },
                data: { ...result.data },
            });

            res.json(updatedCompteBancaire);
        })
    } catch (error) {
        console.error('Failed to update compte bancaire:', error);
        res.status(500).json({ error: error.message || 'Failed to update compte bancaire' });
    }
};

// Delete an account
const deleteCompteBancaire = async (req, res) => {
    const { id } = req.params;

    try {
        const compteBancaireFound = await prisma.compteBancaire.findUnique({
            where: { id: parseInt(id), deletedAt: null },
        });
        if (!compteBancaireFound) {
            return res.status(404).json({ error: 'Compte bancaire non trouvé' });
        }

        await prisma.compteBancaire.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() },
        });

        res.status(200).json({ message: 'Compte bancaire supprimé avec succès!' });
    } catch (error) {
        console.error('Failed to delete compte bancaire:', error);
        res.status(500).json({ error: 'Erreure de suppresion de la compte bancaire' });
    }
};

export { getCompteBancaires, retrieveCompteBancaires, createCompteBancaire, updateCompteBancaire, deleteCompteBancaire };

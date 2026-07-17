import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../config/prisma.js';
import { representantValidation } from '../../database/validations/tools/representantValidation.js';

const getRepresentants = async (req, res) => {
    console.log('Récupération des representants');
    try {
        const representants = await prisma.representant.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                zones: true
            }
        });

        console.log('Represenatnts récupérés avec succès:', representants);
        res.json(representants);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch representants' });
    }
};

const createRepresentant = async (req, res) => {
    console.log('Insersion d\'un representant:', req.body);
    await prisma.$transaction(async (tx) => {
        try {
            const result = representantValidation.safeParse({
                ...req.body,
            });

            if (!result.success) {
                return res.status(402).json({
                    errors: result.error.format(),
                });
            }

            if (result.data?.phone) {
                const existing = await tx.representant.findUnique({
                    where: { phone: result.data.phone, deletedAt: null },
                });

                if (existing) {
                    return res.status(409).json({ error: 'Ce representant existe déjà' });
                }
            }

            if (result.data?.email) {
                const existing = await tx.representant.findUnique({
                    where: { email: result.data.email, deletedAt: null },
                });

                if (existing) {
                    return res.status(409).json({ error: 'Ce representant existe déjà' });
                }
            }

            console.log('Insersion reussie');
            const newRepresentant = await tx.representant.create({
                data: { ...result.data },
            });

            res.status(201).json(newRepresentant);
        } catch (error) {
            console.error('Failed to create representant:', error);
            res.status(500).json({ error: error.message || 'Failed to create representant' });
        }
    })
};

const updateRepresentant = async (req, res) => {
    let { id } = req.params;

    await prisma.$transaction(async (tx) => {
        try {
            let representantFound = await tx.representant.findUnique({ where: { id: parseInt(id), deletedAt: null } })
            if (!representantFound) return res.status(404).json({ error: "Cet representant n'existe pas!" })

            const result = representantValidation.safeParse({
                ...req.body,
            });

            if (!result.success) {
                return res.status(402).json({
                    errors: result.error.format(),
                });
            }

            if (result.data?.phone) {
                const duplicate = await tx.representant.findFirst({
                    where: { phone: result.data.phone, id: { not: parseInt(id) }, deletedAt: null },
                });

                if (duplicate) {
                    return res.status(409).json({ error: 'Cet representant existe déjà' });
                }
            }

            if (result.data?.email) {
                const duplicate = await tx.representant.findFirst({
                    where: { email: result.data.email, id: { not: parseInt(id) }, deletedAt: null },
                });

                if (duplicate) {
                    return res.status(409).json({ error: 'Cet representant existe déjà' });
                }
            }

            const updatedRepresentant = await tx.representant.update({
                where: { id: parseInt(id) },
                data: { ...result.data },
            });

            res.json(updatedRepresentant);
        } catch (error) {
            console.error('Failed to update representant:', error);
            res.status(500).json({ error: error.message || 'Failed to update representant' });
        }
    })
};

const deleteRepresentant = async (req, res) => {
    const { id } = req.params;

    try {
        const representantFound = await prisma.representant.findUnique({
            where: { id: parseInt(id), deletedAt: null },
        });
        if (!representantFound) {
            return res.status(404).json({ error: 'Representant non trouvé' });
        }

        await prisma.representant.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() },
        });

        res.json({ message: 'Representant supprimé avec succès!' });
    } catch (error) {
        console.error('Failed to delete representant:', error);
        res.status(500).json({ error: 'Erreure de suppresion du representant' });
    }
};

export { getRepresentants, createRepresentant, updateRepresentant, deleteRepresentant };

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../config/prisma.js';
import { camionValidation } from '../../database/validations/tools/camionValidation.js';

const getCamions = async (req, res) => {
    try {
        const camions = await prisma.camion.findMany({
            where: { deletedAt: null },
            include: {
                marque: true,
            },
            orderBy: { id: 'desc' },
        });

        res.json(camions);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch camions' });
    }
};

const createCamion = async (req, res) => {
    console.log("Debut de la creation des camion : ", req.body)
    try {
        const result = camionValidation.safeParse({
            ...req.body,
        });

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format(),
            });
        }

        // marque
        if (result.data?.marqueId) {
            const existing = await prisma.marque.findFirst({
                where: { id: result.data.id },
            });

            if (!existing) {
                return res.json({ error: 'Cette marque n\'existe pas' });
            }
        }

        // immatriculation
        if (result.data?.immatriculation) {
            const existing = await prisma.camion.findFirst({
                where: { immatriculation: result.data.immatriculation, deletedAt: null },
            });

            if (existing) {
                return res.status(409).json({ error: 'Cette immatriculation existe déjà' });
            }
        }

        const newCamion = await prisma.camion.create({
            data: { ...result.data },
        });

        console.log("Camion created successfully:", newCamion);
        res.status(201).json(newCamion);
    } catch (error) {
        console.log('Failed to create camion:', error);
        res.status(500).json({ error: error.message || 'Failed to create camion' });
    }
};

const updateCamion = async (req, res) => {
    let { id } = req.params;

    try {
        let camionFound = await prisma.camion.findUnique({ where: { id: parseInt(id) } })
        if (!camionFound) return res.status(404).json({ error: "Ce camion n'existe pas!" })

        const result = camionValidation.safeParse({
            ...req.body,
        });

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format(),
            });
        }

        // marque
        if (result.data?.marqueId) {
            const existing = await prisma.marque.findFirst({
                where: { id: result.data.id },
            });

            if (!existing) {
                return res.status(409).json({ error: 'Cette marque n\'existe pas' });
            }
        }

        // immatriculation
        if (result.data?.immatriculation) {
            const existing = await prisma.camion.findFirst({
                where: { immatriculation: result.data.immatriculation, NOT: { id: parseInt(id) }, deletedAt: null },
            });

            if (existing) {
                return res.status(409).json({ error: 'Cette immatriculation existe déjà!' });
            }
        }

        const updatedCamion = await prisma.camion.update({
            where: { id: parseInt(id) },
            data: { ...result.data },
        });

        console.log("Camion updated successfully:", updatedCamion);
        res.json(updatedCamion);
    } catch (error) {
        console.error('Failed to update camion:', error);
        res.status(500).json({ error: error.message || 'Failed to update camion' });
    }
};

const deleteCamion = async (req, res) => {
    const { id } = req.params;

    try {
        const camionFound = await prisma.camion.findUnique({
            where: { id: parseInt(id), deletedAt: null },
        });
        if (!camionFound) {
            return res.status(404).json({ error: 'Camion non trouvé' });
        }

        await prisma.camion.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() },
        });

        res.status(200).json({ message: 'Camion supprimé avec succès!' });
    } catch (error) {
        console.error('Failed to delete camion:', error);
        res.status(500).json({ error: 'Erreure de suppresion de la camion' });
    }
};

export { getCamions, createCamion, updateCamion, deleteCamion };

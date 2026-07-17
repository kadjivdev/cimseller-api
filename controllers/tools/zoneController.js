import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../config/prisma.js';
import { zoneValidation } from '../../database/validations/tools/zoneValidation.js';

const getZones = async (req, res) => {
    try {
        const zones = await prisma.zone.findMany({
            include: {
                representant: true,
            },
            orderBy: { id: 'desc' },
        });

        res.json(zones);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch zones' });
    }
};

const createZone = async (req, res) => {
    try {
        const result = zoneValidation.safeParse({
            ...req.body,
        });

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format(),
            });
        }

        if (result.data?.name) {
            const existing = await prisma.zone.findFirst({
                where: { name: result.data.name },
            });

            if (existing) {
                return res.status(409).json({ error: 'Cette zone existe déjà' });
            }
        }

        const newZone = await prisma.zone.create({
            data: { ...result.data },
        });

        res.status(201).json(newZone);
    } catch (error) {
        console.error('Failed to create zone:', error);
        res.status(500).json({ error: error.message || 'Failed to create zone' });
    }
};

const updateZone = async (req, res) => {
    let { id } = req.params;

    try {
        let zoneFound = await prisma.zone.findUnique({ where: { id: parseInt(id) } })
        if (!zoneFound) return res.status(404).json({ error: "Cette zone n'existe pas!" })

        const result = zoneValidation.safeParse({
            ...req.body,
        });

        if (!result.success) {
            return res.status(402).json({
                errors: result.error.format(),
            });
        }

        if (result.data?.name) {
            const duplicate = await prisma.zone.findFirst({
                where: { name: result.data.name, id: { not: parseInt(id) } },
            });

            if (duplicate) {
                return res.status(409).json({ error: 'Cette zone existe déjà' });
            }
        }

        const updatedZone = await prisma.zone.update({
            where: { id: parseInt(id) },
            data: { ...result.data },
        });

        res.json(updatedZone);
    } catch (error) {
        console.error('Failed to update zone:', error);
        res.status(500).json({ error: error.message || 'Failed to update zone' });
    }
};

const deleteZone = async (req, res) => {
    const { id } = req.params;

    try {
        const zoneFound = await prisma.zone.findUnique({
            where: { id: parseInt(id), deletedAt: null },
        });
        if (!zoneFound) {
            return res.status(404).json({ error: 'Zone non trouvée' });
        }

        await prisma.zone.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() },
        });

        res.status(200).json({ message: 'Zone supprimée avec succès!' });
    } catch (error) {
        console.error('Failed to delete zone:', error);
        res.status(500).json({ error: 'Erreure de suppresion de la zone' });
    }
};

export { getZones, createZone, updateZone, deleteZone };

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../config/prisma.js';
import { camionMarqueValidation } from '../../database/validations/tools/camionMarqueValidation.js';

const getMarques = async (req, res) => {
    try {
        const marques = await prisma.marque.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
        });

        res.json(marques);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch marques' });
    }
};

const createMarque = async (req, res) => {
    try {
        const result = marqueValidation.safeParse({
            ...req.body,
        });

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format(),
            });
        }

        if (result.data?.name) {
            const existing = await prisma.marque.findFirst({
                where: { name: result.data.name },
            });

            if (existing) {
                return res.status(409).json({ error: 'Cette marque existe déjà' });
            }
        }

        const newMarque = await prisma.marque.create({
            data: { ...result.data },
        });

        res.status(201).json(newMarque);
    } catch (error) {
        console.error('Failed to create marque:', error);
        res.status(500).json({ error: error.message || 'Failed to create marque' });
    }
};

const updateMarque = async (req, res) => {
    let { id } = req.params;

    try {
        let marqueFound = await prisma.marque.findUnique({ where: { id: parseInt(id) } })
        if (!marqueFound) return res.status(404).json({ error: "Cette marque n'existe pas!" })

        const result = marqueValidation.safeParse({
            ...req.body,
        });

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format(),
            });
        }

        if (result.data?.name) {
            const duplicate = await prisma.marque.findFirst({
                where: { name: result.data.name, id: { not: parseInt(id) } },
            });

            if (duplicate) {
                return res.status(409).json({ error: 'Cette marque existe déjà' });
            }
        }

        const updatedMarque = await prisma.marque.update({
            where: { id: parseInt(id) },
            data: { ...result.data },
        });

        res.json(updatedMarque);
    } catch (error) {
        console.error('Failed to update marque:', error);
        res.status(500).json({ error: error.message || 'Failed to update marque' });
    }
};

const deleteMarque = async (req, res) => {
    const { id } = req.params;

    try {
        const marqueFound = await prisma.marque.findUnique({
            where: { id: parseInt(id), deletedAt: null },
        });
        if (!marqueFound) {
            return res.status(404).json({ error: 'Marque non trouvée' });
        }

        await prisma.marque.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() },
        });

        res.status(200).json({ message: 'Marque supprimée avec succès!' });
    } catch (error) {
        console.error('Failed to delete zone:', error);
        res.status(500).json({ error: 'Erreure de suppresion de la marque' });
    }
};

export { getMarques, createMarque, updateMarque, deleteMarque };

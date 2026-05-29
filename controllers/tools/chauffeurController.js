import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../config/prisma.js';
import { chauffeurValidation } from "./../../database/validations/tools/chauffeurValidation.js"

const getChauffeurs = async (req, res) => {
    try {
        const chauffeurs = await prisma.chauffeur.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' }
        });

        res.json(chauffeurs);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch chauffeurs' });
    }
};

const createChauffeur = async (req, res) => {
    console.log("Req body : ", req.body)
    try {

        const result = chauffeurValidation.safeParse({
            ...req.body,
        });

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format(),
            });
        }

        // fullname
        if (result.data?.fullname) {
            const existing = await prisma.chauffeur.findFirst({
                where: { fullname: result.data.fullname },
            });

            if (existing) {
                return res.status(409).json({ error: 'Ce chauffeur existe déjà' });
            }
        }

        // phone
        if (result.data?.phone) {
            const existing = await prisma.chauffeur.findFirst({
                where: { phone: result.data.phone },
            });

            if (existing) {
                return res.status(409).json({ error: 'Ce numéro de telephone existe déjà' });
            }
        }

        const newChauffeur = await prisma.chauffeur.create({
            data: { ...result.data },
        });

        res.status(201).json(newChauffeur);
    } catch (error) {
        console.error('Failed to create chauffeur:', error);
        res.status(500).json({ error: error.message || 'Failed to create chauffeur' });
    }
};

const updateChauffeur = async (req, res) => {
    let { id } = req.params;

    try {
        let chauffeurFound = await prisma.chauffeur.findUnique({ where: { id: parseInt(id) } })
        if (!chauffeurFound) return res.status(404).json({ error: "Ce chauffeur n'existe pas!" })

        const result = chauffeurValidation.safeParse({
            ...chauffeurFound,
            ...req.body,
        });

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format(),
            });
        }

        // fullname
        if (result.data?.fullname) {
            const duplicate = await prisma.chauffeur.findFirst({
                where: { fullname: result.data.fullname, id: { not: parseInt(id) } },
            });

            if (duplicate) {
                return res.status(409).json({ error: 'Ce chauffeur existe déjà' });
            }
        }

        // phone
        if (result.data?.phone) {
            const duplicate = await prisma.chauffeur.findFirst({
                where: { phone: result.data.phone, id: { not: parseInt(id) } },
            });

            if (duplicate) {
                return res.status(409).json({ error: 'Ce numéro de telephone existe déjà' });
            }
        }

        const updatedChauffeur = await prisma.chauffeur.update({
            where: { id: parseInt(id) },
            data: { ...result.data },
        });

        res.json(updatedChauffeur);
    } catch (error) {
        console.error('Failed to update chauffeur:', error);
        res.status(500).json({ error: error.message || 'Failed to update chauffeur' });
    }
};

const deleteChauffeur = async (req, res) => {
    const { id } = req.params;

    try {
        const chauffeurFound = await prisma.chauffeur.findUnique({
            where: { id: parseInt(id), deletedAt: null },
        });
        if (!chauffeurFound) {
            return res.status(404).json({ error: 'Chauffeur non trouvé' });
        }

        await prisma.chauffeur.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() },
        });

        res.status(200).json({ message: 'Chauffeur supprimé avec succès!' });
    } catch (error) {
        console.error('Failed to delete chauffeur:', error);
        res.status(500).json({ error: 'Erreure de suppresion de la chauffeur' });
    }
};

export { getChauffeurs, createChauffeur, updateChauffeur, deleteChauffeur };

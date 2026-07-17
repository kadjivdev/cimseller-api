import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../config/prisma.js';
import { avaliseurValidation } from "./../../database/validations/tools/avaliseurValidation.js"

const getAvaliseurs = async (req, res) => {
    try {
        const avaliseurs = await prisma.avaliseurProgrammation.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' }
        });

        res.json(avaliseurs);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch avaliseurs' });
    }
};

const createAvaliseur = async (req, res) => {
    console.log("Req body : ", req.body)

    try {

        const result = avaliseurValidation.safeParse({
            ...req.body,
        });

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format(),
            });
        }

        // fullname
        if (result.data?.fullname) {
            const existing = await prisma.avaliseurProgrammation.findFirst({
                where: { fullname: result.data.fullname,deletedAt:null },
            });

            if (existing) {
                return res.status(409).json({ error: 'Cet avaliseur existe déjà' });
            }
        }

        // phone
        if (result.data?.phone) {
            const existing = await prisma.avaliseurProgrammation.findFirst({
                where: { phone: result.data.phone,deletedAt:null },
            });

            if (existing) {
                return res.status(409).json({ error: 'Ce numéro de telephone existe déjà' });
            }
        }

        // email
        if (result.data?.email) {
            const existing = await prisma.avaliseurProgrammation.findFirst({
                where: { email: result.data.email,deletedAt:null },
            });

            if (existing) {
                return res.status(409).json({ error: 'Cet avaliseur existe déjà' });
            }
        }

        const newAvaliseur = await prisma.avaliseurProgrammation.create({
            data: { ...result.data },
        });

        res.status(201).json(newAvaliseur);
    } catch (error) {
        console.error('Failed to create avaliseur:', error);
        res.status(500).json({ error: error.message || 'Failed to create avaliseur' });
    }
};

const updateAvaliseur = async (req, res) => {
    let { id } = req.params;

    try {
        let avaliseurFound = await prisma.avaliseurProgrammation.findUnique({ where: { id: parseInt(id) } })
        if (!avaliseurFound) return res.status(404).json({ error: "Cet avaliseur n'existe pas!" })

        const result = avaliseurValidation.safeParse({
            ...avaliseurFound,
            ...req.body,
        });

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format(),
            });
        }

        // fullname
        if (result.data?.fullname) {
            const existing = await prisma.avaliseurProgrammation.findFirst({
                where: { fullname: result.data.fullname, NOT: { id: parseInt(id) },deletedAt:null },
            });

            if (existing) {
                return res.status(409).json({ error: 'Cet avaliseur existe déjà' });
            }
        }

        // phone
        if (result.data?.phone) {
            const existing = await prisma.avaliseurProgrammation.findFirst({
                where: { phone: result.data.phone, NOT: { id: parseInt(id) },deletedAt:null },
            });

            if (existing) {
                return res.status(409).json({ error: "Ce numéro de telephone existe déjà" });
            }
        }

        // email
        if (result.data?.email) {
            const existing = await prisma.avaliseurProgrammation.findFirst({
                where: { email: result.data.email, NOT: { id: parseInt(id) },deletedAt:null },
            });

            if (existing) {
                return res.status(409).json({ error: 'Cet email existe déjà' });
            }
        }

        const updatedAvaliseur = await prisma.avaliseurProgrammation.update({
            where: { id: parseInt(id) },
            data: { ...result.data },
        });

        res.json(updatedAvaliseur);
    } catch (error) {
        console.error('Failed to update avaliseur:', error);
        res.status(500).json({ error: error.message || 'Failed to update avaliseur' });
    }
};

const deleteAvaliseur = async (req, res) => {
    const { id } = req.params;

    try {
        const avaliseurFound = await prisma.avaliseurProgrammation.findUnique({
            where: { id: parseInt(id), deletedAt: null },
        });
        if (!avaliseurFound) {
            return res.status(404).json({ error: 'Avaliseur non trouvé' });
        }

        await prisma.avaliseurProgrammation.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() },
        });

        res.status(200).json({ message: 'Avaliseur supprimé avec succès!' });
    } catch (error) {
        console.error('Failed to delete avaliseur:', error);
        res.status(500).json({ error: 'Erreure de suppresion de la avaliseur' });
    }
};

export { getAvaliseurs, createAvaliseur, updateAvaliseur, deleteAvaliseur };

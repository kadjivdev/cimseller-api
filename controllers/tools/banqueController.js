import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../config/prisma.js';
import { banqueValidation } from '../../database/validations/tools/banqueValidation.js';

const getBanques = async (req, res) => {
    console.log("Début de récu^pération des banques :",req.body)
    try {
        const banques = await prisma.banque.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
        });

        console.log("Banques récupérées avec succès")
        res.json(banques);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch banques' });
    }
};

const createBanque = async (req, res) => {

    await prisma.$transaction(async (tx)=>{
        try {
            const result = banqueValidation.safeParse({
                ...req.body,
            });
    
            if (!result.success) {
                return res.status(400).json({
                    errors: result.error.format(),
                });
            }
    
            if (result.data?.name) {
                const existing = await tx.banque.findFirst({
                    where: { name: result.data.name },
                });
    
                if (existing) {
                    return res.status(409).json({ error: 'Cette banque existe déjà' });
                }
            }
    
            const newBanque = await tx.banque.create({
                data: { ...result.data },
            });
    
            res.status(201).json(newBanque);
        } catch (error) {
            console.error('Failed to create banque:', error);
            res.status(500).json({ error: error.message || 'Failed to create banque' });
        }
    })
};

const updateBanque = async (req, res) => {
    let { id } = req.params;

    await prisma.$transaction(async (tx)=>{
        try {
            let banqueFound = await tx.banque.findUnique({ where: { id: parseInt(id) } })
            if (!banqueFound) return res.status(404).json({ error: "Cette banque n'existe pas!" })
    
            const result = banqueValidation.safeParse({
                ...req.body,
            });
    
            if (!result.success) {
                return res.status(400).json({
                    errors: result.error.format(),
                });
            }
    
            if (result.data?.name) {
                const duplicate = await tx.banque.findFirst({
                    where: { name: result.data.name, id: { not: parseInt(id) } },
                });
    
                if (duplicate) {
                    return res.status(409).json({ error: 'Cette zone existe déjà' });
                }
            }
    
            const updatedBanque = await tx.banque.update({
                where: { id: parseInt(id) },
                data: { ...result.data },
            });
    
            res.json(updatedBanque);
        } catch (error) {
            console.error('Failed to update banque:', error);
            res.status(500).json({ error: error.message || 'Failed to update banque' });
        }
    })
};

const deleteBanque = async (req, res) => {
    const { id } = req.params;

    try {
        const banqueFound = await prisma.banque.findUnique({
            where: { id: parseInt(id), deletedAt: null },
        });
        if (!banqueFound) {
            return res.status(404).json({ error: 'Banque non trouvée' });
        }

        await prisma.banque.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() },
        });

        res.json({ message: 'Banque supprimée avec succès!' });
    } catch (error) {
        console.error('Failed to delete banque:', error);
        res.status(500).json({ error: 'Erreure de suppresion de la banque' });
    }
};

export { getBanques, createBanque, updateBanque, deleteBanque };

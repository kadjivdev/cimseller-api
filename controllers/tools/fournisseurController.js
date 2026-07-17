import logger from '../../config/logger.js';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt';
import { fournisseurValidation } from '../../database/validations/fournisseurValidation.js';

// Get all fournisseurs from the database and log them
const getFournisseurs = async (req, res) => {
    try {
        const fournisseurs = await prisma.fournisseur.findMany({
            orderBy: { id: 'desc' }
        });

        res.json(fournisseurs);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch fournisseurs' });
        throw error;
    } 
};

// create a new fournisseur in the database and log the result
const createFournisseur = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    try {
        // validation
        const last = await prisma.fournisseur.findFirst({
            orderBy: { id: 'desc' },
            select: { id: true }
        });

        const result = fournisseurValidation.safeParse({ ...req.body, sigle: `FRS-00${last?.id ? (last?.id + 1) : 1}` });

        if (!result.success) {
            return res.status(402).json({
                errors: result.error.format()
            });
        }

        // traitement du sigle
        if (result.data?.sigle) {
            let fournisseur = await prisma.fournisseur.findFirst({
                where: { sigle: result.data?.sigle, deletedAt: null }
            });

            if (fournisseur) {
                return res.status(409).json({ error: 'Ce sigle existe déjà' });
            }
        }

        // traitement du raison_sociale
        if (result.data?.raison_sociale) {
            let fournisseur = await prisma.fournisseur.findFirst({
                where: { raison_sociale: result.data?.raison_sociale, deletedAt: null }
            });

            if (fournisseur) {
                return res.status(409).json({ error: 'Ce nom existe déjà' });
            }
        }

        // traitement du phone
        if (result.data?.phone) {
            let fournisseur = await prisma.fournisseur.findFirst({
                where: { phone: result.data?.phone, deletedAt: null }
            });

            if (fournisseur) {
                return res.status(409).json({ error: 'Ce phone existe déjà' });
            }
        }

        // traitement du email
        if (result.data?.email) {
            let fournisseur = await prisma.fournisseur.findFirst({
                where: { email: result.data?.email, deletedAt: null }
            });

            if (fournisseur) {
                return res.status(409).json({ error: 'Ce mail existe déjà' });
            }
        }

        // insertion
        const newFournisseur = await prisma.fournisseur.create({
            data: { ...result.data },
        });

        res.status(201).json(newFournisseur);
    } catch (error) {
        res.status(500).json({ error: error.message || 'fournisseur' });
        throw error;
    }
};

// update a fournisseur in the database and log the result
const updateFournisseur = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params
    try {
        let fournisseurFound = await prisma.fournisseur.findUnique({ where: { id: parseInt(id) } })
        if (!fournisseurFound) return res.status(404).json({ error: "Ce fournisseur n'existe pas!" })

        // validation
        const result = fournisseurValidation.safeParse(req.body);

        if (!result.success) {
            return res.status(402).json({
                errors: result.error.format()
            });
        }

        // traitement du raison_sociale
        if (result.data?.raison_sociale) {
            let fournisseur = await prisma.fournisseur.findFirst({
                where: { NOT: { id: parseInt(id) }, raison_sociale: result.data?.raison_sociale }
            });

            if (fournisseur) {
                return res.status(409).json({ error: 'Ce nom existe déjà' });
            }
        }

        // traitement du phone
        if (result.data?.phone) {
            let fournisseur = await prisma.fournisseur.findFirst({
                where: { NOT: { id: parseInt(id) }, phone: result.data?.phone }
            });

            if (fournisseur) {
                return res.status(409).json({ error: 'Ce phone existe déjà' });
            }
        }

        // traitement du email
        if (result.data?.email) {
            let fournisseur = await prisma.fournisseur.findFirst({
                where: { NOT: { id: parseInt(id) }, email: result.data?.email }
            });

            if (fournisseur) {
                return res.status(409).json({ error: 'Ce mail existe déjà' });
            }
        }

        // insertion
        const updatedFournisseur = await prisma.fournisseur.update({
            where: { id: parseInt(id) },
            data: { ...result.data },
        });

        res.json(updatedFournisseur);
    } catch (error) {
        console.error('Failed to create fournisseur:', error);
        res.status(500).json({ error: error.message || 'Failed to create fournisseur' });
        throw error;
    }
};

// delete une founrisseur
const deleteFournisseur = async (req, res) => {
    const { id } = req.params;

    try {
        let fournisseurFound = await prisma.fournisseur.findUnique({
            where: { id: parseInt(id) }
        });
        if (!fournisseurFound) return res.status(404).json({ error: 'Fournisseur non trouvée' });

        // suppression de la fournisseur de la base de données et log du résultat
        await prisma.fournisseur.delete({ where: { id: parseInt(id) } });

        res.status(200).json({ message: 'Fournisseur supprimé avec succès!' });
    } catch (error) {
        console.error('Failed to delete fournisseur:', error);
        res.status(500).json({ error: 'Erreure de suppresion du fournisseur' });
    }
};

export { getFournisseurs, createFournisseur, updateFournisseur, deleteFournisseur };
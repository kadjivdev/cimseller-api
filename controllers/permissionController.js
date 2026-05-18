import logger from '../config/logger.js';
import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';
import { permissionValidation } from '../database/validations/permissionValidation.js';

// Get all permissions from the database and log them
const getPermissions = async (req, res) => {
    try {
        const permissions = await prisma.permission.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                // many-to-many relation
                roles: {
                    include: { role: true }
                }
            }
        });

        res.json(permissions);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch permissions' });
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

// create a new permission in the database and log the result
const createPermisssion = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    try {
        // validation
        const result = permissionValidation.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format()
            });
        }

        // traitement du name
        if (result.data?.name) {
            let permission = await prisma.permission.findFirst({
                where: { name: result.data?.name }
            });

            if (permission) {
                return res.status(409).json({ error: 'Cette permission existe déjà' });
            }
        }

        // insertion
        const newPermission = await prisma.permission.create({
            data: { ...result.data, },
        });

        res.status(201).json(newPermission);
    } catch (error) {
        console.error('Failed to create user:', error);
        // je veux recuperer le statut de l'erreur pour les erreurs de validation de Prisma
        if (error.code === 'P2002') {
            return res.status(409).json({ error: error.message || 'Email already exists' });
        }
        res.status(500).json({ error: error.message || 'Failed to create user' });
        throw error;
    }
};

// update a permission in the database and log the result
const updatePermission = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params
    try {
        let permissionFound = await prisma.permission.findUnique({ where: { id: parseInt(id) } })
        if (!permissionFound) return res.status(404).json("Cette permission n'existe pas!")

        // validation
        const result = permissionValidation.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format()
            });
        }

        // traitement du name
        if (result.data?.name) {
            let permission = await prisma.permission.findFirst({
                where: { name: result.data?.name, id: { not: parseInt(id) } }
            });

            if (permission) {
                return res.status(409).json({ error: 'Cette permission existe déjà' });
            }
        }

        // insertion
        const updatedPermission = await prisma.permission.update({
            where: { id: parseInt(id) },
            data: { ...result.data },
        });

        res.json(updatedPermission);
    } catch (error) {
        console.error('Failed to create permission:', error);
        res.status(500).json({ error: error.message || 'Failed to create permission' });
        throw error;
    }
};

// delete une permission
const deletePermission = async (req, res) => {
    const { id } = req.params;

    try {
        let permissionFound = await prisma.permission.findUnique({
            where: { id: parseInt(id), deletedAt: null }
        });
        if (!permissionFound) return res.status(404).json({ error: 'Permission non trouvée' });

        // suppression de la permission de la base de données et log du résultat
        await prisma.permission.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() }
        });
        res.status(200).json({ message: 'Permission supprimée avec succès!' });
    } catch (error) {
        console.error('Failed to delete permission:', error);
        res.status(500).json({ error: 'Erreure de suppresion de la permission' });
    }
};

export { getPermissions, createPermisssion, updatePermission, deletePermission };
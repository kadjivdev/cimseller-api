import logger from '../config/logger.js';
import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';
import { roleValidation } from '../database/validations/roleValidation.js';

// Get all roles from the database and log them
const getRoles = async (req, res) => {
    try {
        const roles = await prisma.role.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                users: true,
                // many-to-many relation
                permissions: {
                    include: { permission: true }
                }
            }
        });

        res.json(roles);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

// create a new role in the database and log the result
const createRole = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    try {
        // validation
        const result = roleValidation.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format()
            });
        }

        // traitement du mail
        if (result.data?.name) {
            let user = await prisma.role.findFirst({
                where: { name: result.data?.name }
            });

            if (user) {
                return res.status(409).json({ error: 'Ce rôle existe déjà' });
            }
        }

        let {permissionIds,...roleData} = result.data
        // insertion
        const newRole = await prisma.role.create({
            data: {
                ...roleData,
                ...(permissionIds && {
                    permissions: {
                        create: permissionIds.map((permissionId) => ({
                            permission: {
                                connect: { id: permissionId }
                            }
                        }))
                    },
                })
            },
        });

        res.status(201).json(newRole);
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

// update a role in the database and log the result
const updateRole = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    let { id } = req.params
    try {
        let roleFound = await prisma.role.findUnique({ where: { id: parseInt(id) } })
        if (!roleFound) return res.status(404).json("Ce rôle n'existe pas!")

        // validation
        const result = roleValidation.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format()
            });
        }

        // traitement du mail
        if (result.data?.name) {
            let role = await prisma.role.findFirst({
                where: { name: result.data?.name, id: { not: parseInt(id) } }
            });

            if (role) {
                return res.status(409).json({ error: 'Ce rôle existe déjà' });
            }
        }

        console.log("Data :", result.data)

        let { permissionIds, ...roleData } = result.data

        // return res.json(result.data?.permissionIds?.map((id) => id))

        // insertion
        const updatedRole = await prisma.role.update({
            where: { id: parseInt(id) },
            data: {
                ...roleData,
                ...(permissionIds && {
                    permissions: {
                        deleteMany: {},//remove all permissions
                        create: permissionIds.map((permissionId) => ({
                            permission: {
                                connect: { id: permissionId }
                            }
                        }))
                    },
                })
            },
        });

        res.json(updatedRole);
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

// delete un role
const deleteRole = async (req, res) => {
    const { id } = req.params;

    try {
        let roleFound = await prisma.role.findUnique({
            where: { id: parseInt(id), deletedAt: null }
        });
        if (!roleFound) return res.status(404).json({ error: 'User non trouvé' });

        // suppression du role de la base de données et log du résultat
        await prisma.role.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() }
        });
        res.status(200).json({ message: 'Rôle supprimé avec succès!' });
    } catch (error) {
        console.error('Failed to delete rôle:', error);
        res.status(500).json({ error: 'Erreure de suppresion du rôle' });
    }
};

export { getRoles, createRole, updateRole, deleteRole };
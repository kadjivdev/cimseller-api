import logger from '../config/logger.js';
import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';
import { userValidation } from '../database/validations/userValidation.js';

// Get all users from the database and log them
const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: { role: true }
        });

        users.forEach((user) => {
            delete user.password
        })

        res.json(users);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

// create a new user in the database and log the result
const createUser = async (req, res) => {
    console.log('Request body:', req.body); // Log the incoming request body

    try {
        // validation
        const result = userValidation.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format()
            });
        }

        // traitement du mail
        if (result.data?.email) {
            let user = await prisma.user.findFirst({
                where: { email: result.data?.email }
            });

            if (user) {
                return res.status(409).json({ error: 'Ce mail existe déjà' });
            }
        }

        // traitement du roleId
        if (result.data?.roleId) {
            let roleFound = await prisma.role.findUnique({
                where: { id: result.data?.roleId }
            });

            if (!roleFound) {
                return res.status(400).json({ error: 'Rôle non trouvé' });
            }
        }

        // insertion
        const newUser = await prisma.user.create({
            data: {
                ...result.data,
                password: await bcrypt.hash(result.data?.password, 10),
            },
        });
        res.status(201).json(newUser);
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

// Update un user
const updateUser = async (req, res) => {
    const { id } = req.params;
    console.log('Request body:', req.body); // Log the incoming request body

    try {
        let userFound = await prisma.user.findUnique({
            where: { id: parseInt(id), deletedAt: null }
        });
        if (!userFound) return res.status(404).json({ error: 'User non trouvé' });

        let password = req.body.password ? await bcrypt.hash(req.body.password, 10) : userFound.password;

        // validation
        let data = { fullname: userFound.fullname, email: userFound.email, ...req.body, password };

        // traitement du mail
        if (data?.email) {
            let user = await prisma.user.findFirst({
                where: { email: data?.email, id: { not: parseInt(id) } }
            });

            if (user) {
                return res.status(409).json({ error: 'Ce mail existe déjà' });
            }
        }

        // traitement du roleId
        if (data?.roleId) {
            let roleFound = await prisma.role.findUnique({
                where: { id: data?.roleId }
            });

            if (!roleFound) {
                return res.status(400).json({ error: 'Rôle non trouvé' });
            }
        }

        const result = userValidation.safeParse(data);

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format()
            });
        }

        // update the user in the database and log the result
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data
        });

        return res.json({ data: updatedUser });
    } catch (error) {
        console.error('Failed to update user:', error);
        res.status(500).json({ error: error.message || 'Failed to update user' });
    }
}

// delete un user
const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        let userFound = await prisma.user.findUnique({
            where: { id: parseInt(id), deletedAt: null }
        });
        if (!userFound) return res.status(404).json({ error: 'User non trouvé' });

        // suppression du user de la base de données et log du résultat
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() }
        });
        res.status(200).json({ message: 'User supprimé avec succès!' });
    } catch (error) {
        console.error('Failed to delete user:', error);
        res.status(500).json({ error: 'Errreure de suppresion du user' });
    }
};

export { getUsers, createUser, updateUser, deleteUser };
import logger from '../config/logger.js';
import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';
import XLSX from 'xlsx';
import { userValidation } from '../database/validations/userValidation.js';

// Get all users from the database and log them
const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullname: true,
                email: true,
                createdAt: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    }
                }
            }
        })

        res.json(users.map(function (user) {
            delete user.password;//on doit pas afficher le password
            return {
                ...user,
                role: user.role ? {
                    ...user.role,
                    permissions: user.role.permissions?.map((rolePermission) => rolePermission.permission)
                } : null
            }
        }));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
        throw error;
    }
};

// Rerieve users from the database and log them
const retrieveUsers = async (req, res) => {
    console.log("Requetes :", req.params)
    let { id } = req.params
    try {
        const user = await prisma.user.findFirst({
            where: { id: parseInt(id), deletedAt: null },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        permissions: {
                            include: {
                                permission: {
                                    select: { id: true, name: true, description: true }
                                }
                            }
                        }
                    },
                }
            }
        });

        delete user.password;//on doit pas afficher le password
        res.json({
            ...user,
            role: user.role ? {
                ...user.role,
                permissions: user.role.permissions.map((rolePermission) => rolePermission.permission)
            } : null
        });
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
        throw error;
    }
};

// create a new user in the database and log the result
const createUser = async (req, res) => {
    console.log('Debut de crétion de compte:', req.body); // Log the incoming request body

    try {
        // validation
        const result = userValidation.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format()
            });
        }

        // ✅ destructure proprement, exclut confirm_password ET password bruts
        const { confirm_password, password, ...rest } = req.body

        // verification des mots de passe
        if (confirm_password != password) return res.status(400).json({ message: "Les mots de passe ne sont pas conformes." })


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

        console.log("Compte crée avec succès!")
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

// import users from a xlsx file and log the result
const importUsers = async (req, res) => {
    console.log("Debut d'Importation des users", req.body)

    try {
        await prisma.$transaction(async (tx) => {
            const uploadFile = req.file ?? (Array.isArray(req.files) ? req.files[0] : req.files?.users?.[0] ?? req.files?.file?.[0]);
            if (!uploadFile) {
                return res.status(400).json({ error: 'Fichier requis' });
            }
            // validate file type and size

            if (uploadFile.mimetype !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                return res.status(400).json({ error: 'Format de fichier invalide' });
            }

            // xlsx processing
            const workbook = uploadFile.buffer
                ? XLSX.read(uploadFile.buffer, { type: 'buffer' })
                : XLSX.readFile(uploadFile.path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const data = XLSX.utils.sheet_to_json(worksheet);

            const users = await Promise.all(
                data.map(async (row) => ({
                    fullname: row.Nom ?? null,
                    email: row.Email ?? null,
                    password: await bcrypt.hash(row.Email, 10),
                }))
            );

            await tx.user.createMany({
                data: users,
                skipDuplicates: true,
            });

            console.log("Importation éffectuée avec succès")
            return res.status(201).json({
                message: "Users imported successfully!",
                insertedCount: users.length
            });
        })
    } catch (error) {
        console.error('Failed to import users:', error);
        res.status(500).json({ error: error.message || 'Failed to import users' });
    }
};

// Update un user
const updateUser = async (req, res) => {
    const { id } = req.params;

    try {
        let userFound = await prisma.user.findUnique({
            where: { id: parseInt(id), deletedAt: null }
        });
        if (!userFound) return res.status(404).json({ error: 'User non trouvé' });

        // ✅ destructure proprement, exclut confirm_password ET password bruts
        const { confirm_password, password: rawPassword, ...rest } = req.body

        // verification des mots de passe
        if (confirm_password != rawPassword) return res.status(400).json({ message: "Les mots de passe ne sont pas conformes." })

        // ✅ hash le mot de passe seulement s'il a été fourni
        const hashedPassword = rawPassword
            ? await bcrypt.hash(rawPassword, 10)
            : userFound.password

        const data = {
            fullname: userFound.fullname,
            email: userFound.email,
            ...rest,
            password: hashedPassword, // ✅ remis sous la bonne clé "password"
        }

        if (data?.email) {
            let user = await prisma.user.findFirst({
                where: { email: data?.email, id: { not: parseInt(id) } }
            });
            if (user) {
                return res.status(409).json({ error: 'Ce mail existe déjà' });
            }
        }

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
            console.log("Erreur validation :", result.error.format())
            return res.status(402).json({ errors: result.error.format() });
        }

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
    console.log("Debut de suppression de compte ")
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

        console.log("Compte supprimé avec succès")
        res.status(200).json({ message: 'User supprimé avec succès!' });
    } catch (error) {
        console.error('Failed to delete user:', error);
        res.status(500).json({ error: 'Errreure de suppresion du user' });
    }
};

export { getUsers, createUser, retrieveUsers, updateUser, deleteUser, importUsers };
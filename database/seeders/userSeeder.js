import { email } from 'zod';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt'

const users = [
    {
        fullname: 'Admin',
        email: "admin@gmail.com",
        password: await bcrypt.hash('admin@2026', 10)
    }
];


const userSeeders = async () => {
    // Supprimer les users existants pour éviter les doublons
    await prisma.user.deleteMany();

    // insertions
    await prisma.user.createMany({
        data: users
    });
};

export default userSeeders;
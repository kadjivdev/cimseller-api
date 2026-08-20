import { email } from 'zod';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt'

const role = await prisma.role.findFirst({
    where: { deletedAt: null }
})

const users = [
    {
        fullname: 'Admin',
        email: "admin@gmail.com",
        password: await bcrypt.hash('admin@2026', 10),
        roleId: role?.id//role super admin
    }
];


const userSeeders = async () => {
    // TRUNCATE avec RESTART IDENTITY : vide la table ET remet la séquence auto-increment à 1
    await prisma.$transaction([
        prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE users;`),
        prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`),
    ]);

    // await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);
    // await prisma.$executeRawUnsafe(`TRUNCATE TABLE users;`);
    // await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);


    // insertion du user
    await prisma.user.createMany({
        data: users
    });
};

export default userSeeders;
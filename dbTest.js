import logger from './config/logger.js';
import prisma from './config/prisma.js';
import bcrypt from 'bcrypt';

// Get all users from the database and log them
const getAllUsers = async () => {
    try {
        const users = await prisma.user.findMany({
            include: {orders: true},
        });
        logger.info('Les users inserés : ', users);
        console.log('Les users inserés : ', users);
    } catch (error) {
        logger.error('Prisma query failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};

// create a new user in the database and log the result
const createUser = async () => {
    try {
        const newUser = await prisma.user.create({
            data: {
                name: 'John Doe 1',
                email: 'john.doe1@example.com',
                password: await bcrypt.hash('securepassword123', 10),
            },
        });
        logger.info('User created:', newUser);
        console.log('User created:', newUser);
    } catch (error) {
        logger.error('Failed to create user:', error);
        throw error;
    }
};

const getUserById = async (id) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: id,
            },
            include: {
                orders: true,
            },
        });
        logger.info('User found:', user);
        console.log('User found:', user);
        console.log('User orders:', user?.orders);

        if (user) {
            //  create orders for this user
            const orders = await prisma.order.createMany({
                data: [
                    {
                        total: 39.98,
                        userId: user.id,
                    },
                ],
            });
        }
        return user;
    } catch (error) {
        logger.error('Failed to get user by ID:', error);
        throw error;
    }
};

await getAllUsers();
// await createUser();
// await getUserById(4);
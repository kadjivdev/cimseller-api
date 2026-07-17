import prisma from '../../config/prisma.js';

const getClientStatus = async (req, res) => {
    try {
        const status = await prisma.statutClient.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
        });

        res.json(status);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch client status' });
    }
};

export { getClientStatus };

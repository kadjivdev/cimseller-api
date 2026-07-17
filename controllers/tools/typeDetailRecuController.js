import prisma from '../../config/prisma.js';

const getDetailRecuTypes = async (req, res) => {
    try {
        const types = await prisma.typeDetailRecuCommande.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
        });

        res.json(types);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch details recu types' });
    }
};

export { getDetailRecuTypes };

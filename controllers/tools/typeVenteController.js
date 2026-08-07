import prisma from '../../config/prisma.js';

const getVenteTypes = async (req, res) => {
    try {
        const types = await prisma.typeCommandeClient.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
        });

        res.json(types);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch types ventes' });
    }
};

export { getVenteTypes };

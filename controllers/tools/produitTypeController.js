import prisma from '../../config/prisma.js';

const getProduitTypes = async (req, res) => {
    try {
        const types = await prisma.typeProduit.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
        });

        res.json(types);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch produits' });
    }
};


export { getProduitTypes };

import prisma from '../../config/prisma.js';

const getCommandeStatus = async (req, res) => {
    try {
        const statut = await prisma.statutCommande.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
        });

        res.json(statut);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch command statut' });
    }
};

export { getCommandeStatus };

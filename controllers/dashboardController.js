import logger from '../config/logger.js';
import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';
import { permissionValidation } from '../database/validations/permissionValidation.js';

const getStats = async (req, res) => {
    console.log("Début de recuperation de Stats :")
    try {
        const commandes = await prisma.commande.findMany({
            where: { deletedAt: null, validatedAt: { not: null } },
            include: {
                commandeDetails: true,
                programmations: true
            }
        });

        const programmations = await prisma.programmation.findMany({
            where: { deletedAt: null, validatedAt: { not: null } },
        });

        const ventes = await prisma.vente.findMany({
            where: { deletedAt: null, validatedAt: { not: null } },
        });

        // stacks
        res.json({
            "qteCommander": commandes.reduce((qte, command) => qte + command.commandeDetails?.reduce((qte, dt) => (qte + dt.qteCommande), 0), 0),
            "qteProgrammer": programmations?.reduce((qte, dt) => (qte + dt.qteProgrammer), 0),
            "qteLivre": programmations?.reduce((qte, dt) => (qte + dt.qteLivre), 0),
            "qteVendue": ventes?.reduce((qte, vente) => (qte + vente.qteTotal), 0)
        });
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch des stacks' });
        throw error;
    }
};

export { getStats };
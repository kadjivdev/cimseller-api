import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../config/prisma.js';
import { agentValidation } from '../../database/validations/tools/agentValidation.js';

const getAgents = async (req, res) => {
    console.log('Récupération des agents');
    try {
        const agents = await prisma.agent.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
        });

        console.log('Agents récupérés avec succès:', agents);
        res.json(agents);
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
};

const createAgent = async (req, res) => {
    console.log('Insersion d\'un agent:', req.body);
    await prisma.$transaction(async (tx) => {
        try {
            const result = agentValidation.safeParse({
                ...req.body,
            });

            if (!result.success) {
                return res.status(400).json({
                    errors: result.error.format(),
                });
            }

            if (result.data?.nom) {
                const existing = await tx.agent.findFirst({
                    where: { nom: result.data.nom },
                });

                if (existing) {
                    return res.status(409).json({ error: 'Cet agent existe déjà' });
                }
            }

            console.log('Insersion reussie');
            const newAgent = await tx.agent.create({
                data: { ...result.data },
            });

            res.status(201).json(newAgent);
        } catch (error) {
            console.error('Failed to create agent:', error);
            res.status(500).json({ error: error.message || 'Failed to create agent' });
        }
    })
};

const updateAgent = async (req, res) => {
    let { id } = req.params;

    await prisma.$transaction(async (tx) => {
        try {
            let agentFound = await tx.agent.findUnique({ where: { id: parseInt(id) } })
            if (!agentFound) return res.status(404).json({ error: "Cet agent n'existe pas!" })

            const result = agentValidation.safeParse({
                ...req.body,
            });

            if (!result.success) {
                return res.status(400).json({
                    errors: result.error.format(),
                });
            }

            if (result.data?.nom) {
                const duplicate = await tx.agent.findFirst({
                    where: { nom: result.data.nom, id: { not: parseInt(id) } },
                });

                if (duplicate) {
                    return res.status(409).json({ error: 'Cet agent existe déjà' });
                }
            }

            const updatedAgent = await tx.agent.update({
                where: { id: parseInt(id) },
                data: { ...result.data },
            });

            res.json(updatedAgent);
        } catch (error) {
            console.error('Failed to update agent:', error);
            res.status(500).json({ error: error.message || 'Failed to update agent' });
        }
    })
};

const deleteAgent = async (req, res) => {
    const { id } = req.params;

    try {
        const agentFound = await prisma.agent.findUnique({
            where: { id: parseInt(id), deletedAt: null },
        });
        if (!agentFound) {
            return res.status(404).json({ error: 'Agent non trouvé' });
        }

        await prisma.agent.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() },
        });

        res.json({ message: 'Agent supprimé avec succès!' });
    } catch (error) {
        console.error('Failed to delete agent:', error);
        res.status(500).json({ error: 'Erreure de suppresion de l\'agent' });
    }
};

export { getAgents, createAgent, updateAgent, deleteAgent };

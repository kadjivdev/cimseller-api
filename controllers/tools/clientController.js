import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../config/prisma.js';
import XLSX from 'xlsx';
import { clientValidation } from '../../database/validations/tools/clientValidation.js';

const UPLOADS_DIR = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..", "..", "public", "uploads"
)

const ALLOWED_IMAGE_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

function validateImageFile(file, { required }) {
    if (!file) {
        return required
            ? { ok: false, error: "L'image est requise" }
            : { ok: true };
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return { ok: false, error: 'Format image invalide' };
    }
    if (file.size > MAX_IMAGE_SIZE) {
        return { ok: false, error: 'Image trop volumineuse' };
    }
    return { ok: true };
}

async function deleteProfil(filename) {
    if (!filename) return;
    try {
        console.log("path du fichier à supprimer:", path.join(UPLOADS_DIR, filename))

        await fs.promises.unlink(path.join(UPLOADS_DIR, filename));
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error('Failed to delete profil file:', err);
        }
    }
}

const toImageUrl = (filename) =>
    filename ? `${process.env.BASE_URL}/public/uploads/${filename}` : null;

const formatClient = (client) => ({
    ...client,
    approvisionnementAmount: client.approvisionnements?.reduce((a, appro) => (a + appro.montant), 0) ?? 0,
    reglementAmount: client.reglements?.reduce((a, regle) => (a + regle.montant), 0) ?? 0,
    profil: toImageUrl(client.profil),
});

// Get all clients
const getClients = async (req, res) => {
    console.log("Getting clients")
    try {
        const clients = await prisma.client.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                zone: true,
                type: true,
                statut: true,
                approvisionnements: {
                    where: { NOT: { validatedAt: null } },
                    select: {
                        id: true,
                        code: true,
                        reference: true,
                        montant: true,
                        date: true,
                        preuve: true,
                        comment: true,
                        compteBancaire: true,
                        createdBy: true,
                        validatedBy: true,
                        typeDetailRecu: true,
                        createdAt: true,
                        validatedAt: true,
                    }
                },
                reglements: {
                    where: { NOT: { validatedAt: null } },
                    select: {
                        id: true,
                        code: true,
                        reference: true,
                        montant: true,
                        preuve: true,
                        vente: {
                            select: {
                                id: true,
                                code: true,
                                montant: true
                            }
                        },
                        date: true,
                        comment: true,
                        compteBancaire: true,
                        createdBy: true,
                        validatedBy: true,
                        typeDetailRecu: true,
                        createdAt: true,
                        validatedAt: true,
                    }
                },
            }
        });

        res.json(clients.map(formatClient));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

// Get actifs clients
const getActifClients = async (req, res) => {
    console.log("Getting actif clients")
    try {
        const clients = await prisma.client.findMany({
            where: { statutId: 1, deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                zone: true,
                type: true,
                statut: true,
                approvisionnements: {
                    where: { NOT: { validatedAt: null } },
                    select: {
                        id: true,
                        code: true,
                        reference: true,
                        montant: true,
                        date: true,
                        preuve: true,
                        comment: true,
                        compteBancaire: true,
                        createdBy: true,
                        validatedBy: true,
                        typeDetailRecu: true,
                        createdAt: true,
                        validatedAt: true,
                    }
                },
                reglements: {
                    where: { NOT: { validatedAt: null } },
                    select: {
                        id: true,
                        code: true,
                        reference: true,
                        montant: true,
                        preuve: true,
                        vente: {
                            select: {
                                id: true,
                                code: true,
                                montant: true
                            }
                        },
                        date: true,
                        comment: true,
                        compteBancaire: true,
                        createdBy: true,
                        validatedBy: true,
                        typeDetailRecu: true,
                        createdAt: true,
                        validatedAt: true,
                    }
                },
            }
        });

        console.log("Clients actifs recuperés avec succès!")

        res.json(clients.map(formatClient));
    } catch (error) {
        console.log('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch actif clients' });
    }
};

// Get actifs clients
const getInActifClients = async (req, res) => {
    console.log("Getting inactif clients")
    try {
        const clients = await prisma.client.findMany({
            where: { statutId: 2, deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                zone: true,
                type: true,
                statut: true,
                approvisionnements: {
                    where: { NOT: { validatedAt: null } },
                    select: {
                        id: true,
                        code: true,
                        reference: true,
                        montant: true,
                        date: true,
                        preuve: true,
                        comment: true,
                        compteBancaire: true,
                        createdBy: true,
                        validatedBy: true,
                        typeDetailRecu: true,
                        createdAt: true,
                        validatedAt: true,
                    }
                },
                reglements: {
                    where: { NOT: { validatedAt: null } },
                    select: {
                        id: true,
                        code: true,
                        reference: true,
                        montant: true,
                        preuve: true,
                        vente: {
                            select: {
                                id: true,
                                code: true,
                                montant: true
                            }
                        },
                        date: true,
                        comment: true,
                        compteBancaire: true,
                        createdBy: true,
                        validatedBy: true,
                        typeDetailRecu: true,
                        createdAt: true,
                        validatedAt: true,
                    }
                },
            }
        });

        res.json(clients.map(formatClient));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch inactifs clients' });
    }
};

// Get befs clients
const getBefClients = async (req, res) => {
    console.log("Getting bef clients")
    try {
        const clients = await prisma.client.findMany({
            where: { statutId: 3, deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                zone: true,
                type: true,
                statut: true,
                approvisionnements: {
                    where: { NOT: { validatedAt: null } },
                    select: {
                        id: true,
                        code: true,
                        reference: true,
                        montant: true,
                        date: true,
                        preuve: true,
                        comment: true,
                        compteBancaire: true,
                        createdBy: true,
                        validatedBy: true,
                        typeDetailRecu: true,
                        createdAt: true,
                        validatedAt: true,
                    }
                },
                reglements: {
                    where: { NOT: { validatedAt: null } },
                    select: {
                        id: true,
                        code: true,
                        reference: true,
                        montant: true,
                        preuve: true,
                        vente: {
                            select: {
                                id: true,
                                code: true,
                                montant: true
                            }
                        },
                        date: true,
                        comment: true,
                        compteBancaire: true,
                        createdBy: true,
                        validatedBy: true,
                        typeDetailRecu: true,
                        createdAt: true,
                        validatedAt: true,
                    }
                },
            }
        });

        res.json(clients.map(formatClient));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch befs clients' });
    }
};

// create client in the database and log the result
const createClient = async (req, res) => {
    console.log("Début insertion de client : ", req.body)

    try {
        await prisma.$transaction(async (tx) => {

            // validation du profil
            const imageCheck = validateImageFile(req.file, { required: false });
            if (!imageCheck.ok) {
                return res.status(400).json({ error: imageCheck.error });
            }

            const result = clientValidation.safeParse({
                ...req.body,
                profil: req.file?.filename,
                phone: req.body?.phone != null ? String(req.body.phone) : undefined,
            });

            if (!result.success) {
                return res.status(402).json({
                    errors: result.error.format(),
                });
            }

            // phone
            if (result.data?.phone) {
                const existing = await prisma.client.findFirst({
                    where: { phone: result.data.phone, deletedAt: null },
                });

                if (existing) {
                    return res.status(409).json({ error: 'Ce phone existe déjà' });
                }
            }

            // email
            if (result.data?.email) {
                const existing = await prisma.client.findFirst({
                    where: { email: result.data.email, deletedAt: null },
                });

                if (existing) {
                    return res.status(409).json({ error: 'Cet email existe déjà' });
                }
            }

            const newClient = await prisma.client.create({
                data: { ...result.data },
            });


            console.log("Fin d'insertion de client")
            res.status(201).json(newClient);
        })
    } catch (error) {
        console.error('Failed to create client:', error);
        res.status(500).json({ error: error.message || 'Failed to create client' });
    }
};

// import clients from a xlsx file and log the result
const importClients = async (req, res) => {
    console.log("Début d'Importation des clients :", req.body)

    try {
        await prisma.$transaction(async (tx) => {
            const uploadFile = req.file ?? (Array.isArray(req.files) ? req.files[0] : req.files?.clients?.[0] ?? req.files?.file?.[0]);
            if (!uploadFile) {
                return res.status(400).json({ error: 'Fichier requis' });
            }
            // validate file type and size

            if (uploadFile.mimetype !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                return res.status(400).json({ error: 'Format de fichier invalide' });
            }

            if (req.body?.statutId) {
                let statut = await tx.statutClient.findFirst({
                    where: { id: parseInt(req.body?.statutId) }
                })

                if (!statut) {
                    res.status(404).json({ error: "Ce statut de client n'existe pas!" })
                }
            }

            // xlsx processing
            const workbook = uploadFile.buffer
                ? XLSX.read(uploadFile.buffer, { type: 'buffer' })
                : XLSX.readFile(uploadFile.path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const data = XLSX.utils.sheet_to_json(worksheet);

            const clients = data.map((row) => ({
                raison_sociale: row.Nom ?? null,
                phone: row.Telephone != null ? String(row.Telephone).trim() : null,
                zoneId: row.Zone ? parseInt(row.Zone) : null,
                statutId: req.body?.statutId ? parseInt(req.body?.statutId) : 1,
                email: row.Email ?? null,
                adresse: row.Adresse ?? null,
            }))

            await tx.client.createMany({
                data: clients,
                skipDuplicates: true,
            });

            console.log("Clients imported successfully!")
            return res.status(201).json({
                message: "Clients imported successfully!",
                insertedCount: clients.length
            });
        })
    } catch (error) {
        console.error('Failed to import clients:', error);
        res.status(500).json({ error: error.message || 'Failed to import clients' });
    }
};


const updateClient = async (req, res) => {
    let { id } = req.params;

    try {

        await prisma.$transaction(async function (tx) {
            let clientFound = await prisma.client.findUnique({ where: { id: parseInt(id) } })
            if (!clientFound) return res.status(404).json({ error: "Ce client n'existe pas!" })

            const imageCheck = validateImageFile(req.file, { required: false });
            if (!imageCheck.ok) {
                return res.status(400).json({ error: imageCheck.error });
            }

            const result = clientValidation.safeParse({
                ...clientFound,
                ...req.body,
                ...(req.file && { profil: req.file?.filename }),
                phone: req.body?.phone != null ? String(req.body.phone) : clientFound.phone,
            });

            if (!result.success) {
                return res.status(402).json({
                    errors: result.error.format(),
                });
            }

            // phone
            if (result.data?.phone) {
                const existing = await prisma.client.findFirst({
                    where: { phone: result.data?.phone, NOT: { id: parseInt(id) }, deletedAt: null },
                });

                if (existing) {
                    return res.status(409).json({ error: 'Ce phone existe déjà' });
                }
            }

            // email
            if (result.data?.email) {
                const existing = await prisma.client.findFirst({
                    where: { email: result.data.email, NOT: { id: parseInt(id) }, deletedAt: null },
                });

                if (existing) {
                    return res.status(409).json({ error: 'Cet email existe déjà' });
                }
            }

            const updatedClient = await tx.client.update({
                where: { id: parseInt(id) },
                data: { ...result.data },
            });

            res.json(updatedClient);
        })
    } catch (error) {
        console.error('Failed to update client:', error);
        res.status(500).json({ error: error.message || 'Failed to update client' });
    }
};

const deleteClient = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.$transaction(async (tx) => {
            const clientFound = await prisma.client.findUnique({
                where: { id: parseInt(id), deletedAt: null },
            });

            if (!clientFound) {
                return res.status(404).json({ error: 'Client non trouvé' });
            }

            await tx.client.update({
                where: { id: parseInt(id) },
                data: { deletedAt: new Date() },
            });

            // suppression du profil du client
            await deleteProfil(clientFound.profil)

            res.status(200).json({ message: 'Client supprimé avec succès!' });
        })
    } catch (error) {
        console.error('Failed to delete client:', error);
        res.status(500).json({ error: 'Erreure de suppresion de la client' });
    }
};

export {
    getClients, createClient, getActifClients, getInActifClients, getBefClients, updateClient, deleteClient, importClients
};

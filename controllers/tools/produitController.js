import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../../config/prisma.js';
import { produitValidation } from '../../database/validations/produitValidation.js';

const UPLOADS_DIR = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../public/uploads'
);

async function deleteImageFile(filename) {
    if (!filename) return;
    try {
        console.log("path du fichier à supprimer:",path.join(UPLOADS_DIR, filename))
        
        await fs.promises.unlink(path.join(UPLOADS_DIR, filename));
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error('Failed to delete image file:', err);
        }
    }
}

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

const toImageUrl = (filename) =>
    filename ? `${process.env.BASE_URL}/public/uploads/${filename}` : null;

const formatProduit = (produit) => ({
    ...produit,
    image: toImageUrl(produit.image),
});

const getProduits = async (req, res) => {
    try {
        const produits = await prisma.produit.findMany({
            where: { deletedAt: null },
            orderBy: { id: 'desc' },
            include: {
                type: true,
            },
        });

        res.json(produits.map(formatProduit));
    } catch (error) {
        console.error('Prisma query failed:', error);
        res.status(500).json({ error: 'Failed to fetch produits' });
    }
};

const createProduit = async (req, res) => {
    try {
        const imageCheck = validateImageFile(req.file, { required: false });
        if (!imageCheck.ok) {
            return res.status(400).json({ error: imageCheck.error });
        }

        const result = produitValidation.safeParse({
            ...req.body,
            image: req.file?.filename,
        });

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format(),
            });
        }

        if (result.data?.name) {
            const existing = await prisma.produit.findFirst({
                where: { name: result.data.name },
            });

            if (existing) {
                return res.status(409).json({ error: 'Ce produit existe déjà' });
            }
        }

        const newProduit = await prisma.produit.create({
            data: { ...result.data },
        });

        res.status(201).json(newProduit);
    } catch (error) {
        console.error('Failed to create produit:', error);
        res.status(500).json({ error: error.message || 'Failed to create produit' });
    }
};

const updateProduit = async (req, res) => {
    let { id } = req.params;

    try {
        let produitFound = await prisma.produit.findUnique({ where: { id: parseInt(id) } })
        if (!produitFound) return res.status(404).json({ error: "Ce produit n'existe pas!" })

        const imageCheck = validateImageFile(req.file, { required: false });
        if (!imageCheck.ok) {
            return res.status(400).json({ error: imageCheck.error });
        }

        const result = produitValidation.safeParse({
            ...req.body,
            ...(req.file && { image: req.file.filename }),
        });

        if (!result.success) {
            return res.status(400).json({
                errors: result.error.format(),
            });
        }

        if (result.data?.name) {
            const duplicate = await prisma.produit.findFirst({
                where: { name: result.data.name, id: { not: parseInt(id) } },
            });

            if (duplicate) {
                return res.status(409).json({ error: 'Ce produit existe déjà' });
            }
        }

        const updatedProduit = await prisma.produit.update({
            where: { id: parseInt(id) },
            data: { ...result.data },
        });

        res.json(updatedProduit);
    } catch (error) {
        console.error('Failed to update produit:', error);
        res.status(500).json({ error: error.message || 'Failed to update produit' });
    }
};

const deleteProduit = async (req, res) => {
    const { id } = req.params;

    try {
        const produitFound = await prisma.produit.findUnique({
            where: { id: parseInt(id), deletedAt: null },
        });
        if (!produitFound) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }

        await prisma.produit.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() },
        });

        await deleteImageFile(produitFound.image);

        res.status(200).json({ message: 'Produit supprimé avec succès!' });
    } catch (error) {
        console.error('Failed to delete produit:', error);
        res.status(500).json({ error: 'Erreure de suppresion de la produit' });
    }
};

export { getProduits, createProduit, updateProduit, deleteProduit };

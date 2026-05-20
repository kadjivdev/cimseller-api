import { Router } from 'express';
import { getProduits, createProduit, updateProduit, deleteProduit } from '../../controllers/tools/produitController.js';
import jwtAuth from '../../middlewares/jwtAuth.js';
import upload from '../../middlewares/multer.js';

const router = Router();

const handleImageUpload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Image trop volumineuse' });
        }
        return res.status(400).json({ error: err.message || 'Erreur lors du téléversement' });
    });
};

router.route('/')
    .get(jwtAuth, getProduits)
    .post(jwtAuth, handleImageUpload, createProduit);

router.route('/:id')
    .put(jwtAuth, handleImageUpload, updateProduit)
    .delete(jwtAuth, deleteProduit);

export default router;
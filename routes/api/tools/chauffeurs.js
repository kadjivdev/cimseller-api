import { Router } from 'express';
import { getChauffeurs, createChauffeur, updateChauffeur, deleteChauffeur } from '../../../controllers/tools/chauffeurController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const handlePermisUpload = (req, res, next) => {
    console.log("file :",req.file)
    upload.single('permis')(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Image trop volumineuse' });
        }
        return res.status(400).json({ error: err.message || 'Erreur lors du téléversement' });
    });
};

const router = Router();

router.route('/')
    .get(jwtAuth, getChauffeurs)
    .post(jwtAuth, handlePermisUpload, createChauffeur);

router.route('/:id')
    .put(jwtAuth, handlePermisUpload, updateChauffeur)
    .delete(jwtAuth, deleteChauffeur);

export default router;
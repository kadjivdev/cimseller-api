import { Router } from 'express';
import { getClients, createClient, updateClient, deleteClient } from '../../../controllers/tools/clientController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const uploadFile = (req, res, next) => {
    upload.single('profil')(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Profil trop volumineuse' });
        }
        return res.status(400).json({ error: err.message || 'Erreur lors du téléversement' });
    });
}

const router = Router();

router.route('/')
    .get(jwtAuth, getClients)
    .post(jwtAuth, uploadFile, createClient);

router.route('/:id')
    .put(jwtAuth, uploadFile, updateClient)
    .delete(jwtAuth, deleteClient);

export default router;
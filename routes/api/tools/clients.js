import { Router } from 'express';
import { getClients, createClient, updateClient, deleteClient, importClients } from '../../../controllers/tools/clientController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload, { memoryUpload } from '../../../middlewares/multer.js';

const uploadFile = (req, res, next) => {
    upload.single('profil')(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Profil trop volumineuse' });
        }
        return res.status(400).json({ error: err.message || 'Erreur lors du téléversement' });
    });
}

const uploadExcelFile = (req, res, next) => {
    memoryUpload.fields([
        { name: 'clients', maxCount: 1 },
        { name: 'file', maxCount: 1 },
    ])(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Fichier trop volumineuse' });
        }
        return res.status(400).json({ error: err.message || 'Erreur lors du téléversement' });
    });
}

const router = Router();

router.route('/')
    .get(jwtAuth, getClients)
    .post(jwtAuth, uploadFile, createClient)
    .put(jwtAuth, uploadExcelFile, importClients);

router.route('/:id')
    .put(jwtAuth, uploadFile, updateClient)
    .delete(jwtAuth, deleteClient);

export default router;
// import express from 'express';
import { Router } from 'express';
import { getCommandeRecuVersements, createCommandeRecuVersement, updateCommandeRecuVersement, deleteCommandeRecuVersement } from '../../../controllers/commande/commandeRecuVersementController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const handlePreuveUpload = (req, res, next) => {
    upload.single('preuve')(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Preuve trop volumineuse' });
        }
        return res.status(400).json({ error: err.message || 'Erreur lors du téléversement' });
    });
};
const router = Router();

router.route("/")
    .get(jwtAuth, getCommandeRecuVersements)
    .post(jwtAuth, handlePreuveUpload, createCommandeRecuVersement);

router.route("/:id")
    .put(jwtAuth, handlePreuveUpload, updateCommandeRecuVersement)
    .delete(jwtAuth, deleteCommandeRecuVersement);

export default router;
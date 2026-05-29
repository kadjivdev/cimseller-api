import { Router } from 'express';
import { getCommandeRecus, createCommandeRecu, updateCommandeRecu, deleteCommandeRecu } from '../../../controllers/commande/commandeRecuController.js';
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
    .get(jwtAuth, getCommandeRecus)
    .post(jwtAuth, handlePreuveUpload, createCommandeRecu);

router.route("/:id")
    .put(jwtAuth, handlePreuveUpload, updateCommandeRecu)
    .delete(jwtAuth, deleteCommandeRecu);

export default router;
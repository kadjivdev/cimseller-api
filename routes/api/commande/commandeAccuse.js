import { Router } from 'express';
import { getCommandeAccuses, retrieveCommandeAccuse, createCommandeAccuse, updateCommandeAccuse, deleteCommandeAccuse } from '../../../controllers/commande/commandeAccuseController.js';
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
    .get(jwtAuth, getCommandeAccuses)
    .post(jwtAuth, handlePreuveUpload, createCommandeAccuse);

router.route("/:id")
    .get(jwtAuth, retrieveCommandeAccuse)
    .put(jwtAuth, handlePreuveUpload, updateCommandeAccuse)
    .delete(jwtAuth, deleteCommandeAccuse);

export default router;
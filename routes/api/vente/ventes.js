import { Router } from 'express';
import { getVentes, getValidatedVentes, createVente, updateVente, validateVente, deleteVente } from '../../../controllers/vente/venteController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

const handlePreuveUpload = (req, res, next) => {
    upload.single('preuve')(req, res, (err) => {
        if (!err) return next();
    });
};

router.route("/")
    .get(jwtAuth, getVentes)
    .post(jwtAuth, handlePreuveUpload, createVente);

// ventes validées
router.get("/validated", jwtAuth, getValidatedVentes)

router.route("/:id")
    .put(jwtAuth, handlePreuveUpload, updateVente)
    .post(jwtAuth, handlePreuveUpload, validateVente)
    .delete(jwtAuth, deleteVente);

export default router;
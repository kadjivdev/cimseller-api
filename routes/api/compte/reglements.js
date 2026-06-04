import { Router } from 'express';
import { getReglements, createReglement, updateReglement, validerReglement, deleteReglement } from '../../../controllers/compte/reglementController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

const handlePreuveUpload = (req, res, next) => {
    upload.single('preuve')(req, res, (err) => {
        if (!err) return next();
    });
};

router.route("/")
    .get(jwtAuth, getReglements)
    .post(jwtAuth, handlePreuveUpload, createReglement);

router.route("/:id")
    .put(jwtAuth, handlePreuveUpload, updateReglement)
    .post(jwtAuth, validerReglement)
    .delete(jwtAuth, deleteReglement);

export default router;
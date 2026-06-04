import { Router } from 'express';
import { getDemandes, createDemande, updateDemande, validerDemande, deleteDemande } from '../../../controllers/demande/updateVenteController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

const handlePreuveUpload = (req, res, next) => {
    upload.single('preuve')(req, res, (err) => {
        if (!err) return next();
    });
};

router.route("/")
    .get(jwtAuth, getDemandes)
    .post(jwtAuth, handlePreuveUpload, createDemande);

router.route("/:id")
    .put(jwtAuth, handlePreuveUpload, updateDemande)
    .post(jwtAuth, validerDemande)
    .delete(jwtAuth, deleteDemande);

export default router;
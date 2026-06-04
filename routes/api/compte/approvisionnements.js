import { Router } from 'express';
import { getApprovisionnements, createApprovisionnement, updateApprovisionnement,validerApprovisionnement, deleteApprovisionnement } from '../../../controllers/compte/approvisionnementController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

const handlePreuveUpload = (req, res, next) => {
    upload.single('preuve')(req, res, (err) => {
        if (!err) return next();
    });
};

router.route("/")
    .get(jwtAuth, getApprovisionnements)
    .post(jwtAuth, handlePreuveUpload, createApprovisionnement);

router.route("/:id")
    .put(jwtAuth, handlePreuveUpload, updateApprovisionnement)
    .post(jwtAuth, validerApprovisionnement)
    .delete(jwtAuth, deleteApprovisionnement);

export default router;
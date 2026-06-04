import { Router } from 'express';
import { getComptabilities, createComptability, updateComptability, deleteComptability } from '../../../controllers/vente/comptabilityController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getComptabilities)
    .post(jwtAuth, createComptability);

router.route("/:id")
    .put(jwtAuth, updateComptability)
    .delete(jwtAuth, deleteComptability);

export default router;
import { Router } from 'express';
import { getFournisseurs, createFournisseur, updateFournisseur, deleteFournisseur } from '../../controllers/tools/fournisseurController.js';
import jwtAuth from '../../middlewares/jwtAuth.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getFournisseurs)
    .post(jwtAuth, createFournisseur);

router.route("/:id")
    .put(jwtAuth, updateFournisseur)
    .delete(jwtAuth, deleteFournisseur);

export default router;
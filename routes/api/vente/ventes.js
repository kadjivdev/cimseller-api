import { Router } from 'express';
import { getVentes, createVente, updateVente, validateVente, deleteVente } from '../../../controllers/vente/venteController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getVentes)
    .post(jwtAuth, createVente);

router.route("/:id")
    .put(jwtAuth, updateVente)
    .post(jwtAuth, validateVente)
    .delete(jwtAuth, deleteVente);

export default router;
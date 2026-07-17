import { Router } from 'express';
import { getCommandes, retrieveCommande, createCommande, updateCommande, validateCommande, deleteCommande } from '../../../controllers/commande/commandeController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getCommandes)
    .post(jwtAuth, createCommande);

router.route("/:id")
    .get(jwtAuth, retrieveCommande)
    .put(jwtAuth, updateCommande)
    .post(jwtAuth, validateCommande)
    .delete(jwtAuth, deleteCommande);

export default router;
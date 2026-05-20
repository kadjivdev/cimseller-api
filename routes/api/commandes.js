// import express from 'express';
import { Router } from 'express';
import { getCommandes, createCommande, updateCommande, validateCommande, deleteCommande } from '../../controllers/commandeController.js';
import jwtAuth from '../../middlewares/jwtAuth.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getCommandes)
    .post(jwtAuth, createCommande);

router.route("/:id")
    .put(jwtAuth, updateCommande)
    .post(jwtAuth, validateCommande)
    .delete(jwtAuth, deleteCommande);

export default router;
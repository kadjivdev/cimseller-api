import { Router } from 'express';
import { getCommandClients, createCommandClient, updateCommandClient, validateCommandClient, deleteCommandClient } from '../../../controllers/vente/commandClientController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getCommandClients)
    .post(jwtAuth, createCommandClient);

router.route("/:id")
    .put(jwtAuth, updateCommandClient)
    .post(jwtAuth, validateCommandClient)
    .delete(jwtAuth, deleteCommandClient);

export default router;
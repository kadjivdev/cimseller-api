import { Router } from 'express';
import { getCommandeStatus } from "../../../controllers/tools/statutCommandeController.js"
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getCommandeStatus);

export default router;
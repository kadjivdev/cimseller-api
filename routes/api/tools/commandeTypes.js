import { Router } from 'express';
import { getCommandeTypes } from "../../../controllers/tools/typeCommandeController.js"
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getCommandeTypes);

export default router;
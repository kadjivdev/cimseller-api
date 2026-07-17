import { Router } from 'express';
import {getProduitTypes} from '../../../controllers/tools/produitTypeController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getProduitTypes)

export default router;
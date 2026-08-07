import { Router } from 'express';
import {getVenteTypes} from '../../../controllers/tools/typeVenteController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getVenteTypes)

export default router;
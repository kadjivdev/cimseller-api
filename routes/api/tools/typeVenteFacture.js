import { Router } from 'express';
import {getFactureVenteTypes} from '../../../controllers/tools/typeFactureVenteController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getFactureVenteTypes)

export default router;
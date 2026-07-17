import { Router } from 'express';
import { getDetailRecuTypes } from '../../../controllers/tools/typeDetailRecuController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getDetailRecuTypes)

export default router;
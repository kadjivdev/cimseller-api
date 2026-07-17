import { Router } from 'express';
import { getClientStatus } from '../../../controllers/tools/statutController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getClientStatus)

export default router;
import { Router } from 'express';
import { getDocumentTypes } from '../../../controllers/tools/typeDocumentController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getDocumentTypes)

export default router;
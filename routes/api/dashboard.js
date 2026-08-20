// import express from 'express';
import { Router } from 'express';
import jwtAuth from '../../middlewares/jwtAuth.js';
import { memoryUpload } from '../../middlewares/multer.js';
import { getStats } from '../../controllers/dashboardController.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getStats)

export default router;
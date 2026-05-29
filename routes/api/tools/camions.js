import { Router } from 'express';
import { getCamions, createCamion, updateCamion, deleteCamion } from '../../../controllers/tools/camionController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route('/')
    .get(jwtAuth, getCamions)
    .post(jwtAuth, createCamion);

router.route('/:id')
    .put(jwtAuth, updateCamion)
    .delete(jwtAuth, deleteCamion);

export default router;
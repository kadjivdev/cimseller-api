import { Router } from 'express';
import { getZones, createZone, updateZone, deleteZone } from '../../../controllers/tools/zoneController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route('/')
    .get(jwtAuth, getZones)
    .post(jwtAuth, createZone);

router.route('/:id')
    .put(jwtAuth, updateZone)
    .delete(jwtAuth, deleteZone);

export default router;
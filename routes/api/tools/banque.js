import { Router } from 'express';
import { getBanques, createBanque, updateBanque, deleteBanque } from '../../../controllers/tools/banqueController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route('/')
    .get(jwtAuth, getBanques)
    .post(jwtAuth, createBanque);

router.route('/:id')
    .put(jwtAuth, updateBanque)
    .delete(jwtAuth, deleteBanque);

export default router;
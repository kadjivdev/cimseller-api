import { Router } from 'express';
import { getAvaliseurs, createAvaliseur, updateAvaliseur, deleteAvaliseur } from '../../../controllers/tools/avaliseurController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route('/')
    .get(jwtAuth, getAvaliseurs)
    .post(jwtAuth, createAvaliseur);

router.route('/:id')
    .put(jwtAuth, updateAvaliseur)
    .delete(jwtAuth, deleteAvaliseur);

export default router;
import { Router } from 'express';
import { getMarques, createMarque, updateMarque, deleteMarque } from '../../../controllers/tools/marqueController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route('/')
    .get(jwtAuth, getMarques)
    .post(jwtAuth, createMarque);

router.route('/:id')
    .put(jwtAuth, updateMarque)
    .delete(jwtAuth, deleteMarque);

export default router;
import { Router } from 'express';
import { getRepresentants,createRepresentant,updateRepresentant,deleteRepresentant } from '../../../controllers/tools/representantController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route('/')
    .get(jwtAuth, getRepresentants)
    .post(jwtAuth, createRepresentant);

router.route('/:id')
    .put(jwtAuth, updateRepresentant)
    .delete(jwtAuth, deleteRepresentant);

export default router;
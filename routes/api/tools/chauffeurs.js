import { Router } from 'express';
import { getChauffeurs, createChauffeur, updateChauffeur, deleteChauffeur } from '../../../controllers/tools/chauffeurController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route('/')
    .get(jwtAuth, getChauffeurs)
    .post(jwtAuth, createChauffeur);

router.route('/:id')
    .put(jwtAuth, updateChauffeur)
    .delete(jwtAuth, deleteChauffeur);

export default router;
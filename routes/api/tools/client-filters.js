import { Router } from 'express';
import { getActifClients, getInActifClients, getBefClients } from '../../../controllers/tools/clientController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.get('/actifs', jwtAuth, getActifClients);
router.get('/inactifs', jwtAuth, getInActifClients);
router.get('/befs', jwtAuth, getBefClients);

export default router;
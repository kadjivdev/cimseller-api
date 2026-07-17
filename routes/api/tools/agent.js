import { Router } from 'express';
import { getAgents, createAgent, updateAgent, deleteAgent } from '../../../controllers/tools/agentController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route('/')
    .get(jwtAuth, getAgents)
    .post(jwtAuth, createAgent);

router.route('/:id')
    .put(jwtAuth, updateAgent)
    .delete(jwtAuth, deleteAgent);

export default router;
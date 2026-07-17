import { Router } from 'express';
import { getProgrammations, retrieveProgrammation, createProgrammation, updateProgrammation, validateProgrammation, deleteProgrammation } from '../../../controllers/programmation/programmationController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getProgrammations)
    .post(jwtAuth, createProgrammation);

router.route("/:id")
    .get(jwtAuth, retrieveProgrammation)
    .put(jwtAuth, updateProgrammation)
    .post(jwtAuth, validateProgrammation)
    .delete(jwtAuth, deleteProgrammation);

export default router;
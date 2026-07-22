import { Router } from 'express';
import { getProgrammations, getValidatedProgrammations, getPdfProgrammations, retrieveProgrammation, createProgrammation, updateProgrammation, validateProgrammation, deleteProgrammation, printProgrammations } from '../../../controllers/programmation/programmationController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getProgrammations)
    .post(jwtAuth, createProgrammation);

router.route("/print")
    .post(jwtAuth, printProgrammations)

router.route("/:fournisseurId/:start/:end/get-pdf")
    .get(getPdfProgrammations)

router.route("/validate")
    .get(jwtAuth, getValidatedProgrammations)

router.route("/:id")
    .get(jwtAuth, retrieveProgrammation)
    .put(jwtAuth, updateProgrammation)
    .post(jwtAuth, validateProgrammation)
    .delete(jwtAuth, deleteProgrammation);

export default router;
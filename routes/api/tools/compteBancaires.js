import { Router } from 'express';
import { getCompteBancaires,retrieveCompteBancaires,createCompteBancaire,updateCompteBancaire,deleteCompteBancaire } from '../../../controllers/tools/compteBancaireController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';

const router = Router();

router.route('/')
    .get(jwtAuth, getCompteBancaires)
    .post(jwtAuth, createCompteBancaire);

router.route('/:id')
    .get(jwtAuth, retrieveCompteBancaires)
    .put(jwtAuth, updateCompteBancaire)
    .delete(jwtAuth, deleteCompteBancaire);

export default router;
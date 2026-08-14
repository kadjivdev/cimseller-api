import { Router } from 'express';
import { getVentes,getDallyVentes,getComptabilizedVentes, getValidatedVentes,retrieveVente, createVente, updateVente, validateVente, deleteVente, getNoComptabilizedVentes, getNoTraitedVentes } from '../../../controllers/vente/venteController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

const handlePreuveUpload = (req, res, next) => {
    upload.single('preuve')(req, res, (err) => {
        if (!err) return next();
    });
};

router.route("/")
    .get(jwtAuth, getVentes)
    .post(jwtAuth, handlePreuveUpload, createVente);

// ventes validées
router.get("/validated", jwtAuth, getValidatedVentes)
router.get("/dally", jwtAuth, getDallyVentes)
router.get("/comptabilized", jwtAuth, getComptabilizedVentes)
router.get("/no-comptabilized", jwtAuth, getNoComptabilizedVentes)
router.get("/no-traited", jwtAuth, getNoTraitedVentes)

router.route("/:id")
    .get(jwtAuth, retrieveVente)
    .put(jwtAuth, handlePreuveUpload, updateVente)
    .post(jwtAuth, handlePreuveUpload, validateVente)
    .delete(jwtAuth, deleteVente);

export default router;
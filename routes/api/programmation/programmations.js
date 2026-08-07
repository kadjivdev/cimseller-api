import { Router } from 'express';
import { getProgrammations, livraisonProgrammation, actualiseProgrammation, getValidatedProgrammations, getPdfProgrammations, retrieveProgrammation, createProgrammation, updateProgrammation, validateProgrammation, deleteProgrammation, printProgrammations, transferProgrammation } from '../../../controllers/programmation/programmationController.js';
import jwtAuth from '../../../middlewares/jwtAuth.js';
import upload from '../../../middlewares/multer.js';

const router = Router();

const handlePreuveUpload = (req, res, next) => {
    // console.log("file :",req.file)
    upload.single('preuve')(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Prueve trop volumineuse' });
        }
        return res.status(400).json({ error: err.message || 'Erreur lors du téléversement' });
    });
};

router.route("/")
    .get(jwtAuth, getProgrammations)
    .post(jwtAuth, createProgrammation);

router.route("/print")
    .post(jwtAuth, printProgrammations)

router.route("/:fournisseurId/:start/:end/get-pdf")
    .get(getPdfProgrammations)

router.route("/validate")
    .get(jwtAuth, getValidatedProgrammations)

router.route("/actualise")
    .put(jwtAuth, actualiseProgrammation)

router.route("/livraison")
    .put(jwtAuth, handlePreuveUpload, livraisonProgrammation)

router.route("/transfert")
    .put(jwtAuth, transferProgrammation)

router.route("/:id")
    .get(jwtAuth, retrieveProgrammation)
    .put(jwtAuth, updateProgrammation)
    .post(jwtAuth, validateProgrammation)
    .delete(jwtAuth, deleteProgrammation);

export default router;
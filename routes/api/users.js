// import express from 'express';
import { Router } from 'express';
import { getUsers, createUser, retrieveUsers, updateUser, deleteUser, importUsers } from '../../controllers/userController.js';
import jwtAuth from '../../middlewares/jwtAuth.js';
import { memoryUpload } from '../../middlewares/multer.js';

const router = Router();

const uploadExcelFile = (req, res, next) => {
    memoryUpload.fields([
        { name: 'users', maxCount: 1 },
        { name: 'file', maxCount: 1 },
    ])(req, res, (err) => {
        console.log("Requetes body :", req.body)
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Fichier trop volumineuse' });
        }
        return res.status(400).json({ error: err.message || 'Erreur lors du téléversement' });
    });
}

router.route("/")
    .get(jwtAuth, getUsers)
    .post(createUser)
    .put(jwtAuth, uploadExcelFile, importUsers);

router.route("/:id")
    .get(jwtAuth, retrieveUsers)
    .put(jwtAuth, updateUser)
    .delete(jwtAuth, deleteUser);

export default router;
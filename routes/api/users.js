// import express from 'express';
import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../../controllers/userController.js';
import jwtAuth from '../../middlewares/jwtAuth.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getUsers)
    .post(createUser);

router.route("/:id")
    .put(jwtAuth, updateUser)
    .delete(jwtAuth, deleteUser);

export default router;
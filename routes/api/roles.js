// import express from 'express';
import { Router } from 'express';
import { getRoles, createRole, updateRole, deleteRole } from '../../controllers/roleController.js';
import jwtAuth from '../../middlewares/jwtAuth.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getRoles)
    .post(jwtAuth, createRole);

router.route("/:id")
    .put(jwtAuth, updateRole)
    .delete(jwtAuth, deleteRole);

export default router;
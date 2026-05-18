// import express from 'express';
import { Router } from 'express';
import { getPermissions, createPermisssion, updatePermission, deletePermission } from '../../controllers/permissionController.js';
import jwtAuth from '../../middlewares/jwtAuth.js';

const router = Router();

router.route("/")
    .get(jwtAuth, getPermissions)
    .post(jwtAuth, createPermisssion);

router.route("/:id")
    .put(jwtAuth, updatePermission)
    .delete(jwtAuth, deletePermission);

export default router;
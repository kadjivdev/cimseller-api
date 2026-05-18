// import express from 'express';
import { Router } from 'express';
import { login, refreshToken, logout } from '../../controllers/authController.js';
const router = Router();

router.post('/login', login)
    .post('/refresh', refreshToken)
    .post('/logout', logout);

export default router;
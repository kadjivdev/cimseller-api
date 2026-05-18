import logger from "../config/logger.js"
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

const jwtAuth = (req, res, next) => {
    const token = req.cookies?.access_token;

    if (!token) {
        return res.status(401).json({ error: 'Accès réfusé! Token invalide!' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Invalid token:', error);
        return res.status(401).json({ error: 'Accès réfusé! Token invalide!' });
    }
};

export default jwtAuth;
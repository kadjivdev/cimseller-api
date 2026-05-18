import express from 'express';
import path from 'path';
import logger from './config/logger.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'

import { Router } from 'express';
import userRoutes from './routes/api/users.js';
import authRoutes from './routes/api/auth.js';
import roleRoutes from './routes/api/roles.js';
import permissionRoutes from "./routes/api/permissions.js";

// env configuration
dotenv.config();
const app = express();
const router = Router();

app.use(cookieParser()); // <-- c'est crucial pour req.cookies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(router);

app.get('/', (req, res) => {
  res.end('Bienvenue sur l\'API de Cimseller');
});

// user's routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// authorization'routes
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

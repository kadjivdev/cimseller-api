import logger from "../config/logger.js";
import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt, { decode } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Authentification controller
const login = async (req, res) => {
    console.log("Début de connexion ......")

    const { email, password } = req.body;
    try {
        // validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe sont requis' });
        }

        // recherche de l'utilisateur
        const user = await prisma.user.findFirst({
            where: { email, deletedAt: null },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: {
                                    select: { id: true, name: true, description: true }
                                }
                            }
                        }
                    }
                }
            }
        });

          // recherche de l'utilisateur pour les cookies
        const userForCookies = await prisma.user.findFirst({
            where: { email, deletedAt: null },
        });

        if (!user) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        // vérification du mot de passe
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        // suppression du mot de passe
        delete user.password;
        delete userForCookies.password

        /**
         * TODO: générer un token JWT pour l'authentification et l'autorisation
         * Ex: const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
         */
        const access_token = jwt.sign(
            { user: userForCookies },
            process.env.JWT_SECRET,
            { expiresIn: parseInt(process.env.JWT_EXPIRES_IN) }
        );

        const refresh_token = jwt.sign(
            { userForCookies },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN) }
        );

        // enregistrement du refrehToken en db
        await prisma.refreshToken.create({
            data: {
                token: refresh_token,
                userId: user.id,
                expiresAt: new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_IN) * 1000) // convert seconds to milliseconds
            }
        });

        const isProduction = process.env.NODE_ENV === "production";

        // envoi des tokens dans des cookies sécurisés
        res.cookie("access_token", access_token, {
            httpOnly: false,
            secure: isProduction,
            // sameSite: "None",
            sameSite: isProduction ? "None" : "Lax", // ✅ Lax en dev, None en prod
            maxAge: parseInt(process.env.JWT_EXPIRES_IN) * 1000 // 1h minutes en ms
        });

        res.cookie("refresh_token", refresh_token, {
            httpOnly: false,
            secure: isProduction,
            // sameSite: "None",
            sameSite: isProduction ? "None" : "Lax", // ✅ Lax en dev, None en prod
            maxAge: parseInt(process.env.JWT_REFRESH_EXPIRES_IN) * 1000 // 1 J en ms
        });

        console.log("Connexion réussie!!")
        res.json({
            user,
            message: 'Vous êtes connecté.e'
        });
    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ error: 'Failed to login' });
        throw error;
    }
}

// Refresh token controller
const refreshToken = async (req, res) => {
    const { refresh_token } = req.cookies;

    try {
        if (!refresh_token) {
            return res.status(401).json({ error: 'Refresh token is required' });
        }

        const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) {
                console.error('Invalid refresh token:', err);
                return res.status(401).json({ error: 'Token invalid' });
            }
            const user = decoded.user;

            // creation du nouveua token d'accès
            const access_token = jwt.sign(
                { user },
                process.env.JWT_SECRET,
                { expiresIn: parseInt(process.env.JWT_EXPIRES_IN) }
            );

            // envoi des tokens dans des cookies sécurisés
            res.cookie("access_token", access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "None",
                maxAge: parseInt(process.env.JWT_EXPIRES_IN) * 1000 // 1h minutes en ms
            });

            res.json({ user });
        });
    } catch (error) {
        console.error('Refresh token failed:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
}

// Logout controller
const logout = async (req, res) => {
    console.log("Début de déconnexion...")

    try {
        const { access_token } = req.cookies;
        console.log("Refresh token:", access_token)
        // console.log("Cookies:", req.cookies)

        if (!access_token) {
            return res.status(401).json({ error: 'Refresh token is required' });
        }

        // Optionnel : supprimer le refresh token stocké en base
        // await prisma.refreshToken.deleteMany({ where: { token: refresh_token } });

        const isProduction = process.env.NODE_ENV === "production";

        res.clearCookie("access_token", {
            httpOnly: false,
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax", // ✅ Lax en dev, None en prodODE_ENV === "production",
        });

        res.clearCookie("refresh_token", {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            secure: isProduction,
            sameSite: isProduction ? "None" : "Lax", // ✅ Lax en dev, None en prodODE_ENV === "production",
        });

        console.log("deconnecté.e avec succès")
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.log('Logout failed:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        res.status(500).json({ error: 'Failed to logout' });
    }
}

export { login, refreshToken, logout };
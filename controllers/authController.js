import logger from "../config/logger.js";
import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt, { decode } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Authentification controller
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe sont requis' });
        }

        // recherche de l'utilisateur
        const user = await prisma.user.findFirst({
            where: { email, deletedAt: null },
            include:{
                role: {
                    include: {
                        permissions: {
                            include: { permission: {
                                select:{id:true, name:true,description:true}
                            } }
                        }
                    }
                }
            }
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

        /**
         * TODO: générer un token JWT pour l'authentification et l'autorisation
         * Ex: const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
         */
        const access_token = jwt.sign(
            { user },
            process.env.JWT_SECRET,
            { expiresIn: parseInt(process.env.JWT_EXPIRES_IN) }
        );

        const refresh_token = jwt.sign(
            { user },
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

        // envoi des tokens dans des cookies sécurisés
        res.cookie("access_token", access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "None",
            maxAge: parseInt(process.env.JWT_EXPIRES_IN) * 1000 // 1h minutes en ms
        });

        res.cookie("refresh_token", refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "None",
            maxAge: parseInt(process.env.JWT_REFRESH_EXPIRES_IN) * 1000 // 1 J en ms
        });

        res.json({ user, message: 'Vous êtes connecté.e' });
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
    try {
        // verification de l'existence du refresh token dans les cookies
        const { refresh_token } = req.cookies;
        // console.log("Refresh token:", refresh_token)

        jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) return res.status(500).json("Le refreh token est invalid")

            // suppression des cookies
            res.clearCookie("access_token");
            res.clearCookie("refresh_token");

            res.json({ message: 'Logged out successfully' });
        })
    } catch (error) {
        console.error('Logout failed:', error);
        res.status(500).json({ error: 'Failed to logout' });
    }
}

export { login, refreshToken, logout };
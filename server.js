import express from 'express';
import path from 'path';
import logger from './config/logger.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { fileURLToPath } from 'url';

import { Router } from 'express';
import userRoutes from './routes/api/users.js';
import authRoutes from './routes/api/auth.js';
import roleRoutes from './routes/api/roles.js';
import permissionRoutes from "./routes/api/permissions.js";
import fournisseurRoutes from "./routes/api/fournisseurs.js";

// tool's routes
import produitRoutes from "./routes/api/tools/produits.js"
import produiTypeRoutes from "./routes/api/tools/produitTypes.js"
import documentTypeRoutes from "./routes/api/tools/documentTypes.js"
import detailRecuTypeRoutes from "./routes/api/tools/detailRecuTypes.js"
import zoneRoutes from "./routes/api/tools/zones.js"
import representantRoutes from "./routes/api/tools/representant.js"
import banqueRoutes from "./routes/api/tools/banque.js"
import compteBancaireRoutes from "./routes/api/tools/compteBancaires.js"
import agentRoutes from "./routes/api/tools/agent.js"
import marqueRoutes from "./routes/api/tools/marques.js"
import chauffeurRoutes from "./routes/api/tools/chauffeurs.js"
import avaliseurRoutes from "./routes/api/tools/avaliseurs.js"
import camionRoutes from "./routes/api/tools/camions.js"
import clientRoutes from "./routes/api/tools/clients.js";
import clientFilterRoutes from "./routes/api/tools/client-filters.js";
import clientStatusRoutes from "./routes/api/tools/clientStatus.js";

// programmation' s routes
import programmationRoutes from "./routes/api/programmation/programmations.js";

// command's routes
import commandeRoutes from "./routes/api/commande/commandes.js"
import commandeTypeRoutes from "./routes/api/tools/commandeTypes.js"
import commandeStatutRoutes from "./routes/api/tools/commandeStatus.js"
import commandeRecuRoutes from './routes/api/commande/commandeRecus.js';
import commandeRecuVersementRoutes from './routes/api/commande/commandeRecuVersement.js';
import commandeAccuseRoutes from "./routes/api/commande/commandeAccuse.js";

// command client's routes
import commandClientRoutes from "./routes/api/vente/commandClients.js"
import venteRoutes from "./routes/api/vente/ventes.js"
import comptabilityRoutes from "./routes/api/vente/comptabilities.js"

// compte's routes
import approvisionnementRoutes from "./routes/api/compte/approvisionnements.js"
import reglementRoutes from "./routes/api/compte/reglements.js"

// demandes
import updateVenteRoutes from "./routes/api/demande/upddateVente.js"
import deleteVenteRoutes from "./routes/api/demande/deleteVente.js"

// env configuration
dotenv.config();
const app = express();
const router = Router();

app.use(cookieParser()); // <-- c'est crucial pour req.cookies

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5000",
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(router);

// static files
app.use('/public/uploads', express.static(path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "public",
  "uploads"
)));

app.get('/', (req, res) => {
  res.end('Bienvenue sur l\'API de Cimseller');
});

// tools
app.use('/api/fournisseurs', fournisseurRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/produits/types', produiTypeRoutes);
app.use('/api/documents/types', documentTypeRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/representants', representantRoutes);
app.use('/api/banques', banqueRoutes);
app.use('/api/compte-bancaires', compteBancaireRoutes);
app.use('/api/agents', agentRoutes);

app.use('/api/marques', marqueRoutes);
app.use('/api/chauffeurs', chauffeurRoutes);
app.use('/api/avaliseurs', avaliseurRoutes);
app.use('/api/camions', camionRoutes);
app.use("/api/clients", clientRoutes)
app.use("/api/client-filters", clientFilterRoutes)
app.use("/api/clients/status", clientStatusRoutes)

// user's routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// authorization'routes
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);

// commande's routes
app.use("/api/commandes", commandeRoutes);
app.use("/api/commandes-types", commandeTypeRoutes);
app.use("/api/commandes-status", commandeStatutRoutes);
app.use("/api/commande-recus", commandeRecuRoutes)
app.use("/api/commande-recu-versements", commandeRecuVersementRoutes)
app.use("/api/commande-recu-accuses", commandeAccuseRoutes)
app.use('/api/commandes/detail-recus/types', detailRecuTypeRoutes);

// programmation's routes
app.use("/api/programmations", programmationRoutes)

// ventes
app.use("/api/commande-clients", commandClientRoutes)
app.use("/api/ventes", venteRoutes)
app.use("/api/comptabilities", comptabilityRoutes)

// compte
app.use("/api/approvisionnements", approvisionnementRoutes)
app.use("/api/reglements", reglementRoutes)

// demandes
app.use("/api/demandes-modification-vente", updateVenteRoutes)
app.use("/api/demandes-suppression-vente", deleteVenteRoutes)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

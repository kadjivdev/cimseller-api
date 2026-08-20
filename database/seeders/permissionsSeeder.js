
import prisma from '../../config/prisma.js';

const createCrudPermissions = (permission, name, viewOnly = false) => {
    return [
        { name: `${name}.view`, description: `Voir les ${permission}` },
        !viewOnly && { name: `${name}.create`, description: `Créer des ${permission}` },
        !viewOnly && { name: `${name}.edit`, description: `Modifier les ${permission}` },
        !viewOnly && { name: `${name}.delete`, description: `Supprimer des ${permission}` },
        !viewOnly && { name: `${name}.validate`, description: `Valider les ${permission}` },
    ].filter(Boolean);
}

const permissions = [
    //    core
    ...createCrudPermissions('commandes', 'commande'),
    ...createCrudPermissions('reçus', 'reçu'),
    ...createCrudPermissions('versements', 'versement'),
    ...createCrudPermissions('accuses', 'accuse'),
    ...createCrudPermissions('programmations', 'programmation'),
    ...createCrudPermissions('suivi sorties', 'suiviSortie', true),
    ...createCrudPermissions('suivi chauffeurs', 'suiviChauffeur', true),
    ...createCrudPermissions('livraisons', 'livraison', true),
    ...createCrudPermissions('ventes', 'vente'),
    ...createCrudPermissions('ventes comptabilisées', 'comptabilizedVente'),
    ...createCrudPermissions('comptabilités', 'comptabilite'),
    ...createCrudPermissions('approvisionnements', 'approvisionnement'),
    ...createCrudPermissions('reglements', 'reglement'),
    ...createCrudPermissions('clients', 'client'),

    // paramêtres
    ...createCrudPermissions('fournisseurs', 'fournisseur'),
    ...createCrudPermissions('avaliseurs', 'avaliseur'),
    ...createCrudPermissions('camions', 'camion'),
    ...createCrudPermissions('chauffeurs', 'chauffeur'),
    ...createCrudPermissions('agents', 'agent'),
    ...createCrudPermissions('banques', 'banque'),
    ...createCrudPermissions('compte bancaires', 'compteBancaire'),
    ...createCrudPermissions('produits', 'produit'),
    ...createCrudPermissions('representants', 'representant'),
    ...createCrudPermissions('zones', 'zone'),


    // securité
    ...createCrudPermissions('utilisateurs', 'user'),
    ...createCrudPermissions('rôles', 'role'),
    ...createCrudPermissions('permissions', 'permission'),
];

const seedPermissions = async () => {
    // TRUNCATE avec RESTART IDENTITY : vide la table ET remet la séquence auto-increment à 1
    await prisma.$transaction([
        prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE permissions;`),
        prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`),
    ]);

    // insertions
    await prisma.permission.createMany({
        data: permissions
    });
};

export default seedPermissions;
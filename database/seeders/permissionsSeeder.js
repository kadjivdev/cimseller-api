
import prisma from '../../config/prisma.js';

const createCrudPermissions = (permission, name) => {
    return [
        { name: `${name}.view`, description: `Voir les ${permission}` },
        { name: `${name}.create`, description: `Créer des ${permission}` },
        { name: `${name}.edit`, description: `Modifier les ${permission}` },
        { name: `${name}.delete`, description: `Supprimer des ${permission}` },
        { name: `${name}.validate`, description: `Valider les ${permission}` },
    ];
}

const permissions = [
    ...createCrudPermissions('utilisateurs', 'user'),
    ...createCrudPermissions('rôles', 'role'),
    ...createCrudPermissions('commandes', 'commande'),
    ...createCrudPermissions('clients', 'client'),
];

const seedPermissions = async () => {
    // Supprimer les permissions existantes pour éviter les doublons
    await prisma.permission.deleteMany();

    // insertions
    await prisma.permission.createMany({
        data: permissions
    });
};

export default seedPermissions;
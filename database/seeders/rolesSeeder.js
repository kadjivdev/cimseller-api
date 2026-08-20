import prisma from '../../config/prisma.js';

const roles = [
    {
        name: 'Super Administrateur',
        description: 'Administrateur du système avec tous les privilèges'
    },
    {
        name: 'Administrateur',
        description: 'Administrateur avec des privilèges limités'
    },
    {
        name: "Superviseur",
        description: "Superviseur avec des responsabilités de supervision"
    },
    {
        name: "Gestionnaire",
        description: "Gestionnaire avec des responsabilités de gestion"
    },
    {
        name: "Vendeur",
        description: "Vendeur avec des responsabilités de vente"
    },
    {
        name: "Validateur",
        description: "Validateur avec des responsabilités de validation"
    },
    {
        name: "Controlleur",
        description: "Controlleur avec des responsabilités de contrôle"
    },
    {
        name: "Comptable",
        description: "Comptable avec des responsabilités de comptabilité"
    },
    {
        name: "Gestion Client",
        description: "Client avec des privilèges d'accès limités"
    },
    {
        name: "Suivi",
        description: "Suivi avec des responsabilités de suivi"
    }
];


const seedRoles = async () => {
    // Supprimer les rôles existants pour éviter les doublons
    // TRUNCATE avec RESTART IDENTITY : vide la table ET remet la séquence auto-increment à 1
    await prisma.$transaction([
        prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE roles;`),
        prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`),
    ]);

    // insertions
    await prisma.role.createMany({
        data: roles
    });

    const permissions = await prisma.permission.findMany({
        where: { deletedAt: null }
    })

    // attachement de toutes les permissions au role 1 Super admin
    await prisma.role.update({
        where: { id: 1 },//role 1
        data: {
            permissions: {
                deleteMany: {},//remove all permissions
                create: permissions.map((per) => ({
                    permission: {
                        connect: { id: per.id }
                    }
                }))
            },
        },
    });
};

export default seedRoles;
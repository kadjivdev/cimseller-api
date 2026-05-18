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
    await prisma.role.deleteMany();

    // insertions
    await prisma.role.createMany({
        data: roles
    });
};

export default seedRoles;
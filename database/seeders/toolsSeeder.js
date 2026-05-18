import { name } from 'ejs';
import prisma from '../../config/prisma.js';

const tools = {
    zones: [
        {
            name: 'Alibori',
        }, {
            name: 'Atacora',
        }, {
            name: 'Borgou',
        }, {
            name: 'Collines',
        }, {
            name: 'Dahomey',
        }, {
            name: 'Donga',
        }, {
            name: 'Littoral',
        }, {
            name: 'Mono',
        }, {
            name: 'Ouémé',
        }, {
            name: 'Plateau',
        }, {
            name: 'Zou',
        }, {
            name: 'Direction',
        }, {
            name: 'Porto-Novo',
        }, {
            name: 'Borgou-Nord',
        }, {
            name: 'Borgou-Sud',
        }
    ],
    statutCommandes: [
        {
            name: 'Programmée',
            description: 'La commande est programmée et en attente de traitement.',
        },
        {
            name: 'Livrée',
            description: 'La commande a été livrée.',
        },
        {
            name: 'Validée',
            description: 'La commande est validée.',
        }
    ],
    typeCommandes: [
        {
            name: 'Comptants',
            description: "Commande passée en comptant.",
        },
        {
            name: 'Crédit',
            description: 'Commande passée en crédit.',
        }
    ],
    typeDocuments: [
        {
            name: 'Reçu d\'encaissement',
            description: 'Document attestant de l\'encaissement d\'une commande.',
        },
        {
            name: "Accusé de reception",
            description: 'Document confirmant la réception d\'une commande.',
        }
    ],
    typeDetailRecuCommandes: [
        {
            name: 'Borderreaux de versement',
            description: 'Document détaillant les versements effectués pour une commande.',
        },
        {
            name: 'Chèque',
            description: 'Document de paiement par chèque pour une commande.',
        }
    ],
    statutProgrammations: [
        {
            name: 'Validée',
            description: 'La programmation de la commande est validée.',
        }, {
            name: 'Annulée',
            description: 'La programmation de la commande est annulée.',
        },
        {
            name: 'Livrée',
            description: 'La commande est livrée.',
        },
        {
            name: 'Vendue',
            description: 'La commande est vendue.',
        }
    ],
    statutCommandeClients: [
        {
            name: 'Non livrée',
            description: 'La commande client n\'a pas encore été livrée.',
        },
        {
            name: 'Livrée',
            description: 'La commande client est livrée.',
        }, {
            name: 'Livrée partiellement',
            description: 'La commande client est livrée partiellement.',
        }, {
            name: 'Validée',
            description: 'La commande client est validée.',
        }
    ],
    typeCommandeClients: [
        {
            name: 'Comptant',
            description: 'Commande client passée en comptant.',
        },
        {
            name: 'Crédit',
            description: 'Commande client passée en crédit.',
        }
    ],
    statutVentes: [
        {
            name: 'Préparation',
            description: 'La vente est en cours de préparation.',
        },
        {
            name: 'Vendue',
            description: 'La vente est finalisée et le produit est vendu.',
        },
        {
            name: 'En attente de modification',
            description: 'La vente est en attente de modification.',
        }
    ],
    typeProduits: [
        {
            name: 'Ciment ordinaire',
            description: 'Ciment utilisé pour les constructions standard.',
        },
        {
            name: 'Ciment pour les grosses oeuvres',
            description: 'Ciment utilisé pour les grandes constructions.',
        }
    ],
    typeClients: [
        {
            name: 'Particulier',
            description: 'Client particulier.',
        },
        {
            name: 'Société',
            description: 'Client société.',
        }, {
            name: 'Btp',
            description: 'Client Btp.',
        }, {
            name: 'Autres',
            description: 'Client autres.',
        }
    ],
    statutClients: [
        {
            name: 'Actif',
            description: 'Le client est actif.',
        }, {
            name: 'Inactif',
            description: 'Le client est inactif.',
        }, {
            name: 'Bef',
            description: 'Le client est un bef.',
        }
    ],
    marqueCamions: [
        {
            name: "Scania",
            description: "Marque de camion Scania."
        }, {
            name: "Renault",
            description: "Marque de camion Renault."
        }, {
            name: "Man",
            description: "Marque de camion Man."
        }, {
            name: "Synotrock",
            description: "Marque de camion Synotrock."
        }
    ]
};

const seedTools = async () => {
    // Supprimer les outils existants pour éviter les doublons
    await Promise.all([
        prisma.Zone.deleteMany(),
        prisma.StatutCommande.deleteMany(),
        prisma.TypeCommande.deleteMany(),
        prisma.TypeDocument.deleteMany(),
        prisma.TypeDetailRecuCommande.deleteMany(),
        prisma.StatutProgrammation.deleteMany(),
        prisma.StatutCommandeClient.deleteMany(),
        prisma.TypeCommandeClient.deleteMany(),
        prisma.StatutVente.deleteMany(),
        prisma.TypeProduit.deleteMany(),
        prisma.StatutClient.deleteMany(),
        prisma.TypeClient.deleteMany(),
        prisma.Marque.deleteMany()
    ]);

    // insertions
    await Promise.all([
        prisma.Zone.createMany({ data: tools.zones }),
        prisma.StatutCommande.createMany({ data: tools.statutCommandes }),
        prisma.TypeCommande.createMany({ data: tools.typeCommandes }),
        prisma.TypeDocument.createMany({ data: tools.typeDocuments }),
        prisma.TypeDetailRecuCommande.createMany({ data: tools.typeDetailRecuCommandes }),
        prisma.StatutProgrammation.createMany({ data: tools.statutProgrammations }),
        prisma.StatutCommandeClient.createMany({ data: tools.statutCommandeClients }),
        prisma.TypeCommandeClient.createMany({ data: tools.typeCommandeClients }),
        prisma.StatutVente.createMany({ data: tools.statutVentes }),
        prisma.TypeProduit.createMany({ data: tools.typeProduits }),
        prisma.StatutClient.createMany({ data: tools.statutClients }),
        prisma.TypeClient.createMany({ data: tools.typeClients }),
        prisma.Marque.createMany({ data: tools.marqueCamions })
    ]);

    console.log('Tools seeding completed successfully.');
};

export default seedTools;
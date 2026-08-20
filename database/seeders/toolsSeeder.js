import { email } from 'zod';
import prisma from '../../config/prisma.js';

const tools = {
    zones: [
        {
            name: 'Inconnue 1',//1
        }, {
            name: 'Ouémé',//2
        }, {
            name: 'Inconnue 2',//3
        }, {
            name: 'Littoral',//4
        }, {
            name: 'Atlantique',//5
        }, {
            name: 'Mono',//6
        }, {
            name: 'Atacora',//7
        }, {
            name: 'Alibori',//8
        }, {
            name: 'Borgou-Nord',//9
        }, {
            name: 'Borgou-Sud',//10
        }, {
            name: 'Donga',//11
        }, {
            name: 'Inconnue 3',//12
        }, {
            name: 'Inconnue 4',//13
        }, {
            name: 'Inconnue 5',//14
        }, {
            name: 'Inconnue 6',//15
        }, {
            name: 'Inconnue 7',//16
        }, {
            name: 'Inconnue 8',//17
        }, {
            name: 'Direction',//18
        }, {
            name: 'Inconnue 9',//19
        }, {
            name: 'Inconnue 10',//20
        }, {
            name: 'Collines',//21
        }, {
            name: 'Zou',//22
        }, {
            name: 'Couffo',//23
        }, {
            name: 'Plateau',//24
        }, {
            name: 'Zone BTP',//25
        },
    ],
    statutCommandes: [
        {
            name: 'Non programmée',
            description: "La commande n'est pas programmée",
        },
        {
            name: 'En cours de programmation',
            description: 'La commande est en cours de programmation et en attente de traitement.',
        },
        {
            name: 'Programmée',
            description: 'La commande est programmée et en attente de traitement.',
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
        },
        {
            name: 'Annulée',
            description: 'La programmation de la commande est annulée.',
        },
        {
            name: 'Partiellement livrée',
            description: 'La programmation de la commande est livrée partiellement.',
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
            name: 'Validée',
            description: 'La vente est validée.',
        },
        {
            name: 'Vendue',
            description: 'La vente est finalisée et le produit est vendu.',
        },
        {
            name: 'En attente de modification',
            description: 'La vente est en attente de modification.',
        },
        {
            name: 'Contrôlée',
            description: 'La vente est contrôlée.',
        },
    ],
    typeFactures: [
        {
            name: 'Avec facture',
            description: 'Vente éffectuée avec facture.',
        },
        {
            name: 'Sans facture',
            description: 'Vente éffectuée sans facture.',
        },
        {
            name: "Facture à prendre après",
            description: 'Vente éffectuée avec facture à prendre après.',
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
    ],

    // avaliseur
    avaliseurs: [
        {
            fullname: "Avaliseur 1",
            phone: "+0122956554397",
            email: "avalisaue1@gmail.com"
        }
    ],
    produits: [
        {
            name: "CIMENT CEMII/BLL 32.5 NOCIBE",
            fournisseurPrice: 0,
            typeId: 1
        },
        {
            name: "CIMENT CEMII/42.5 NOCIBE",
            fournisseurPrice: 0,
            typeId: 2
        },
        {
            name: "CIMENT CEMII/BLL32.5 LAFARGE",
            fournisseurPrice: 0,
            typeId: 2
        },
        {
            name: "CIMENT CEMII/42.5 LAFARGE",
            fournisseurPrice: 1000,
            typeId: 2
        },
        {
            name: "CIMENT CPJ 35 CIMBENIN",
            fournisseurPrice: 0,
            typeId: 1
        },
        {
            name: "CEMI 42.5 LAFARGE",
            fournisseurPrice: 84682,
            typeId: 2
        },
        {
            name: "MC22.5X CIMBENIN",
            fournisseurPrice: 69999,
            typeId: 1
        },
        {
            name: "CIMBENIN 42.5 CPJ",
            fournisseurPrice: 78900,
            typeId: 1
        },
        {
            name: "CIM BENIN 42.5 CP",
            fournisseurPrice: 82646,
            typeId: 2
        },
        {
            name: "CIMBENIN 42.5 CPJ VRAC",
            fournisseurPrice: 86646,
            typeId: 2
        },
        {
            name: "NOCIBE VRAC 42.5",
            fournisseurPrice: 78302,
            typeId: 2
        },
    ],
    agents: [
        {
            nom: "Agent 1",
            prenom: "Test d'agent",
            phone: "0122956854397"
        }
    ],
    banques: [
        {
            name: "BOA",
            description: "Banque Of Africa"
        },
        {
            name: "ECOBANK",
            description: "Banque Eco"
        },
        {
            name: "NSIA",
            description: "Banque NSIA"
        },
        {
            name: "BGFI",
            description: "Banque BGFI"
        },
        {
            name: "ATLANTIQUE BANQUE",
            description: "Banque ATLANTIQUE BANQUE"
        },
        {
            name: "CORIS BANQUE",
            description: "Banque CORIS BANQUE"
        },
        {
            name: "UBA",
            description: "Banque UBA"
        },
        {
            name: "KADJIV CIMENTIER",
            description: "Banque KADJIV CIMENTIER"
        },
        {
            name: "ORABANK BENIN",
            description: "Banque ORABANK BENIN"
        },
        {
            name: "KADJIV ATLANTIC",
            description: "Banque KADJIV ATLANTIC"
        },
        {
            name: "KADJIV GADO HABIROU ATL",
            description: "Banque GADO HABIROU ATL"
        },
        {
            name: "BIIC-BENIN",
            description: "Banque BIIC-BENIN"
        },
        {
            name: "BSIC BENIN",
            description: "Banque BSIC BENIN"
        },
    ],
    compteBancaires: [
        {
            banqueId: 1,
            numero: "02 83 72 60 009",
            intitule: "KADJIV Sarl",
        },
        {
            banqueId: 1,
            numero: "00 66 80 10 00 00",
            intitule: "FOFANA ALASSANE ANDIL",
        },
        {
            banqueId: 1,
            numero: "00 66 73 89 00 02",
            intitule: "RIDVAN BOCCO",
        },
        {
            banqueId: 2,
            numero: "11 04 65 46 70 01",
            intitule: "KADJIV SARL",
        },
        {
            banqueId: 3,
            numero: "01 00 00 12 60 11 12 42 010",
            intitule: "KADJIV SARL",
        },
        {
            banqueId: 4,
            numero: "04 00 24 69 10 11",
            intitule: "KADJIV SARL",
        },
        {
            banqueId: 5,
            numero: "03 56 03 18 00 07",
            intitule: "GADO HABIROU",
        },
        {
            banqueId: 6,
            numero: "02 85 44 24 102",
            intitule: "KADJIV SARL",
        },
        {
            banqueId: 7,
            numero: "50 10 90 04 74 68",
            intitule: "KADJIV SARL",
        },
        {
            banqueId: 8,
            numero: "00 00 00 00 00 00 ",
            intitule: "Extrait Sur Compte Client",
        },
        {
            banqueId: 9,
            numero: "BJ058 01000 26089100201",
            intitule: "KADJIV SARL",
        },
        {
            banqueId: 10,
            numero: "30177450027",
            intitule: "KADJIV SARL",
        },
        {
            banqueId: 12,
            numero: "BJ 185 01100 000209284001 07",
            intitule: "BIIC- BENIN KADJIV SARL",
        },
        {
            banqueId: 13,
            numero: "BJ107 01010 00100261176 84",
            intitule: "KADJIV SARL BSIC BANK",
        },
    ],
    camions: [
        {
            marqueId: 1,
            immatriculation: "AG7601"
        },
        {
            marqueId: 1,
            immatriculation: "AG7596"
        },
    ],
    chauffeurs: [
        {
            fullname: "ABAHOUMBA AMOUSSOU FIRMIN",
            phone: "90 90 95 01"
        },
        {
            fullname: "ABAHUI MOHAMED",
            phone: "91 90 95 01"
        },
    ],
    representants: [
        {
            nom: "GOUDJANIAN",
            prenom: "FREDY",
            phone: "51 210 065",
            email: "l.fredy.goudjanian@kadjivsarl.com",
        },
        {
            nom: "ALASSANE",
            prenom: "FOFANA ANDIL",
            phone: "61 794 796",
            email: "andil.fofanaalasane@kadjivsarl.com",
        },
        {
            nom: "FAHIMOU",
            prenom: "DJIBRIL",
            phone: "62 13 45 28",
            email: "fahimou.djibril@kadjivsarl.com",
        },
        {
            nom: "KOUNOU",
            prenom: "CARMEN LAURENDA",
            phone: "55 828 734",
            email: "gbedjodelaurendacarmen.kounou@kadjivsarl.com",
        },
        {
            nom: "ZINSOU",
            prenom: "CARLOS",
            phone: "46 442 325",
            email: "zinsou.carlos@kadjivsarl.com",
        },
        {
            nom: "DAGBE",
            prenom: "BONAVENTURE",
            phone: "97 079 383",
            email: "dagbe.bonaventure@kadjivsarl.com",
        },
        {
            nom: "HOUSSA",
            prenom: "AIME",
            phone: "12222222",
            email: "aimee.houssa@kadjivsarl.com",
        },
        {
            nom: "AIGO",
            prenom: "Olive Yaovi",
            phone: "54 197 864",
            email: "olive.aigo@kadjivsarl.com",
        },
        {
            nom: "BOSSOU",
            prenom: "FREUD",
            phone: "61 374 045",
            email: "freud.benoitp.bossou@kadjivsarl.com",
        },
        {
            nom: "CODJA",
            prenom: "GLADYS",
            phone: "51 791 339",
            email: "codjia.gladys@kadjivsarl.com",
        },
        {
            nom: "DJITRINOU",
            prenom: "HIPPOLYTE",
            phone: "67 544 408",
            email: "djitrinou.hippolyte@kadjivsarl.com",
        },
        {
            nom: "SALAMOU",
            prenom: "LAWANI ABOUDOU",
            phone: "40 534 877",
            email: "aboudousalamou.lawani@kadjivsarl.com",
        },
        {
            nom: "NASSARA",
            prenom: "LUC",
            phone: "67846261",
            email: "luc.nassara@kadjivsarl.com",
        },
        {
            nom: "NONDICHAO",
            prenom: "MANSOUROU",
            phone: "97 723 856",
            email: "nondichao.mansourou@kadjivsarl.com",
        },
        {
            nom: "OROU MASSA",
            prenom: "MOHAMED",
            phone: "61 023 494",
            email: "mohamed.massa@kadjivsarl.com",
        },
        {
            nom: "MAMOUDOU ABDOUL",
            prenom: "NANFIOU MAMA",
            phone: "95 555 190",
            email: "abdoulnanfihou.mama@kadjivsarl.com",
        },
        {
            nom: "OBOGNON",
            prenom: "Tchègoun Babatoundé Rodolphe",
            phone: "66 523 110",
            email: "tbrodolphe.obognon@kadjivsarl.com",
        },
        {
            nom: "SOSSA",
            prenom: "RAOUL",
            phone: "62 134 528",
            email: "raoul.sossa@kadjivsarl.com",
        },
        {
            nom: "GBADAMASSI",
            prenom: "RODOLFO T.",
            phone: "67 698 447",
            email: "gbadamassi.rodolpho@kadjivsarl.com",
        },
        {
            nom: "SAKA",
            prenom: "SIRA",
            phone: "53 391 779",
            email: "adilou.sakasira@kadjivsarl.com",
        },
        {
            nom: "SEMIOU",
            prenom: "ALAMOU",
            phone: "97 154 955",
            email: "semiou.alamou@kadjivsarl.com",
        },
        {
            nom: "KANHONOU",
            prenom: "Taeser",
            phone: "98768765",
            email: "Teaserk@gmail.com",
        },
        {
            nom: "ADECHI",
            prenom: "MOULISINE",
            phone: "0163276193",
            email: "kadjivsarl1@gmail.com",
        },
        {
            nom: "WOROU",
            prenom: "SABIROU",
            phone: "61023494",
            email: "",
        },
    ],
    fournisseurs:[
        {
            sigle:"NOCIBE",
            raison_sociale:"NOUVELLE CIMENTERIE DU BENIN",
            phone:"21315513",
            email:"commercial@nouvellecimenteriedubenin.com",
            adresse:"Immeuble SGB 4ieme Etage Lot 4153 08BP 1024 TEL: 0..."
        },
        {
            sigle:"LAFARGE",
            raison_sociale:"SCB LAFARGE",
            phone:"95360771",
            email:"scb.lafarge@scb-lafarge.bj",
            adresse:"Haie-vive N*455 Rue12.170- Cotonou Tel: 95 24 39 42"
        },
        {
            sigle:"CIM BENIN",
            raison_sociale:"CIMENTERIE BENINOISE SA",
            phone:"97031849",
            email:"cimbenin@gmail.com",
            adresse:"Route De Porto-Novo PK8, Avant Le Carrefour Sèkandji En Face De La Voix Inter-état 65 65 02 02 Service Clientele"
        },
        {
            sigle:"ADJE OLA GROUP",
            raison_sociale:"ADJE OLA GROUPE",
            phone:"96123367",
            email:"adjeolagroupe@gmail.com",
            adresse:"RB AKPAKPA N*IFU 3202011760095 N*RCCM;RB/cot/20/ B..."
        },
        {
            sigle:"SAINT LOUIS SA",
            raison_sociale:"SAINT LOUIS SA",
            phone:"97481138",
            email:"didier@gmail.com",
            adresse:"Lot 257-m/oKE MAGLOIRE Qtier SEGB/ COTONOU"
        },
        {
            sigle:"BENI ELITE",
            raison_sociale:"GROUPE BENI ELITE/ DC NOCIBE",
            phone:"97011589",
            email:"kadjivsarl1@gmail.com",
            adresse:"COTONOU - NOCIBE"
        }
    ]
};

const seedTools = async () => {
    // Supprimer les outils existants pour éviter les doublons
    // await Promise.all([
    //     prisma.Zone.deleteMany(),
    //     prisma.StatutCommande.deleteMany(),
    //     prisma.TypeCommande.deleteMany(),
    //     prisma.TypeDocument.deleteMany(),
    //     prisma.TypeDetailRecuCommande.deleteMany(),
    //     prisma.StatutProgrammation.deleteMany(),
    //     prisma.StatutCommandeClient.deleteMany(),
    //     prisma.TypeCommandeClient.deleteMany(),
    //     prisma.StatutVente.deleteMany(),
    //     prisma.TypeProduit.deleteMany(),
    //     prisma.StatutClient.deleteMany(),
    //     prisma.TypeClient.deleteMany(),
    //     prisma.Marque.deleteMany(),

    //     // 
    //     prisma.avaliseurProgrammation.deleteMany(),
    //     prisma.produit.deleteMany(),
    //     prisma.agent.deleteMany(),
    //     prisma.agent.deleteMany(),
    //     prisma.banque.deleteMany(),
    //     prisma.compteBancaire.deleteMany(),
    //     prisma.camion.deleteMany(),
    //     prisma.chauffeur.deleteMany(),
    //     prisma.representant.deleteMany(),
    // ]);

    // TRUNCATE avec RESTART IDENTITY : vide la table ET remet la séquence auto-increment à 1
    await prisma.$transaction([
        prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE zones;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE statut_commandes;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE type_commandes;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE type_documents;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE type_detail_recu_commandes;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE statut_programmations;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE statut_commande_clients;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE type_commande_clients;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE statut_ventes;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE type_produits;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE statut_clients;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE type_clients;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE type_factures_vente;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE marques;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE avaliseur_programmations;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE produits;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE agents;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE banques;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE compte_bancaires;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE compte_bancaires;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE camions;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE chauffeurs;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE representants;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE fournisseurs;`),
        prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`),
    ]);

    // insertions
    await prisma.Zone.createMany({ data: tools.zones });
    await prisma.StatutCommande.createMany({ data: tools.statutCommandes });
    await prisma.TypeCommande.createMany({ data: tools.typeCommandes });
    await prisma.TypeDocument.createMany({ data: tools.typeDocuments });
    await prisma.TypeDetailRecuCommande.createMany({ data: tools.typeDetailRecuCommandes });
    await prisma.StatutProgrammation.createMany({ data: tools.statutProgrammations });
    await prisma.StatutCommandeClient.createMany({ data: tools.statutCommandeClients });
    await prisma.TypeCommandeClient.createMany({ data: tools.typeCommandeClients });
    await prisma.StatutVente.createMany({ data: tools.statutVentes });
    await prisma.TypeProduit.createMany({ data: tools.typeProduits });
    await prisma.StatutClient.createMany({ data: tools.statutClients });
    await prisma.TypeClient.createMany({ data: tools.typeClients });
    await prisma.TypeFactureVente.createMany({ data: tools.typeFactures });
    await prisma.Marque.createMany({ data: tools.marqueCamions });
    // 
    await prisma.avaliseurProgrammation.createMany({ data: tools.avaliseurs });
    await prisma.produit.createMany({ data: tools.produits });
    await prisma.agent.createMany({ data: tools.agents });
    await prisma.banque.createMany({ data: tools.banques });
    await prisma.compteBancaire.createMany({ data: tools.compteBancaires });
    await prisma.camion.createMany({ data: tools.camions });
    await prisma.chauffeur.createMany({ data: tools.chauffeurs });
    await prisma.representant.createMany({ data: tools.representants });
    await prisma.fournisseur.createMany({ data: tools.fournisseurs });

    console.log('Tools seeding completed successfully.');
};

export default seedTools;
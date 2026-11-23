import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt'

const role = await prisma.role.findFirst({
    where: { deletedAt: null }
})

const users = [
    {
        fullname: 'Admin',
        email: "admin@gmail.com",
        roleId: role?.id,//role super admin
        zoneId: 18
    },
    {
        fullname: "SAKA SIRA",
        email: "adilou.sakasira@kadjivsarl.com",
        zoneId: 9
    },
    {
        fullname: "GBADAMASSI RODOLPHO T.",
        email: "gbadamassi.rodolpho@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "SOSSA RAOUL",
        email: "_______raoulsegnon88@gmail.com",
        zoneId: null
    },
    {
        fullname: "OBOGNON Tchègoun Babatoundé Rodolphe",
        email: "___tbrodolphe.obognon@kadjivsarl.com",
        zoneId: 11
    },
    {
        fullname: "MAMOUDOU ABDOUL NANFIOU MAMA",
        email: "abdoulnanfihou.mama@kadjivsarl.com",
        zoneId: 7
    },
    {
        fullname: "OROU MASSA MOHAMED",
        email: "__mohamed.massa@kadjivsarl.com",
        zoneId: 10
    },
    {
        fullname: "NONDICHAO MANSOUROU",
        email: "nondichao.mansourou@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "NASSARA LUC",
        email: "luc.nassara@kadjivsarl.com",
        zoneId: 5
    },
    {
        fullname: "SALAMOU LAWANI ABOUDOU",
        email: "_____aboudousalamou.lawani@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "DJITRINOU HIPPOLYTE",
        email: "djitrinou.hippolyte@kadjivsarl.com",
        zoneId: 25
    },
    {
        fullname: "CODJA GLADYS",
        email: "codjia.gladys@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "BOSSOU FREUD",
        email: "___freud.benoitp.bossou@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "AIGO Olive Yaovi",
        email: "olive.aigo@kadjivsarl.com",
        zoneId: 8
    },
    {
        fullname: "HOUSSA AIME",
        email: "aime.houssa@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "DAGBE BONAVENTURE",
        email: "dagbe.bonaventure@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "ZINSOU CARLOS",
        email: "zinsou.carlos@kadjivsarl.com",
        zoneId: 4
    },
    {
        fullname: "KOUNOU CARMEN LAURENDA",
        email: "carmen.kounou@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "FAHIMOU DJIBRIL",
        email: "fahimou.djibril@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "ALASSANE FOFANA ANDIL",
        email: "andil.fofanaalasane@kadjivsarl.com",
        zoneId: 18
    },
    {
        fullname: "GOUDJANIAN FREDY",
        email: "____fredy.goudjanian@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "SEMIOU ALAMOU",
        email: "semiou.alamou@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "kadjiv",
        email: "kadjiv@gmail.com",
        zoneId: null
    },
    {
        fullname: "Luc Oluwatiyin h. OLouDE",
        email: "oloudeoluwatoyin@gmail.com",
        zoneId: null
    },
    {
        fullname: "ADEBOUMY Lookman",
        email: "adeboumy@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "DJOSSOU Johannes",
        email: "johannes@kadjivsarl.com",
        zoneId: 21
    },
    {
        fullname: "ELO Charles",
        email: "charleselo96@gmail.com",
        zoneId: 6
    },
    {
        fullname: "DG KADJIV",
        email: "directionkadjiv@gmail.com",
        zoneId: 18
    },
    {
        fullname: "TCHENAGNON NONDOME MURIELLE HERMANCE",
        email: "___murielletchenangnon@gmail.com",
        zoneId: null
    },
    {
        fullname: "ABDOUL Aziz Abdoulaye",
        email: "amidechasse@gmail.com",
        zoneId: null
    },
    {
        fullname: "ADECHI Moulisine",
        email: "amoulisine02@gmail.com",
        zoneId: 27
    },
    {
        fullname: "BONI OROU Abibou",
        email: "boniorouabibou@gmail.com",
        zoneId: null
    },
    {
        fullname: "KPONSENON Mesmin",
        email: "mesmin@gmail.com",
        zoneId: null
    },
    {
        fullname: "ADANDE KARIMATOU FIFAME",
        email: "__adandefifame@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "WOROU SABIROU",
        email: "worousabirou@gmail.com",
        zoneId: 28
    },
    {
        fullname: "NOUDEVIWA Sandrine",
        email: "sandrine@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "ADELEKE RUCHDANE KOLAWOLE",
        email: "ruchdanekolawolearemouadeleke@gmail.com",
        zoneId: 28
    },
    {
        fullname: "ZAINABE Chalonne",
        email: "koutonzainabe@gmail.com",
        zoneId: null
    },
    {
        fullname: "ASSOGBA AUBIN",
        email: "assogba@gmail.com",
        zoneId: null
    },
    {
        fullname: "GAËL HODONOU",
        email: "hodonou@gmail.com",
        zoneId: 18
    },
    {
        fullname: "MOUFOUTAOU Adelani",
        email: "adelani@kadjivsarl.com",
        zoneId: 11
    },
    {
        fullname: "DHOSSOU Jeanne",
        email: "jeanne@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "HOUNKANRIN Emmanuel",
        email: "emmanuelkadjiv@gmail.com",
        zoneId: null
    },
    {
        fullname: "ADEBAYOR Israel",
        email: "israel@kadjivsarl.com",
        zoneId: null
    },
    {
        fullname: "Aimé HOUSSA",
        email: "aimes.houssa@kadjivsarl.com",
        zoneId: null
    }
];

const userSeeders = async () => {
    // TRUNCATE avec RESTART IDENTITY : vide la table ET remet la séquence auto-increment à 1
    await prisma.$transaction([
        prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE users;`),
        prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`),
    ]);

    // insertion du user
    await prisma.user.createMany({
        data: await Promise.all(users.map(async (user) => ({
            ...user,
            password: await bcrypt.hash(user.email, 10)
        })))
    });

    console.log('Users seeded successfully.');
};

export default userSeeders;
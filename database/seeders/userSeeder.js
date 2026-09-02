import { email } from 'zod';
import prisma from '../../config/prisma.js';
import bcrypt from 'bcrypt'

const role = await prisma.role.findFirst({
    where: { deletedAt: null }
})

const users = [
    {
        fullname: 'Admin',
        email: "admin@gmail.com",
        password: await bcrypt.hash('admin@2026', 10),
        roleId: role?.id,//role super admin
        zoneId: 18
    },
    {
        fullname: "SAKA SIRA",
        email: "adilou.sakasira@kadjivsarl.com",
        password: "$2y$10$t21itQ56znQ9MyYKrYaSAebB4mvMxfVk3pPvp.IXiSl4mirvQxlEq",
        zoneId: 9
    },
    {
        fullname: "GBADAMASSI RODOLPHO T.",
        email: "gbadamassi.rodolpho@kadjivsarl.com",
        password: "$2y$10$D59Bl7DfzbENuWWkcN5Izu4XQ9XS/QXkGSirjTtsBMb7yunkZ1j1u",
        zoneId:null
    },
    {
        fullname: "SOSSA RAOUL",
        email: "_______raoulsegnon88@gmail.com",
        password: "$2y$10$dRD4AC6JrFUt12v3b6AYiuJivzRzj2ZyfkHSMnGuCs.HLJkuow7eW",
        zoneId:null
    },
    {
        fullname: "OBOGNON Tchègoun Babatoundé Rodolphe",
        email: "___tbrodolphe.obognon@kadjivsarl.com",
        password: "$2y$10$elZw4Ri2JGW2dXPgoO1d1O1mv9fvI7GRIRmYmbQqiJr4Cy97ZhrZu",
        zoneId: 11
    },
    {
        fullname: "MAMOUDOU ABDOUL NANFIOU MAMA",
        email: "abdoulnanfihou.mama@kadjivsarl.com",
        password: "$2y$10$W/2PTDLjwXR0uAsfYX6fX.wo2vkbzXUfWKCWQcirWHANfMG7Dkpx2",
        zoneId: 7
    },
    {
        fullname: "OROU MASSA MOHAMED",
        email: "__mohamed.massa@kadjivsarl.com",
        password: "$2y$10$2Br/vJO4qb184Y7F/LZOJeoeEs78RaeZLdpFxjCOXaaj8aK50r0zK",
        zoneId: 10
    },
    {
        fullname: "NONDICHAO MANSOUROU",
        email: "nondichao.mansourou@kadjivsarl.com",
        password: "$2y$10$FUxOwtczf2paSf5wDuyRQ.y3W4I0NcOZiDaWKuIYZo5KCbSnGbwvi",
        zoneId:null
    },
    {
        fullname: "NASSARA LUC",
        email: "luc.nassara@kadjivsarl.com",
        password: "$2y$10$EoxcSzgKR6Cq4KRSdAJ0JeQxX0bRE0EIkSuDvnaI/jp9YFBmu/4Ie",
        zoneId: 5
    },
    {
        fullname: "SALAMOU LAWANI ABOUDOU",
        email: "_____aboudousalamou.lawani@kadjivsarl.com",
        password: "_____$2y$10$Rjuw7PMvh.Nj4Tn0ZGcxSuNnZNaUNbjVoSWqbmBLtNQPNWI3o3bGm",
        zoneId:null
    },
    {
        fullname: "DJITRINOU HIPPOLYTE",
        email: "djitrinou.hippolyte@kadjivsarl.com",
        password: "$2y$10$l41QdecfFDta/CfKFIlR4emp3VfimB5l.TZFFxyVO/FuXr0Lly.qO",
        zoneId: 25
    },
    {
        fullname: "CODJA GLADYS",
        email: "codjia.gladys@kadjivsarl.com",
        password: "$2y$10$FUxOwtczf2paSf5wDuyRQ.y3W4I0NcOZiDaWKuIYZo5KCbSnGbwvi",
        zoneId:null
    },
    {
        fullname: "BOSSOU FREUD",
        email: "___freud.benoitp.bossou@kadjivsarl.com",
        password: "$2y$10$GJFa2RbqfQkDfofk0tNW2OBu0eBKXqorrnp6ddCtnU22iI0wqwFwC",
        zoneId:null
    },
    {
        fullname: "AIGO Olive Yaovi",
        email: "olive.aigo@kadjivsarl.com",
        password: "$2y$10$J9tnMySgVk7P7WlvY9HH3usuSXAL0y7OQqZeen4bBJn8OpQ/a259O",
        zoneId: 8
    },
    {
        fullname: "HOUSSA AIME",
        email: "aime.houssa@kadjivsarl.com",
        password: "$2y$10$BWMZRxEaKHqElbNeoE5CP.4TI9lxpapr3ZW77heWrgWGXUlQ.S7R2",
        zoneId:null
    },
    {
        fullname: "DAGBE BONAVENTURE",
        email: "dagbe.bonaventure@kadjivsarl.com",
        password: "$2y$10$FUxOwtczf2paSf5wDuyRQ.y3W4I0NcOZiDaWKuIYZo5KCbSnGbwvi",
        zoneId:null
    },
    {
        fullname: "ZINSOU CARLOS",
        email: "zinsou.carlos@kadjivsarl.com",
        password: "$2y$10$CI5P59ICr/HOihqlnYUrLeKwCajgMKd34HB66.JsJBrIOQY9fazrG",
        zoneId: 4
    },
    {
        fullname: "KOUNOU CARMEN LAURENDA",
        email: "carmen.kounou@kadjivsarl.com",
        password: "$2y$10$R7WNG/zuUGPrOqhE1oxa5utb4UFmFLWVMmhQsz.OjWK/xfGg64TOy",
        zoneId:null
    },
    {
        fullname: "FAHIMOU DJIBRIL",
        email: "fahimou.djibril@kadjivsarl.com",
        password: "$2y$10$8gTOAgSsD/NxrwL0M8Hzwudq6LzHeAMECP5A68xsOsBZd0/1qKUqO",
        zoneId:null
    },
    {
        fullname: "ALASSANE FOFANA ANDIL",
        email: "andil.fofanaalasane@kadjivsarl.com",
        password: "$2y$10$gxJvbkN16PTuMCZJG72YeutY2E7/zJySSSlclcDA0zQ3IZPAWVOWe",
        zoneId: 18
    },
    {
        fullname: "GOUDJANIAN FREDY",
        email: "____fredy.goudjanian@kadjivsarl.com",
        password: "____$2y$10$SBiO3TmREA.0TSChBI/FAe.64isi2bkUhR/0jTcemu0Fx1mmmoYVG",
        zoneId:null
    },
    {
        fullname: "SEMIOU ALAMOU",
        email: "semiou.alamou@kadjivsarl.com",
        password: "$2y$10$FUxOwtczf2paSf5wDuyRQ.y3W4I0NcOZiDaWKuIYZo5KCbSnGbwvi",
        zoneId:null
    },
    {
        fullname: "kadjiv",
        email: "kadjiv@gmail.com",
        password: "$2y$10$cBjNkWAXCnZDqrePJAT4i.OhVrFL.Q.M/FZ7535VzeKLPRjjRYvCO",
        zoneId:null
    },
    {
        fullname: "Luc Oluwatiyin h. OLouDE",
        email: "oloudeoluwatoyin@gmail.com",
        password: "$2y$10$unvVIUtZz//8qwLqqx67zek.81LlDvF3mpnkTTjAeXAg4v1XJh6gq",
        zoneId:null
    },
    {
        fullname: "ADEBOUMY Lookman",
        email: "adeboumy@kadjivsarl.com",
        password: "$2y$10$N7ZxR5uwff9pijhsStQmbumJqQh3PydxrZrO9lvzTuHCGr7aDfV42",
        zoneId:null
    },
    {
        fullname: "DJOSSOU Johannes",
        email: "johannes@kadjivsarl.com",
        password: "$2y$10$NELSrcc.kPK7ZJfsuuYwMuuDdDLjWyS.ora5zkfDJYvVOrHPLVuK.",
        zoneId: 21
    },
    {
        fullname: "ELO Charles",
        email: "charleselo96@gmail.com",
        password: "$2y$10$8ji8wzlV9JzQmDkJn9e14ObkQx14jvl0WEsV62MjT.H2xwdhszWTy",
        zoneId: 6
    },
    {
        fullname: "DG KADJIV",
        email: "directionkadjiv@gmail.com",
        password: "$2y$10$dfeGAchX8yAVP6X0.V1mQ.VcYZ0mtimxoqQZoadBC.t7to3KCySoO",
        zoneId: 18
    },
    {
        fullname: "TCHENAGNON NONDOME MURIELLE HERMANCE",
        email: "___murielletchenangnon@gmail.com",
        password: "$2y$10$Qty6EhH5PB1NqRifVsd.TOUxA0/oHQ5HDMA/9hR0l6znX92OIQnua",
        zoneId:null
    },
    {
        fullname: "ABDOUL Aziz Abdoulaye",
        email: "amidechasse@gmail.com",
        password: "$2y$10$ACxJriw2Wp5dwNzn5eX1y.q6FQgzEBzjTxSi.pTh3dtW/OK418IY6",
        zoneId:null
    },
    {
        fullname: "ADECHI Moulisine",
        email: "amoulisine02@gmail.com",
        password: "$2y$10$AnXXEbtj.BjIiCsJ74f/Kewhm4LcpJXet8tntiGsHHt8UJCuCJRpy",
        zoneId: 27
    },
    {
        fullname: "BONI OROU Abibou",
        email: "boniorouabibou@gmail.com",
        password: "$2y$10$48fBJmAWCJX3lL/IivxgmezURlGGtCpNpiMoazCBR4WaBovAFOpFW",
        zoneId: null
    },
    {
        fullname: "KPONSENON Mesmin",
        email: "mesmin@gmail.com",
        password: "$2y$10$TtBkpCM5CoQOJ1l59SXPrOR1L9BOkyOLIcCxAYIfhMipGYlFDDePS",
        zoneId: null
    },
    {
        fullname: "ADANDE KARIMATOU FIFAME",
        email: "__adandefifame@kadjivsarl.com",
        password: "$2y$10$2BLHt5ztpPIO3eMHvGmCVuh98NmVIcGY4PumBPzotdcMfnppXZv5K",
        zoneId: null
    },
    {
        fullname: "WOROU SABIROU",
        email: "worousabirou@gmail.com",
        password: "$2y$10$EF0kn2Cqok2Lhxcw47Vm.eRCTG1wfA6w7Uwdp2DmY/OO61XNEBdZO",
        zoneId: 28
    },
    {
        fullname: "NOUDEVIWA Sandrine",
        email: "sandrine@kadjivsarl.com",
        password: "$2y$10$OHST3okUCgn8p0/FUfs.reWgEOShJMH6sLLesfdcXqLM.qpZcHdWy",
        zoneId: null
    },
    {
        fullname: "ADELEKE RUCHDANE KOLAWOLE",
        email: "ruchdanekolawolearemouadeleke@gmail.com",
        password: "$2y$10$UgokTX9tHhhD9yS.ZuC35uKk6t6wSIKyrB0xNdOl7DBoex6J8iY3q",
        zoneId: 28
    },
    {
        fullname: "ZAINABE Chalonne",
        email: "koutonzainabe@gmail.com",
        password: "$2y$10$dqfPbwsVrBMgpcypQNRP/unsSWGfXSwasBtDy6W7YzmXmXgX/kmai",
        zoneId: null
    },
    {
        fullname: "ASSOGBA AUBIN",
        email: "assogba@gmail.com",
        password: "$2y$10$6pH2obY.Yqh/GW6kthb7g.hNeRdYRdvZps6lLMfMDZK2OqIr/CBIq",
        zoneId: null
    },
    {
        fullname: "GAËL HODONOU",
        email: "hodonou@gmail.com",
        password: "$2y$10$Nk9I9kx1PfQhoVqOgSJzquK5pUTfHMp.zwUCRN4RhyaQ7sPEuNmHi",
        zoneId: 18
    },
    {
        fullname: "MOUFOUTAOU Adelani",
        email: "adelani@kadjivsarl.com",
        password: "$2y$10$XwZCg4WY.j/zjWg8lNzKjuAcipP/AJn4j0KqwNvOgjtF2V1blfTPm",
        zoneId: 11
    },
    {
        fullname: "DHOSSOU Jeanne",
        email: "jeanne@kadjivsarl.com",
        password: "$2y$10$W7TOolXcO1plnbeqoLCp2eaP7f7wlhxVPyzsFtx2IloZKiisHRPFq",
        zoneId: null
    },
    {
        fullname: "HOUNKANRIN Emmanuel",
        email: "emmanuelkadjiv@gmail.com",
        password: "$2y$10$r43yGmhbp92GrerCc8LUbujw0E6OhS4Rs4wsWHMOM7NlDMV5vvBxS",
        zoneId: null
    },
    {
        fullname: "ADEBAYOR Israel",
        email: "israel@kadjivsarl.com",
        password: "$2y$10$9WSw7rRRPqvY6I.LyZzObOOpGX8DDRsPNl3DTzylD7MezjI7l7M7O",
        zoneId: null
    },
    {
        fullname: "Aimé HOUSSA",
        email: "aimes.houssa@kadjivsarl.com",
        password: "$2y$10$NgIABeszoTGY/ulnYcRlpeiGCpDJ1zbD0nPpiMVkPGafpmknkUUh.",
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
        data: users
    });

    console.log('Users seeded successfully.');
};

export default userSeeders;
// exportService.js

import prisma from '../config/prisma.js';
import ExcelJS from 'exceljs';

export async function exportVentesToExcel() {
  // 1. Transaction : on lit puis on marque dans la même transaction
  const items = await prisma.$transaction(async (tx) => {

    const ventes = await tx.vente.findMany({
      orderBy: { id: 'asc' },
      where: {
        treatedById: { not: null }, // les ventes traitées
        exported: false,            // les ventes non exportées
        venteComptability: {
          isNot: null,               // ventes comptabilisées
        },
      },
      include: {
        produit: true,              // pour vente.produit.name
        venteComptability: true,    // pour les champs prix
      },
    });

    if (ventes.length === 0) return ventes;

    const ids = ventes.map((r) => r.id);

    await tx.vente.updateMany({
      where: { id: { in: ids } },
      data: { exported: true },
    });

    return ventes;
  });

  if (items.length === 0) {
    return null; // rien à exporter
  }

  // 2. Génération du fichier Excel
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Export');

  sheet.columns = [
    { header: 'Vente', key: 'code', width: 15 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Produit', key: 'produitName', width: 25 },
    { header: 'PU', key: 'unitePrice', width: 15 },
    { header: 'Qte Totale', key: 'qteTotal', width: 15 },
    { header: 'Transport', key: 'transport', width: 15 },
    { header: 'Montant', key: 'montant', width: 15 },

    { header: 'Prix Unitaire HT', key: 'unitPriceHT', width: 18 },
    { header: 'Prix Unitaire AIB', key: 'unitPriceAib', width: 18 },
    { header: 'Prix Unitaire TVA', key: 'unitPriceTva', width: 18 },
    { header: 'Prix Unitaire Marge', key: 'unitPriceMarge', width: 18 },
    { header: 'Prix Unitaire TTC', key: 'unitPriceTtc', width: 18 },

    { header: 'Prix Total HT', key: 'priceHT', width: 18 },
    { header: 'Prix Total AIB', key: 'priceAib', width: 18 },
    { header: 'Prix Total TVA', key: 'priceTva', width: 18 },
    { header: 'Prix Total 1.18', key: 'price118', width: 18 },
    { header: 'Prix Total Marge', key: 'priceMarge', width: 18 },
    { header: 'Prix Total TTC', key: 'priceTtc', width: 18 },
  ];

  items.forEach((vente) => {
    const c = vente.venteComptability ?? {};

    sheet.addRow({
      code: vente.code,
      date: vente.date,
      produitName: vente.produit?.name ?? '',
      unitePrice: vente.unitePrice, // vérifie que ce champ existe bien sur Vente
      qteTotal: vente.qteTotal,
      transport: vente.transport,
      montant: vente.montant,

      unitPriceHT: c.unitPriceHT,
      unitPriceAib: c.unitPriceAib,
      unitPriceTva: c.unitPriceTva,
      unitPriceMarge: c.unitPriceMarge,
      unitPriceTtc: c.unitPriceTtc,

      priceHT: c.priceHT,
      priceAib: c.priceAib,
      priceTva: c.priceTva,
      price118: c.price118,
      priceMarge: c.priceMarge,
      priceTtc: c.priceTtc,
    });
  });

  sheet.getRow(1).font = { bold: true };

  return workbook;
}
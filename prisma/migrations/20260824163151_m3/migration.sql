/*
  Warnings:

  - You are about to drop the column `aib` on the `vente_comptabilities` table. All the data in the column will be lost.
  - You are about to drop the column `aibPrice` on the `vente_comptabilities` table. All the data in the column will be lost.
  - You are about to drop the column `bruitPrice` on the `vente_comptabilities` table. All the data in the column will be lost.
  - You are about to drop the column `htPrice` on the `vente_comptabilities` table. All the data in the column will be lost.
  - You are about to drop the column `marge` on the `vente_comptabilities` table. All the data in the column will be lost.
  - You are about to drop the column `margePrice` on the `vente_comptabilities` table. All the data in the column will be lost.
  - You are about to drop the column `netHorsTaxe` on the `vente_comptabilities` table. All the data in the column will be lost.
  - You are about to drop the column `prixTTC` on the `vente_comptabilities` table. All the data in the column will be lost.
  - You are about to drop the column `ttcPrice` on the `vente_comptabilities` table. All the data in the column will be lost.
  - You are about to drop the column `tva` on the `vente_comptabilities` table. All the data in the column will be lost.
  - You are about to drop the column `tvaPrice` on the `vente_comptabilities` table. All the data in the column will be lost.
  - You are about to drop the column `usinePrixHT` on the `vente_comptabilities` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `vente_comptabilities` DROP COLUMN `aib`,
    DROP COLUMN `aibPrice`,
    DROP COLUMN `bruitPrice`,
    DROP COLUMN `htPrice`,
    DROP COLUMN `marge`,
    DROP COLUMN `margePrice`,
    DROP COLUMN `netHorsTaxe`,
    DROP COLUMN `prixTTC`,
    DROP COLUMN `ttcPrice`,
    DROP COLUMN `tva`,
    DROP COLUMN `tvaPrice`,
    DROP COLUMN `usinePrixHT`,
    ADD COLUMN `priceAib` DOUBLE NULL,
    ADD COLUMN `priceHT` DOUBLE NULL,
    ADD COLUMN `priceMarge` DOUBLE NULL,
    ADD COLUMN `priceTtc` DOUBLE NULL,
    ADD COLUMN `priceTva` DOUBLE NULL,
    ADD COLUMN `unitPriceAib` DOUBLE NULL,
    ADD COLUMN `unitPriceHT` DOUBLE NULL,
    ADD COLUMN `unitPriceMarge` DOUBLE NULL,
    ADD COLUMN `unitPriceTtc` DOUBLE NULL,
    ADD COLUMN `unitPriceTva` DOUBLE NULL;

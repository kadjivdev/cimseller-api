-- AlterTable
ALTER TABLE `users` ADD COLUMN `zoneId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

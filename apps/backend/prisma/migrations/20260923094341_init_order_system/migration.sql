-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('OWNER', 'TENANT') NOT NULL DEFAULT 'OWNER';

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `propertyId` INTEGER NOT NULL,
    `tenantFullName` VARCHAR(191) NOT NULL,
    `tenantPhone` VARCHAR(191) NOT NULL,
    `tenantEmail` VARCHAR(191) NOT NULL,
    `requestedStartDate` DATETIME(3) NOT NULL,
    `requestedEndDate` DATETIME(3) NOT NULL,
    `rentAmountSnapshot` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `orders_userId_idx`(`userId`),
    INDEX `orders_propertyId_idx`(`propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

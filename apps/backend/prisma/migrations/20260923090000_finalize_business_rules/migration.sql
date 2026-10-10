-- Migration: finalize_business_rules
-- Menyelaraskan database dengan keputusan owner (2026-09-23) yang sudah
-- dituangkan di prisma/schema.prisma. Jalankan `npm run prisma:migrate:deploy`
-- (atau `prisma migrate dev` di lingkungan development) setelah file ini ada
-- di folder migrations agar Prisma menandainya sebagai applied.
--
-- PENTING sebelum menjalankan:
-- 1) Tenant.email & Tenant.identityNumber akan menjadi NOT NULL + UNIQUE.
--    Pastikan dulu tidak ada baris tenants dengan email/identityNumber NULL
--    atau duplikat, kalau tidak ALTER TABLE ini akan gagal:
--      SELECT id, fullName FROM tenants WHERE email IS NULL OR identityNumber IS NULL;
--      SELECT email, COUNT(*) FROM tenants GROUP BY email HAVING COUNT(*) > 1;
--      SELECT identityNumber, COUNT(*) FROM tenants GROUP BY identityNumber HAVING COUNT(*) > 1;
--    Backfill data yang kurang/duplikat secara manual terlebih dahulu.

-- PropertyStatus: tambah RESERVED & INACTIVE
ALTER TABLE `properties`
  MODIFY COLUMN `status` ENUM('AVAILABLE', 'OCCUPIED', 'UNDER_MAINTENANCE', 'RESERVED', 'INACTIVE') NOT NULL DEFAULT 'AVAILABLE';

-- Tenant: email & identityNumber wajib diisi & unik
ALTER TABLE `tenants`
  MODIFY COLUMN `email` VARCHAR(191) NOT NULL,
  MODIFY COLUMN `identityNumber` VARCHAR(191) NOT NULL;

ALTER TABLE `tenants`
  ADD UNIQUE INDEX `tenants_email_key`(`email`),
  ADD UNIQUE INDEX `tenants_identityNumber_key`(`identityNumber`);

-- PaymentStatus: tambah UNPAID
ALTER TABLE `payments`
  MODIFY COLUMN `status` ENUM('PAID', 'PARTIAL', 'LATE', 'UNPAID') NOT NULL DEFAULT 'PAID';

-- PaymentMethod: dari free-text VARCHAR menjadi ENUM final
-- (kolom yang berisi nilai di luar 4 pilihan ini perlu dibersihkan/dipetakan
-- ulang secara manual dulu sebelum ALTER berikut dijalankan)
ALTER TABLE `payments`
  MODIFY COLUMN `method` ENUM('CASH', 'BANK_TRANSFER', 'E_WALLET', 'OTHER') NULL;

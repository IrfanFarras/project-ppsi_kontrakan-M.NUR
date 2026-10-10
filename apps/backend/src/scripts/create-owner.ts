/**
 * Membuat akun OWNER (admin) secara manual.
 *
 * Public registration (`POST /api/auth/register`) sengaja hanya menghasilkan
 * role TENANT, jadi akun OWNER harus dibuat lewat script ini.
 *
 * Pemakaian (dari folder apps/backend):
 *   npm run create-owner -- "Nama Owner" owner@email.com passwordRahasia
 *
 * Script menolak jika email sudah terdaftar (tidak mengubah role akun lama).
 */
import "../config/env"; // load .env + validasi (fail-fast)
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";

async function main() {
  const [name, email, password] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error('Usage: npm run create-owner -- "<nama>" <email> <password>');
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Password minimal 6 karakter.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`Email ${email} sudah terdaftar (role: ${existing.role}). Tidak ada perubahan.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "OWNER" },
  });

  console.log(`Akun OWNER dibuat: id=${user.id} email=${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

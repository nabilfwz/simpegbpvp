/**
 * Script migrasi role: 5 role lama → 3 role baru
 *
 * Mapping:
 *   admin_kepegawaian, kasubag_tu → admin
 *   instruktur, operator          → user
 *   superadmin                    → superadmin (tidak berubah)
 *
 * Cara jalankan:
 *   npx tsx scripts/migrate-roles.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Mulai migrasi role...\n");

  // Hitung sebelum migrasi
  const before = await prisma.user.groupBy({
    by: ["role"],
    _count: { role: true },
  });
  console.log("📊 Distribusi role SEBELUM migrasi:");
  before.forEach((r) => console.log(`   ${r.role}: ${r._count.role} user`));
  console.log();

  // Migrasi: admin_kepegawaian & kasubag_tu → admin
  const toAdmin = await prisma.user.updateMany({
    where: { role: { in: ["admin_kepegawaian", "kasubag_tu"] } },
    data: { role: "admin" },
  });
  console.log(`✅ Dimigrasi ke "admin": ${toAdmin.count} user`);

  // Migrasi: instruktur & operator → user
  const toUser = await prisma.user.updateMany({
    where: { role: { in: ["instruktur", "operator"] } },
    data: { role: "user" },
  });
  console.log(`✅ Dimigrasi ke "user": ${toUser.count} user`);

  // Hitung setelah migrasi
  const after = await prisma.user.groupBy({
    by: ["role"],
    _count: { role: true },
  });
  console.log("\n📊 Distribusi role SETELAH migrasi:");
  after.forEach((r) => console.log(`   ${r.role}: ${r._count.role} user`));

  console.log("\n🎉 Migrasi selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Error migrasi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

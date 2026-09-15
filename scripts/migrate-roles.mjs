import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Migrasi role lama 'admin' → 'superadmin'
  const updated = await prisma.user.updateMany({
    where: { role: 'admin' },
    data: { role: 'superadmin' },
  });
  console.log(`✅ Updated ${updated.count} user(s): admin → superadmin`);

  // Tampilkan semua user saat ini
  const users = await prisma.user.findMany({
    select: { id: true, email: true, nama: true, role: true, aktif: true },
    orderBy: { role: 'asc' },
  });

  console.log('\n📋 Daftar User Saat Ini:');
  console.table(users.map(u => ({
    email: u.email,
    nama: u.nama,
    role: u.role,
    aktif: u.aktif,
  })));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const assignments = [
    // Staf kepegawaian TU
    { email: 'siti.kepegawaian@kemnaker.go.id', role: 'admin_kepegawaian', alasan: 'Staf kepegawaian TU' },
    // Kasubag TU (pimpinan)
    { email: 'iskandar.umum@kemnaker.go.id', role: 'kasubag_tu', alasan: 'Kepala Subbag TU' },
    { email: 'rahmad.hidayat@kemnaker.go.id', role: 'kasubag_tu', alasan: 'Pejabat struktural TU' },
    // Instruktur
    { email: 'fauzi.asn@kemnaker.go.id', role: 'instruktur', alasan: 'Instruktur Listrik' },
    { email: 'cut.nurul@kemnaker.go.id', role: 'instruktur', alasan: 'Instruktur Listrik' },
    { email: 'iqbal.tik@kemnaker.go.id', role: 'instruktur', alasan: 'Instruktur TIK' },
    { email: 'dedi.otomotif@kemnaker.go.id', role: 'instruktur', alasan: 'Instruktur Otomotif' },
    { email: 'zulkifli.las@kemnaker.go.id', role: 'instruktur', alasan: 'Instruktur Las' },
    // IT staff → superadmin
    { email: 'fahmi.it@kemnaker.go.id', role: 'superadmin', alasan: 'Staff IT Pengelola Sistem' },
  ];

  for (const { email, role, alasan } of assignments) {
    const result = await prisma.user.updateMany({
      where: { email },
      data: { role },
    });
    console.log(result.count > 0
      ? `OK  ${email} => ${role} (${alasan})`
      : `--  ${email} tidak ditemukan`);
  }

  const distribution = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
    orderBy: { role: 'asc' },
  });

  console.log('\nDistribusi Role Final:');
  for (const d of distribution) {
    console.log(`  ${d.role.padEnd(20)} : ${d._count.role} user`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

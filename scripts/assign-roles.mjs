import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Assign role sesuai jabatan nyata
  const assignments: Array<{ email: string; role: string; alasan: string }> = [
    // Siti Rahmah, S.E. → Staff TU pengelola kepegawaian
    { email: 'siti.kepegawaian@kemnaker.go.id', role: 'admin_kepegawaian', alasan: 'Staf kepegawaian TU' },
    // Iskandar Muda, S.Sos., M.M. → Kasubag Tata Usaha (pimpinan TU)
    { email: 'iskandar.umum@kemnaker.go.id', role: 'kasubag_tu', alasan: 'Kepala Subbag TU' },
    // Instruktur-instruktur
    { email: 'fauzi.asn@kemnaker.go.id', role: 'instruktur', alasan: 'Instruktur Listrik' },
    { email: 'cut.nurul@kemnaker.go.id', role: 'instruktur', alasan: 'Instruktur Listrik' },
    { email: 'iqbal.tik@kemnaker.go.id', role: 'instruktur', alasan: 'Instruktur TIK' },
    { email: 'dedi.otomotif@kemnaker.go.id', role: 'instruktur', alasan: 'Instruktur Otomotif' },
    { email: 'zulkifli.las@kemnaker.go.id', role: 'instruktur', alasan: 'Instruktur Las' },
    // IT staff → superadmin
    { email: 'fahmi.it@kemnaker.go.id', role: 'superadmin', alasan: 'Staff IT Pengelola Sistem' },
    // Rahmad Hidayat, S.T., M.Si. → kasubag_tu (bisa jadi kabid)
    { email: 'rahmad.hidayat@kemnaker.go.id', role: 'kasubag_tu', alasan: 'Pejabat struktural TU' },
    // Non-PNS → operator
    { email: 'agus.security@kemnaker.go.id', role: 'operator', alasan: 'Non-PNS, akses terbatas' },
    { email: 'putri.kios@kemnaker.go.id', role: 'operator', alasan: 'Non-PNS, akses terbatas' },
  ];

  for (const { email, role, alasan } of assignments) {
    const result = await prisma.user.updateMany({
      where: { email },
      data: { role },
    });
    if (result.count > 0) {
      console.log(`✅ ${email} → ${role} (${alasan})`);
    } else {
      console.log(`⚠️  ${email} tidak ditemukan`);
    }
  }

  console.log('\n📋 Distribusi Role Final:');
  const distribution = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
    orderBy: { role: 'asc' },
  });
  console.table(distribution.map(d => ({ role: d.role, jumlah: d._count.role })));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

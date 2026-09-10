import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Master Data and Default Users...");

  // 1. PANGKAT_GOLONGAN
  const pangkatGolonganData = [
    { label: "Golongan I/a (Juru Muda)", kode: "I/a", urutan: 1 },
    { label: "Golongan I/b (Juru Muda Tingkat I)", kode: "I/b", urutan: 2 },
    { label: "Golongan I/c (Juru)", kode: "I/c", urutan: 3 },
    { label: "Golongan I/d (Juru Tingkat I)", kode: "I/d", urutan: 4 },
    { label: "Golongan II/a (Pengatur Muda)", kode: "II/a", urutan: 5 },
    { label: "Golongan II/b (Pengatur Muda Tingkat I)", kode: "II/b", urutan: 6 },
    { label: "Golongan II/c (Pengatur)", kode: "II/c", urutan: 7 },
    { label: "Golongan II/d (Pengatur Tingkat I)", kode: "II/d", urutan: 8 },
    { label: "Golongan III/a (Penata Muda)", kode: "III/a", urutan: 9 },
    { label: "Golongan III/b (Penata Muda Tingkat I)", kode: "III/b", urutan: 10 },
    { label: "Golongan III/c (Penata)", kode: "III/c", urutan: 11 },
    { label: "Golongan III/d (Penata Tingkat I)", kode: "III/d", urutan: 12 },
    { label: "Golongan IV/a (Pembina)", kode: "IV/a", urutan: 13 },
    { label: "Golongan IV/b (Pembina Tingkat I)", kode: "IV/b", urutan: 14 },
    { label: "Golongan IV/c (Pembina Utama Muda)", kode: "IV/c", urutan: 15 },
    { label: "Golongan IV/d (Pembina Utama Madya)", kode: "IV/d", urutan: 16 },
    { label: "Golongan IV/e (Pembina Utama)", kode: "IV/e", urutan: 17 },
  ];

  for (const item of pangkatGolonganData) {
    await prisma.masterData.upsert({
      where: {
        kategori_label: {
          kategori: "PANGKAT_GOLONGAN",
          label: item.label,
        },
      },
      update: { kode: item.kode, urutan: item.urutan, aktif: true },
      create: {
        kategori: "PANGKAT_GOLONGAN",
        label: item.label,
        kode: item.kode,
        urutan: item.urutan,
        aktif: true,
      },
    });
  }

  // 2. AGAMA
  const agamaData = [
    { label: "Islam", kode: "ISL", urutan: 1 },
    { label: "Kristen Protestan", kode: "PRO", urutan: 2 },
    { label: "Katolik", kode: "KAT", urutan: 3 },
    { label: "Hindu", kode: "HIN", urutan: 4 },
    { label: "Buddha", kode: "BUD", urutan: 5 },
    { label: "Khonghucu", kode: "KHO", urutan: 6 },
  ];

  for (const item of agamaData) {
    await prisma.masterData.upsert({
      where: {
        kategori_label: {
          kategori: "AGAMA",
          label: item.label,
        },
      },
      update: { kode: item.kode, urutan: item.urutan, aktif: true },
      create: {
        kategori: "AGAMA",
        label: item.label,
        kode: item.kode,
        urutan: item.urutan,
        aktif: true,
      },
    });
  }

  // 3. JENIS_KELAMIN
  const jenisKelaminData = [
    { label: "Laki-laki", kode: "L", urutan: 1 },
    { label: "Perempuan", kode: "P", urutan: 2 },
  ];

  for (const item of jenisKelaminData) {
    await prisma.masterData.upsert({
      where: {
        kategori_label: {
          kategori: "JENIS_KELAMIN",
          label: item.label,
        },
      },
      update: { kode: item.kode, urutan: item.urutan, aktif: true },
      create: {
        kategori: "JENIS_KELAMIN",
        label: item.label,
        kode: item.kode,
        urutan: item.urutan,
        aktif: true,
      },
    });
  }

  // 4. STATUS_PERKAWINAN
  const perkawinanData = [
    { label: "Belum Menikah", kode: "BK", urutan: 1 },
    { label: "Menikah", kode: "K", urutan: 2 },
    { label: "Cerai Hidup", kode: "CH", urutan: 3 },
    { label: "Cerai Mati", kode: "CM", urutan: 4 },
  ];

  for (const item of perkawinanData) {
    await prisma.masterData.upsert({
      where: {
        kategori_label: {
          kategori: "STATUS_PERKAWINAN",
          label: item.label,
        },
      },
      update: { kode: item.kode, urutan: item.urutan, aktif: true },
      create: {
        kategori: "STATUS_PERKAWINAN",
        label: item.label,
        kode: item.kode,
        urutan: item.urutan,
        aktif: true,
      },
    });
  }

  // 5. STATUS_PEGAWAI
  const statusPegawaiData = [
    { label: "PNS (Pegawai Negeri Sipil)", kode: "PNS", urutan: 1 },
    { label: "PPPK (Pegawai Pemerintah dengan Perjanjian Kerja)", kode: "PPPK", urutan: 2 },
    { label: "Honorer / PPNPN", kode: "PPNPN", urutan: 3 },
    { label: "Magang / PKL", kode: "MGN", urutan: 4 },
  ];

  for (const item of statusPegawaiData) {
    await prisma.masterData.upsert({
      where: {
        kategori_label: {
          kategori: "STATUS_PEGAWAI",
          label: item.label,
        },
      },
      update: { kode: item.kode, urutan: item.urutan, aktif: true },
      create: {
        kategori: "STATUS_PEGAWAI",
        label: item.label,
        kode: item.kode,
        urutan: item.urutan,
        aktif: true,
      },
    });
  }

  // 6. PENDIDIKAN
  const pendidikanData = [
    { label: "SMA / SMK Sederajat", kode: "SLTA", urutan: 1 },
    { label: "Diploma I / II (D1/D2)", kode: "D1-D2", urutan: 2 },
    { label: "Diploma III (D3)", kode: "D3", urutan: 3 },
    { label: "Diploma IV / Sarjana (D4/S1)", kode: "S1", urutan: 4 },
    { label: "Magister (S2)", kode: "S2", urutan: 5 },
    { label: "Doktoral (S3)", kode: "S3", urutan: 6 },
  ];

  for (const item of pendidikanData) {
    await prisma.masterData.upsert({
      where: {
        kategori_label: {
          kategori: "PENDIDIKAN",
          label: item.label,
        },
      },
      update: { kode: item.kode, urutan: item.urutan, aktif: true },
      create: {
        kategori: "PENDIDIKAN",
        label: item.label,
        kode: item.kode,
        urutan: item.urutan,
        aktif: true,
      },
    });
  }

  // 7. UNIT_KERJA (Penempatan BPVP)
  const unitKerjaData = [
    { label: "Pimpinan Balai (Kepala BPVP)", kode: "PIMPINAN", urutan: 1 },
    { label: "Subbagian Tata Usaha", kode: "TU", urutan: 2 },
    { label: "Seksi Penyelenggaraan Pelatihan Vokasi", kode: "PELATIHAN", urutan: 3 },
    { label: "Seksi Program dan Evaluasi", kode: "PROG-EVAL", urutan: 4 },
    { label: "Kejuruan Teknologi Informasi & Komunikasi", kode: "TIK", urutan: 5 },
    { label: "Kejuruan Otomotif & Mekatronika", kode: "OTO", urutan: 6 },
    { label: "Kejuruan Teknik Las & Manufaktur", kode: "LAS", urutan: 7 },
    { label: "Kejuruan Pariwisata & Perhotelan", kode: "PAR", urutan: 8 },
    { label: "Kejuruan Tata Busana & Industri Kreatif", kode: "BUSANA", urutan: 9 },
    { label: "Kejuruan Pertanian & Pengolahan Hasil", kode: "TANI", urutan: 10 },
  ];

  for (const item of unitKerjaData) {
    await prisma.masterData.upsert({
      where: {
        kategori_label: {
          kategori: "UNIT_KERJA",
          label: item.label,
        },
      },
      update: { kode: item.kode, urutan: item.urutan, aktif: true },
      create: {
        kategori: "UNIT_KERJA",
        label: item.label,
        kode: item.kode,
        urutan: item.urutan,
        aktif: true,
      },
    });
  }

  // 8. JABATAN
  const jabatanData = [
    { label: "Kepala Balai", kode: "KB", urutan: 1 },
    { label: "Kepala Subbagian Tata Usaha", kode: "KASUBAG-TU", urutan: 2 },
    { label: "Subkoordinator Seksi Penyelenggaraan Pelatihan", kode: "SUBKOOR-LAT", urutan: 3 },
    { label: "Subkoordinator Seksi Program & Evaluasi", kode: "SUBKOOR-EVAL", urutan: 4 },
    { label: "Instruktur Ahli Madya", kode: "INST-MDY", urutan: 5 },
    { label: "Instruktur Ahli Muda", kode: "INST-MDA", urutan: 6 },
    { label: "Instruktur Ahli Pertama", kode: "INST-PRT", urutan: 7 },
    { label: "Instruktur Terampil / Pelaksana", kode: "INST-TRM", urutan: 8 },
    { label: "Pengelola Kepegawaian", kode: "PG-PEG", urutan: 9 },
    { label: "Pengelola Keuangan & BMN", kode: "PG-KEU", urutan: 10 },
    { label: "Arsiparis Ahli Pertama", kode: "ARS-PRT", urutan: 11 },
    { label: "Pranata Komputer Ahli Pertama", kode: "PRAKOM", urutan: 12 },
    { label: "Pengadministrasi Perkantoran", kode: "ADM-KTR", urutan: 13 },
    { label: "Teknisi Sarana dan Prasarana", kode: "TEKNISI", urutan: 14 },
    { label: "Petugas Layanan Operasional", kode: "OPS", urutan: 15 },
  ];

  for (const item of jabatanData) {
    await prisma.masterData.upsert({
      where: {
        kategori_label: {
          kategori: "JABATAN",
          label: item.label,
        },
      },
      update: { kode: item.kode, urutan: item.urutan, aktif: true },
      create: {
        kategori: "JABATAN",
        label: item.label,
        kode: item.kode,
        urutan: item.urutan,
        aktif: true,
      },
    });
  }

  // 9. DEFAULT USERS (Admin & Operator)
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@bpvp.local";
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedAdminPassword,
      role: "admin",
      aktif: true,
    },
    create: {
      nama: "Administrator BPVP",
      email: adminEmail,
      password: hashedAdminPassword,
      role: "admin",
      aktif: true,
    },
  });

  const operatorPassword = "operator123";
  const hashedOperatorPassword = await bcrypt.hash(operatorPassword, 10);

  const operatorUser = await prisma.user.upsert({
    where: { email: "operator@bpvp.local" },
    update: {
      password: hashedOperatorPassword,
      role: "operator",
      aktif: true,
    },
    create: {
      nama: "Operator Kepegawaian",
      email: "operator@bpvp.local",
      password: hashedOperatorPassword,
      role: "operator",
      aktif: true,
    },
  });

  console.log(`Seeding selesai!`);
  console.log(`- Admin: ${adminUser.email} (Password: ${adminPassword})`);
  console.log(`- Operator: ${operatorUser.email} (Password: ${operatorPassword})`);
}

main()
  .catch((e) => {
    console.error("Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

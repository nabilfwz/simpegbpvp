import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertMaster(
  kategori: string,
  label: string,
  kode?: string | null,
  urutan: number = 0,
  parentId?: string | null
) {
  const existing = await prisma.masterData.findFirst({
    where: {
      kategori,
      label,
      parentId: parentId || null,
    },
  });

  if (existing) {
    return prisma.masterData.update({
      where: { id: existing.id },
      data: {
        kode: kode || null,
        urutan,
        aktif: true,
        parentId: parentId || null,
      },
    });
  } else {
    return prisma.masterData.create({
      data: {
        kategori,
        label,
        kode: kode || null,
        urutan,
        aktif: true,
        parentId: parentId || null,
      },
    });
  }
}

async function main() {
  console.log("Seeding Master Data BPVP Banda Aceh, Wilayah Aceh & Sumut sampai tingkat Desa...");

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
    await upsertMaster("PANGKAT_GOLONGAN", item.label, item.kode, item.urutan);
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
    await upsertMaster("AGAMA", item.label, item.kode, item.urutan);
  }

  // 3. JENIS_KELAMIN
  const jenisKelaminData = [
    { label: "Laki-laki", kode: "L", urutan: 1 },
    { label: "Perempuan", kode: "P", urutan: 2 },
  ];

  for (const item of jenisKelaminData) {
    await upsertMaster("JENIS_KELAMIN", item.label, item.kode, item.urutan);
  }

  // 4. STATUS_PERKAWINAN
  const perkawinanData = [
    { label: "Belum Menikah", kode: "BK", urutan: 1 },
    { label: "Menikah", kode: "K", urutan: 2 },
    { label: "Cerai Hidup", kode: "CH", urutan: 3 },
    { label: "Cerai Mati", kode: "CM", urutan: 4 },
  ];

  for (const item of perkawinanData) {
    await upsertMaster("STATUS_PERKAWINAN", item.label, item.kode, item.urutan);
  }

  // 5. STATUS_PEGAWAI (PNS & Non-PNS Lengkap)
  const statusPegawaiData = [
    { label: "PNS (Pegawai Negeri Sipil)", kode: "PNS", urutan: 1 },
    { label: "PPPK (Pegawai Pemerintah dengan Perjanjian Kerja)", kode: "PPPK", urutan: 2 },
    { label: "PPNPN (Pegawai Pemerintah Non Pegawai Negeri)", kode: "PPNPN", urutan: 3 },
    { label: "Tenaga Honorer / Kontrak", kode: "HONORER", urutan: 4 },
    { label: "Instruktur Non-ASN (Pelatih Kontrak)", kode: "INST-NONASN", urutan: 5 },
    { label: "Tenaga Alih Daya (Outsourcing)", kode: "OUTSOURCE", urutan: 6 },
    { label: "Tenaga Ahli / Konsultan Vokasi", kode: "AHLI", urutan: 7 },
  ];

  for (const item of statusPegawaiData) {
    await upsertMaster("STATUS_PEGAWAI", item.label, item.kode, item.urutan);
  }

  // 6. PENDIDIKAN
  const pendidikanData = [
    { label: "SD / Sederajat", kode: "SD", urutan: 1 },
    { label: "SMP / MTs Sederajat", kode: "SMP", urutan: 2 },
    { label: "SMA / SMK / MA Sederajat", kode: "SLTA", urutan: 3 },
    { label: "Diploma I / II (D1/D2)", kode: "D1-D2", urutan: 4 },
    { label: "Diploma III (D3)", kode: "D3", urutan: 5 },
    { label: "Diploma IV / Sarjana (D4/S1)", kode: "S1", urutan: 6 },
    { label: "Magister (S2)", kode: "S2", urutan: 7 },
    { label: "Doktoral (S3)", kode: "S3", urutan: 8 },
  ];

  for (const item of pendidikanData) {
    await upsertMaster("PENDIDIKAN", item.label, item.kode, item.urutan);
  }

  // 7. DIRJEN (Kementerian Ketenagakerjaan RI)
  console.log("Seeding Direktorat Jenderal (Dirjen) Kemnaker...");
  const dirjenData = [
    { label: "Ditjen Pembinaan Pelatihan Vokasi dan Produktivitas (Binalavotas)", kode: "DITJEN-BINALAVOTAS", urutan: 1 },
    { label: "Sekretariat Jenderal Kemnaker", kode: "SETJEN", urutan: 2 },
    { label: "Ditjen Pembinaan Penempatan Tenaga Kerja dan Perluasan Kesempatan Kerja (Binapenta & PKK)", kode: "DITJEN-BINAPENTA", urutan: 3 },
    { label: "Ditjen Pembinaan Pengawasan Ketenagakerjaan dan K3 (Binwasnaker & K3)", kode: "DITJEN-BINWASK3", urutan: 4 },
    { label: "Ditjen Pembinaan Hubungan Industrial dan Jaminan Sosial Tenaga Kerja (PHI & Jamsos)", kode: "DITJEN-PHI", urutan: 5 },
    { label: "Badan Perencanaan dan Pengembangan Ketenagakerjaan (Barenbang)", kode: "BARENBANG", urutan: 6 },
    { label: "Inspektorat Jenderal (Itjen)", kode: "ITJEN", urutan: 7 },
  ];

  const mapDirjen: Record<string, any> = {};
  for (const d of dirjenData) {
    mapDirjen[d.kode] = await upsertMaster("DIRJEN", d.label, d.kode, d.urutan);
  }

  // 8. UNIT_KERJA (Balai / Direktorat di bawah Dirjen Binalavotas & Setjen)
  console.log("Seeding Unit Kerja Pelaksana...");
  const binalavotasId = mapDirjen["DITJEN-BINALAVOTAS"]?.id;
  const setjenId = mapDirjen["SETJEN"]?.id;

  const unitKerjaData = [
    { label: "Balai Pelatihan Vokasi dan Produktivitas (BPVP) Banda Aceh", kode: "BPVP-BNA", urutan: 1, parentId: binalavotasId },
    { label: "Balai Besar Pelatihan Vokasi dan Produktivitas (BBPVP) Medan", kode: "BBPVP-MDN", urutan: 2, parentId: binalavotasId },
    { label: "Balai Besar Pelatihan Vokasi dan Produktivitas (BBPVP) Serang", kode: "BBPVP-SRG", urutan: 3, parentId: binalavotasId },
    { label: "Balai Besar Pelatihan Vokasi dan Produktivitas (BBPVP) Bekasi", kode: "BBPVP-BKS", urutan: 4, parentId: binalavotasId },
    { label: "Balai Besar Pelatihan Vokasi dan Produktivitas (BBPVP) Bandung", kode: "BBPVP-BDG", urutan: 5, parentId: binalavotasId },
    { label: "Balai Besar Pelatihan Vokasi dan Produktivitas (BBPVP) Semarang", kode: "BBPVP-SMG", urutan: 6, parentId: binalavotasId },
    { label: "Direktorat Bina Kelembagaan Pelatihan Vokasi", kode: "DIT-LEMBAGA", urutan: 7, parentId: binalavotasId },
    { label: "Direktorat Bina Standardisasi Kompetensi dan Program Pelatihan", kode: "DIT-STAN", urutan: 8, parentId: binalavotasId },
    { label: "Direktorat Bina Instruktur dan Tenaga Pelatihan", kode: "DIT-INTEN", urutan: 9, parentId: binalavotasId },
    { label: "Sekretariat Ditjen Binalavotas", kode: "SET-DITJEN", urutan: 10, parentId: binalavotasId },
    { label: "Biro Umum dan Pengadaan Barang/Jasa", kode: "BIRO-UMUM", urutan: 11, parentId: setjenId },
    { label: "Biro Organisasi dan SDM Aparatur", kode: "BIRO-OSDM", urutan: 12, parentId: setjenId },
    { label: "Biro Keuangan", kode: "BIRO-KEU", urutan: 13, parentId: setjenId },
    // Backwards-compatible entries
    { label: "Pimpinan Balai (Kepala BPVP)", kode: "PIMPINAN", urutan: 14, parentId: binalavotasId },
    { label: "Subbagian Tata Usaha", kode: "TU", urutan: 15, parentId: binalavotasId },
    { label: "Subbagian Umum", kode: "SUBBAG-UMUM", urutan: 16, parentId: binalavotasId },
    { label: "Seksi Penyelenggaraan Pelatihan Vokasi", kode: "PELATIHAN", urutan: 17, parentId: binalavotasId },
    { label: "Seksi Program dan Evaluasi Pelatihan Vokasi", kode: "PROG-EVAL", urutan: 18, parentId: binalavotasId },
  ];

  let bpvpBandaAcehRecord: any = null;
  for (const item of unitKerjaData) {
    const res = await upsertMaster("UNIT_KERJA", item.label, item.kode, item.urutan, item.parentId);
    if (item.kode === "BPVP-BNA") bpvpBandaAcehRecord = res;
  }

  // 9. SUB_UNIT_KERJA (Di bawah BPVP Banda Aceh)
  console.log("Seeding Sub Unit Kerja BPVP Banda Aceh...");
  const bpvpId = bpvpBandaAcehRecord?.id;
  const subUnitKerjaData = [
    { label: "Pimpinan Balai (Kepala BPVP Banda Aceh)", kode: "SUB-PIMPINAN", urutan: 1 },
    { label: "Subbagian Umum (Tata Usaha, Kepegawaian, Keuangan, BMN & Rumah Tangga)", kode: "SUB-UMUM", urutan: 2 },
    { label: "Seksi Penyelenggaraan Pelatihan Vokasi", kode: "SUB-LAT", urutan: 3 },
    { label: "Seksi Program dan Evaluasi Pelatihan Vokasi", kode: "SUB-EVAL", urutan: 4 },
    { label: "Subkoordinator Pemberdayaan dan Kemitraan Vokasi", kode: "SUB-MITRA", urutan: 5 },
    { label: "Lembaga Sertifikasi Profesi (LSP-P1 BPVP Banda Aceh)", kode: "SUB-LSP", urutan: 6 },
    { label: "Kios Siap Kerja / Talent Center BPVP Banda Aceh", kode: "SUB-KIOS", urutan: 7 },
    { label: "Kejuruan Teknologi Informasi & Komunikasi (TIK)", kode: "SUB-KJ-TIK", urutan: 8 },
    { label: "Kejuruan Otomotif (Roda Dua & Roda Empat)", kode: "SUB-KJ-OTO", urutan: 9 },
    { label: "Kejuruan Teknik Las & Pabrikasi (Welding)", kode: "SUB-KJ-LAS", urutan: 10 },
    { label: "Kejuruan Teknik Listrik & Instrumentasi", kode: "SUB-KJ-LISTRIK", urutan: 11 },
    { label: "Kejuruan Teknik Elektronika", kode: "SUB-KJ-ELEK", urutan: 12 },
    { label: "Kejuruan Refrigerasi & Tata Udara (AC)", kode: "SUB-KJ-AC", urutan: 13 },
    { label: "Kejuruan Pariwisata & Perhotelan", kode: "SUB-KJ-PAR", urutan: 14 },
    { label: "Kejuruan Tata Busana & Desain Mode", kode: "SUB-KJ-BUSANA", urutan: 15 },
    { label: "Kejuruan Pengolahan Hasil Pertanian & Barista", kode: "SUB-KJ-PERTANIAN", urutan: 16 },
    { label: "Kejuruan Bangunan & Konstruksi Sipil", kode: "SUB-KJ-BANGUNAN", urutan: 17 },
    { label: "Kejuruan Bisnis & Manajemen", kode: "SUB-KJ-BISNIS", urutan: 18 },
  ];

  for (const item of subUnitKerjaData) {
    await upsertMaster("SUB_UNIT_KERJA", item.label, item.kode, item.urutan, bpvpId);
  }

  // 10. ESELON (Tingkat Jabatan Struktural, Fungsional & Pelaksana)
  console.log("Seeding Klasifikasi Eselon...");
  const eselonData = [
    { label: "Eselon I.a (Direktur Jenderal / Sekretaris Jenderal)", kode: "I.a", urutan: 1 },
    { label: "Eselon I.b (Staf Ahli Menteri)", kode: "I.b", urutan: 2 },
    { label: "Eselon II.a (Direktur / Kepala Biro / Sekretaris Ditjen)", kode: "II.a", urutan: 3 },
    { label: "Eselon II.b (Kepala Balai Besar Pelatihan)", kode: "II.b", urutan: 4 },
    { label: "Eselon III.a (Kepala Balai BPVP Banda Aceh)", kode: "III.a", urutan: 5 },
    { label: "Eselon III.b (Kepala Bagian Tata Usaha)", kode: "III.b", urutan: 6 },
    { label: "Eselon IV.a (Kasubbag Umum / Kepala Seksi)", kode: "IV.a", urutan: 7 },
    { label: "Eselon IV.b (Kepala Subseksi)", kode: "IV.b", urutan: 8 },
    { label: "Non-Eselon / JF Ahli Utama", kode: "JF-UTM", urutan: 9 },
    { label: "Non-Eselon / JF Ahli Madya", kode: "JF-MDY", urutan: 10 },
    { label: "Non-Eselon / JF Ahli Muda", kode: "JF-MDA", urutan: 11 },
    { label: "Non-Eselon / JF Ahli Pertama", kode: "JF-PRT", urutan: 12 },
    { label: "Non-Eselon / JF Keterampilan (Penyelia, Mahir, Terampil, Pemula)", kode: "JF-TRM", urutan: 13 },
    { label: "Pelaksana / Pengadministrasi Perkantoran", kode: "PELAKSANA", urutan: 14 },
    { label: "Tenaga Non-ASN / PPNPN / Pegawai Kontrak", kode: "NON-ASN", urutan: 15 },
  ];

  for (const item of eselonData) {
    await upsertMaster("ESELON", item.label, item.kode, item.urutan);
  }

  // 8. JABATAN (PNS, PPPK, & Non-PNS Lengkap)
  const jabatanData = [
    { label: "Kepala Balai", kode: "KB", urutan: 1 },
    { label: "Kepala Subbagian Tata Usaha", kode: "KASUBAG-TU", urutan: 2 },
    { label: "Subkoordinator Penyelenggaraan Pelatihan Vokasi", kode: "SUBKOOR-LAT", urutan: 3 },
    { label: "Subkoordinator Program dan Evaluasi", kode: "SUBKOOR-EVAL", urutan: 4 },
    { label: "Subkoordinator Pemberdayaan dan Kemitraan", kode: "SUBKOOR-MITRA", urutan: 5 },
    { label: "Instruktur Ahli Utama", kode: "INST-UTM", urutan: 6 },
    { label: "Instruktur Ahli Madya", kode: "INST-MDY", urutan: 7 },
    { label: "Instruktur Ahli Muda", kode: "INST-MDA", urutan: 8 },
    { label: "Instruktur Ahli Pertama", kode: "INST-PRT", urutan: 9 },
    { label: "Instruktur Terampil / Pelaksana", kode: "INST-TRM", urutan: 10 },
    { label: "Instruktur Pemula", kode: "INST-PML", urutan: 11 },
    { label: "Pengantar Kerja Ahli Pertama", kode: "PK-PRT", urutan: 12 },
    { label: "Pranata Komputer Ahli Pertama", kode: "PRAKOM", urutan: 13 },
    { label: "Arsiparis Ahli Pertama", kode: "ARS-PRT", urutan: 14 },
    { label: "Pranata SDM Aparatur / Pengelola Kepegawaian", kode: "SDM-APA", urutan: 15 },
    { label: "Pengelola Keuangan & APBN", kode: "PG-KEU", urutan: 16 },
    { label: "Pengelola Pengadaan Barang dan Jasa", kode: "PG-PBJ", urutan: 17 },
    { label: "Instruktur Non-ASN (Pelatih Kejuruan Kontrak)", kode: "INST-NONASN", urutan: 18 },
    { label: "Asisten Instruktur / Teknisi Bengkel & Lab", kode: "TEK-BENGKEL", urutan: 19 },
    { label: "Pengadministrasi Perkantoran & Tata Usaha", kode: "ADM-TU", urutan: 20 },
    { label: "Petugas Front Office & Layanan Siap Kerja", kode: "FO-SIAPKERJA", urutan: 21 },
    { label: "Pengelola Sistem Informasi & IT Support", kode: "IT-SUPPORT", urutan: 22 },
    { label: "Petugas Sarana, Prasarana & Gudang", kode: "GUDANG-SARPRAS", urutan: 23 },
    { label: "Petugas Keamanan (Satpam / Security)", kode: "SECURITY", urutan: 24 },
    { label: "Pengemudi Operasional (Driver)", kode: "DRIVER", urutan: 25 },
    { label: "Pramubakti & Petugas Kebersihan", kode: "PRAMUBAKTI", urutan: 26 },
    { label: "Petugas Asrama & Fasilitas Pelatihan", kode: "ASRAMA", urutan: 27 },
  ];

  for (const item of jabatanData) {
    await upsertMaster("JABATAN", item.label, item.kode, item.urutan);
  }

  // 9. PROVINSI (Aceh, Sumut, dan Provinsi Utama Lainnya)
  console.log("Seeding Provinsi...");
  const provinsiAceh = await upsertMaster("PROVINSI", "Aceh", "11", 1);
  const provinsiSumut = await upsertMaster("PROVINSI", "Sumatera Utara", "12", 2);
  const provinsiSumbar = await upsertMaster("PROVINSI", "Sumatera Barat", "13", 3);
  const provinsiRiau = await upsertMaster("PROVINSI", "Riau", "14", 4);
  const provinsiJambi = await upsertMaster("PROVINSI", "Jambi", "15", 5);
  const provinsiSumsel = await upsertMaster("PROVINSI", "Sumatera Selatan", "16", 6);
  const provinsiBengkulu = await upsertMaster("PROVINSI", "Bengkulu", "17", 7);
  const provinsiLampung = await upsertMaster("PROVINSI", "Lampung", "18", 8);
  const provinsiBabel = await upsertMaster("PROVINSI", "Kepulauan Bangka Belitung", "19", 9);
  const provinsiKepri = await upsertMaster("PROVINSI", "Kepulauan Riau", "21", 10);
  const provinsiDKI = await upsertMaster("PROVINSI", "DKI Jakarta", "31", 11);
  const provinsiJabar = await upsertMaster("PROVINSI", "Jawa Barat", "32", 12);
  const provinsiJateng = await upsertMaster("PROVINSI", "Jawa Tengah", "33", 13);
  const provinsiDIY = await upsertMaster("PROVINSI", "DI Yogyakarta", "34", 14);
  const provinsiJatim = await upsertMaster("PROVINSI", "Jawa Timur", "35", 15);
  const provinsiBanten = await upsertMaster("PROVINSI", "Banten", "36", 16);

  // 10. KABUPATEN / KOTA di Provinsi Aceh (23 Lengkap)
  console.log("Seeding 23 Kabupaten/Kota di Aceh...");
  const kabKotaAceh = [
    { label: "Kota Banda Aceh", kode: "11.71", urutan: 1 },
    { label: "Kabupaten Aceh Besar", kode: "11.06", urutan: 2 },
    { label: "Kota Sabang", kode: "11.72", urutan: 3 },
    { label: "Kota Lhokseumawe", kode: "11.73", urutan: 4 },
    { label: "Kota Langsa", kode: "11.74", urutan: 5 },
    { label: "Kota Subulussalam", kode: "11.75", urutan: 6 },
    { label: "Kabupaten Pidie", kode: "11.07", urutan: 7 },
    { label: "Kabupaten Pidie Jaya", kode: "11.16", urutan: 8 },
    { label: "Kabupaten Bireuen", kode: "11.08", urutan: 9 },
    { label: "Kabupaten Aceh Utara", kode: "11.09", urutan: 10 },
    { label: "Kabupaten Aceh Timur", kode: "11.05", urutan: 11 },
    { label: "Kabupaten Aceh Tamiang", kode: "11.12", urutan: 12 },
    { label: "Kabupaten Bener Meriah", kode: "11.15", urutan: 13 },
    { label: "Kabupaten Aceh Tengah", kode: "11.18", urutan: 14 },
    { label: "Kabupaten Gayo Lues", kode: "11.11", urutan: 15 },
    { label: "Kabupaten Aceh Tenggara", kode: "11.04", urutan: 16 },
    { label: "Kabupaten Aceh Barat", kode: "11.17", urutan: 17 },
    { label: "Kabupaten Aceh Jaya", kode: "11.14", urutan: 18 },
    { label: "Kabupaten Nagan Raya", kode: "11.13", urutan: 19 },
    { label: "Kabupaten Aceh Barat Daya", kode: "11.10", urutan: 20 },
    { label: "Kabupaten Aceh Selatan", kode: "11.03", urutan: 21 },
    { label: "Kabupaten Aceh Singkil", kode: "11.02", urutan: 22 },
    { label: "Kabupaten Simeulue", kode: "11.01", urutan: 23 },
  ];

  const mapKabKota: Record<string, any> = {};
  for (const kab of kabKotaAceh) {
    const record = await upsertMaster(
      "KABUPATEN_KOTA",
      kab.label,
      kab.kode,
      kab.urutan,
      provinsiAceh.id
    );
    mapKabKota[kab.label] = record;
  }

  // 11. KABUPATEN / KOTA di Provinsi Sumatera Utara (33 Lengkap)
  console.log("Seeding 33 Kabupaten/Kota di Sumatera Utara...");
  const kabKotaSumut = [
    // 8 Kota di Sumut
    { label: "Kota Medan", kode: "12.71", urutan: 1 },
    { label: "Kota Pematangsiantar", kode: "12.72", urutan: 2 },
    { label: "Kota Sibolga", kode: "12.73", urutan: 3 },
    { label: "Kota Tanjungbalai", kode: "12.74", urutan: 4 },
    { label: "Kota Binjai", kode: "12.75", urutan: 5 },
    { label: "Kota Tebing Tinggi", kode: "12.76", urutan: 6 },
    { label: "Kota Padangsidimpuan", kode: "12.77", urutan: 7 },
    { label: "Kota Gunungsitoli", kode: "12.78", urutan: 8 },
    // 25 Kabupaten di Sumut
    { label: "Kabupaten Deli Serdang", kode: "12.07", urutan: 9 },
    { label: "Kabupaten Langkat", kode: "12.05", urutan: 10 },
    { label: "Kabupaten Karo", kode: "12.06", urutan: 11 },
    { label: "Kabupaten Simalungun", kode: "12.08", urutan: 12 },
    { label: "Kabupaten Asahan", kode: "12.09", urutan: 13 },
    { label: "Kabupaten Batubara", kode: "12.19", urutan: 14 },
    { label: "Kabupaten Dairi", kode: "12.11", urutan: 15 },
    { label: "Kabupaten Humbang Hasundutan", kode: "12.16", urutan: 16 },
    { label: "Kabupaten Labuhanbatu", kode: "12.10", urutan: 17 },
    { label: "Kabupaten Labuhanbatu Selatan", kode: "12.22", urutan: 18 },
    { label: "Kabupaten Labuhanbatu Utara", kode: "12.23", urutan: 19 },
    { label: "Kabupaten Mandailing Natal", kode: "12.13", urutan: 20 },
    { label: "Kabupaten Nias", kode: "12.04", urutan: 21 },
    { label: "Kabupaten Nias Barat", kode: "12.25", urutan: 22 },
    { label: "Kabupaten Nias Selatan", kode: "12.14", urutan: 23 },
    { label: "Kabupaten Nias Utara", kode: "12.24", urutan: 24 },
    { label: "Kabupaten Padang Lawas", kode: "12.21", urutan: 25 },
    { label: "Kabupaten Padang Lawas Utara", kode: "12.20", urutan: 26 },
    { label: "Kabupaten Pakpak Bharat", kode: "12.15", urutan: 27 },
    { label: "Kabupaten Samosir", kode: "12.17", urutan: 28 },
    { label: "Kabupaten Serdang Bedagai", kode: "12.18", urutan: 29 },
    { label: "Kabupaten Tapanuli Selatan", kode: "12.03", urutan: 30 },
    { label: "Kabupaten Tapanuli Tengah", kode: "12.01", urutan: 31 },
    { label: "Kabupaten Tapanuli Utara", kode: "12.02", urutan: 32 },
    { label: "Kabupaten Toba", kode: "12.12", urutan: 33 },
  ];

  for (const kab of kabKotaSumut) {
    const record = await upsertMaster(
      "KABUPATEN_KOTA",
      kab.label,
      kab.kode,
      kab.urutan,
      provinsiSumut.id
    );
    mapKabKota[kab.label] = record;
  }

  // Tambahkan juga contoh Kab/Kota DKI Jakarta
  await upsertMaster("KABUPATEN_KOTA", "Kota Jakarta Pusat", "31.71", 1, provinsiDKI.id);
  await upsertMaster("KABUPATEN_KOTA", "Kota Jakarta Selatan", "31.74", 2, provinsiDKI.id);

  // 12. KECAMATAN di Kota Banda Aceh (9 Kecamatan Lengkap)
  console.log("Seeding 9 Kecamatan di Kota Banda Aceh...");
  const bandaAceh = mapKabKota["Kota Banda Aceh"];
  const mapKecBandaAceh: Record<string, any> = {};

  if (bandaAceh) {
    const kecBandaAceh = [
      { label: "Kecamatan Baiturrahman", kode: "11.71.01", urutan: 1 },
      { label: "Kecamatan Kuta Alam", kode: "11.71.02", urutan: 2 },
      { label: "Kecamatan Meuraxa", kode: "11.71.03", urutan: 3 },
      { label: "Kecamatan Syiah Kuala", kode: "11.71.04", urutan: 4 },
      { label: "Kecamatan Lueng Bata", kode: "11.71.05", urutan: 5 },
      { label: "Kecamatan Kuta Raja", kode: "11.71.06", urutan: 6 },
      { label: "Kecamatan Banda Raya", kode: "11.71.07", urutan: 7 },
      { label: "Kecamatan Jaya Baru", kode: "11.71.08", urutan: 8 },
      { label: "Kecamatan Ulee Kareng", kode: "11.71.09", urutan: 9 },
    ];

    for (const kec of kecBandaAceh) {
      const r = await upsertMaster("KECAMATAN", kec.label, kec.kode, kec.urutan, bandaAceh.id);
      mapKecBandaAceh[kec.label] = r;
    }
  }

  // 13. KECAMATAN di Kota Medan (21 Kecamatan Lengkap)
  console.log("Seeding 21 Kecamatan di Kota Medan...");
  const kotaMedan = mapKabKota["Kota Medan"];
  const mapKecMedan: Record<string, any> = {};

  if (kotaMedan) {
    const kecMedan = [
      { label: "Kecamatan Medan Kota", kode: "12.71.01", urutan: 1 },
      { label: "Kecamatan Medan Amplas", kode: "12.71.02", urutan: 2 },
      { label: "Kecamatan Medan Area", kode: "12.71.03", urutan: 3 },
      { label: "Kecamatan Medan Barat", kode: "12.71.04", urutan: 4 },
      { label: "Kecamatan Medan Baru", kode: "12.71.05", urutan: 5 },
      { label: "Kecamatan Medan Belawan", kode: "12.71.06", urutan: 6 },
      { label: "Kecamatan Medan Deli", kode: "12.71.07", urutan: 7 },
      { label: "Kecamatan Medan Denai", kode: "12.71.08", urutan: 8 },
      { label: "Kecamatan Medan Helvetia", kode: "12.71.09", urutan: 9 },
      { label: "Kecamatan Medan Johor", kode: "12.71.10", urutan: 10 },
      { label: "Kecamatan Medan Labuhan", kode: "12.71.11", urutan: 11 },
      { label: "Kecamatan Medan Maimun", kode: "12.71.12", urutan: 12 },
      { label: "Kecamatan Medan Marelan", kode: "12.71.13", urutan: 13 },
      { label: "Kecamatan Medan Perjuangan", kode: "12.71.14", urutan: 14 },
      { label: "Kecamatan Medan Petisah", kode: "12.71.15", urutan: 15 },
      { label: "Kecamatan Medan Polonia", kode: "12.71.16", urutan: 16 },
      { label: "Kecamatan Medan Selayang", kode: "12.71.17", urutan: 17 },
      { label: "Kecamatan Medan Sunggal", kode: "12.71.18", urutan: 18 },
      { label: "Kecamatan Medan Tembung", kode: "12.71.19", urutan: 19 },
      { label: "Kecamatan Medan Timur", kode: "12.71.20", urutan: 20 },
      { label: "Kecamatan Medan Tuntungan", kode: "12.71.21", urutan: 21 },
    ];

    for (const kec of kecMedan) {
      const r = await upsertMaster("KECAMATAN", kec.label, kec.kode, kec.urutan, kotaMedan.id);
      mapKecMedan[kec.label] = r;
    }
  }

  // 14. KECAMATAN di Kabupaten Aceh Besar (23 Kecamatan Lengkap)
  console.log("Seeding 23 Kecamatan di Kabupaten Aceh Besar...");
  const acehBesar = mapKabKota["Kabupaten Aceh Besar"];
  const mapKecAcehBesar: Record<string, any> = {};

  if (acehBesar) {
    const kecAcehBesar = [
      { label: "Kecamatan Ingin Jaya", kode: "11.06.10", urutan: 1 },
      { label: "Kecamatan Darul Imarah", kode: "11.06.07", urutan: 2 },
      { label: "Kecamatan Krueng Barona Jaya", kode: "11.06.21", urutan: 3 },
      { label: "Kecamatan Kuta Baro", kode: "11.06.11", urutan: 4 },
      { label: "Kecamatan Blang Bintang", kode: "11.06.23", urutan: 5 },
      { label: "Kecamatan Baitussalam", kode: "11.06.20", urutan: 6 },
      { label: "Kecamatan Darussalam", kode: "11.06.12", urutan: 7 },
      { label: "Kecamatan Peukan Bada", kode: "11.06.08", urutan: 8 },
      { label: "Kecamatan Lhoknga", kode: "11.06.02", urutan: 9 },
      { label: "Kecamatan Leupung", kode: "11.06.22", urutan: 10 },
      { label: "Kecamatan Lhoong", kode: "11.06.01", urutan: 11 },
      { label: "Kecamatan Montasik", kode: "11.06.05", urutan: 12 },
      { label: "Kecamatan Sukamakmur", kode: "11.06.06", urutan: 13 },
      { label: "Kecamatan Indrapuri", kode: "11.06.03", urutan: 14 },
      { label: "Kecamatan Kuta Malaka", kode: "11.06.17", urutan: 15 },
      { label: "Kecamatan Kuta Cot Glie", kode: "11.06.16", urutan: 16 },
      { label: "Kecamatan Seulimeum", kode: "11.06.04", urutan: 17 },
      { label: "Kecamatan Lembah Seulawah", kode: "11.06.14", urutan: 18 },
      { label: "Kecamatan Kota Jantho", kode: "11.06.15", urutan: 19 },
      { label: "Kecamatan Simpang Tiga", kode: "11.06.18", urutan: 20 },
      { label: "Kecamatan Darul Kamal", kode: "11.06.19", urutan: 21 },
      { label: "Kecamatan Mesjid Raya", kode: "11.06.09", urutan: 22 },
      { label: "Kecamatan Pulo Aceh", kode: "11.06.13", urutan: 23 },
    ];

    for (const kec of kecAcehBesar) {
      const r = await upsertMaster("KECAMATAN", kec.label, kec.kode, kec.urutan, acehBesar.id);
      mapKecAcehBesar[kec.label] = r;
    }
  }

  // 15. DESA / GAMPONG di Kota Banda Aceh (90 Gampong Lengkap di 9 Kecamatan)
  console.log("Seeding 90 Gampong di Kota Banda Aceh...");
  const gampongBandaAceh: Record<string, string[]> = {
    "Kecamatan Baiturrahman": [
      "Gampong Ateuk Jawo",
      "Gampong Ateuk Deah Tanoh",
      "Gampong Ateuk Patek",
      "Gampong Ateuk Munjeng",
      "Gampong Neusu Aceh",
      "Gampong Neusu Jaya",
      "Gampong Peuniti",
      "Gampong Kampung Baru",
      "Gampong Sukaramai",
      "Gampong Seutui",
    ],
    "Kecamatan Kuta Alam": [
      "Gampong Peunayong",
      "Gampong Laksana",
      "Gampong Keuda Aceh",
      "Gampong Beurawe",
      "Gampong Kuta Alam",
      "Gampong Bandar Baru",
      "Gampong Mulia",
      "Gampong Lampulo",
      "Gampong Lamdingin",
      "Gampong Lambaro Skep",
      "Gampong Peurada",
    ],
    "Kecamatan Meuraxa": [
      "Gampong Alue Deah Teungoh",
      "Gampong Asoe Nanggroe",
      "Gampong Blang",
      "Gampong Blang Oi",
      "Gampong Cot Lamkuweue",
      "Gampong Deah Baro",
      "Gampong Deah Glumpang",
      "Gampong Baro",
      "Gampong Pie",
      "Gampong Lampaseh Aceh",
      "Gampong Punge Jurong",
      "Gampong Punge Ulee Lheue",
      "Gampong Surien",
      "Gampong Ulee Lheue",
      "Gampong Lambung",
      "Gampong Pasi Jambo",
    ],
    "Kecamatan Syiah Kuala": [
      "Gampong Alue Naga",
      "Gampong Deah Raya",
      "Gampong Ie Masen Kaye Adang",
      "Gampong Jeulingke",
      "Gampong Kopelma Darussalam",
      "Gampong Lamgugob",
      "Gampong Pineung",
      "Gampong Rukoh",
      "Gampong Tibang",
    ],
    "Kecamatan Lueng Bata": [
      "Gampong Batoh",
      "Gampong Blang Cut",
      "Gampong Cot Mesjid",
      "Gampong Lampaloh",
      "Gampong Lamseupeung",
      "Gampong Lueng Bata",
      "Gampong Panteriek",
      "Gampong Sukadamai",
      "Gampong Lamdom",
    ],
    "Kecamatan Kuta Raja": [
      "Gampong Jawa",
      "Gampong Pande",
      "Gampong Merduati",
      "Gampong Keudah",
      "Gampong Peulanggahan",
      "Gampong Lampaseh Kota",
    ],
    "Kecamatan Banda Raya": [
      "Gampong Geuceu Komplek",
      "Gampong Geuceu Iniem",
      "Gampong Geuceu Kayee Jato",
      "Gampong Lam Ara",
      "Gampong Lamlagang",
      "Gampong Lhong Cut",
      "Gampong Lhong Raya",
      "Gampong Mibo",
      "Gampong Penyeurat",
    ],
    "Kecamatan Jaya Baru": [
      "Gampong Bitai",
      "Gampong Empeerom",
      "Gampong Geuceu Meunara",
      "Gampong Lam Jamee",
      "Gampong Lampoh Daya",
      "Gampong Lamteumen Barat",
      "Gampong Lamteumen Timur",
      "Gampong Punge Blang Cut",
      "Gampong Ulee Pata",
    ],
    "Kecamatan Ulee Kareng": [
      "Gampong Pango Deah",
      "Gampong Pango Raya",
      "Gampong Ilie",
      "Gampong Lamteh",
      "Gampong Lamglumpang",
      "Gampong Ceurih",
      "Gampong Ie Masen Ulee Kareng",
      "Gampong Doy",
      "Gampong Lambhuk",
    ],
  };

  for (const [kecName, gampongList] of Object.entries(gampongBandaAceh)) {
    const kecRecord = mapKecBandaAceh[kecName];
    if (kecRecord) {
      let idx = 1;
      for (const gName of gampongList) {
        await upsertMaster("DESA_KELURAHAN", gName, null, idx++, kecRecord.id);
      }
    }
  }

  // 16. DESA / GAMPONG di Aceh Besar (Wilayah Sekitar Balai: Ingin Jaya, Darul Imarah, Baitussalam)
  console.log("Seeding Gampong di Aceh Besar...");
  const gampongAcehBesar: Record<string, string[]> = {
    "Kecamatan Ingin Jaya": [
      "Gampong Meunasah Manyang",
      "Gampong Lambaro Kaphee",
      "Gampong Lubok Batee",
      "Gampong Ajuen Jeumpet",
      "Gampong Paleuh Blang",
      "Gampong Meunasah Manyet",
      "Gampong Cot Suruy",
      "Gampong Jurong Dagang",
      "Gampong Lam Bheu",
      "Gampong Siron",
      "Gampong Gani",
      "Gampong Meunasah Baro",
      "Gampong Pantee",
    ],
    "Kecamatan Darul Imarah": [
      "Gampong Lampeuneurut Gampong",
      "Gampong Lampeuneurut Ulee Blang",
      "Gampong Tingkeum",
      "Gampong Garot",
      "Gampong Gue Gajah",
      "Gampong Lampasi Engking",
      "Gampong Punie",
      "Gampong Bayu",
      "Gampong Jeumpet Ajuen",
      "Gampong Kuta Karang",
    ],
    "Kecamatan Baitussalam": [
      "Gampong Baet",
      "Gampong Cadek",
      "Gampong Cot Paya",
      "Gampong Kajhu",
      "Gampong Klieng Cot Arun",
      "Gampong Klieng Meuria",
      "Gampong Lampineung",
      "Gampong Miruek Lamreudeup",
    ],
  };

  for (const [kecName, gampongList] of Object.entries(gampongAcehBesar)) {
    const kecRecord = mapKecAcehBesar[kecName];
    if (kecRecord) {
      let idx = 1;
      for (const gName of gampongList) {
        await upsertMaster("DESA_KELURAHAN", gName, null, idx++, kecRecord.id);
      }
    }
  }

  // 17. KELURAHAN di Kota Medan
  console.log("Seeding Kelurahan di Kota Medan...");
  const kelurahanMedan: Record<string, string[]> = {
    "Kecamatan Medan Kota": [
      "Kelurahan Pasar Merah Barat",
      "Kelurahan Teladan Barat",
      "Kelurahan Teladan Timur",
      "Kelurahan Pasar Baru",
      "Kelurahan Mesjid",
      "Kelurahan Pandau Hulu I",
      "Kelurahan Kotamatsum III",
      "Kelurahan Sitirejo II",
    ],
    "Kecamatan Medan Petisah": [
      "Kelurahan Petisah Tengah",
      "Kelurahan Sekip",
      "Kelurahan Sei Putih Barat",
      "Kelurahan Sei Putih Tengah",
      "Kelurahan Sei Putih Timur I",
      "Kelurahan Sei Putih Timur II",
    ],
    "Kecamatan Medan Baru": [
      "Kelurahan Padang Bulan",
      "Kelurahan Babura",
      "Kelurahan Merdeka",
      "Kelurahan Titi Rantai",
      "Kelurahan Darat",
      "Kelurahan Petisah Hulu",
    ],
    "Kecamatan Medan Barat": [
      "Kelurahan Kesawan",
      "Kelurahan Silalas",
      "Kelurahan Glugur Kota",
      "Kelurahan Pulo Brayan Kota",
      "Kelurahan Karang Berombak",
      "Kelurahan Sei Agul",
    ],
    "Kecamatan Medan Helvetia": [
      "Kelurahan Helvetia",
      "Kelurahan Helvetia Tengah",
      "Kelurahan Helvetia Timur",
      "Kelurahan Dwikora",
      "Kelurahan Sei Sikambing C II",
      "Kelurahan Cinta Damai",
      "Kelurahan Tanjung Gusta",
    ],
    "Kecamatan Medan Sunggal": [
      "Kelurahan Sunggal",
      "Kelurahan Babura Sunggal",
      "Kelurahan Lalang",
      "Kelurahan Sei Sikambing B",
      "Kelurahan Simpang Tanjung",
      "Kelurahan Tanjung Rejo",
    ],
  };

  for (const [kecName, kelList] of Object.entries(kelurahanMedan)) {
    const kecRecord = mapKecMedan[kecName];
    if (kecRecord) {
      let idx = 1;
      for (const kelName of kelList) {
        await upsertMaster("DESA_KELURAHAN", kelName, null, idx++, kecRecord.id);
      }
    }
  }

  // 18. DEFAULT USERS (Superadmin & User)
  console.log("Seeding Default Users...");
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@bpvp.local";
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedAdminPassword,
      role: "superadmin",
      aktif: true,
    },
    create: {
      nama: "Administrator BPVP Banda Aceh",
      email: adminEmail,
      password: hashedAdminPassword,
      role: "superadmin",
      aktif: true,
    },
  });

  const userPassword = "user123";
  const hashedUserPassword = await bcrypt.hash(userPassword, 10);

  const operatorUser = await prisma.user.upsert({
    where: { email: "operator@bpvp.local" },
    update: {
      password: hashedUserPassword,
      role: "user",
      aktif: true,
    },
    create: {
      nama: "Operator Kepegawaian BPVP",
      email: "operator@bpvp.local",
      password: hashedUserPassword,
      role: "user",
      aktif: true,
    },
  });

  console.log(`Seeding selesai dengan sukses!`);
  console.log(`- Superadmin: ${adminUser.email} (Password: ${adminPassword})`);
  console.log(`- User: ${operatorUser.email} (Password: ${userPassword})`);
}

main()
  .catch((e) => {
    console.error("Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

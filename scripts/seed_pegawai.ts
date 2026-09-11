import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedPegawai() {
  console.log("=== SEEDING PEGAWAI BPVP BANDA ACEH LENGKAP ===");

  // 1. Fetch reference MasterData IDs
  const dirjen = await prisma.masterData.findFirst({
    where: { kategori: "DIRJEN", label: { contains: "Binalavotas" } },
  });
  const unitKerja = await prisma.masterData.findFirst({
    where: { kategori: "UNIT_KERJA", label: { contains: "Banda Aceh" } },
  });

  // Sub Units
  const subPimpinan = await prisma.masterData.findFirst({ where: { kategori: "SUB_UNIT_KERJA", label: { contains: "Pimpinan" } } });
  const subUmum = await prisma.masterData.findFirst({ where: { kategori: "SUB_UNIT_KERJA", label: { contains: "Subbagian Umum" } } });
  const subPelatihan = await prisma.masterData.findFirst({ where: { kategori: "SUB_UNIT_KERJA", label: { contains: "Penyelenggaraan" } } });
  const subProgram = await prisma.masterData.findFirst({ where: { kategori: "SUB_UNIT_KERJA", label: { contains: "Program" } } });
  const subKios = await prisma.masterData.findFirst({ where: { kategori: "SUB_UNIT_KERJA", label: { contains: "Kios" } } });
  const subTik = await prisma.masterData.findFirst({ where: { kategori: "SUB_UNIT_KERJA", label: { contains: "TIK" } } });
  const subOtomotif = await prisma.masterData.findFirst({ where: { kategori: "SUB_UNIT_KERJA", label: { contains: "Otomotif" } } });
  const subLas = await prisma.masterData.findFirst({ where: { kategori: "SUB_UNIT_KERJA", label: { contains: "Las" } } });
  const subListrik = await prisma.masterData.findFirst({ where: { kategori: "SUB_UNIT_KERJA", label: { contains: "Listrik" } } });

  // Eselon
  const eselon3b = await prisma.masterData.findFirst({ where: { kategori: "ESELON", label: { contains: "Eselon III.b" } } });
  const eselon4a = await prisma.masterData.findFirst({ where: { kategori: "ESELON", label: { contains: "Eselon IV.a" } } });
  const eselon4b = await prisma.masterData.findFirst({ where: { kategori: "ESELON", label: { contains: "Eselon IV.b" } } });
  const jfMadya = await prisma.masterData.findFirst({ where: { kategori: "ESELON", label: { contains: "Instruktur Ahli Madya" } } });
  const jfMuda = await prisma.masterData.findFirst({ where: { kategori: "ESELON", label: { contains: "Instruktur Ahli Muda" } } });
  const jfPertama = await prisma.masterData.findFirst({ where: { kategori: "ESELON", label: { contains: "Instruktur Ahli Pertama" } } });
  const jfTerampil = await prisma.masterData.findFirst({ where: { kategori: "ESELON", label: { contains: "Instruktur Terampil" } } });
  const pelaksana = await prisma.masterData.findFirst({ where: { kategori: "ESELON", label: { contains: "Pelaksana" } } });
  const nonAsn = await prisma.masterData.findFirst({ where: { kategori: "ESELON", label: { contains: "Non-ASN" } } });

  // Status Pegawai
  const pns = (await prisma.masterData.findFirst({ where: { kategori: "STATUS_PEGAWAI", label: { contains: "PNS" } } }))!;
  const pppk = (await prisma.masterData.findFirst({ where: { kategori: "STATUS_PEGAWAI", label: { contains: "PPPK" } } })) || pns;
  const ppnpn = (await prisma.masterData.findFirst({ where: { kategori: "STATUS_PEGAWAI", label: { contains: "PPNPN" } } })) || pns;

  // Demografi
  const jkL = (await prisma.masterData.findFirst({ where: { kategori: "JENIS_KELAMIN", kode: "L" } }))!;
  const jkP = (await prisma.masterData.findFirst({ where: { kategori: "JENIS_KELAMIN", kode: "P" } })) || jkL;
  const islam = (await prisma.masterData.findFirst({ where: { kategori: "AGAMA", label: "Islam" } }))!;
  const menikah = (await prisma.masterData.findFirst({ where: { kategori: "STATUS_PERKAWINAN", label: "Menikah" } }))!;
  const belumMenikah = (await prisma.masterData.findFirst({ where: { kategori: "STATUS_PERKAWINAN", label: { contains: "Belum" } } })) || menikah;

  // Pendidikan
  const s2 = (await prisma.masterData.findFirst({ where: { kategori: "PENDIDIKAN", label: { contains: "S2" } } }))!;
  const s1 = (await prisma.masterData.findFirst({ where: { kategori: "PENDIDIKAN", label: { contains: "S1" } } })) || s2;
  const d3 = (await prisma.masterData.findFirst({ where: { kategori: "PENDIDIKAN", label: { contains: "D3" } } })) || s1;
  const smk = (await prisma.masterData.findFirst({ where: { kategori: "PENDIDIKAN", label: { contains: "SMK" } } })) || s1;

  // Golongan
  const gol4a = await prisma.masterData.findFirst({ where: { kategori: "PANGKAT_GOLONGAN", kode: "IV/a" } });
  const gol3d = await prisma.masterData.findFirst({ where: { kategori: "PANGKAT_GOLONGAN", kode: "III/d" } });
  const gol3c = await prisma.masterData.findFirst({ where: { kategori: "PANGKAT_GOLONGAN", kode: "III/c" } });
  const gol3a = await prisma.masterData.findFirst({ where: { kategori: "PANGKAT_GOLONGAN", kode: "III/a" } });
  const gol2c = await prisma.masterData.findFirst({ where: { kategori: "PANGKAT_GOLONGAN", kode: "II/c" } });

  // Wilayah Aceh
  const provAceh = await prisma.masterData.findFirst({ where: { kategori: "PROVINSI", label: "Aceh" } });
  const kotaBandaAceh = await prisma.masterData.findFirst({ where: { kategori: "KABUPATEN_KOTA", label: { contains: "Banda Aceh" } } });
  const kabAcehBesar = await prisma.masterData.findFirst({ where: { kategori: "KABUPATEN_KOTA", label: { contains: "Aceh Besar" } } });

  const kecSyiahKuala = await prisma.masterData.findFirst({ where: { kategori: "KECAMATAN", label: { contains: "Syiah Kuala" } } });
  const kecBaiturrahman = await prisma.masterData.findFirst({ where: { kategori: "KECAMATAN", label: { contains: "Baiturrahman" } } });
  const kecKutaAlam = await prisma.masterData.findFirst({ where: { kategori: "KECAMATAN", label: { contains: "Kuta Alam" } } });

  const desaJeulingke = await prisma.masterData.findFirst({ where: { kategori: "DESA_KELURAHAN", label: { contains: "Jeulingke" } } });
  const desaLamgugob = await prisma.masterData.findFirst({ where: { kategori: "DESA_KELURAHAN", label: { contains: "Lamgugob" } } });
  const desaPeunayong = await prisma.masterData.findFirst({ where: { kategori: "DESA_KELURAHAN", label: { contains: "Peunayong" } } });

  // Jabatan Master
  const jbtKepala = await prisma.masterData.findFirst({ where: { kategori: "JABATAN", label: { contains: "Kepala Balai" } } });
  const jbtKasubbag = await prisma.masterData.findFirst({ where: { kategori: "JABATAN", label: { contains: "Tata Usaha" } } }) || jbtKepala;
  const jbtInstruktur = await prisma.masterData.findFirst({ where: { kategori: "JABATAN", label: { contains: "Instruktur" } } }) || jbtKepala;
  const jbtPengadministrasi = await prisma.masterData.findFirst({ where: { kategori: "JABATAN", label: { contains: "Pengelola Kepegawaian" } } }) || jbtKepala;

  // Pegawai List to seed
  const pegawaiData = [
    {
      nip: "197808152003121002",
      nama: "Rahmad Hidayat, S.T., M.Si.",
      jenisKelaminId: jkL!.id,
      tempatLahir: "Kota Banda Aceh",
      tempatLahirId: kotaBandaAceh?.id,
      tanggalLahir: new Date("1978-08-15"),
      agamaId: islam!.id,
      statusPerkawinanId: menikah!.id,
      alamat: "Jl. Teuku Nyak Arief No. 45, Jeulingke",
      provinsiId: provAceh?.id,
      kabupatenKotaId: kotaBandaAceh?.id,
      kecamatanId: kecSyiahKuala?.id,
      desaId: desaJeulingke?.id,
      noHp: "08116800101",
      email: "rahmad.hidayat@kemnaker.go.id",
      pendidikanTerakhirId: s2!.id,
      dirjenId: dirjen?.id,
      unitKerjaId: unitKerja!.id,
      subUnitKerjaId: subPimpinan?.id,
      eselonId: eselon3b?.id,
      statusPegawaiId: pns!.id,
      pangkatGolonganId: gol4a?.id,
      jabatanId: jbtKepala?.id,
      role: "admin",
    },
    {
      nip: "198204122008011005",
      nama: "Iskandar Muda, S.Sos., M.M.",
      jenisKelaminId: jkL!.id,
      tempatLahir: "Kota Banda Aceh",
      tempatLahirId: kotaBandaAceh?.id,
      tanggalLahir: new Date("1982-04-12"),
      agamaId: islam!.id,
      statusPerkawinanId: menikah!.id,
      alamat: "Jl. T. Hasan Dek No. 18, Kuta Alam",
      provinsiId: provAceh?.id,
      kabupatenKotaId: kotaBandaAceh?.id,
      kecamatanId: kecKutaAlam?.id,
      desaId: desaPeunayong?.id,
      noHp: "08126900202",
      email: "iskandar.umum@kemnaker.go.id",
      pendidikanTerakhirId: s2!.id,
      dirjenId: dirjen?.id,
      unitKerjaId: unitKerja!.id,
      subUnitKerjaId: subUmum?.id,
      eselonId: eselon4a?.id,
      statusPegawaiId: pns!.id,
      pangkatGolonganId: gol3d?.id,
      jabatanId: jbtKasubbag?.id,
      role: "admin",
    },
    {
      nip: "198506202010012011",
      nama: "Cut Nurul Fazilah, S.T.",
      jenisKelaminId: jkP!.id,
      tempatLahir: "Kota Banda Aceh",
      tempatLahirId: kotaBandaAceh?.id,
      tanggalLahir: new Date("1985-06-20"),
      agamaId: islam!.id,
      statusPerkawinanId: menikah!.id,
      alamat: "Komplek Perumahan Dolog No. 8, Lamgugob",
      provinsiId: provAceh?.id,
      kabupatenKotaId: kotaBandaAceh?.id,
      kecamatanId: kecSyiahKuala?.id,
      desaId: desaLamgugob?.id,
      noHp: "08137700303",
      email: "cut.nurul@kemnaker.go.id",
      pendidikanTerakhirId: s1!.id,
      dirjenId: dirjen?.id,
      unitKerjaId: unitKerja!.id,
      subUnitKerjaId: subPelatihan?.id,
      eselonId: eselon4a?.id,
      statusPegawaiId: pns!.id,
      pangkatGolonganId: gol3c?.id,
      jabatanId: jbtKasubbag?.id,
      role: "operator",
    },
    {
      nip: "198811042012121003",
      nama: "Teuku Muhammad Iqbal, S.Kom.",
      jenisKelaminId: jkL!.id,
      tempatLahir: "Kota Banda Aceh",
      tempatLahirId: kotaBandaAceh?.id,
      tanggalLahir: new Date("1988-11-04"),
      agamaId: islam!.id,
      statusPerkawinanId: menikah!.id,
      alamat: "Jl. Syiah Kuala No. 22, Jeulingke",
      provinsiId: provAceh?.id,
      kabupatenKotaId: kotaBandaAceh?.id,
      kecamatanId: kecSyiahKuala?.id,
      desaId: desaJeulingke?.id,
      noHp: "08126500404",
      email: "iqbal.tik@kemnaker.go.id",
      pendidikanTerakhirId: s1!.id,
      dirjenId: dirjen?.id,
      unitKerjaId: unitKerja!.id,
      subUnitKerjaId: subTik?.id,
      eselonId: jfMuda?.id,
      statusPegawaiId: pns!.id,
      pangkatGolonganId: gol3c?.id,
      jabatanId: jbtInstruktur?.id,
      role: "operator",
    },
    {
      nip: "199003182015031006",
      nama: "Dedi Suryadi, S.Pd.T.",
      jenisKelaminId: jkL!.id,
      tempatLahir: "Aceh Besar",
      tempatLahirId: kabAcehBesar?.id,
      tanggalLahir: new Date("1990-03-18"),
      agamaId: islam!.id,
      statusPerkawinanId: menikah!.id,
      alamat: "Jl. Banda Aceh - Medan Km. 8, Ingin Jaya",
      provinsiId: provAceh?.id,
      kabupatenKotaId: kabAcehBesar?.id,
      kecamatanId: kecSyiahKuala?.id,
      desaId: desaLamgugob?.id,
      noHp: "08216600505",
      email: "dedi.otomotif@kemnaker.go.id",
      pendidikanTerakhirId: s1!.id,
      dirjenId: dirjen?.id,
      unitKerjaId: unitKerja!.id,
      subUnitKerjaId: subOtomotif?.id,
      eselonId: jfPertama?.id,
      statusPegawaiId: pns!.id,
      pangkatGolonganId: gol3a?.id,
      jabatanId: jbtInstruktur?.id,
      role: "operator",
    },
    {
      nip: "199207252018012004",
      nama: "Siti Rahmah, S.E.",
      jenisKelaminId: jkP!.id,
      tempatLahir: "Kota Banda Aceh",
      tempatLahirId: kotaBandaAceh?.id,
      tanggalLahir: new Date("1992-07-25"),
      agamaId: islam!.id,
      statusPerkawinanId: belumMenikah!.id,
      alamat: "Jl. T. Nyak Arief Lorong Pelajar, Kopelma Darussalam",
      provinsiId: provAceh?.id,
      kabupatenKotaId: kotaBandaAceh?.id,
      kecamatanId: kecSyiahKuala?.id,
      desaId: desaJeulingke?.id,
      noHp: "08527700606",
      email: "siti.kepegawaian@kemnaker.go.id",
      pendidikanTerakhirId: s1!.id,
      dirjenId: dirjen?.id,
      unitKerjaId: unitKerja!.id,
      subUnitKerjaId: subUmum?.id,
      eselonId: pelaksana?.id,
      statusPegawaiId: pns!.id,
      pangkatGolonganId: gol3a?.id,
      jabatanId: jbtPengadministrasi?.id,
      role: "operator",
    },
    {
      nip: "199409102021021008",
      nama: "Zulkifli, A.Md.T.",
      jenisKelaminId: jkL!.id,
      tempatLahir: "Kota Banda Aceh",
      tempatLahirId: kotaBandaAceh?.id,
      tanggalLahir: new Date("1994-09-10"),
      agamaId: islam!.id,
      statusPerkawinanId: belumMenikah!.id,
      alamat: "Jl. Pocut Baren No. 34, Keuda Pring",
      provinsiId: provAceh?.id,
      kabupatenKotaId: kotaBandaAceh?.id,
      kecamatanId: kecKutaAlam?.id,
      desaId: desaPeunayong?.id,
      noHp: "08238800707",
      email: "zulkifli.las@kemnaker.go.id",
      pendidikanTerakhirId: d3!.id,
      dirjenId: dirjen?.id,
      unitKerjaId: unitKerja!.id,
      subUnitKerjaId: subLas?.id,
      eselonId: jfTerampil?.id,
      statusPegawaiId: pppk!.id,
      pangkatGolonganId: gol2c?.id,
      jabatanId: jbtInstruktur?.id,
      role: "operator",
    },
    {
      nip: "199612052023211009",
      nama: "Fahmi Ramadhan, S.Tr.Kom.",
      jenisKelaminId: jkL!.id,
      tempatLahir: "Kota Banda Aceh",
      tempatLahirId: kotaBandaAceh?.id,
      tanggalLahir: new Date("1996-12-05"),
      agamaId: islam!.id,
      statusPerkawinanId: belumMenikah!.id,
      alamat: "Jl. Prada Utama No. 12, Syiah Kuala",
      provinsiId: provAceh?.id,
      kabupatenKotaId: kotaBandaAceh?.id,
      kecamatanId: kecSyiahKuala?.id,
      desaId: desaLamgugob?.id,
      noHp: "08129900808",
      email: "fahmi.it@kemnaker.go.id",
      pendidikanTerakhirId: s1!.id,
      dirjenId: dirjen?.id,
      unitKerjaId: unitKerja!.id,
      subUnitKerjaId: subUmum?.id,
      eselonId: pelaksana?.id,
      statusPegawaiId: pppk!.id,
      pangkatGolonganId: gol3a?.id,
      jabatanId: jbtPengadministrasi?.id,
      role: "operator",
    },
    {
      nip: "199805140000000010",
      nama: "Agus Maulana (Non-PNS)",
      jenisKelaminId: jkL!.id,
      tempatLahir: "Aceh Besar",
      tempatLahirId: kabAcehBesar?.id,
      tanggalLahir: new Date("1998-05-14"),
      agamaId: islam!.id,
      statusPerkawinanId: belumMenikah!.id,
      alamat: "Desa Lamcot, Kec. Ingin Jaya, Aceh Besar",
      provinsiId: provAceh?.id,
      kabupatenKotaId: kabAcehBesar?.id,
      kecamatanId: kecSyiahKuala?.id,
      desaId: desaJeulingke?.id,
      noHp: "08531100909",
      email: "agus.security@kemnaker.go.id",
      pendidikanTerakhirId: smk!.id,
      dirjenId: dirjen?.id,
      unitKerjaId: unitKerja!.id,
      subUnitKerjaId: subUmum?.id,
      eselonId: nonAsn?.id,
      statusPegawaiId: ppnpn!.id,
      pangkatGolonganId: gol2c?.id,
      jabatanId: jbtPengadministrasi?.id,
      role: "operator",
    },
    {
      nip: "199902200000000011",
      nama: "Putri Mayasari (Non-PNS)",
      jenisKelaminId: jkP!.id,
      tempatLahir: "Kota Banda Aceh",
      tempatLahirId: kotaBandaAceh?.id,
      tanggalLahir: new Date("1999-02-20"),
      agamaId: islam!.id,
      statusPerkawinanId: belumMenikah!.id,
      alamat: "Jl. T. Iskandar No. 70, Ulee Kareng",
      provinsiId: provAceh?.id,
      kabupatenKotaId: kotaBandaAceh?.id,
      kecamatanId: kecKutaAlam?.id,
      desaId: desaPeunayong?.id,
      noHp: "08223300101",
      email: "putri.kios@kemnaker.go.id",
      pendidikanTerakhirId: d3!.id,
      dirjenId: dirjen?.id,
      unitKerjaId: unitKerja!.id,
      subUnitKerjaId: subKios?.id,
      eselonId: nonAsn?.id,
      statusPegawaiId: ppnpn!.id,
      pangkatGolonganId: gol2c?.id,
      jabatanId: jbtPengadministrasi?.id,
      role: "operator",
    },
  ];

  for (const p of pegawaiData) {
    const existing = await prisma.pegawai.findUnique({
      where: { nip: p.nip },
    });

    let pegawaiId: string;
    if (existing) {
      const updated = await prisma.pegawai.update({
        where: { id: existing.id },
        data: {
          nama: p.nama,
          tempatLahir: p.tempatLahir,
          tempatLahirId: p.tempatLahirId,
          tanggalLahir: p.tanggalLahir,
          agamaId: p.agamaId,
          statusPerkawinanId: p.statusPerkawinanId,
          alamat: p.alamat,
          provinsiId: p.provinsiId,
          kabupatenKotaId: p.kabupatenKotaId,
          kecamatanId: p.kecamatanId,
          desaId: p.desaId,
          noHp: p.noHp,
          email: p.email,
          pendidikanTerakhirId: p.pendidikanTerakhirId,
          dirjenId: p.dirjenId,
          unitKerjaId: p.unitKerjaId,
          subUnitKerjaId: p.subUnitKerjaId,
          eselonId: p.eselonId,
          statusPegawaiId: p.statusPegawaiId,
          aktif: true,
        },
      });
      pegawaiId = updated.id;
    } else {
      const created = await prisma.pegawai.create({
        data: {
          nip: p.nip,
          nama: p.nama,
          jenisKelaminId: p.jenisKelaminId,
          tempatLahir: p.tempatLahir,
          tempatLahirId: p.tempatLahirId,
          tanggalLahir: p.tanggalLahir,
          agamaId: p.agamaId,
          statusPerkawinanId: p.statusPerkawinanId,
          alamat: p.alamat,
          provinsiId: p.provinsiId,
          kabupatenKotaId: p.kabupatenKotaId,
          kecamatanId: p.kecamatanId,
          desaId: p.desaId,
          noHp: p.noHp,
          email: p.email,
          pendidikanTerakhirId: p.pendidikanTerakhirId,
          dirjenId: p.dirjenId,
          unitKerjaId: p.unitKerjaId,
          subUnitKerjaId: p.subUnitKerjaId,
          eselonId: p.eselonId,
          statusPegawaiId: p.statusPegawaiId,
          aktif: true,
        },
      });
      pegawaiId = created.id;
    }

    // Riwayat Pangkat
    if (p.pangkatGolonganId) {
      const hasPangkat = await prisma.riwayatPangkat.findFirst({
        where: { pegawaiId, pangkatGolonganId: p.pangkatGolonganId },
      });
      if (!hasPangkat) {
        await prisma.riwayatPangkat.create({
          data: {
            pegawaiId,
            pangkatGolonganId: p.pangkatGolonganId,
            tmt: new Date("2023-04-01"),
            noSk: `SK-KP/${p.nip.slice(-4)}/2023`,
            tanggalSk: new Date("2023-03-20"),
            keterangan: "Kenaikan Pangkat Terakhir",
          },
        });
      }
    }

    // Riwayat Jabatan
    if (p.jabatanId) {
      const hasJabatan = await prisma.riwayatJabatan.findFirst({
        where: { pegawaiId, jabatanId: p.jabatanId },
      });
      if (!hasJabatan) {
        await prisma.riwayatJabatan.create({
          data: {
            pegawaiId,
            jabatanId: p.jabatanId,
            unitKerjaId: p.unitKerjaId,
            tmt: new Date("2023-01-01"),
            noSk: `SK-JBT/${p.nip.slice(-4)}/2023`,
            tanggalSk: new Date("2022-12-15"),
            keterangan: "Pengangkatan Jabatan Definitif",
          },
        });
      }
    }

    // Create User record for each Pegawai so they can log in via SSO seamlessly
    const defaultPassword = await bcrypt.hash("bpvp123", 10);
    await prisma.user.upsert({
      where: { email: p.email },
      update: {
        nama: p.nama,
        role: p.role,
        aktif: true,
      },
      create: {
        nama: p.nama,
        email: p.email,
        password: defaultPassword,
        role: p.role,
        aktif: true,
      },
    });

    console.log(`-> Seeded Pegawai: ${p.nama} (${p.nip})`);
  }

  console.log("=== SEEDING PEGAWAI SELESAI DENGAN SUKSES ===");
}

seedPegawai()
  .catch((e) => {
    console.error("Error seeding pegawai:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

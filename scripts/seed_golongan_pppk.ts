import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const pppkGolonganData = [
  { label: "Golongan I", kode: "I", urutan: 1 },
  { label: "Golongan II", kode: "II", urutan: 2 },
  { label: "Golongan III", kode: "III", urutan: 3 },
  { label: "Golongan IV", kode: "IV", urutan: 4 },
  { label: "Golongan V", kode: "V", urutan: 5 },
  { label: "Golongan VI", kode: "VI", urutan: 6 },
  { label: "Golongan VII", kode: "VII", urutan: 7 },
  { label: "Golongan VIII", kode: "VIII", urutan: 8 },
  { label: "Golongan IX", kode: "IX", urutan: 9 },
  { label: "Golongan X", kode: "X", urutan: 10 },
  { label: "Golongan XI", kode: "XI", urutan: 11 },
  { label: "Golongan XII", kode: "XII", urutan: 12 },
  { label: "Golongan XIII", kode: "XIII", urutan: 13 },
  { label: "Golongan XIV", kode: "XIV", urutan: 14 },
  { label: "Golongan XV", kode: "XV", urutan: 15 },
  { label: "Golongan XVI", kode: "XVI", urutan: 16 },
  { label: "Golongan XVII", kode: "XVII", urutan: 17 },
];

async function main() {
  console.log("Seeding Master Data Golongan PPPK (Golongan I - XVII)...");

  for (const item of pppkGolonganData) {
    const existing = await prisma.masterData.findFirst({
      where: {
        kategori: "GOLONGAN_PPPK",
        OR: [{ kode: item.kode }, { label: item.label }],
      },
    });

    if (existing) {
      await prisma.masterData.update({
        where: { id: existing.id },
        data: {
          label: item.label,
          kode: item.kode,
          urutan: item.urutan,
          aktif: true,
        },
      });
      console.log(`Updated: ${item.label}`);
    } else {
      await prisma.masterData.create({
        data: {
          kategori: "GOLONGAN_PPPK",
          label: item.label,
          kode: item.kode,
          urutan: item.urutan,
          aktif: true,
        },
      });
      console.log(`Created: ${item.label}`);
    }
  }

  console.log("Seeding Golongan PPPK selesai!");
}

main()
  .catch((e) => {
    console.error("Error seeding Golongan PPPK:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

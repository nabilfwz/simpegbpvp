# SIMPEG BPVP - Sistem Informasi Manajemen Pegawai

Aplikasi web untuk manajemen kepegawaian Balai Pelatihan Vokasi dan Produktivitas (BPVP) Kementerian Ketenagakerjaan Republik Indonesia.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (credentials provider)
- **Styling**: Tailwind CSS + shadcn/ui
- **Validation**: Zod + React Hook Form
- **UI Components**: Toaster (sonner)

## Fitur Utama

### Untuk Admin & Operator
- ✅ Dashboard dengan statistik pegawai
- ✅ Manajemen data pegawai (CRUD)
- ✅ Riwayat pangkat/golongan pegawai
- ✅ Riwayat jabatan pegawai
- ✅ Pencarian & filter pegawai (NIP, nama, unit kerja, status, jenis kelamin)
- ✅ Pagination

### Khusus Admin
- ✅ Master Data management (8 kategori: Pangkat/Golongan, Jabatan, Unit Kerja, Pendidikan, Agama, Status Pegawai, Status Perkawinan, Jenis Kelamin)
- ✅ Log Aktivitas (audit trail semua perubahan data)
- ✅ Manajemen User (admin & operator)

## Prinsip Arsitektur

- **No Hardcoded Dropdowns**: Semua pilihan dropdown diambil dari database (tabel `MasterData`)
- **Soft Delete**: Data pegawai dan master data menggunakan flag `aktif` untuk menghindari kerusakan relasi historis
- **Audit Trail**: Setiap operasi CREATE/UPDATE/DELETE tercatat di `LogAktivitas` dengan data before/after
- **Role-Based Access**: Middleware NextAuth membatasi akses route `/admin/*` hanya untuk role `admin`

## Setup & Instalasi

### 1. Clone & Install Dependencies

```bash
cd simpegbpvp
npm install
# atau
pnpm install
```

### 2. Setup Database

Buat file `.env` dari template `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` dan sesuaikan:

```env
# PostgreSQL Connection
DATABASE_URL="postgresql://user:password@localhost:5432/simpegbpvp?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/simpegbpvp?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-random-secret-here"

# Default Admin (opsional, untuk seed)
DEFAULT_ADMIN_EMAIL="admin@bpvp.local"
DEFAULT_ADMIN_PASSWORD="admin123"
```

**Generate `NEXTAUTH_SECRET`**:
```bash
openssl rand -base64 32
```

### 3. Database Migration & Seed

```bash
# Generate Prisma Client
npx prisma generate

# Jalankan migrasi
npx prisma migrate dev --name init

# Seed data master & user default
npx prisma db seed
```

Seed akan mengisi:
- Master data untuk 8 kategori (Pangkat, Jabatan, Unit Kerja, dll)
- 1 akun Admin: `admin@bpvp.local` / `admin123`
- 1 akun Operator: `operator@bpvp.local` / `operator123`

### 4. Jalankan Development Server

```bash
npm run dev
# atau
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Kredensial Default

| Role     | Email                | Password    |
|----------|----------------------|-------------|
| Admin    | admin@bpvp.local     | admin123    |
| Operator | operator@bpvp.local  | operator123 |

⚠️ **PENTING**: Ganti password default di production!

## Struktur Database

### Model Utama

- **MasterData**: Tabel referensi untuk semua dropdown (8 kategori)
- **Pegawai**: Data pegawai + demografi
- **RiwayatPangkat**: Histori kepangkatan
- **RiwayatJabatan**: Histori jabatan & penempatan
- **User**: Akun admin/operator
- **LogAktivitas**: Audit trail

### Relasi Kunci

```
Pegawai 
  ├─ jenisKelamin → MasterData
  ├─ agama → MasterData
  ├─ statusPerkawinan → MasterData
  ├─ pendidikanTerakhir → MasterData
  ├─ unitKerja → MasterData (penempatan)
  ├─ statusPegawai → MasterData
  ├─ riwayatPangkat[] → RiwayatPangkat
  └─ riwayatJabatan[] → RiwayatJabatan

RiwayatPangkat
  └─ pangkatGolongan → MasterData

RiwayatJabatan
  ├─ jabatan → MasterData
  └─ unitKerja → MasterData
```

## Navigasi Aplikasi

### Halaman Umum (Admin & Operator)
- `/` - Dashboard
- `/pegawai` - Daftar pegawai
- `/pegawai/tambah` - Form tambah pegawai
- `/pegawai/[id]` - Detail pegawai (edit, riwayat pangkat/jabatan)

### Halaman Admin Only
- `/admin/master-data` - Kelola master data
- `/admin/users` - Manajemen user
- `/admin/log-aktivitas` - Audit log

## Catatan Penting

### Master Data Management
Semua dropdown di aplikasi diambil dari tabel `MasterData` dengan kategori:
- `PANGKAT_GOLONGAN` (I/a sampai IV/e)
- `JABATAN` (15 jabatan struktural & fungsional)
- `UNIT_KERJA` (10 unit kerja/kejuruan BPVP)
- `PENDIDIKAN` (SLTA sampai S3)
- `AGAMA` (6 agama resmi)
- `STATUS_PEGAWAI` (PNS, PPPK, Honorer, Magang)
- `STATUS_PERKAWINAN` (Belum Menikah, Menikah, Cerai Hidup, Cerai Mati)
- `JENIS_KELAMIN` (Laki-laki, Perempuan)

### Asumsi & Kustomisasi

**Nama & Logo BPVP**: Aplikasi menggunakan nama generik "BPVP". Sesuaikan dengan nama lengkap instansi di:
- `app/login/page.tsx` (header login)
- `app/components/sidebar.tsx` (logo sidebar)

**Unit Kerja**: Seed data unit kerja disesuaikan untuk BPVP dengan 10 unit (Pimpinan, TU, 3 seksi, 5 kejuruan). Edit di `prisma/seed.ts` jika berbeda.

**Jabatan**: 15 jabatan default mencakup struktural (Kepala Balai, Kasubag) dan fungsional (Instruktur, Pengelola). Tambahkan via Master Data UI.

**Warna Tema**: Navy `#003399` sebagai warna primer Kemnaker. Ubah di seluruh file jika perlu tema berbeda.

## Development Commands

```bash
# Development
npm run dev

# Build production
npm run build

# Start production
npm start

# Lint
npm run lint

# Prisma Studio (GUI database)
npx prisma studio

# Reset database (DANGER)
npx prisma migrate reset
```

## Troubleshooting

### Prisma Client Error
```bash
npx prisma generate
```

### Migration Conflict
```bash
npx prisma migrate reset
npx prisma migrate dev
npx prisma db seed
```

### Port Already in Use
Edit `package.json`:
```json
"dev": "next dev -p 3001"
```

## Keamanan

- ✅ Password di-hash dengan bcrypt
- ✅ Session JWT-based via NextAuth
- ✅ Middleware proteksi route
- ✅ Role-based access control
- ✅ Input validation (Zod) server-side
- ✅ Soft delete untuk data sensitif
- ⚠️ Ganti `NEXTAUTH_SECRET` di production
- ⚠️ Gunakan HTTPS di production
- ⚠️ Ganti password default admin

## Lisensi

Aplikasi internal untuk Kementerian Ketenagakerjaan RI.

---

**Developed for**: BPVP Kementerian Ketenagakerjaan RI  
**Tech Stack**: Next.js 14 + Prisma + PostgreSQL + NextAuth  
**Year**: 2026

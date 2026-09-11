# AGENTS.md — Manajemen Pegawai BPVP

File ini dibaca otomatis oleh OpenCode di setiap sesi. Isinya adalah aturan permanen & konteks proyek — jangan dihapus, update kalau ada perubahan keputusan desain.

## Tentang Proyek
Aplikasi web "Manajemen Pegawai BPVP". Tema visual: identitas Kemnaker (navy #003399 + putih, aksen kuning/emas, tipografi formal instansi, layout sidebar).

## Tech Stack (final, jangan diganti tanpa alasan kuat)
- Next.js 14+, App Router, TypeScript
- Prisma ORM + PostgreSQL
- Tailwind CSS + shadcn/ui
- NextAuth.js (credentials), role: `admin`, `operator`
- Zod + React Hook Form

## Aturan Wajib (berlaku di semua task, jangan dilanggar)
0. **Semua command shell WAJIB non-interaktif.** Jangan pernah menjalankan command yang bisa menunggu konfirmasi user (y/n, pilihan menu, dsb) — ini akan menggantung tanpa batas karena tidak ada yang menjawab. Wajib:
   - `npx` → selalu tambahkan `-y` atau `--yes` (contoh: `npx -y create-next-app@latest .`, `npx -y shadcn@latest init`, `npx -y prisma init`).
   - `create-next-app` → gunakan flag non-interaktif lengkap (`--ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm` atau sesuai package manager, jangan biarkan wizard tanya-tanya).
   - `shadcn` CLI → tambahkan flag `-y` / `--defaults` kalau tersedia.
   - `npm install` / `pnpm install` → jangan pakai flag yang memicu prompt (hindari mode audit-fix interaktif).
   - Command `git` yang bisa buka editor (misal `git commit` tanpa `-m`) → selalu sertakan pesan lewat flag, jangan andalkan editor interaktif.
   - Sebelum menjalankan command baru yang berpotensi interaktif, cek dokumentasi flag non-interaktifnya dulu, jangan coba-coba lalu menggantung.
   - Kalau sebuah command tetap menggantung >30 detik tanpa output jelas, anggap itu tanda command sedang menunggu input — hentikan dan cari flag non-interaktifnya, jangan diulang persis sama.
1. **Tidak boleh ada dropdown/opsi hardcode di kode.** Semua opsi (pangkat/golongan, jabatan, unit kerja, pendidikan, agama, status pegawai, status perkawinan, jenis kelamin) HARUS diambil dari tabel `MasterData` via API `/api/master-data?kategori=...`.
2. **Semua create/update/delete WAJIB tercatat ke `LogAktivitas`** lewat helper terpusat `lib/log-aktivitas.ts`. Jangan duplikasi logic pencatatan log di tiap route API.
3. **Soft delete**, bukan hard delete, untuk data yang punya relasi (Pegawai, MasterData) — pakai field `aktif`.
4. **Validasi server wajib** (Zod) di setiap route API, tidak cukup validasi client.
5. Form "Tambah Pegawai" HANYA berisi data demografi + NIP + alamat + penempatan. Riwayat pangkat & riwayat jabatan HANYA bisa diisi dari halaman Detail Pegawai, tidak ada di form tambah.

## Skema Data (referensi — lihat prisma/schema.prisma sebagai source of truth aktual)
- `MasterData`: id, kategori, kode?, label, urutan, aktif, timestamps
- `Pegawai`: id, nip, nama, jenisKelaminId, tempatLahir, tanggalLahir, agamaId, statusPerkawinanId, alamat, noHp?, email?, pendidikanTerakhirId, unitKerjaId, statusPegawaiId, fotoUrl?, aktif, timestamps
- `RiwayatPangkat`: id, pegawaiId, pangkatGolonganId, tmt, noSk?, tanggalSk?, keterangan?
- `RiwayatJabatan`: id, pegawaiId, jabatanId, unitKerjaId, tmt, noSk?, tanggalSk?, keterangan?
- `User`: id, nama, email, password, role, aktif
- `LogAktivitas`: id, userId, aksi, entitas, entitasId, deskripsi, dataSebelum?, dataSesudah?, ipAddress?, createdAt

## Status Progress (UPDATE bagian ini setiap kali sebuah task selesai)
- [x] Task 1 — Inisialisasi proyek
- [x] Task 2 — Schema Prisma + migration + seed
- [x] Task 3 — Auth & middleware
- [x] Task 4 — Helper log aktivitas
- [x] Task 5 — CRUD Master Data (admin)
- [x] Task 6 — Fitur Pegawai (daftar, tambah, detail + riwayat pangkat/jabatan)
- [x] Task 7 — Log Aktivitas (halaman admin)
- [x] Task 8 — Manajemen User (admin)
- [x] Task 9 — Dashboard
- [x] Task 11 — Searchable Dropdown, Penempatan Detail (Dirjen, Sub Unit Kerja / Subbagian Umum, Eselon), Logo Resmi Kemnaker & BPVP, Mobile Sidebar Redesign, Tong Sampah Pegawai (Soft Delete, Restore, Hapus Permanen Admin)
- [x] Task 12 — Single Sign-On (SSO) Kemnaker RI (SIAPkerja ID) & Google Workspace, Portal SSO Interaktif, Auto-Provisioning User, Pencatatan Log Login SSO
- [x] Task 13 — Audit Trail Data Lama & Data Baru (dataSebelum & dataSesudah pada Log Aktivitas), Modal Diff Visual (Tabel Kolom & Raw JSON), Pembersihan Dropdown (Tanpa Kode & No Truncate), Sistem Tombol Kontras Tinggi Kemnaker
- [x] Task 14 — Tong Sampah Khusus Admin di Sidebar (dengan Badge Dinamis), Pembersihan Tab Pegawai, Central SSO Ekosistem BPVP (Verifikasi Ketat Berbasis Tabel Pegawai & Status Aktif, Penolakan Orang Luar & Pegawai Nonaktif), Token Kriptografis Cross-App (HMAC-SHA256), App Switcher 9-Dot Grid, Verifikator Satelit & Demo Aplikasi Ekosistem (Skillhub, Maganghub, LSP-P1, Keuangan & BMN, PTSP)
- [x] Task 15 — Pemisahan SSO Terpusat Menjadi Layanan Mandiri Terpisah (`sso-bpvp` di Port 3001), SIMPEG Murni sebagai SSO Client (Port 3000), Cross-Origin Authentication Flow & Cryptographic Handshake, Showcase Satelit Ekosistem di Server SSO Terpusat

> Catatan: sebelum mulai task baru, **selalu cek dulu kondisi file yang sudah ada** (jangan asumsi kosong). Kalau ada bagian dari task sebelumnya yang ternyata belum lengkap/error, perbaiki dulu sebelum lanjut.

## Kredensial Default (dev/seed)
- Admin: `admin@bpvp.local` / `admin123` (ubah kalau sudah beda di seed.ts yang sebenarnya)

## Definition of Done per Task
Sebuah task dianggap selesai kalau:
- Kode jalan tanpa error (`next build` tidak gagal karena bagian itu)
- Tidak ada hardcode dropdown
- Log aktivitas tercatat untuk aksi tulis
- Halaman terkait bisa diakses sesuai role yang benar
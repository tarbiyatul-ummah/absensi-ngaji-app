# Riwayat Perubahan (CHANGELOG)

Semua perubahan tercatat di dalam satu berkas ini secara terpusat. Setiap kali ada commit baru ke repository GitHub, bagian changelog baru akan ditambahkan di bagian atas dokumen ini.

---

## [Uncommitted / Next Commit] - 2026-11-04

### 1. Fitur Generator & Manajemen Invoice SPP (Multi-Siswa, Multi-Bulan & Database Persistence)
- **Database Schema**: Menambahkan script migrasi mandiri di [`supabase_migration_invoices.sql`](file:///d:/project/absensi-ngaji-app/supabase_migration_invoices.sql) untuk membuat tabel `spp_invoices`, 4 indeks pencarian, dan Row Level Security (RLS).
- **Pengaturan Rekening & Tarif**: Menambahkan kolom alamat lembaga, kontak/telepon, tarif default SPP, rekening pembayaran (bank, nomor rekening, atas nama), judul header, dan instruksi transfer di `src/config/organization.ts` dan `src/views/OrganizationTermsView.tsx`.
- **Otomatisasi Pembayaran (Auto-Sync)**: Mengintegrasikan sinkronisasi otomatis status pembayaran di `src/services/invoiceService.ts` dan `src/services/financeService.ts`. Ketika invoice ditandai `paid` (lunas), seluruh bulan siswa yang ditagihkan otomatis berubah menjadi lunas di tabel `spp_payments`.
- **Generator PDF & Gambar Resmi**: Membuat service `src/services/invoicePdfService.ts` berbasis `@pdfme/generator` untuk unduh PDF A4 resmi, serta `src/services/invoiceImageService.ts` berbasis `html-to-image` untuk ekspor gambar beresolusi tinggi (PNG) siap share ke media sosial / chat.
- **Generator WhatsApp**: Membuat helper `generateInvoiceWhatsAppMessage` di `src/utils/invoiceUtils.ts` untuk salin teks tagihan terformat rapi ke WhatsApp.
- **Komponen UI**:
  - [`InvoiceGeneratorDialog.tsx`](file:///d:/project/absensi-ngaji-app/src/components/finance/InvoiceGeneratorDialog.tsx): Dialog pembuatan dan pengeditan invoice interaktif dengan auto-suggest tunggakan santri, penyesuaian tarif, diskon, dan live preview.
  - [`InvoiceListDialog.tsx`](file:///d:/project/absensi-ngaji-app/src/components/finance/InvoiceListDialog.tsx): Dialog riwayat invoice dengan pencarian, filter status, tombol 1-klik "Tandai Lunas", unduh PDF, salin WA, edit, dan hapus.
  - [`InvoiceLivePreview.tsx`](file:///d:/project/absensi-ngaji-app/src/components/finance/InvoiceLivePreview.tsx): Pratinjau visual invoice berstandar kertas cetak.
  - [`FinanceView.tsx`](file:///d:/project/absensi-ngaji-app/src/views/FinanceView.tsx): Menambahkan tombol "Buat Invoice" dan "Daftar Invoice" di header, serta tombol aksi cepat "Buat Tagihan Siswa Ini" di dialog detail santri.

---

## Commit `b9d01e4` - 2026-10-09
> **Pesan Commit**: `add design system and also change loading state`

### 1. Refactor Atomic Design System Penuh
- **Design Tokens**: Membuat standarisasi token di `src/design-system/tokens.ts` dan integrasi Tailwind v4 di `src/assets/main.css` (warna semantik, skala spacing 4px-48px, corner radius `rounded-xl`/`rounded-2xl`, tipografi Geist Variable, dan elevation shadow).
- **Komponen Atom & Molekul Baru**:
  - [`PageHeader.tsx`](file:///d:/project/absensi-ngaji-app/src/components/layout/PageHeader.tsx): Header konsisten di setiap halaman dengan slot tombol aksi dan navigasi kembali.
  - [`SearchInput.tsx`](file:///d:/project/absensi-ngaji-app/src/components/ui/search-input.tsx): Input pencarian seragam dengan ikon search dan tombol hapus cepat (X).
  - [`FilterChip.tsx`](file:///d:/project/absensi-ngaji-app/src/components/ui/filter-chip.tsx): Chip filter pill konsisten.
- **Standarisasi Komponen Inti**: `button.tsx`, `card.tsx`, `badge.tsx`, `dialog.tsx`, `input.tsx`, `textarea.tsx`.
- **Migrasi 11 Halaman**: Menerapkan arsitektur dan token desain ke seluruh 11 views aplikasi:
  - `AbsensiView.tsx`
  - `DashboardView.tsx`
  - `MasterSantri.tsx`
  - `MasterGuruJilid.tsx`
  - `FinanceView.tsx`
  - `SavingsView.tsx`
  - `SavingsDetailView.tsx`
  - `AssessmentView.tsx`
  - `AccountView.tsx`
  - `ExportView.tsx`
  - `OrganizationTermsView.tsx`

---

## Commit `f8a4551` - 2026-10-09
> **Pesan Commit**: `change dropdown styling`

### 1. Penyeragaman Styling Dropdown
- Menyeragamkan visual dan perilaku semua dropdown menu pada aplikasi agar selaras dengan desain dropdown menu akun pengguna (card background, border subtle, padding, dan hover states).
- Mengubah filter analitik data santri (per jilid, per asatidz, dan per tipe) menjadi dropdown kecil responsif pada layar mobile.

---

## Commit `3ce12d8` - 2026-10-09
> **Pesan Commit**: `rewrite ke react, add guard buat di spp, add tanggal masuk, keluar`

### 1. Siklus Hidup Santri (Lifecycle Schema)
- Menambahkan kolom `tanggal_masuk` (DATE) dan `tanggal_keluar` (DATE) pada tabel `santri` di Supabase.
- Memperbarui antarmuka TypeScript `Santri` serta form penambahan/pengeditan santri di `MasterSantri.tsx`.
- Menambahkan kolom tanggal masuk dan keluar pada fitur ekspor Excel santri.

### 2. Guard Pembayaran SPP (Bulan Pra-Masuk)
- Logika guard: santri yang masuk di pertengahan tahun ajaran (misal bulan September) otomatis dinonaktifkan (*disabled*) untuk bulan-bulan sebelum tanggal masuknya (misal Juli dan Agustus).

### 3. Tracking Perubahan Status SPP & Timestamp
- Menambahkan kolom `paid_at` (TIMESTAMPTZ) pada tabel `spp_payments` untuk mencatat waktu perubahan dari belum dibayar ke lunas.
- Menampilkan tanggal dan jam pelunasan SPP per bulan pada modal detail santri.
- Menyertakan tanggal pembayaran pada laporan ekspor Excel SPP.

---

## Commit `7ad5a69` - 2026-10-08
> **Pesan Commit**: `add fallback when refreshing not in main page`

### 1. Routing & Refresh Fallback
- Menambahkan konfigurasi rewrites dan fallback rute SPA untuk mengatasi error 404 saat pengguna melakukan refresh browser di luar halaman utama.

---

## Commit `a77d110` - 2026-10-08
> **Pesan Commit**: `make organization setting tied up to account`

### 1. Pengaturan Organisasi & Istilah
- Mengaitkan konfigurasi organisasi dan istilah dinamis (santri/siswa/murid, asatidz/guru, dll.) langsung ke profil akun pengguna.
- Menyediakan halaman `OrganizationTermsView` untuk menyesuaikan terminologi lembaga.

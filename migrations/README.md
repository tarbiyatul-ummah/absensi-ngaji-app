# Supabase Database Migrations

Folder ini berisi seluruh script migration dan skema database untuk aplikasi **Absensi & Keuangan Ngaji** berbasis Supabase PostgreSQL.

---

## Daftar File Migrasi

| File | Keterangan | Kapan Dijalankan? |
| :--- | :--- | :--- |
| **`000_full_schema.sql`** | **Skema Lengkap (All-in-One)**: Mencakup semua 16 tabel, indeks pencarian, dan konfigurasi Row Level Security (RLS) multi-tenant. | Gunakan file ini jika melakukan **setup awal project Supabase baru**. Cukup jalankan 1 file ini saja. |
| **`001_initial_schema.sql`** | Skema awal tabel inti: master kelas/guru/santri, absensi, tahun ajaran, SPP, tabungan, penilaian santri, dan pengaturan organisasi. | Jika menjalankan migrasi secara bertahap / CI-CD step 1. |
| **`002_add_student_entry_exit_dates.sql`** | Penambahan kolom `tanggal_masuk` dan `tanggal_keluar` pada tabel `students` beserta indeksnya. | Jalankan jika database lama belum memiliki kolom tanggal masuk/keluar santri. |
| **`003_create_spp_invoices.sql`** | Pembuatan tabel `spp_invoices`, indeks nomor tagihan, dan RLS policy untuk fitur Invoice Tagihan SPP. | Jalankan jika database lama meng-upgrade ke fitur pembuatan invoice tagihan SPP. |
| **`004_assessment_schema.sql`** (atau `supabase/assessment_schema.sql`) | Reparasi dan pembaruan 5 tabel modul Penilaian, Foreign Keys untuk query join, penambahan kolom kualitatif, dan reload schema cache. | Jalankan jika muncul error *"Schema penilaian belum terbaru"* saat membuka menu Penilaian. |

---

## Petunjuk Eksekusi di Supabase Dashboard

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih project Anda.
2. Pada bilah navigasi kiri, klik menu **SQL Editor**.
3. Klik tombol **New query** (tanda tambah `+`).
4. Buka salah satu file SQL di atas, salin seluruh kodenya, dan tempelkan ke editor.
5. Klik tombol **Run** (atau tekan `Ctrl` + `Enter`).
6. Pastikan muncul notifikasi **`Success. No rows returned`**.

---

## Keamanan Data (Row Level Security - RLS)

Seluruh tabel telah dilengkapi dengan **Row Level Security (RLS)**:
- Setiap akun lembaga hanya dapat membaca (`SELECT`), menambah (`INSERT`), memperbarui (`UPDATE`), dan menghapus (`DELETE`) data miliknya sendiri melalui pengecekan `auth.uid() = user_id`.
- Data antar lembaga dijamin terisolasi secara aman di tingkat basis data.


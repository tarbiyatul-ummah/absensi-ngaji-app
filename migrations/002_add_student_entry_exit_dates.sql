-- ==============================================================================
-- Migration: 002_add_student_entry_exit_dates.sql
-- Aplikasi: Absensi & Keuangan Ngaji
-- Keterangan: Tambahan kolom tanggal_masuk & tanggal_keluar pada tabel students
-- ==============================================================================

-- 1. Tambahkan kolom tanggal_masuk (format: YYYY-MM-DD)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS tanggal_masuk DATE;

-- 2. Tambahkan kolom tanggal_keluar (format: YYYY-MM-DD, terisi saat dinonaktifkan/keluar)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS tanggal_keluar DATE;

-- 3. Isi tanggal_masuk untuk data murid lama yang sudah ada dari created_at jika masih kosong
UPDATE students 
SET tanggal_masuk = to_timestamp(created_at / 1000)::date 
WHERE tanggal_masuk IS NULL AND created_at IS NOT NULL;

-- 4. Buat index pencarian untuk performa export & filter periode aktif santri
CREATE INDEX IF NOT EXISTS idx_students_tanggal_masuk ON students (tanggal_masuk);
CREATE INDEX IF NOT EXISTS idx_students_tanggal_keluar ON students (tanggal_keluar);


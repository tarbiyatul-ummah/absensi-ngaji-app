-- ==============================================================================
-- SKRIP MIGRASI PENILAIAN HARIAN (IS_DAILY)
-- File: migrations/006_assessment_is_daily.sql
-- Aplikasi: Absensi & Keuangan Ngaji
-- ==============================================================================

-- 1. Tambah kolom is_daily pada tabel assessments
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS is_daily BOOLEAN NOT NULL DEFAULT false;

-- 2. Buat index untuk pencarian penilaian harian yang cepat
CREATE INDEX IF NOT EXISTS idx_assessments_user_daily 
ON assessments (user_id, is_daily) 
WHERE is_archived = false;

-- 3. Reload Schema Cache Supabase PostgREST
NOTIFY pgrst, 'reload schema';


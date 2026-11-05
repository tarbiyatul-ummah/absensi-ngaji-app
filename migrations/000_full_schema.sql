-- ==============================================================================
-- Schema Lengkap (All-in-One): 000_full_schema.sql
-- Aplikasi: Absensi & Keuangan Ngaji (Supabase PostgreSQL)
-- Petunjuk: Jalankan query ini jika Anda melakukan setup awal pada project Supabase baru.
--           Skema ini mencakup semua tabel inti, tanggal masuk/keluar santri,
--           tabel invoice tagihan SPP, indeks, dan Row Level Security (RLS).
-- ==============================================================================

-- 1. Tabel Kelas / Jilid (classes)
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  nama TEXT NOT NULL,
  urutan INTEGER DEFAULT 0,
  created_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_classes_user_id ON classes (user_id);

-- 2. Tabel Pengajar / Guru (teachers)
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  nama TEXT NOT NULL,
  created_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers (user_id);

-- 3. Tabel Kategori / Tipe Santri (student_types)
CREATE TABLE IF NOT EXISTS student_types (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  nama TEXT NOT NULL,
  created_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_student_types_user_id ON student_types (user_id);

-- 4. Tabel Murid / Santri (students)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  nama TEXT NOT NULL,
  jilid_id TEXT,
  guru_id TEXT,
  tipe_id TEXT,
  tanggal_lahir TEXT,
  tanggal_masuk DATE,
  tanggal_keluar DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students (user_id);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students (is_active);
CREATE INDEX IF NOT EXISTS idx_students_jilid_id ON students (jilid_id);
CREATE INDEX IF NOT EXISTS idx_students_guru_id ON students (guru_id);
CREATE INDEX IF NOT EXISTS idx_students_tipe_id ON students (tipe_id);
CREATE INDEX IF NOT EXISTS idx_students_tanggal_masuk ON students (tanggal_masuk);
CREATE INDEX IF NOT EXISTS idx_students_tanggal_keluar ON students (tanggal_keluar);

-- 5. Tabel Absensi Harian (attendances)
CREATE TABLE IF NOT EXISTS attendances (
  id TEXT PRIMARY KEY, -- Format custom: {date}_{santri_id}
  user_id UUID NOT NULL,
  date TEXT NOT NULL,
  santri_id TEXT NOT NULL,
  jilid_id TEXT,
  guru_id TEXT,
  is_present BOOLEAN NOT NULL DEFAULT true,
  status TEXT
);

CREATE INDEX IF NOT EXISTS idx_attendances_user_id ON attendances (user_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances (date);
CREATE INDEX IF NOT EXISTS idx_attendances_santri_id ON attendances (santri_id);

-- 6. Tabel Tahun Ajaran (academic_years)
CREATE TABLE IF NOT EXISTS academic_years (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  start_year INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT,
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_academic_years_user_id ON academic_years (user_id);

-- 7. Tabel Pembayaran SPP / Iuran Bulanan (spp_payments)
CREATE TABLE IF NOT EXISTS spp_payments (
  id TEXT PRIMARY KEY, -- Format custom: {academic_year_start}_{month}_{santri_id}
  user_id UUID NOT NULL,
  santri_id TEXT NOT NULL,
  academic_year_start INTEGER NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at BIGINT,
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_spp_payments_user_id ON spp_payments (user_id);
CREATE INDEX IF NOT EXISTS idx_spp_payments_year ON spp_payments (academic_year_start);
CREATE INDEX IF NOT EXISTS idx_spp_payments_santri ON spp_payments (santri_id);

-- 8. Tabel Rekening Tabungan (savings_accounts)
CREATE TABLE IF NOT EXISTS savings_accounts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  academic_year_start INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  mode TEXT NOT NULL,
  santri_ids JSONB DEFAULT '[]'::jsonb,
  created_at BIGINT,
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_savings_accounts_user_id ON savings_accounts (user_id);

-- 9. Tabel Transaksi Tabungan (savings_payments)
CREATE TABLE IF NOT EXISTS savings_payments (
  id TEXT PRIMARY KEY, -- Format custom: {savings_account_id}_{month}_{santri_id}
  user_id UUID NOT NULL,
  savings_account_id TEXT NOT NULL,
  santri_id TEXT NOT NULL,
  academic_year_start INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  month TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at BIGINT,
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_savings_payments_user_id ON savings_payments (user_id);
CREATE INDEX IF NOT EXISTS idx_savings_payments_account ON savings_payments (savings_account_id);

-- 10. Tabel Header Penilaian / Raport (assessments)
CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  assessment_type TEXT NOT NULL,
  minimum_score NUMERIC DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT,
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments (user_id);

-- 11. Tabel Aspek / Butir Penilaian (assessment_items)
CREATE TABLE IF NOT EXISTS assessment_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  assessment_type TEXT NOT NULL,
  max_score NUMERIC DEFAULT 100,
  sort_order INTEGER DEFAULT 0,
  created_at BIGINT,
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_assessment_items_assessment_id ON assessment_items (assessment_id);

-- Pastikan CHECK constraint mendukung 'qualitative'
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_assessment_type_check;
ALTER TABLE assessments ADD CONSTRAINT assessments_assessment_type_check CHECK (assessment_type IN ('score', 'scale', 'qualitative'));
ALTER TABLE assessment_items DROP CONSTRAINT IF EXISTS assessment_items_assessment_type_check;
ALTER TABLE assessment_items DROP CONSTRAINT IF EXISTS assessment_items_max_score_check;
ALTER TABLE assessment_items ADD CONSTRAINT assessment_items_assessment_type_check CHECK (assessment_type IN ('score', 'scale', 'qualitative'));

-- 12. Tabel Peserta Penilaian (assessment_participants)
CREATE TABLE IF NOT EXISTS assessment_participants (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  santri_id TEXT NOT NULL,
  created_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_assessment_participants_assessment_id ON assessment_participants (assessment_id);

-- 13. Tabel Catatan / Hasil Penilaian Santri (assessment_results)
CREATE TABLE IF NOT EXISTS assessment_results (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  santri_id TEXT NOT NULL,
  notes TEXT,
  submitted_at BIGINT,
  updated_at BIGINT,
  CONSTRAINT uq_assessment_santri UNIQUE (assessment_id, santri_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results (assessment_id);

-- 14. Tabel Nilai Per Aspek Santri (assessment_scores)
CREATE TABLE IF NOT EXISTS assessment_scores (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  santri_id TEXT NOT NULL,
  assessment_item_id TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  created_at BIGINT,
  updated_at BIGINT,
  CONSTRAINT uq_assessment_santri_item UNIQUE (assessment_id, santri_id, assessment_item_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_scores_assessment_id ON assessment_scores (assessment_id);

-- 15. Tabel Konfigurasi Organisasi & Lembaga (organization_settings)
CREATE TABLE IF NOT EXISTS organization_settings (
  user_id UUID PRIMARY KEY,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at BIGINT NOT NULL
);

-- 16. Tabel Tagihan Invoice SPP (spp_invoices)
CREATE TABLE IF NOT EXISTS spp_invoices (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  issued_date TEXT NOT NULL,
  due_date TEXT,
  recipient_name TEXT,
  status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid' | 'paid' | 'cancelled'
  total_amount NUMERIC NOT NULL DEFAULT 0,
  data JSONB NOT NULL,
  paid_at BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spp_invoices_user_id ON spp_invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_spp_invoices_status ON spp_invoices (status);
CREATE INDEX IF NOT EXISTS idx_spp_invoices_created_at ON spp_invoices (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spp_invoices_invoice_number ON spp_invoices (invoice_number);

-- 17. Tabel Penilaian Harian (Talaqqi / Setoran Ngaji)
CREATE TABLE IF NOT EXISTS daily_assessments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  santri_id TEXT NOT NULL,
  jilid_id TEXT,
  materi TEXT,
  general_notes TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CONSTRAINT uq_daily_assessment_date_santri UNIQUE (user_id, date, santri_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_assessments_user_date ON daily_assessments (user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_assessments_santri ON daily_assessments (santri_id);

CREATE TABLE IF NOT EXISTS daily_assessment_scores (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  daily_assessment_id TEXT NOT NULL REFERENCES daily_assessments(id) ON DELETE CASCADE,
  santri_id TEXT NOT NULL,
  item_label TEXT NOT NULL,
  score NUMERIC NOT NULL,
  score_type TEXT NOT NULL DEFAULT 'qualitative',
  note TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  CONSTRAINT uq_daily_score_item UNIQUE (daily_assessment_id, item_label)
);

CREATE INDEX IF NOT EXISTS idx_daily_scores_assessment ON daily_assessment_scores (daily_assessment_id);
CREATE INDEX IF NOT EXISTS idx_daily_scores_santri ON daily_assessment_scores (santri_id);

-- ==============================================================================
-- PENGATURAN ROW LEVEL SECURITY (RLS) MULTI-TENANT
-- ==============================================================================

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE spp_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE spp_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_assessment_scores ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT unnest(ARRAY[
      'classes', 'teachers', 'student_types', 'students', 'attendances', 
      'academic_years', 'spp_payments', 'savings_accounts', 'savings_payments', 
      'assessments', 'assessment_items', 'assessment_participants', 
      'assessment_results', 'assessment_scores', 'spp_invoices',
      'daily_assessments', 'daily_assessment_scores'
    ])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = tbl AND policyname = 'Users can manage their own ' || tbl
    ) THEN
      EXECUTE format(
        'CREATE POLICY "Users can manage their own %I" ON %I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
        tbl, tbl
      );
    END IF;
  END LOOP;

  -- Kebijakan khusus organization_settings (PK adalah user_id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_settings' AND policyname = 'Users can manage their own organization settings'
  ) THEN
    CREATE POLICY "Users can manage their own organization settings" 
      ON organization_settings FOR ALL 
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


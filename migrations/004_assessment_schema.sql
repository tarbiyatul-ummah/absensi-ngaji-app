-- ==============================================================================
-- SKRIP REPARASI & PEMBARUAN SCHEMA PENILAIAN SUPABASE
-- File: migrations/004_assessment_schema.sql
-- Aplikasi: Absensi & Keuangan Ngaji
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PEMBUATAN / PEMASTIAN TABEL PENILAIAN (5 TABEL)
-- ------------------------------------------------------------------------------

-- Tabel 1: Header Format Penilaian
CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  assessment_type TEXT NOT NULL DEFAULT 'score', -- 'score' | 'scale' | 'qualitative'
  minimum_score NUMERIC DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT,
  updated_at BIGINT
);

-- Tabel 2: Butir / Aspek Penilaian
CREATE TABLE IF NOT EXISTS assessment_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id TEXT NOT NULL,
  label TEXT NOT NULL,
  assessment_type TEXT NOT NULL DEFAULT 'score',
  max_score NUMERIC DEFAULT 100,
  sort_order INTEGER DEFAULT 0,
  created_at BIGINT,
  updated_at BIGINT
);

-- Tabel 3: Partisipan Santri Penilaian
CREATE TABLE IF NOT EXISTS assessment_participants (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id TEXT NOT NULL,
  santri_id TEXT NOT NULL,
  created_at BIGINT
);

-- Tabel 4: Hasil & Catatan Ulasan Santri
CREATE TABLE IF NOT EXISTS assessment_results (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id TEXT NOT NULL,
  santri_id TEXT NOT NULL,
  notes TEXT,
  submitted_at BIGINT,
  updated_at BIGINT
);

-- Tabel 5: Skor / Nilai Detail Per Aspek
CREATE TABLE IF NOT EXISTS assessment_scores (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id TEXT NOT NULL,
  santri_id TEXT NOT NULL,
  assessment_item_id TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  created_at BIGINT,
  updated_at BIGINT
);

-- ------------------------------------------------------------------------------
-- 2. ALTER TABLE: TAMBAHKAN KOLOM JIKA TABEL SUDAH ADA SEBELUMNYA (PATCH)
-- ------------------------------------------------------------------------------

-- Patch assessments
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS assessment_type TEXT DEFAULT 'score';
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS minimum_score NUMERIC DEFAULT 0;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS created_at BIGINT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS updated_at BIGINT;

-- Patch assessment_items
ALTER TABLE assessment_items ADD COLUMN IF NOT EXISTS assessment_type TEXT DEFAULT 'score';
ALTER TABLE assessment_items ADD COLUMN IF NOT EXISTS max_score NUMERIC DEFAULT 100;
ALTER TABLE assessment_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE assessment_items ADD COLUMN IF NOT EXISTS created_at BIGINT;
ALTER TABLE assessment_items ADD COLUMN IF NOT EXISTS updated_at BIGINT;

-- Patch assessment_participants
ALTER TABLE assessment_participants ADD COLUMN IF NOT EXISTS created_at BIGINT;

-- Patch assessment_results
ALTER TABLE assessment_results ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE assessment_results ADD COLUMN IF NOT EXISTS submitted_at BIGINT;
ALTER TABLE assessment_results ADD COLUMN IF NOT EXISTS updated_at BIGINT;

-- Patch assessment_scores
ALTER TABLE assessment_scores ADD COLUMN IF NOT EXISTS score NUMERIC DEFAULT 0;
ALTER TABLE assessment_scores ADD COLUMN IF NOT EXISTS created_at BIGINT;
ALTER TABLE assessment_scores ADD COLUMN IF NOT EXISTS updated_at BIGINT;

-- ------------------------------------------------------------------------------
-- 2B. PERBARUI CHECK CONSTRAINT ASSESSMENT_TYPE (MENDUKUNG 'qualitative')
-- ------------------------------------------------------------------------------

-- Hapus constraint lama jika ada (yang sebelumnya membatasi hanya 'score' dan 'scale')
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_assessment_type_check;
ALTER TABLE assessment_items DROP CONSTRAINT IF EXISTS assessment_items_assessment_type_check;
ALTER TABLE assessment_items DROP CONSTRAINT IF EXISTS assessment_items_max_score_check;

-- Buat constraint baru yang mengizinkan 'qualitative'
ALTER TABLE assessments 
  ADD CONSTRAINT assessments_assessment_type_check 
  CHECK (assessment_type IN ('score', 'scale', 'qualitative'));

ALTER TABLE assessment_items 
  ADD CONSTRAINT assessment_items_assessment_type_check 
  CHECK (assessment_type IN ('score', 'scale', 'qualitative'));

-- ------------------------------------------------------------------------------
-- 3. FOREIGN KEYS & UNIQUE CONSTRAINTS (PENTING UNTUK SUPABASE POSTGREST JOIN)
-- ------------------------------------------------------------------------------

DO $$ 
BEGIN
  -- Foreign Key assessment_items -> assessments
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessment_items_assessment_id_fkey'
  ) THEN
    ALTER TABLE assessment_items 
      ADD CONSTRAINT assessment_items_assessment_id_fkey 
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;
  END IF;

  -- Foreign Key assessment_participants -> assessments
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessment_participants_assessment_id_fkey'
  ) THEN
    ALTER TABLE assessment_participants 
      ADD CONSTRAINT assessment_participants_assessment_id_fkey 
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;
  END IF;

  -- Foreign Key assessment_results -> assessments
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessment_results_assessment_id_fkey'
  ) THEN
    ALTER TABLE assessment_results 
      ADD CONSTRAINT assessment_results_assessment_id_fkey 
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;
  END IF;

  -- Foreign Key assessment_scores -> assessments
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessment_scores_assessment_id_fkey'
  ) THEN
    ALTER TABLE assessment_scores 
      ADD CONSTRAINT assessment_scores_assessment_id_fkey 
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;
  END IF;

  -- Unique Constraint uq_assessment_santri
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_assessment_santri'
  ) THEN
    ALTER TABLE assessment_results
      ADD CONSTRAINT uq_assessment_santri UNIQUE (assessment_id, santri_id);
  END IF;

  -- Unique Constraint uq_assessment_santri_item
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_assessment_santri_item'
  ) THEN
    ALTER TABLE assessment_scores
      ADD CONSTRAINT uq_assessment_santri_item UNIQUE (assessment_id, santri_id, assessment_item_id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. INDEX PENCARIAN
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments (user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_items_assessment_id ON assessment_items (assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_participants_assessment_id ON assessment_participants (assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results (assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_assessment_id ON assessment_scores (assessment_id);

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_scores ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT unnest(ARRAY[
      'assessments', 'assessment_items', 'assessment_participants', 
      'assessment_results', 'assessment_scores'
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
END $$;

-- ------------------------------------------------------------------------------
-- 6. REFRESH SCHEMA CACHE SUPABASE
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';


-- ==============================================================================
-- Migration: 003_create_spp_invoices.sql
-- Aplikasi: Absensi & Keuangan Ngaji
-- Keterangan: Pembuatan tabel spp_invoices (Tagihan SPP Multi-Santri & Multi-Bulan),
--             indeks pencarian, dan Row Level Security (RLS)
-- ==============================================================================

-- 1. Buat Tabel spp_invoices
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

-- 2. Buat Index untuk Performa Pencarian & Filter
CREATE INDEX IF NOT EXISTS idx_spp_invoices_user_id 
  ON spp_invoices (user_id);

CREATE INDEX IF NOT EXISTS idx_spp_invoices_status 
  ON spp_invoices (status);

CREATE INDEX IF NOT EXISTS idx_spp_invoices_created_at 
  ON spp_invoices (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_spp_invoices_invoice_number 
  ON spp_invoices (invoice_number);

-- 3. Pengaturan Row Level Security (RLS)
ALTER TABLE spp_invoices ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'spp_invoices' 
    AND policyname = 'Users can view and manage their own invoices'
  ) THEN
    CREATE POLICY "Users can view and manage their own invoices" 
      ON spp_invoices 
      FOR ALL 
      USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


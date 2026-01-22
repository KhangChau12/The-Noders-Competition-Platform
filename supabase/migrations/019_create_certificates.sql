-- Migration: Create certificates table and storage bucket
-- Description: System for certificate verification with PDF/PNG upload

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verification_code VARCHAR(20) UNIQUE NOT NULL,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
  recipient_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('pdf', 'png', 'jpg', 'jpeg')),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  issued_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast verification code lookup
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_competition_id ON certificates(competition_id);

-- Create certificate_prefixes table to store prefix per competition
CREATE TABLE IF NOT EXISTS certificate_prefixes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID UNIQUE REFERENCES competitions(id) ON DELETE CASCADE,
  prefix VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificate_prefixes_competition_id ON certificate_prefixes(competition_id);

-- RLS Policies for certificates

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_prefixes ENABLE ROW LEVEL SECURITY;

-- Anyone can verify certificates (read by verification_code)
CREATE POLICY "Anyone can verify certificates"
  ON certificates
  FOR SELECT
  USING (true);

-- Admins can manage certificates
CREATE POLICY "Admins can insert certificates"
  ON certificates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update certificates"
  ON certificates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete certificates"
  ON certificates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS for certificate_prefixes
CREATE POLICY "Anyone can read certificate prefixes"
  ON certificate_prefixes
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage certificate prefixes"
  ON certificate_prefixes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create storage bucket for certificates (run this in Supabase dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true);

-- Storage policies for certificates bucket
-- Note: Run these in Supabase dashboard SQL editor

-- DROP POLICY IF EXISTS "Public can view certificates" ON storage.objects;
-- CREATE POLICY "Public can view certificates"
--   ON storage.objects
--   FOR SELECT
--   USING (bucket_id = 'certificates');

-- DROP POLICY IF EXISTS "Admins can upload certificates" ON storage.objects;
-- CREATE POLICY "Admins can upload certificates"
--   ON storage.objects
--   FOR INSERT
--   WITH CHECK (
--     bucket_id = 'certificates'
--     AND EXISTS (
--       SELECT 1 FROM public.users
--       WHERE id = auth.uid()
--       AND role = 'admin'
--     )
--   );

-- DROP POLICY IF EXISTS "Admins can delete certificates" ON storage.objects;
-- CREATE POLICY "Admins can delete certificates"
--   ON storage.objects
--   FOR DELETE
--   USING (
--     bucket_id = 'certificates'
--     AND EXISTS (
--       SELECT 1 FROM public.users
--       WHERE id = auth.uid()
--       AND role = 'admin'
--     )
--   );

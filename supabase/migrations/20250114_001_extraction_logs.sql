-- Extraction logs: track AI event extraction sessions
-- Used for debugging, audit trail, and future points attribution

CREATE TABLE extraction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles NOT NULL,

  -- Input
  image_url text NOT NULL,  -- URL of uploaded poster image
  organizer_id uuid REFERENCES organizers,  -- Target organizer for extracted events

  -- Output metrics
  extracted_count int DEFAULT 0,   -- Events extracted by AI
  published_count int DEFAULT 0,   -- Events actually published
  skipped_count int DEFAULT 0,     -- Events skipped (dupes/rejected)

  -- Raw AI response for debugging
  raw_response jsonb,

  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'completed')),

  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_extraction_logs_user ON extraction_logs(user_id);
CREATE INDEX idx_extraction_logs_status ON extraction_logs(status);
CREATE INDEX idx_extraction_logs_created ON extraction_logs(created_at DESC);

COMMENT ON TABLE extraction_logs IS 'Tracks AI event extraction sessions for audit and future points system';

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE extraction_logs ENABLE ROW LEVEL SECURITY;

-- Users can see their own logs, admins see all
CREATE POLICY "extraction_logs_select"
ON extraction_logs FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Contributors and admins can insert
CREATE POLICY "extraction_logs_insert"
ON extraction_logs FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'contributor'))
);

-- Only the creator or admin can update (to mark status changes)
CREATE POLICY "extraction_logs_update"
ON extraction_logs FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- STORAGE BUCKET FOR EXTRACTION UPLOADS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'extraction-uploads',
  'extraction-uploads',
  true,
  10485760,  -- 10MB for poster images
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for extraction uploads
CREATE POLICY "Privileged users can upload extraction images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'extraction-uploads' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'contributor'))
);

CREATE POLICY "Anyone can view extraction images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'extraction-uploads');

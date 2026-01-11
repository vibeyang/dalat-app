-- Organizers: venues and organizations that host events
-- Examples: Phố Bên Đồi, The Married Beans, etc.

CREATE TABLE organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  website_url text,
  facebook_url text,
  instagram_url text,

  -- Verification and priority placement
  is_verified boolean DEFAULT false,
  priority_score int DEFAULT 0,  -- Higher = more prominent in listings

  -- Ownership linkage (optional - organizer can exist without user account)
  owner_id uuid REFERENCES profiles,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_organizers_slug ON organizers(slug);
CREATE INDEX idx_organizers_verified ON organizers(is_verified) WHERE is_verified = true;
CREATE INDEX idx_organizers_owner ON organizers(owner_id) WHERE owner_id IS NOT NULL;

-- Updated_at trigger (reuses existing function)
CREATE TRIGGER organizers_updated_at BEFORE UPDATE ON organizers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "organizers_select_public"
ON organizers FOR SELECT USING (true);

-- Only admins can create organizers
CREATE POLICY "organizers_insert_admin"
ON organizers FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admins or owner can update
CREATE POLICY "organizers_update_admin_or_owner"
ON organizers FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR owner_id = auth.uid()
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  OR owner_id = auth.uid()
);

-- Only admins can delete
CREATE POLICY "organizers_delete_admin"
ON organizers FOR DELETE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organizer-logos',
  'organizer-logos',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for organizer logos
CREATE POLICY "Admin can upload organizer logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organizer-logos' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can view organizer logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organizer-logos');

CREATE POLICY "Admin can update organizer logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organizer-logos' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin can delete organizer logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organizer-logos' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

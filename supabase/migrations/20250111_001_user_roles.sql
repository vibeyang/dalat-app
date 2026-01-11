-- User roles for access control
-- Roles: user (default), contributor (can submit via AI), admin (full access)

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'contributor'));

-- Index for role-based queries (only index non-default roles)
CREATE INDEX idx_profiles_role ON profiles(role) WHERE role IN ('admin', 'contributor');

-- Comment for clarity
COMMENT ON COLUMN profiles.role IS 'User role: user (default), contributor (can submit via AI extraction), admin (full access)';

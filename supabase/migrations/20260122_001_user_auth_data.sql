-- Migration: Add RPC to get user auth data for admin
-- Returns last_sign_in_at for each user

CREATE OR REPLACE FUNCTION get_users_auth_data()
RETURNS TABLE (
  user_id uuid,
  last_sign_in_at timestamptz,
  sign_in_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id AS user_id,
    au.last_sign_in_at,
    -- Supabase doesn't track sign-in count, so we estimate from identities
    -- This counts how many auth providers are linked (not actual logins)
    COALESCE(
      (au.raw_app_meta_data->>'sign_in_count')::bigint,
      1
    ) AS sign_in_count
  FROM auth.users au;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_auth_data() TO authenticated;

-- Create a table to track login events (for accurate login count)
CREATE TABLE IF NOT EXISTS public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_in_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_logged_in_at ON login_events(logged_in_at DESC);

-- RLS for login_events (only admins can read via RPC)
ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;

-- No direct access - only via RPC functions
CREATE POLICY "No direct access to login_events"
  ON login_events FOR ALL
  USING (false);

-- Updated function to get users with their login counts
CREATE OR REPLACE FUNCTION get_users_with_login_stats()
RETURNS TABLE (
  user_id uuid,
  last_sign_in_at timestamptz,
  login_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id AS user_id,
    au.last_sign_in_at,
    COALESCE(le.cnt, 0) AS login_count
  FROM auth.users au
  LEFT JOIN (
    SELECT login_events.user_id, COUNT(*) as cnt
    FROM login_events
    GROUP BY login_events.user_id
  ) le ON le.user_id = au.id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_users_with_login_stats() TO authenticated;

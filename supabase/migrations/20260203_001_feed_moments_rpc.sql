-- Migration: Feed moments RPC
-- Description: Creates RPC function to fetch moments across all past events for the content-first feed

-- RPC function to get moments for the feed (cross-event, past events only)
CREATE OR REPLACE FUNCTION get_feed_moments(
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0,
  p_content_types text[] DEFAULT ARRAY['photo', 'video']
)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  user_id uuid,
  content_type text,
  media_url text,
  text_content text,
  created_at timestamptz,
  username text,
  display_name text,
  avatar_url text,
  event_slug text,
  event_title text,
  event_image_url text,
  event_starts_at timestamptz,
  event_location_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.event_id,
    m.user_id,
    m.content_type::text,
    m.media_url,
    m.text_content,
    m.created_at,
    p.username,
    p.display_name,
    p.avatar_url,
    e.slug as event_slug,
    e.title as event_title,
    e.image_url as event_image_url,
    e.starts_at as event_starts_at,
    e.location_name as event_location_name
  FROM moments m
  JOIN profiles p ON p.id = m.user_id
  JOIN events e ON e.id = m.event_id
  WHERE m.status = 'published'
    AND m.content_type::text = ANY(p_content_types)
    AND e.status = 'published'
    AND e.starts_at < now()  -- Only past events
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Grant execute to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_feed_moments(int, int, text[]) TO anon, authenticated;

COMMENT ON FUNCTION get_feed_moments IS 'Fetches moments from past events for the content-first feed. Filters by content type (photo/video by default, excludes text-only).';

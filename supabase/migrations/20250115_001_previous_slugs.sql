-- Add previous_slugs column to track old slugs for redirects
-- This allows reminder notifications and shared links to still work after slug changes

ALTER TABLE events
ADD COLUMN IF NOT EXISTS previous_slugs text[] DEFAULT '{}';

-- Create index for efficient lookup of old slugs
CREATE INDEX IF NOT EXISTS idx_events_previous_slugs
ON events USING GIN (previous_slugs);

-- Add comment for documentation
COMMENT ON COLUMN events.previous_slugs IS 'Array of previous slugs this event had, used for redirects';

-- Add organizer_id to events
-- Optional FK - maintains backward compatibility with existing events

ALTER TABLE events ADD COLUMN organizer_id uuid REFERENCES organizers;

-- Index for "more from this organizer" queries
CREATE INDEX idx_events_organizer ON events(organizer_id) WHERE organizer_id IS NOT NULL;

COMMENT ON COLUMN events.organizer_id IS 'Optional link to official organizer/venue. NULL for user-created events.';

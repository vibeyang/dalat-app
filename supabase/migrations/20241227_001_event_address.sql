-- Add physical address field to events for Grab drivers and accurate calendar locations
ALTER TABLE events ADD COLUMN address text;

-- Add comment for clarity
COMMENT ON COLUMN events.address IS 'Physical street address for navigation (e.g., for Grab drivers)';

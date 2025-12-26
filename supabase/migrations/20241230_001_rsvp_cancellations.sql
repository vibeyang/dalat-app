-- Store RSVP cancellation reasons for analytics
CREATE TABLE IF NOT EXISTS rsvp_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles ON DELETE CASCADE DEFAULT auth.uid(),
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE rsvp_cancellations ENABLE ROW LEVEL SECURITY;

-- Users can insert their own cancellation reasons
CREATE POLICY "Users can insert own cancellation reasons"
  ON rsvp_cancellations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Event creators can view cancellation reasons for their events
CREATE POLICY "Event creators can view cancellation reasons"
  ON rsvp_cancellations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = rsvp_cancellations.event_id
      AND events.created_by = auth.uid()
    )
  );

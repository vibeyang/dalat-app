-- Push subscriptions for web push notifications
-- Each user can have multiple subscriptions (one per device/browser)

CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Each endpoint should be unique per user
  UNIQUE (user_id, endpoint)
);

-- Index for quick lookups by user
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Auto-update updated_at
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
CREATE POLICY "push_subscriptions_select_own"
ON push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own subscriptions
CREATE POLICY "push_subscriptions_insert_own"
ON push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own subscriptions
CREATE POLICY "push_subscriptions_delete_own"
ON push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- Service role needs full access to send notifications
-- This is handled by using service role key in API routes

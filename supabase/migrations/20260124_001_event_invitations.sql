-- Event Invitations System
-- Allows organizers to invite guests via email with RSVP functionality

-- ============================================
-- Tables
-- ============================================

-- Main invitations table
CREATE TABLE event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES profiles(id) NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  token UUID UNIQUE DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'responded')),
  rsvp_status TEXT CHECK (rsvp_status IN ('going', 'cancelled', 'interested')),
  claimed_by UUID REFERENCES profiles(id),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, email)
);

CREATE INDEX idx_invitations_event ON event_invitations(event_id);
CREATE INDEX idx_invitations_token ON event_invitations(token);
CREATE INDEX idx_invitations_email ON event_invitations(email);
CREATE INDEX idx_invitations_claimed ON event_invitations(claimed_by);
CREATE INDEX idx_invitations_invited_by ON event_invitations(invited_by);

-- Organizer's contact book (auto-saved from invites)
CREATE TABLE organizer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  last_invited_at TIMESTAMPTZ DEFAULT now(),
  invite_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, email)
);

CREATE INDEX idx_contacts_owner ON organizer_contacts(owner_id);

-- Invite quota tracking (daily resets)
CREATE TABLE invite_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  daily_count INT DEFAULT 0,
  weekly_count INT DEFAULT 0,
  week_start DATE DEFAULT date_trunc('week', CURRENT_DATE)::date,
  UNIQUE(user_id, date)
);

CREATE INDEX idx_quotas_user ON invite_quotas(user_id);

-- ============================================
-- Functions
-- ============================================

-- Check if user can send N invites (quota check)
CREATE OR REPLACE FUNCTION check_invite_quota(p_user_id UUID, p_count INT DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_daily_limit INT;
  v_weekly_limit INT;
  v_daily_used INT;
  v_weekly_used INT;
BEGIN
  -- Get user role
  SELECT role INTO v_role FROM profiles WHERE id = p_user_id;

  -- Set limits based on role
  CASE v_role
    WHEN 'admin' THEN
      RETURN jsonb_build_object('allowed', true, 'remaining_daily', 999999, 'remaining_weekly', 999999);
    WHEN 'organizer_verified' THEN
      v_daily_limit := 50;
      v_weekly_limit := 200;
    WHEN 'organizer_pending' THEN
      v_daily_limit := 10;
      v_weekly_limit := 50;
    ELSE
      -- Regular users cannot send invites
      RETURN jsonb_build_object('allowed', false, 'reason', 'unauthorized', 'remaining_daily', 0, 'remaining_weekly', 0);
  END CASE;

  -- Get current daily usage
  SELECT COALESCE(daily_count, 0) INTO v_daily_used
  FROM invite_quotas
  WHERE user_id = p_user_id AND date = CURRENT_DATE;

  IF v_daily_used IS NULL THEN
    v_daily_used := 0;
  END IF;

  -- Get current weekly usage
  SELECT COALESCE(SUM(daily_count), 0) INTO v_weekly_used
  FROM invite_quotas
  WHERE user_id = p_user_id
    AND date >= date_trunc('week', CURRENT_DATE)::date;

  -- Check daily limit
  IF v_daily_used + p_count > v_daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit_exceeded',
      'remaining_daily', GREATEST(0, v_daily_limit - v_daily_used),
      'remaining_weekly', GREATEST(0, v_weekly_limit - v_weekly_used)
    );
  END IF;

  -- Check weekly limit
  IF v_weekly_used + p_count > v_weekly_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'weekly_limit_exceeded',
      'remaining_daily', GREATEST(0, v_daily_limit - v_daily_used),
      'remaining_weekly', GREATEST(0, v_weekly_limit - v_weekly_used)
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining_daily', v_daily_limit - v_daily_used - p_count,
    'remaining_weekly', v_weekly_limit - v_weekly_used - p_count
  );
END;
$$;

-- Increment invite quota after sending
CREATE OR REPLACE FUNCTION increment_invite_quota(p_user_id UUID, p_count INT DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO invite_quotas (user_id, date, daily_count, weekly_count, week_start)
  VALUES (p_user_id, CURRENT_DATE, p_count, p_count, date_trunc('week', CURRENT_DATE)::date)
  ON CONFLICT (user_id, date) DO UPDATE
  SET daily_count = invite_quotas.daily_count + p_count,
      weekly_count = invite_quotas.weekly_count + p_count;
END;
$$;

-- Auto-link invitation to existing user on creation
CREATE OR REPLACE FUNCTION link_invitation_to_existing_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_user_id UUID;
BEGIN
  -- Check if email already has an account
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(NEW.email)
  LIMIT 1;

  IF v_existing_user_id IS NOT NULL THEN
    NEW.claimed_by := v_existing_user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_invitation_created
  BEFORE INSERT ON event_invitations
  FOR EACH ROW EXECUTE FUNCTION link_invitation_to_existing_user();

-- Auto-link invitations when user signs up
CREATE OR REPLACE FUNCTION link_invitations_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Get the email from auth.users
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = NEW.id;

  IF v_user_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Link unclaimed invitations to this new user
  UPDATE event_invitations
  SET claimed_by = NEW.id
  WHERE LOWER(email) = LOWER(v_user_email)
    AND claimed_by IS NULL;

  -- Auto-create RSVPs for "going" invitations
  INSERT INTO rsvps (event_id, user_id, status, plus_ones)
  SELECT event_id, NEW.id, 'going', 0
  FROM event_invitations
  WHERE claimed_by = NEW.id
    AND rsvp_status = 'going'
  ON CONFLICT (event_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_link_invitations
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION link_invitations_on_signup();

-- Save/update contact when sending invite
CREATE OR REPLACE FUNCTION upsert_organizer_contact(
  p_owner_id UUID,
  p_email TEXT,
  p_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO organizer_contacts (owner_id, email, name, last_invited_at, invite_count)
  VALUES (p_owner_id, LOWER(p_email), p_name, now(), 1)
  ON CONFLICT (owner_id, email) DO UPDATE
  SET name = COALESCE(EXCLUDED.name, organizer_contacts.name),
      last_invited_at = now(),
      invite_count = organizer_contacts.invite_count + 1;
END;
$$;

-- Get invitation counts for an event
CREATE OR REPLACE FUNCTION get_invitation_counts(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'sent', COUNT(*) FILTER (WHERE status = 'sent'),
    'viewed', COUNT(*) FILTER (WHERE status = 'viewed'),
    'responded', COUNT(*) FILTER (WHERE status = 'responded'),
    'going', COUNT(*) FILTER (WHERE rsvp_status = 'going'),
    'not_going', COUNT(*) FILTER (WHERE rsvp_status = 'cancelled'),
    'maybe', COUNT(*) FILTER (WHERE rsvp_status = 'interested')
  ) INTO v_result
  FROM event_invitations
  WHERE event_id = p_event_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_quotas ENABLE ROW LEVEL SECURITY;

-- event_invitations policies
CREATE POLICY "Event creators can view invitations for their events"
  ON event_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_invitations.event_id
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view invitations they sent"
  ON event_invitations FOR SELECT
  USING (invited_by = auth.uid());

CREATE POLICY "Users can view invitations claimed by them"
  ON event_invitations FOR SELECT
  USING (claimed_by = auth.uid());

CREATE POLICY "Anyone can view invitation by token for RSVP"
  ON event_invitations FOR SELECT
  USING (true);

CREATE POLICY "Event creators can create invitations"
  ON event_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Inviters can update their invitations"
  ON event_invitations FOR UPDATE
  USING (invited_by = auth.uid());

CREATE POLICY "Anyone can update invitation RSVP status via token"
  ON event_invitations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Inviters can delete their invitations"
  ON event_invitations FOR DELETE
  USING (invited_by = auth.uid());

-- organizer_contacts policies
CREATE POLICY "Users can view their own contacts"
  ON organizer_contacts FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own contacts"
  ON organizer_contacts FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own contacts"
  ON organizer_contacts FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own contacts"
  ON organizer_contacts FOR DELETE
  USING (owner_id = auth.uid());

-- invite_quotas policies (read-only for users, writes via SECURITY DEFINER functions)
CREATE POLICY "Users can view their own quota"
  ON invite_quotas FOR SELECT
  USING (user_id = auth.uid());

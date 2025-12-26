-- Reset created_at when re-RSVPing so users go to end of waitlist if they leave and rejoin
CREATE OR REPLACE FUNCTION rsvp_event(p_event_id uuid, p_plus_ones int DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_capacity int;
  v_status text;
  v_event_status text;
  v_spots_taken_excl_me int;
  v_rsvp_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_plus_ones < 0 THEN
    RAISE EXCEPTION 'invalid_plus_ones';
  END IF;

  -- Lock event row to serialize capacity decisions
  SELECT capacity, status
  INTO v_capacity, v_event_status
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_not_found';
  END IF;

  IF v_event_status <> 'published' THEN
    RAISE EXCEPTION 'event_not_published';
  END IF;

  -- Spots taken EXCLUDING caller (so +1 updates work correctly)
  SELECT coalesce(sum(1 + plus_ones), 0)
  INTO v_spots_taken_excl_me
  FROM rsvps
  WHERE event_id = p_event_id
    AND status = 'going'
    AND user_id <> v_uid;

  IF v_capacity IS NULL OR (v_spots_taken_excl_me + 1 + p_plus_ones) <= v_capacity THEN
    v_status := 'going';
  ELSE
    v_status := 'waitlist';
  END IF;

  INSERT INTO rsvps (event_id, user_id, status, plus_ones)
  VALUES (p_event_id, v_uid, v_status, p_plus_ones)
  ON CONFLICT (event_id, user_id) DO UPDATE
    SET status = EXCLUDED.status,
        plus_ones = EXCLUDED.plus_ones,
        created_at = now()
  RETURNING id INTO v_rsvp_id;

  RETURN jsonb_build_object(
    'ok', true,
    'status', v_status,
    'rsvp_id', v_rsvp_id
  );
END;
$$;

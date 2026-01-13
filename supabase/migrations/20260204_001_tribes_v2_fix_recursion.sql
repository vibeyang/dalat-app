-- ============================================================
-- FIX: Infinite recursion in tribe_members RLS policies
-- ============================================================
-- Problem: Policies on tribe_members query tribe_members, causing recursion
-- Solution: Use SECURITY DEFINER functions that bypass RLS

-- First, recreate helper functions to ensure they exist and bypass RLS
CREATE OR REPLACE FUNCTION is_tribe_member(p_tribe_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tribe_members
    WHERE tribe_id = p_tribe_id
    AND user_id = p_user_id
    AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_tribe_admin(p_tribe_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tribe_members
    WHERE tribe_id = p_tribe_id
    AND user_id = p_user_id
    AND role IN ('leader', 'admin')
    AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM tribes
    WHERE id = p_tribe_id
    AND created_by = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_tribe_creator(p_tribe_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tribes
    WHERE id = p_tribe_id
    AND created_by = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Drop all existing policies
DROP POLICY IF EXISTS "tribe_members_select" ON tribe_members;
DROP POLICY IF EXISTS "tribe_members_insert" ON tribe_members;
DROP POLICY IF EXISTS "tribe_members_update" ON tribe_members;
DROP POLICY IF EXISTS "tribe_members_delete" ON tribe_members;

-- Recreate policies using SECURITY DEFINER functions (no recursion)
CREATE POLICY "tribe_members_select" ON tribe_members FOR SELECT USING (
  user_id = auth.uid()
  OR is_tribe_member(tribe_id, auth.uid())
  OR is_tribe_creator(tribe_id, auth.uid())
);

CREATE POLICY "tribe_members_insert" ON tribe_members FOR INSERT WITH CHECK (
  -- User joining a public tribe
  (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM tribes WHERE id = tribe_id AND access_type = 'public'
  ))
  -- Admin adding members
  OR is_tribe_admin(tribe_id, auth.uid())
  -- Creator adding members
  OR is_tribe_creator(tribe_id, auth.uid())
);

CREATE POLICY "tribe_members_update" ON tribe_members FOR UPDATE USING (
  user_id = auth.uid()
  OR is_tribe_admin(tribe_id, auth.uid())
  OR is_tribe_creator(tribe_id, auth.uid())
);

CREATE POLICY "tribe_members_delete" ON tribe_members FOR DELETE USING (
  user_id = auth.uid()
  OR is_tribe_admin(tribe_id, auth.uid())
  OR is_tribe_creator(tribe_id, auth.uid())
);

-- Also fix tribe_requests policies that reference tribe_members
DROP POLICY IF EXISTS "tribe_requests_select" ON tribe_requests;
DROP POLICY IF EXISTS "tribe_requests_update" ON tribe_requests;

CREATE POLICY "tribe_requests_select" ON tribe_requests FOR SELECT USING (
  user_id = auth.uid()
  OR is_tribe_admin(tribe_id, auth.uid())
  OR is_tribe_creator(tribe_id, auth.uid())
);

CREATE POLICY "tribe_requests_update" ON tribe_requests FOR UPDATE USING (
  (user_id = auth.uid() AND status = 'pending')
  OR is_tribe_admin(tribe_id, auth.uid())
  OR is_tribe_creator(tribe_id, auth.uid())
);

-- Fix tribes visibility policy
DROP POLICY IF EXISTS "tribes_select_visible" ON tribes;
CREATE POLICY "tribes_select_visible" ON tribes FOR SELECT USING (
  access_type IN ('public', 'request', 'invite_only')
  OR created_by = auth.uid()
  OR is_tribe_member(id, auth.uid())
);

-- ============================================================================
-- INTERNAL MESSAGING SYSTEM - PHASE 1 & 2 SETUP
-- Access Control, RLS Policies, and Helper Functions
-- ============================================================================

-- ============================================================================
-- PART 1: HELPER FUNCTIONS
-- ============================================================================

-- Function to get all internal staff members
CREATE OR REPLACE FUNCTION public.get_internal_staff()
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  email text,
  role app_role,
  avatar_url text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    p.id,
    p.full_name,
    p.username,
    au.email,
    ur.role,
    p.avatar_url,
    p.is_active
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  JOIN auth.users au ON au.id = p.id
  WHERE ur.role IN ('powerdesk', 'website_manager', 'sales', 'finance', 'inspection', 'dealer')
    AND p.is_active = true
  ORDER BY p.full_name;
$$;

-- Function to get all dealers for PowerDesk
CREATE OR REPLACE FUNCTION public.get_dealers_list()
RETURNS TABLE (
  id uuid,
  dealership_name text,
  full_name text,
  username text,
  email text,
  avatar_url text,
  logo_url text,
  city_name text,
  total_listings bigint,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    dp.dealership_name,
    p.full_name,
    p.username,
    au.email,
    p.avatar_url,
    dp.logo_url,
    c.name as city_name,
    COALESCE(
      (SELECT COUNT(*) FROM car_listings WHERE seller_id = p.id AND status = 'live'),
      0
    ) as total_listings,
    p.is_active
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  JOIN dealer_profiles dp ON dp.id = p.id
  JOIN auth.users au ON au.id = p.id
  LEFT JOIN cities c ON c.id = dp.city_id
  WHERE ur.role = 'dealer'
    AND p.is_active = true
  ORDER BY dp.dealership_name;
$$;

-- Function to check if conversation exists between users
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(
  participant_ids uuid[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_conversation_id uuid;
  new_conversation_id uuid;
  participant_id uuid;
BEGIN
  -- Check if a direct conversation already exists with exactly these participants
  SELECT c.id INTO existing_conversation_id
  FROM conversations c
  WHERE c.conversation_type = 'direct'
    AND (
      SELECT COUNT(*)
      FROM conversation_participants cp
      WHERE cp.conversation_id = c.id
    ) = array_length(participant_ids, 1)
    AND NOT EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = c.id
        AND cp.user_id != ALL(participant_ids)
    )
    AND (
      SELECT COUNT(*)
      FROM conversation_participants cp
      WHERE cp.conversation_id = c.id
        AND cp.user_id = ANY(participant_ids)
    ) = array_length(participant_ids, 1)
  LIMIT 1;

  -- If conversation exists, return it
  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (conversation_type, created_by)
  VALUES ('direct', auth.uid())
  RETURNING id INTO new_conversation_id;

  -- Add participants
  FOREACH participant_id IN ARRAY participant_ids
  LOOP
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (new_conversation_id, participant_id);
  END LOOP;

  RETURN new_conversation_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_internal_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dealers_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(uuid[]) TO authenticated;

-- ============================================================================
-- PART 2: RLS POLICIES FOR CONVERSATIONS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Internal staff can view conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "PowerDesk can view all conversations" ON conversations;

-- Internal staff (including dealers) can view their conversations
CREATE POLICY "Internal staff can view conversations"
ON conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM conversation_participants cp
    WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'powerdesk'::app_role) OR
    has_role(auth.uid(), 'website_manager'::app_role) OR
    has_role(auth.uid(), 'dealer'::app_role) OR
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'inspection'::app_role)
  )
);

-- Internal staff can create conversations
CREATE POLICY "Internal staff can create conversations"
ON conversations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (
    has_role(auth.uid(), 'powerdesk'::app_role) OR
    has_role(auth.uid(), 'website_manager'::app_role) OR
    has_role(auth.uid(), 'dealer'::app_role) OR
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'inspection'::app_role)
  )
);

-- Users can update their conversations (for title, etc.)
CREATE POLICY "Internal staff can update conversations"
ON conversations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM conversation_participants cp
    WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
  )
);

-- ============================================================================
-- PART 3: RLS POLICIES FOR CONVERSATION_PARTICIPANTS
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "PowerDesk can view all participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Conversation creators can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;

-- Users can view participants of their conversations
CREATE POLICY "Internal staff can view participants"
ON conversation_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
  )
);

-- Conversation creators can add participants
CREATE POLICY "Internal staff can add participants"
ON conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM conversations
    WHERE conversations.id = conversation_participants.conversation_id
      AND conversations.created_by = auth.uid()
  )
);

-- Users can update their own participant record (last_read_at, is_muted)
CREATE POLICY "Internal staff can update own participant record"
ON conversation_participants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can leave conversations
CREATE POLICY "Internal staff can leave conversations"
ON conversation_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- PART 4: RLS POLICIES FOR MESSAGES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "PowerDesk can view all messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Users can view messages in their conversations
CREATE POLICY "Internal staff can view messages"
ON messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
  )
  AND is_deleted = false
);

-- Users can send messages to their conversations
CREATE POLICY "Internal staff can send messages"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
  )
  AND sender_id = auth.uid()
);

-- Users can update their own messages (for edit functionality)
CREATE POLICY "Internal staff can update own messages"
ON messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

-- Users can soft delete their own messages
CREATE POLICY "Internal staff can delete own messages"
ON messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

-- ============================================================================
-- PART 5: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_conversation_sent 
ON messages(conversation_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender 
ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user 
ON conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation 
ON conversation_participants(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
ON conversations(created_by);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test get_internal_staff function
SELECT * FROM get_internal_staff() LIMIT 5;

-- Test get_dealers_list function
SELECT * FROM get_dealers_list() LIMIT 5;

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('conversations', 'conversation_participants', 'messages')
ORDER BY tablename, policyname;

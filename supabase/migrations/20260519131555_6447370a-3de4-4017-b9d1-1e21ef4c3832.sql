
-- 1. Subscriptions: only backend (service role) may write
DROP POLICY IF EXISTS "own sub upsert" ON public.subscriptions;
DROP POLICY IF EXISTS "own sub update" ON public.subscriptions;

-- 2. Progress events: prevent post-hoc tampering and cap XP per insert
DROP POLICY IF EXISTS "own progress update" ON public.progress_events;
DROP POLICY IF EXISTS "own progress delete" ON public.progress_events;

-- Tighten insert: cap xp to a sane per-event maximum (anti-cheat)
DROP POLICY IF EXISTS "own progress insert" ON public.progress_events;
CREATE POLICY "own progress insert"
ON public.progress_events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND xp >= 0
  AND xp <= 100
  AND kind IN ('study','quiz','lesson','tutor','voice','note','classroom')
);

-- 3. Profiles: allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- 4. Realtime channel access: restrict to authenticated users on allowed topics
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can read classroom topics" ON realtime.messages;
CREATE POLICY "authenticated can read classroom topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'classroom:%')
);

DROP POLICY IF EXISTS "authenticated can send presence on classroom topics" ON realtime.messages;
CREATE POLICY "authenticated can send presence on classroom topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() LIKE 'classroom:%')
);

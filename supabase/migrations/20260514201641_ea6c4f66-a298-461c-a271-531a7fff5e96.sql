
-- progress_events
CREATE TABLE public.progress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  subject TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.progress_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress select" ON public.progress_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own progress insert" ON public.progress_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own progress update" ON public.progress_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own progress delete" ON public.progress_events FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_progress_user_created ON public.progress_events(user_id, created_at DESC);

-- classroom_messages
CREATE TABLE public.classroom_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room TEXT NOT NULL DEFAULT 'main',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classroom_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read messages" ON public.classroom_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "own message insert" ON public.classroom_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own message delete" ON public.classroom_messages FOR DELETE USING (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_messages;

-- proctoring_events
CREATE TABLE public.proctoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.proctoring_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own proctor select" ON public.proctoring_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own proctor insert" ON public.proctoring_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'inactive',
  provider TEXT,
  external_id TEXT,
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sub select" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own sub upsert" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sub update" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

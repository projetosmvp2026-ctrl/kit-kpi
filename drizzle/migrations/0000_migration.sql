CREATE TABLE public.almox_state (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.almox_state TO anon, authenticated;
GRANT ALL ON public.almox_state TO service_role;
ALTER TABLE public.almox_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read state" ON public.almox_state FOR SELECT TO anon, authenticated USING (id = 'main');
CREATE POLICY "insert state" ON public.almox_state FOR INSERT TO anon, authenticated WITH CHECK (id = 'main');
CREATE POLICY "update state" ON public.almox_state FOR UPDATE TO anon, authenticated USING (id = 'main') WITH CHECK (id = 'main');
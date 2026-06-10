
CREATE TABLE public.bus_locations (
  bus_id TEXT PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'inactive',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bus_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bus locations"
  ON public.bus_locations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert bus locations"
  ON public.bus_locations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update bus locations"
  ON public.bus_locations FOR UPDATE
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_locations;
ALTER TABLE public.bus_locations REPLICA IDENTITY FULL;

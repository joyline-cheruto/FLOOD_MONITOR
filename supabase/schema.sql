-- Flood Monitor Kenya: database schema (Supabase / PostgreSQL + PostGIS)
-- Run this whole file in the Supabase SQL editor.

create extension if not exists postgis;

-- ---------------------------------------------------------------
-- incidents
-- ---------------------------------------------------------------
create table if not exists public.incidents (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in (
                  'flash_flood', 'river_overflow', 'urban_flooding',
                  'dam_breach', 'landslide', 'road_cut')),
  severity      text not null default 'medium'
                  check (severity in ('low', 'medium', 'high', 'critical')),
  status        text not null default 'unconfirmed'
                  check (status in ('unconfirmed', 'likely', 'confirmed')),
  confidence    int  not null default 30 check (confidence between 0 and 100),
  title         text not null,
  summary       text,
  county        text not null,
  location_text text,
  lat           double precision not null check (lat between -5 and 5.5),
  lng           double precision not null check (lng between 33 and 42.5),
  -- how exact the coordinates are: exact point, ward/sub-county, or county centroid
  precision     text not null default 'county'
                  check (precision in ('exact', 'area', 'county')),
  geom          geography(Point, 4326)
                  generated always as (
                    st_setsrid(st_makepoint(lng, lat), 4326)::geography
                  ) stored,
  source_name   text,
  source_url    text,
  origin        text not null default 'manual'
                  check (origin in ('manual', 'citizen', 'news', 'official')),
  -- citizen reports stay hidden until a moderator sets published = true
  published     boolean not null default false,
  -- seed rows are labelled so they are never mistaken for real events
  is_sample     boolean not null default false,
  occurred_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists incidents_geom_idx     on public.incidents using gist (geom);
create index if not exists incidents_created_idx  on public.incidents (created_at desc);
create index if not exists incidents_county_idx   on public.incidents (county);

-- ---------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------
alter table public.incidents enable row level security;

-- Anyone can read published incidents.
drop policy if exists "public read published" on public.incidents;
create policy "public read published"
  on public.incidents for select
  using (published = true);

-- Anyone can submit a citizen report, but only as an unpublished,
-- unconfirmed row. A moderator publishes it from the Supabase dashboard
-- (or with the service role key).
drop policy if exists "public submit citizen report" on public.incidents;
create policy "public submit citizen report"
  on public.incidents for insert
  with check (
    origin = 'citizen'
    and published = false
    and status = 'unconfirmed'
    and is_sample = false
    and confidence <= 30
  );

-- ---------------------------------------------------------------
-- Realtime: push new and updated incidents to the browser
-- ---------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.incidents;
exception when duplicate_object then
  null;
end $$;

-- ---------------------------------------------------------------
-- Nearby incidents (used by the detail drawer)
-- ---------------------------------------------------------------
create or replace function public.incidents_nearby(
  p_incident_id uuid,
  p_radius_m    int default 15000,
  p_limit       int default 5
)
returns setof public.incidents
language sql
stable
as $$
  select i.*
  from public.incidents i
  join public.incidents src on src.id = p_incident_id
  where i.id <> src.id
    and i.published = true
    and st_dwithin(i.geom, src.geom, p_radius_m)
  order by st_distance(i.geom, src.geom)
  limit p_limit;
$$;

-- ---------------------------------------------------------------
-- SAMPLE DATA: invented rows so the map is not empty on first run.
-- They are flagged is_sample = true and the UI shows a SAMPLE badge.
-- Delete them before launch:  delete from incidents where is_sample;
-- ---------------------------------------------------------------
insert into public.incidents
  (type, severity, status, confidence, title, summary, county, location_text,
   lat, lng, precision, source_name, origin, published, is_sample, occurred_at)
values
  ('urban_flooding', 'high', 'unconfirmed', 35,
   'SAMPLE: Flooding reported along a Nairobi estate road',
   'Sample record for testing the map. Not a real event.',
   'Nairobi', 'Nairobi', -1.2864, 36.8172, 'county',
   'Sample', 'manual', true, true, now() - interval '2 hours'),
  ('river_overflow', 'critical', 'likely', 60,
   'SAMPLE: River bursts banks in Tana River County',
   'Sample record for testing the map. Not a real event.',
   'Tana River', 'Hola', -1.5000, 40.0300, 'area',
   'Sample', 'manual', true, true, now() - interval '5 hours'),
  ('flash_flood', 'medium', 'unconfirmed', 30,
   'SAMPLE: Flash flood cuts a road in Kajiado',
   'Sample record for testing the map. Not a real event.',
   'Kajiado', 'Kajiado', -1.8520, 36.7820, 'county',
   'Sample', 'manual', true, true, now() - interval '9 hours'),
  ('river_overflow', 'high', 'unconfirmed', 40,
   'SAMPLE: Rising water near Budalangi',
   'Sample record for testing the map. Not a real event.',
   'Busia', 'Budalangi', 0.1100, 34.0000, 'area',
   'Sample', 'manual', true, true, now() - interval '20 hours'),
  ('landslide', 'medium', 'unconfirmed', 30,
   'SAMPLE: Landslide after heavy rain in Murang''a',
   'Sample record for testing the map. Not a real event.',
   'Murang''a', 'Murang''a', -0.7210, 37.1520, 'county',
   'Sample', 'manual', true, true, now() - interval '30 hours');

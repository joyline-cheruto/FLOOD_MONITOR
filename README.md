# Flood Monitor Kenya (starter)

A live map and feed of flood incidents for Kenya.

**Stack:** Next.js 14 (App Router) + Tailwind, Leaflet with marker clustering, Supabase (PostgreSQL + PostGIS, Realtime).

This is build step 1: database, live map, feed, detail drawer and a citizen report form. News ingestion, AI extraction, rainfall/river risk layers and SMS alerts come next.

## Run it

1. **Create a Supabase project** at supabase.com (the free tier is enough).
2. In the Supabase dashboard open **SQL Editor**, paste all of `supabase/schema.sql` and run it. This creates the table, security rules, realtime, a "nearby incidents" function and five labelled SAMPLE rows.
3. Copy `.env.example` to `.env.local` and fill in the project URL and anon key from **Project Settings > API**.
4. Install and start:

   ```bash
   npm install
   npm run dev
   ```

5. Open http://localhost:3000. You should see five sample pins.

## How reports work

- Anyone can submit a report with the **Report a flood** button. It is saved as `published = false`, `status = unconfirmed`, so it does **not** appear on the map yet.
- To approve one: Supabase dashboard > Table Editor > `incidents` > set `published` to true. You can also raise `status` and `confidence` there if you have verified it.
- The map updates for everyone through Realtime when a row is published.

## Before you go public

- Delete the sample rows: `delete from incidents where is_sample;`
- Keep the "not an official warning" notice. Never present unverified reports as confirmed.
- Add rate limiting for the report form (for example a Supabase Edge Function or Cloudflare Turnstile). The honeypot field only stops simple bots.
- Only the 20 counties in `lib/counties.ts` are in the form so far. Add the rest.
- Check licences and terms of any data source you add later.

## Project layout

```
app/page.tsx            main screen: filters, map, feed, realtime
components/MapView.tsx  Leaflet map with clusters (browser only)
components/Feed.tsx     incident list
components/Drawer.tsx   incident details, confidence, nearby incidents
components/ReportForm.tsx  citizen report form
lib/                    Supabase client, types, county centroids
supabase/schema.sql     tables, RLS, realtime, functions, sample data
```

## Next steps

1. `ingest/` Python job: RSS and ReliefWeb, flood keyword filter, LLM extraction to JSON, geocoding, insert with `origin = 'news'`.
2. Rainfall and GloFAS risk layer (new tables and a map overlay).
3. Deduplication and confidence scoring.
4. SMS and Telegram alerts (Africa's Talking).

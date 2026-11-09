"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import Feed from "@/components/Feed";
import Drawer from "@/components/Drawer";
import ReportForm from "@/components/ReportForm";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { Incident, TYPE_LABELS } from "@/lib/types";

// Leaflet touches `window`, so the map must only load in the browser.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-bg" />,
});

const WINDOWS: { label: string; hours: number | null }[] = [
  { label: "24H", hours: 24 },
  { label: "48H", hours: 48 },
  { label: "7D", hours: 24 * 7 },
  { label: "14D", hours: 24 * 14 },
  { label: "ALL", hours: null },
];

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [windowHours, setWindowHours] = useState<number | null>(24 * 7);
  const [county, setCounty] = useState("all");
  const [type, setType] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const load = useCallback(async () => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    let query = supabase
      .from("incidents")
      .select("*")
      .eq("published", true)
      .order("occurred_at", { ascending: false })
      .limit(500);

    if (windowHours !== null) {
      const since = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
      query = query.gte("occurred_at", since);
    }

    const { data, error } = await query;
    if (error) {
      setLoadError("Could not load incidents. Check your Supabase settings.");
    } else {
      setLoadError(null);
      setIncidents((data as Incident[]) ?? []);
    }
    setLoading(false);
  }, [windowHours]);

  // Initial load, refresh every minute, and live updates from Supabase Realtime.
  useEffect(() => {
    load();
    const timer = setInterval(load, 60_000);
    const channel = supabase
      .channel("incidents-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => load())
      .subscribe();
    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [load]);

  const counties = useMemo(
    () => Array.from(new Set(incidents.map((i) => i.county))).sort(),
    [incidents]
  );

  const visible = useMemo(
    () =>
      incidents.filter(
        (i) => (county === "all" || i.county === county) && (type === "all" || i.type === type)
      ),
    [incidents, county, type]
  );

  const critical = visible.filter((i) => i.severity === "critical").length;
  const selected = visible.find((i) => i.id === selectedId) ?? null;

  const select =
    "rounded-md border border-line bg-bg px-2 py-1 text-xs outline-none focus:border-sky-400";

  return (
    <div className="flex h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-panel px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold">Flood Monitor Kenya</span>
          <span className="text-xs text-muted">
            {visible.length} incidents ·{" "}
            <span className={critical > 0 ? "text-red-400" : ""}>{critical} critical</span>
          </span>
        </div>
        <button
          onClick={() => setShowReport(true)}
          className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-sky-400"
        >
          Report a flood
        </button>
      </header>

      {!supabaseConfigured && (
        <div className="bg-amber-400 px-4 py-2 text-sm text-black">
          Supabase is not configured yet. Copy <code>.env.example</code> to{" "}
          <code>.env.local</code>, add your project URL and anon key, then restart the dev
          server.
        </div>
      )}
      {loadError && <div className="bg-red-500 px-4 py-2 text-sm text-white">{loadError}</div>}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <main className="relative h-[55%] md:h-auto md:flex-1">
          <MapView incidents={visible} selectedId={selectedId} onSelect={setSelectedId} />
          {selected && (
            <Drawer
              incident={selected}
              onClose={() => setSelectedId(null)}
              onSelect={setSelectedId}
            />
          )}
        </main>

        <aside className="flex min-h-0 flex-1 flex-col border-t border-line bg-panel md:w-[380px] md:flex-none md:border-l md:border-t-0">
          <div className="space-y-2 border-b border-line p-3">
            <div className="flex items-center justify-between">
              <h1 className="text-sm font-bold tracking-wide">
                INTEL FEED <span className="ml-1 text-[10px] text-emerald-400">● LIVE</span>
              </h1>
            </div>
            <div className="flex flex-wrap gap-1">
              {WINDOWS.map((w) => (
                <button
                  key={w.label}
                  onClick={() => setWindowHours(w.hours)}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                    windowHours === w.hours
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-white/5 text-muted hover:text-white"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <select className={select} value={county} onChange={(e) => setCounty(e.target.value)}>
                <option value="all">All counties</option>
                {counties.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select className={select} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">All types</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-muted">Loading…</p>
            ) : (
              <Feed incidents={visible} selectedId={selectedId} onSelect={setSelectedId} />
            )}
          </div>
        </aside>
      </div>

      {showReport && <ReportForm onClose={() => setShowReport(false)} />}
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { COUNTY_NAMES, centroidFor } from "@/lib/counties";
import { IncidentType, Severity, TYPE_LABELS } from "@/lib/types";

interface Props {
  onClose: () => void;
}

export default function ReportForm({ onClose }: Props) {
  const [type, setType] = useState<IncidentType>("flash_flood");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [county, setCounty] = useState("Nairobi");
  const [locationText, setLocationText] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number; exact: boolean } | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Your browser does not support location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, exact: true }),
      () => setError("Could not get your location. The county centre will be used instead."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (honeypot) return; // bots fill hidden fields

    const fallback = centroidFor(county);
    const lat = coords?.lat ?? fallback?.[0];
    const lng = coords?.lng ?? fallback?.[1];
    if (lat === undefined || lng === undefined) {
      setError("Pick a county or share your location.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Please describe what you are seeing (at least 10 characters).");
      return;
    }

    setBusy(true);
    const place = locationText.trim() || county;
    const { error: insertError } = await supabase.from("incidents").insert({
      type,
      severity,
      status: "unconfirmed",
      confidence: 20,
      title: `${TYPE_LABELS[type]} reported in ${place}`,
      summary: description.trim(),
      county,
      location_text: locationText.trim() || null,
      lat,
      lng,
      precision: coords?.exact ? "exact" : "county",
      source_name: "Citizen report",
      origin: "citizen",
      published: false,
    });
    setBusy(false);

    if (insertError) {
      setError("Could not send your report. Please try again.");
      return;
    }
    setDone(true);
  }

  const field =
    "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-sky-400";

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-xl border border-line bg-panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Report a flood</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-white">
            ✕
          </button>
        </div>

        {done ? (
          <div className="mt-4 space-y-3 text-sm">
            <p>
              Thank you. Your report has been sent for review and will appear on the map once it
              is checked.
            </p>
            <p className="text-muted">
              If someone is in immediate danger, call 999 or 112 now. Do not wait for this site.
            </p>
            <button
              onClick={onClose}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-black"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <p className="rounded-lg bg-white/5 p-2 text-xs text-muted">
              If someone is in immediate danger, call 999 or 112 first.
            </p>

            <label className="block text-xs font-semibold uppercase text-muted">
              What is happening
              <select
                className={`${field} mt-1 normal-case`}
                value={type}
                onChange={(e) => setType(e.target.value as IncidentType)}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold uppercase text-muted">
              How serious
              <select
                className={`${field} mt-1 normal-case`}
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
              >
                <option value="low">Low: water on the ground, passable</option>
                <option value="medium">Medium: roads affected</option>
                <option value="high">High: homes or businesses flooded</option>
                <option value="critical">Critical: people trapped or at risk</option>
              </select>
            </label>

            <label className="block text-xs font-semibold uppercase text-muted">
              County
              <select
                className={`${field} mt-1 normal-case`}
                value={county}
                onChange={(e) => {
                  setCounty(e.target.value);
                  setCoords(null);
                }}
              >
                {COUNTY_NAMES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold uppercase text-muted">
              Place or landmark
              <input
                className={`${field} mt-1 normal-case`}
                value={locationText}
                maxLength={120}
                placeholder="e.g. Mathare, near the bridge"
                onChange={(e) => setLocationText(e.target.value)}
              />
            </label>

            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={getMyLocation}
                className="rounded-lg border border-line px-3 py-2 hover:bg-white/5"
              >
                Use my location
              </button>
              <span className="text-muted">
                {coords?.exact
                  ? "Exact location added."
                  : "Optional. Without it, the county centre is used."}
              </span>
            </div>

            <label className="block text-xs font-semibold uppercase text-muted">
              Describe what you see
              <textarea
                className={`${field} mt-1 min-h-[90px] normal-case`}
                value={description}
                maxLength={600}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            {/* Honeypot: hidden from people, filled in by simple bots */}
            <input
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send report"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

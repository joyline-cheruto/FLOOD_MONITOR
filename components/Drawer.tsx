"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Incident,
  SEVERITY_COLORS,
  STATUS_LABELS,
  TYPE_LABELS,
  timeAgo,
} from "@/lib/types";

interface Props {
  incident: Incident;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export default function Drawer({ incident, onClose, onSelect }: Props) {
  const [nearby, setNearby] = useState<Incident[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc("incidents_nearby", { p_incident_id: incident.id })
      .then(({ data }) => {
        if (!cancelled) setNearby((data as Incident[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [incident.id]);

  const color = SEVERITY_COLORS[incident.severity];

  return (
    <aside className="absolute left-3 top-3 z-[1000] max-h-[calc(100%-1.5rem)] w-[360px] max-w-[calc(100%-1.5rem)] overflow-y-auto rounded-xl border border-line bg-panel p-4 shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase">
          <span className="rounded-full border border-line px-2 py-0.5">
            {TYPE_LABELS[incident.type]}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-black"
            style={{ background: color }}
          >
            {incident.severity}
          </span>
          {incident.is_sample && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-black">Sample</span>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close details"
          className="text-muted hover:text-white"
        >
          ✕
        </button>
      </div>

      <h2 className="mt-3 text-base font-semibold leading-snug">{incident.title}</h2>
      <p className="mt-1 text-xs text-muted">
        {incident.location_text || incident.county} · {incident.county} County ·{" "}
        {timeAgo(incident.occurred_at)}
      </p>
      {incident.precision !== "exact" && (
        <p className="mt-1 text-xs text-muted">
          Pin shows the {incident.precision === "county" ? "county centre" : "approximate area"},
          not the exact spot.
        </p>
      )}

      <div className="mt-3 rounded-lg border border-line p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold uppercase">{STATUS_LABELS[incident.status]}</span>
          <span className="text-muted">{incident.confidence}% confidence</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-line">
          <div
            className="h-1.5 rounded-full"
            style={{ width: `${incident.confidence}%`, background: color }}
          />
        </div>
      </div>

      {incident.summary && (
        <p className="mt-3 text-sm leading-relaxed text-slate-200">{incident.summary}</p>
      )}

      {incident.source_name && (
        <div className="mt-3 text-xs">
          <div className="mb-1 font-semibold uppercase text-muted">Source</div>
          {incident.source_url ? (
            <a
              href={incident.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline"
            >
              {incident.source_name} ↗
            </a>
          ) : (
            <span>{incident.source_name}</span>
          )}
        </div>
      )}

      <p className="mt-3 rounded-lg bg-white/5 p-2 text-[11px] text-muted">
        This is not an official warning. Follow instructions from the Kenya Meteorological
        Department, NDMA and your county government.
      </p>

      {nearby.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-semibold uppercase text-muted">
            Other incidents nearby
          </div>
          <ul className="space-y-1">
            {nearby.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => onSelect(n.id)}
                  className="w-full rounded-lg border border-line px-3 py-2 text-left text-xs hover:bg-white/5"
                >
                  <div className="truncate">{n.title}</div>
                  <div className="text-muted">
                    {n.county} · {timeAgo(n.occurred_at)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

"use client";

import { Incident, SEVERITY_COLORS, STATUS_LABELS, TYPE_LABELS, timeAgo } from "@/lib/types";

interface Props {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function Feed({ incidents, selectedId, onSelect }: Props) {
  if (incidents.length === 0) {
    return (
      <p className="p-4 text-sm text-muted">
        No incidents match these filters in the selected time window.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {incidents.map((inc) => (
        <li key={inc.id}>
          <button
            onClick={() => onSelect(inc.id)}
            className={`w-full px-4 py-3 text-left transition hover:bg-white/5 ${
              inc.id === selectedId ? "bg-white/5" : ""
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: SEVERITY_COLORS[inc.severity] }}
                />
                {TYPE_LABELS[inc.type]}
              </span>
              <span className="font-normal normal-case text-muted">{timeAgo(inc.occurred_at)}</span>
            </div>
            <div className="mt-0.5 text-xs text-muted">{inc.county}</div>
            <div className="mt-1 text-sm leading-snug">{inc.title}</div>
            <div className="mt-1.5 flex gap-3 text-[10px] font-semibold uppercase tracking-wide text-muted">
              <span>{STATUS_LABELS[inc.status]}</span>
              <span>Conf {inc.confidence}%</span>
              {inc.is_sample && <span className="text-amber-400">Sample</span>}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

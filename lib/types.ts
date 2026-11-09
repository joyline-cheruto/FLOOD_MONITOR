export type IncidentType =
  | "flash_flood"
  | "river_overflow"
  | "urban_flooding"
  | "dam_breach"
  | "landslide"
  | "road_cut";

export type Severity = "low" | "medium" | "high" | "critical";
export type Status = "unconfirmed" | "likely" | "confirmed";

export interface Incident {
  id: string;
  type: IncidentType;
  severity: Severity;
  status: Status;
  confidence: number;
  title: string;
  summary: string | null;
  county: string;
  location_text: string | null;
  lat: number;
  lng: number;
  precision: "exact" | "area" | "county";
  source_name: string | null;
  source_url: string | null;
  origin: "manual" | "citizen" | "news" | "official";
  published: boolean;
  is_sample: boolean;
  occurred_at: string;
  created_at: string;
}

export const TYPE_LABELS: Record<IncidentType, string> = {
  flash_flood: "Flash flood",
  river_overflow: "River overflow",
  urban_flooding: "Urban flooding",
  dam_breach: "Dam breach",
  landslide: "Landslide",
  road_cut: "Road cut off",
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  low: "#4ade80",
  medium: "#facc15",
  high: "#fb923c",
  critical: "#f87171",
};

export const STATUS_LABELS: Record<Status, string> = {
  unconfirmed: "Unconfirmed",
  likely: "Likely true",
  confirmed: "Confirmed",
};

export const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];

export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

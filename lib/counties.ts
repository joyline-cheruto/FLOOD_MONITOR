// Approximate county centroids, used as a fallback when a report has no
// exact location. Extend this list to all 47 counties as you go.
export const COUNTY_CENTROIDS: Record<string, [number, number]> = {
  Nairobi: [-1.2864, 36.8172],
  Mombasa: [-4.0435, 39.6682],
  Kisumu: [-0.0917, 34.768],
  Nakuru: [-0.3031, 36.08],
  Kajiado: [-1.852, 36.782],
  Machakos: [-1.5177, 37.2634],
  "Murang'a": [-0.721, 37.152],
  Kiambu: [-1.1714, 36.8356],
  Garissa: [-0.4532, 39.6461],
  "Tana River": [-1.5, 40.03],
  Busia: [0.4608, 34.1115],
  Siaya: [0.0607, 34.2881],
  Homa_Bay: [-0.5273, 34.4571],
  Kilifi: [-3.5107, 39.9093],
  Kwale: [-4.1816, 39.4606],
  Mandera: [3.9366, 41.867],
  Wajir: [1.7471, 40.0573],
  Turkana: [3.1167, 35.6],
  "West Pokot": [1.6, 35.1],
  Baringo: [0.4667, 35.9667],
};

export const COUNTY_NAMES = Object.keys(COUNTY_CENTROIDS)
  .map((n) => n.replace("_", " "))
  .sort();

export function centroidFor(county: string): [number, number] | null {
  return (
    COUNTY_CENTROIDS[county] ?? COUNTY_CENTROIDS[county.replace(" ", "_")] ?? null
  );
}

import { AirNowResponse, HouseholdProfile } from "shared";

export interface CoarsenedFactsPayload {
  aqi: number;
  category: string;
  dominantPollutant: string;
  pm25: number;
  whoMultiple: number;
  smogDrivers: string[];
  coarsenedLocation: {
    name: string;
    approxLat: number;
    approxLng: number;
  };
  sensitiveGroups: string[];
  hasPurifier: boolean;
  timestampIso: string;
}

function extractSensitiveGroups(profile?: HouseholdProfile | null): string[] {
  if (!profile || !profile.members) return [];
  const groups = new Set<string>();

  for (const m of profile.members) {
    if (m.sensitiveFlags.child) groups.add("child");
    if (m.sensitiveFlags.olderAdult) groups.add("elderly");
    if (m.sensitiveFlags.respiratoryCondition) groups.add("asthma");
    if (m.sensitiveFlags.pregnancy) groups.add("pregnancy");
  }

  return Array.from(groups);
}

export function buildCoarsenedFacts(
  airNow: AirNowResponse,
  profile?: HouseholdProfile | null,
): CoarsenedFactsPayload {
  // Coarsen location to ~1 km (round to 2 decimal places)
  const approxLat = Math.round(airNow.location.lat * 100) / 100;
  const approxLng = Math.round(airNow.location.lng * 100) / 100;

  const sensitiveGroups = extractSensitiveGroups(profile);
  const hasPurifier = profile?.rooms?.some((r) => r.hasPurifier) ?? false;

  return {
    aqi: airNow.aqi,
    category: airNow.category,
    dominantPollutant: airNow.dominantPollutant,
    pm25: airNow.pollutants.pm25,
    whoMultiple: airNow.whoMultiple,
    smogDrivers: airNow.smogDrivers.map((d) => d.name),
    coarsenedLocation: {
      name: airNow.location.name,
      approxLat,
      approxLng,
    },
    sensitiveGroups,
    hasPurifier,
    timestampIso: airNow.provenance.fetchedAt,
  };
}

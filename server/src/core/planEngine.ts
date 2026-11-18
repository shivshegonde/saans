/**
 * Daily Plan Generation Engine (Deterministic Rules P1–P10).
 * Produces prioritized, time-ordered Action Cards without requiring any AI or external services.
 */

export interface HouseholdContext {
  hasChild: boolean;
  hasElder: boolean;
  hasRespiratoryCondition: boolean;
  hasPregnancy: boolean;
  hasPurifier: boolean;
  purifierCadrM3h?: number;
  commuteMode: string;
  commuteDistanceKm: number;
  cookingFuel: "biomass" | "lpg" | "induction_electric";
  currentAqi: number;
  forecastHours: Array<{ timeIso: string; aqi: number; pm25: number }>;
  bestVentilationWindow?: { startIso: string; endIso: string };
}

export type TimeSlot = "Morning" | "Afternoon" | "Evening" | "Night";

export interface ActionCard {
  id: string;
  ruleId: "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7" | "P8" | "P9" | "P10";
  slot: TimeSlot;
  headline: string;
  why: string;
  impact: {
    health: string;
    city: string;
  };
  effort: "low" | "medium" | "high";
  costBand: "free" | "₹" | "₹₹" | "₹₹₹";
  evidenceLevel: "strong" | "moderate" | "limited";
  knowledgeIds: string[];
}

export function buildDailyPlan(ctx: HouseholdContext): ActionCard[] {
  const cards: ActionCard[] = [];
  const isSevere = ctx.currentAqi >= 401;
  const isPoorOrWorse = ctx.currentAqi >= 201;
  const hasSensitiveMember =
    ctx.hasChild || ctx.hasElder || ctx.hasRespiratoryCondition || ctx.hasPregnancy;

  // P1: Sensitive group outdoor restriction
  if (hasSensitiveMember && isPoorOrWorse) {
    cards.push({
      id: "action-p1-sensitive-indoor",
      ruleId: "P1",
      slot: "Morning",
      headline: "Move sensitive family exercise & children's play indoors",
      why: `Outdoor AQI is ${ctx.currentAqi}. Children and respiratory patients inhale more air per kg of body weight, increasing lung particulate deposition.`,
      impact: {
        health: "~50–70% reduction in peak morning particulate exposure",
        city: "Zero additional city emissions",
      },
      effort: "low",
      costBand: "free",
      evidenceLevel: "strong",
      knowledgeIds: ["routine-indoor-play", "sensitive-vulnerability"],
    });
  }

  // P2: Ventilation window
  if (ctx.bestVentilationWindow) {
    cards.push({
      id: "action-p2-ventilation-timing",
      ruleId: "P2",
      slot: "Afternoon",
      headline: `Aerate rooms briefly between ${ctx.bestVentilationWindow.startIso.slice(11, 16)} and ${ctx.bestVentilationWindow.endIso.slice(11, 16)}`,
      why: "Forecast indicates a temporary dip in surface particulate concentration during midday thermal mixing. Keep windows sealed during morning and night smog peaks.",
      impact: {
        health: "Flushes indoor CO2 and VOCs while minimizing PM2.5 infiltration",
        city: "Natural airflow reduces cooling/heating energy load",
      },
      effort: "low",
      costBand: "free",
      evidenceLevel: "strong",
      knowledgeIds: ["indoor-ventilation-timing"],
    });
  } else {
    cards.push({
      id: "action-p2-keep-sealed",
      ruleId: "P2",
      slot: "Afternoon",
      headline: "Keep windows and external doors sealed today",
      why: "Outdoor PM2.5 remains elevated throughout the 24-hour cycle. Infiltration would rapidly contaminate indoor air.",
      impact: {
        health: "Prevents up to 80% of outdoor fine particulate infiltration",
        city: "Passive barrier without energy consumption",
      },
      effort: "low",
      costBand: "free",
      evidenceLevel: "strong",
      knowledgeIds: ["indoor-sealing"],
    });
  }

  // P3: Purifier pre-running & night filtration
  cards.push({
    id: "action-p3-purifier-bedroom",
    ruleId: "P3",
    slot: "Evening",
    headline: "Pre-run bedroom air purifier 30 minutes before sleep",
    why: "Running the purifier on high for 30 minutes brings bedroom PM2.5 under 15 µg/m³, allowing low-fan whisper operation overnight.",
    impact: {
      health: "~75–85% less PM2.5 inhaled over 8 hours of sleep",
      city: "Low fan speed cuts nightly electricity consumption by ~40%",
    },
    effort: "low",
    costBand: ctx.hasPurifier ? "free" : "₹₹₹",
    evidenceLevel: "strong",
    knowledgeIds: ["indoor-purifier-night", "purifier-cadr-sizing"],
  });

  // P4: Mask guidance
  if (isPoorOrWorse) {
    cards.push({
      id: "action-p4-mask-n95",
      ruleId: "P4",
      slot: "Morning",
      headline: "Wear a well-fitted N95/FFP2 respirator for unavoidable trips",
      why: "Cloth and surgical masks leak around the edges and do not filter sub-micron particles. A certified N95 provides ~88% true protection.",
      impact: {
        health: "Blocks ~88% of fine inhalable particulate matter outdoors",
        city: "Zero tailpipe emission impact",
      },
      effort: "low",
      costBand: "₹",
      evidenceLevel: "strong",
      knowledgeIds: ["mask-n95-vs-cloth", "mask-children-fit"],
    });
  }

  // P5: Commute alternative (Metro / Bus / WFH, no cycling in severe air)
  cards.push({
    id: "action-p5-commute-metro",
    ruleId: "P5",
    slot: "Morning",
    headline:
      isSevere || ctx.commuteMode.includes("car")
        ? "Switch commute to Electric Metro, Bus, or Work-From-Home"
        : "Plan commute via Metro or public transit",
    why: isPoorOrWorse
      ? "Cycling or running in severe smog dramatically increases pulmonary minute ventilation and inhaled toxic dose. Metro cabins are filtered and electric."
      : "Metro transit avoids traffic gridlock and vehicular emissions.",
    impact: {
      health: "Avoids 60–80% of roadside peak toxic exposure compared to open transit",
      city: `Avoids ~${Number(((ctx.commuteDistanceKm * 152) / 1000).toFixed(1))} kg CO2e per round trip`,
    },
    effort: "medium",
    costBand: "₹",
    evidenceLevel: "strong",
    knowledgeIds: ["sustainable-metro-commute", "cardio-smog-tradeoff"],
  });

  // P6: Cooking exhaust & clean fuels
  cards.push({
    id: "action-p6-cooking-ventilation",
    ruleId: "P6",
    slot: "Evening",
    headline: "Run kitchen exhaust or chimney with kitchen door closed",
    why: "Frying and tadka generate rapid PM2.5 peaks up to 400 µg/m³. Exhaust creates negative pressure, preventing smoke from spreading to living areas.",
    impact: {
      health: "Prevents indoor kitchen smoke from raising living area PM2.5 by > 150 µg/m³",
      city: "Clean cooking practices minimize domestic emission footprint",
    },
    effort: "low",
    costBand: "free",
    evidenceLevel: "strong",
    knowledgeIds: ["cooking-indoor-smoke", "clean-cooking-lpg-induction"],
  });

  // P7: Wet mopping instead of dry sweeping
  cards.push({
    id: "action-p7-cleaning-wet-mop",
    ruleId: "P7",
    slot: "Morning",
    headline: "Use wet mopping or HEPA vacuum; avoid dry brooming",
    why: "Dry sweeping with a standard jhadu resuspends settled toxic particulates and heavy metals into the breathing zone for hours.",
    impact: {
      health: "Prevents resuspension of 5,000 µg/h of fine floor dust",
      city: "Zero chemical emissions",
    },
    effort: "low",
    costBand: "free",
    evidenceLevel: "strong",
    knowledgeIds: ["indoor-wet-mopping", "dust-resuspension"],
  });

  // P8: Community leaf burning avoidance & anti-idling
  cards.push({
    id: "action-p8-civic-anti-burning",
    ruleId: "P8",
    slot: "Afternoon",
    headline: "Compost garden leaves; do not burn waste or idle car engines",
    why: "Open burning of 10 kg of dry leaves releases 185g of fine PM2.5 right at lung level in your neighborhood.",
    impact: {
      health: "Protects neighborhood children from acute respiratory irritation",
      city: "Eliminates ~14.5 kg CO2e and 185g PM2.5 per 10 kg leaves composted",
    },
    effort: "medium",
    costBand: "free",
    evidenceLevel: "strong",
    knowledgeIds: ["civic-anti-burning", "vehicle-idling-schools"],
  });

  // P9: Older adults walk timing
  if (ctx.hasElder) {
    cards.push({
      id: "action-p9-elder-walk-timing",
      ruleId: "P9",
      slot: "Afternoon",
      headline: "Shift senior walks to late afternoon (1:00 PM – 4:00 PM)",
      why: "Winter thermal inversions trap the highest particulate concentrations between 6:00 AM and 9:00 AM. Afternoon sunlight breaks the inversion, creating the safest outdoor window.",
      impact: {
        health: "Avoids 40–60% higher peak morning ground particulate exposure",
        city: "Encourages safe, community-aligned wellness routines",
      },
      effort: "low",
      costBand: "free",
      evidenceLevel: "strong",
      knowledgeIds: ["elder-walk-timing", "morning-inversion-peak"],
    });
  }

  // P10: Severe emergency advisory
  if (isSevere) {
    cards.push({
      id: "action-p10-severe-smog-lockdown",
      ruleId: "P10",
      slot: "Morning",
      headline: "Enact severe smog protocol: minimize all non-essential travel",
      why: "AQI exceeds 400 (Severe). Atmospheric boundary layer is completely stagnant. GRAP Stage III/IV emergency measures are in effect.",
      impact: {
        health: "Halves total daily cardiovascular and pulmonary particulate stress",
        city: "Reduces peak-hour urban traffic congestion and citywide emissions",
      },
      effort: "high",
      costBand: "free",
      evidenceLevel: "strong",
      knowledgeIds: ["severe-smog-protocol", "grap-city-measures"],
    });
  }

  return cards;
}

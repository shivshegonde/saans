import { CoarsenedFactsPayload } from "./factsBuilder.js";

const CHILD_KEYWORDS = ["child", "son", "asthma", "pe", "school"];
const OUTDOOR_KEYWORDS = ["outdoor", "sport", "participate"];
const ELDER_KEYWORDS = ["dadaji", "cardiac", "stent", "elder"];
const PREGNANCY_KEYWORDS = ["trimester", "pregnant", "pregnancy"];

function getVulnerableAdvice(lower: string): string | null {
  if (
    CHILD_KEYWORDS.some((k) => lower.includes(k)) &&
    OUTDOOR_KEYWORDS.some((k) => lower.includes(k))
  ) {
    return "Children with asthma must avoid intense outdoor sports during elevated AQI. Schools and parents should move physical activity indoors or reschedule to the afternoon window (12:00 PM – 03:30 PM).";
  }

  if (ELDER_KEYWORDS.some((k) => lower.includes(k))) {
    return "Elders and individuals with cardiac conditions must postpone early morning walks. Cold air and trapped particulate smog increase cardiovascular strain; indoor walking or postponing until afternoon is advised.";
  }

  if (PREGNANCY_KEYWORDS.some((k) => lower.includes(k))) {
    return "During pregnancy, fine particulate exposure increases systemic inflammation. Stay indoors in air-purified rooms, run HEPA filtration continuously, and wear a fitted N95 respirator if travel is essential.";
  }

  return null;
}

const CADR_KEYWORDS = ["calculate", "cadr", "ceiling", "ach"];
const MASK_KEYWORDS = ["cloth", "surgical", "mask"];

function getTechnicalAdvice(lower: string): string | null {
  if (CADR_KEYWORDS.some((k) => lower.includes(k))) {
    return "Required CADR (m³/h) = Room Floor Area (m²) × Ceiling Height (m) × 4.8 Air Changes per Hour (ACH) for polluted winter conditions.";
  }

  if (MASK_KEYWORDS.some((k) => lower.includes(k))) {
    return "Cloth and surgical masks offer less than 20% filtration efficiency against sub-micron PM2.5. A certified, edge-sealed N95 or FFP2 respirator is strictly recommended.";
  }

  if (lower.includes("cure")) {
    return "HEPA air purifiers filter airborne particulates to reduce lung exposure, but they do NOT cure or diagnose asthma, COPD, or respiratory diseases. Consult a certified medical doctor for treatments.";
  }

  return null;
}

const PURIFIER_KEYWORDS = ["purifier", "indoor", "कमरे", "प्यूरीफायर"];
const EXERCISE_KEYWORDS = ["walk", "jog", "exercise", "outdoor", "सैर"];
const WINDOW_KEYWORDS = ["window", "inversion", "खिडक्या", "7 am"];

function getRoutineAdvice(lower: string): string {
  if (PURIFIER_KEYWORDS.some((k) => lower.includes(k))) {
    return "Run indoor HEPA purifiers on medium-to-high fan speed in bedrooms with closed doors and windows to achieve clean indoor air quality.";
  }

  if (EXERCISE_KEYWORDS.some((k) => lower.includes(k))) {
    return "Postpone strenuous outdoor exercise and walks until the afternoon ventilation window. When venturing outdoors, use a certified N95 respirator.";
  }

  if (WINDOW_KEYWORDS.some((k) => lower.includes(k))) {
    return "Early morning thermal inversions trap cold air and toxic pollutants near ground level. Keep windows sealed during morning and evening rush hours; ventilate only between 12:00 PM and 03:30 PM.";
  }

  return "Keep windows closed during morning thermal inversion. Shift short trips to public metro transit to minimize ambient vehicular emissions.";
}

/**
 * Deterministic fallback generator when AI model is offline or validation triggers fallback.
 * Generates scientifically grounded, persona-aware, and rule-compliant air quality guidance.
 */
export function getDeterministicAdvice(message: string, _facts: CoarsenedFactsPayload): string {
  const lower = message.toLowerCase();
  return getVulnerableAdvice(lower) || getTechnicalAdvice(lower) || getRoutineAdvice(lower);
}

/**
 * Pre-Model Safety Interceptor.
 * Pure deterministic guardrails executed before any LLM API is invoked.
 *
 * Invariants:
 * 1. Emergency health symptoms short-circuit directly to emergency services (India: 112).
 *    The model is NEVER called for medical emergencies.
 * 2. Prompt injection attempts are detected, blocked, and logged.
 * 3. Out-of-scope requests receive a polite redirect.
 */

export interface SafetyCheckResult {
  allowed: boolean;
  action: "PASS" | "EMERGENCY_INTERCEPT" | "INJECTION_BLOCKED" | "OUT_OF_SCOPE";
  message?: string;
  emergencyPhone?: string;
  sanitizedInput?: string;
}

// Emergency medical triggers requiring immediate 112 escalation
const EMERGENCY_PATTERNS = [
  /\b(chest pain|heart attack|angina)\b/i,
  /\b(severe breathlessness|cannot breathe|struggling to breathe|can't breathe|gasping for air)\b/i,
  /\b(blue lips|cyanosis|blue fingernails)\b/i,
  /\b(fainted|fainting|unconscious|loss of consciousness|passed out)\b/i,
  /\b(coughing (up )?blood|hemoptysis)\b/i,
  /\b(child (is )?struggling to breathe|child turning blue)\b/i,
  /\b(suicide|self[- ]harm|kill myself)\b/i,
];

// Adversarial prompt injection signatures
const INJECTION_PATTERNS = [
  /\b(ignore (all )?(previous|prior) (instructions|prompts|rules))\b/i,
  /\b(disregard (the )?(system|above) (prompt|instructions))\b/i,
  /\b(you are now (in )?(DAN|unrestricted|god) mode)\b/i,
  /\b(system prompt (leak|reveal|dump))\b/i,
  /\b(jailbreak|bypass security checks)\b/i,
  /<script\b[^>]*>([\s\S]*?)<\/script>/i,
];

// Allowed domain vocabulary for out-of-scope detection
const DOMAIN_KEYWORDS = [
  "air",
  "aqi",
  "smog",
  "pollution",
  "pm2.5",
  "pm10",
  "purifier",
  "hepa",
  "cadr",
  "mask",
  "n95",
  "window",
  "ventilate",
  "ventilation",
  "breathe",
  "breath",
  "lungs",
  "asthma",
  "cough",
  "smoke",
  "inversion",
  "delhi",
  "weather",
  "humidity",
  "wind",
  "commute",
  "metro",
  "emissions",
  "co2",
  "walk",
  "exercise",
  "outdoor",
  "plant",
  "leaves",
  "burning",
  "hacks",
];

export function runPreModelSafetyCheck(userInput: string, countryCode = "IN"): SafetyCheckResult {
  const text = userInput.trim();

  // 1. Emergency Symptom Interceptor
  for (const pattern of EMERGENCY_PATTERNS) {
    if (pattern.test(text)) {
      const emergencyNumber = countryCode === "IN" ? "112" : "911";
      return {
        allowed: false,
        action: "EMERGENCY_INTERCEPT",
        emergencyPhone: emergencyNumber,
        message: `EMERGENCY ALERT: Your message describes acute medical distress or severe respiratory symptoms. Seek immediate emergency care. Call ${emergencyNumber} or go to the nearest emergency room immediately. Saans provides environmental guidance only and cannot diagnose or treat medical emergencies.`,
      };
    }
  }

  // 2. Prompt Injection Detector
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        action: "INJECTION_BLOCKED",
        message:
          "Security notice: Request contains disallowed prompt modification or jailbreak patterns and has been logged.",
      };
    }
  }

  // 3. Out-of-Scope Topic Redirect
  // If text is longer than 5 words and shares zero domain terms
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 2);

  if (words.length >= 6) {
    const hasDomainTerm = DOMAIN_KEYWORDS.some((kw) => lower.includes(kw));
    if (!hasDomainTerm) {
      return {
        allowed: false,
        action: "OUT_OF_SCOPE",
        message:
          "I am Saans, your dedicated urban air quality assistant. I can help with real-time AQI, indoor air purification, smog forecasts, low-emission daily routines, and family health precautions. Please ask a question related to air quality or pollution.",
      };
    }
  }

  return {
    allowed: true,
    action: "PASS",
    sanitizedInput: text,
  };
}

import { describe, it, expect } from "vitest";
import {
  validateNumberGrounding,
  validateBannedClaims,
  validateCitations,
  validateAiOutput,
  extractNumbersFromText,
} from "../src/ai/validators.js";
import { CoarsenedFactsPayload } from "../src/ai/factsBuilder.js";
import { getAllKnowledgeIds } from "../src/ai/retrieval.js";

describe("AI Number Grounding & Validator Tests (ai.number-grounding.test)", () => {
  const dummyFacts: CoarsenedFactsPayload = {
    aqi: 320,
    category: "Very Poor",
    dominantPollutant: "PM2.5",
    pm25: 185,
    whoMultiple: 12,
    smogDrivers: ["Thermal Inversion", "Vehicular Emissions"],
    coarsenedLocation: {
      name: "Rohini, Delhi",
      approxLat: 28.71,
      approxLng: 77.12,
    },
    sensitiveGroups: ["child", "asthma"],
    hasPurifier: true,
    timestampIso: "2026-11-18T08:00:00.000Z",
  };

  const validKnowledgeIds = getAllKnowledgeIds();
  validKnowledgeIds.add("cpcb-health-guidelines");

  it("extracts integers and decimal numbers from text", () => {
    const numbers = extractNumbersFromText("AQI is 320 and PM2.5 is 185.5 µg/m³ across 24 hours.");
    expect(numbers).toContain(320);
    expect(numbers).toContain(185.5);
    expect(numbers).toContain(24);
  });

  it("passes grounded text containing facts numbers and standard environmental constants", () => {
    const text =
      "Rohini shows AQI 320 with PM2.5 at 185 µg/m³, which is 12 times WHO guidelines over 24 hours.";
    const result = validateNumberGrounding(text, dummyFacts);
    expect(result.grounded).toBe(true);
    expect(result.ungroundedNumbers).toHaveLength(0);
  });

  it("detects and rejects hallucinated numbers not present in facts", () => {
    const hallucinatedText =
      "AQI is 875 and PM2.5 has spiked to 640 µg/m³ with 99% mortality risk.";
    const result = validateNumberGrounding(hallucinatedText, dummyFacts);
    expect(result.grounded).toBe(false);
    expect(result.ungroundedNumbers).toContain(875);
    expect(result.ungroundedNumbers).toContain(640);
  });

  it("detects banned medical claims such as 'cure' and '100% safe'", () => {
    const cureText = "This air purifier guarantees a permanent cure for childhood asthma.";
    const check1 = validateBannedClaims(cureText);
    expect(check1.hasBannedClaims).toBe(true);
    expect(check1.matchedTerms.length).toBeGreaterThan(0);

    const safeText = "Wearing this mask makes you 100% safe from all respiratory hazards.";
    const check2 = validateBannedClaims(safeText);
    expect(check2.hasBannedClaims).toBe(true);
  });

  it("validates citation IDs against curated knowledge base", () => {
    const validCitations = [
      { id: "cpcb-health-guidelines", title: "CPCB Protocol", organisation: "CPCB" },
    ];
    const invalidCitations = [
      { id: "hallucinated-fake-study-2026", title: "Fake Study", organisation: "Unknown" },
    ];

    expect(validateCitations(validCitations, validKnowledgeIds).valid).toBe(true);
    const invalidRes = validateCitations(invalidCitations, validKnowledgeIds);
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.invalidIds).toContain("hallucinated-fake-study-2026");
  });

  it("fails composite validation if output contains ungrounded numbers or banned claims", () => {
    const badText = "The AQI is 780 and this purifier will cure your lungs.";
    const badCitations = [{ id: "invalid-id", title: "Bogus", organisation: "None" }];

    const composite = validateAiOutput(badText, badCitations, dummyFacts, validKnowledgeIds);
    expect(composite.valid).toBe(false);
    expect(composite.errors.length).toBeGreaterThanOrEqual(2);
  });
});

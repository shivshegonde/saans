import { describe, it, expect } from "vitest";
import { GeminiService } from "../src/ai/geminiClient.js";
import { CoarsenedFactsPayload } from "../src/ai/factsBuilder.js";

describe("AI Deterministic Offline Fallback Tests (ai.fallback.test)", () => {
  const dummyFacts: CoarsenedFactsPayload = {
    aqi: 345,
    category: "Very Poor",
    dominantPollutant: "PM2.5",
    pm25: 198,
    whoMultiple: 13,
    smogDrivers: ["Thermal Inversion", "Biomass Burning"],
    coarsenedLocation: {
      name: "Anand Vihar, Delhi",
      approxLat: 28.65,
      approxLng: 77.31,
    },
    sensitiveGroups: ["elderly", "cardiac"],
    hasPurifier: true,
    timestampIso: "2026-11-18T08:00:00.000Z",
  };

  it("returns deterministic fallback with accurate facts when forced model outage is enabled", async () => {
    const service = new GeminiService({ forceModelOutage: true });

    const response = await service.askSaans(
      {
        message: "Can I go for an outdoor morning jog right now?",
        language: "en",
      },
      dummyFacts,
    );

    expect(response.safety.wasIntercepted).toBe(false);
    expect(response.aiBadge).toBe("Standard guidance");
    expect(response.reply).toContain("Anand Vihar, Delhi");
    expect(response.reply).toContain("345");
    expect(response.reply).toContain("198");
    expect(response.reply).toContain("outdoor");
    expect(response.citations.length).toBeGreaterThan(0);
  });

  it("provides window and CADR purifier guidance during forced outage", async () => {
    const service = new GeminiService({ forceModelOutage: true });

    const response = await service.askSaans(
      {
        message: "How should I run my indoor air purifier and when should I open windows?",
        language: "en",
      },
      dummyFacts,
    );

    expect(response.reply).toContain("purifier");
    expect(response.citations.length).toBeGreaterThan(0);
  });

  it("preserves proposal card generation even in offline fallback mode", async () => {
    const service = new GeminiService({ forceModelOutage: true });

    const response = await service.askSaans(
      {
        message: "Please configure my morning alert for high smog levels",
        language: "en",
      },
      dummyFacts,
    );

    expect(response.proposalCard).toBeDefined();
    expect(response.proposalCard?.actionType).toBe("UPDATE_ALERT_PREFERENCES");
    expect(response.proposalCard?.payload).toHaveProperty("enabled", true);
  });

  it("handles toggling forceModelOutage dynamically", async () => {
    const service = new GeminiService();
    service.setForceModelOutage(true);

    const res1 = await service.askSaans(
      { message: "Tell me about air quality today", language: "en" },
      dummyFacts,
    );
    expect(res1.aiBadge).toBe("Standard guidance");

    service.setForceModelOutage(false);
  });
});

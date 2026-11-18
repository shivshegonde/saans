import { describe, it, expect } from "vitest";
import {
  getAllKnowledge,
  getKnowledgeById,
  getKnowledgeByCategory,
  searchKnowledge,
  checkMythClaim,
} from "../src/core/knowledge.js";

describe("Curated Knowledge Base & Myth Check Engine (knowledge.test)", () => {
  it("contains at least 40 curated entries across routines, indoor hacks, alternatives, and myths", () => {
    const all = getAllKnowledge();
    expect(all.length).toBeGreaterThanOrEqual(40);

    const routines = getKnowledgeByCategory("routine");
    const hacks = getKnowledgeByCategory("indoor_hack");
    const alts = getKnowledgeByCategory("alternative");
    const myths = getKnowledgeByCategory("myth");

    expect(routines.length).toBeGreaterThanOrEqual(10);
    expect(hacks.length).toBeGreaterThanOrEqual(10);
    expect(alts.length).toBeGreaterThanOrEqual(10);
    expect(myths.length).toBeGreaterThanOrEqual(10);
  });

  it("verifies every entry has required fields and valid peer-reviewed/official citations", () => {
    const all = getAllKnowledge();
    for (const entry of all) {
      expect(entry.id).toBeDefined();
      expect(entry.title).toBeDefined();
      expect(entry.appliesWhen).toBeDefined();
      expect(["low", "medium", "high"]).toContain(entry.effort);
      expect(["free", "₹", "₹₹", "₹₹₹"]).toContain(entry.costBand);
      expect(["strong", "moderate", "limited"]).toContain(entry.evidence.level);
      expect(entry.evidence.sources.length).toBeGreaterThanOrEqual(1);

      for (const src of entry.evidence.sources) {
        expect(src.title).toBeDefined();
        expect(src.organisation).toBeDefined();
        expect(src.year).toBeGreaterThanOrEqual(1980);
      }
    }
  });

  it("evaluates viral myth: houseplants do not clean room air", () => {
    const res = checkMythClaim("Do indoor snake plants and areca palms clean room air during smog?");
    expect(res.verdict).toBe("unsupported");
    expect(res.matchedMyth?.id).toBe("myth-houseplants-clean-air");
    expect(res.explanation).toContain("NASA Clean Air Study");
    expect(res.citations.length).toBeGreaterThan(0);
  });

  it("evaluates viral myth: cloth mask protection", () => {
    const res = checkMythClaim("Is a cotton cloth mask or handkerchief good enough for smog?");
    expect(res.verdict).toBe("unsupported");
    expect(res.matchedMyth?.id).toBe("myth-cloth-mask-sufficient");
    expect(res.explanation).toContain("Cotton fabric pore size");
  });

  it("returns honest 'no evidence' when a claim has no documented support", () => {
    const res = checkMythClaim("Can wearing purple crystals deflect particulate pollution?");
    expect(res.verdict).toBe("no evidence");
    expect(res.matchedMyth).toBeUndefined();
    expect(res.citations.length).toBe(0);
  });

  it("searches knowledge entries by keyword", () => {
    const results = searchKnowledge("purifier cadr");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.category).toBeDefined();
  });

  it("retrieves entries by exact ID", () => {
    const entry = getKnowledgeById("routine-afternoon-walks");
    expect(entry).toBeDefined();
    expect(entry?.title).toContain("Shift Outdoor Walks");
  });
});

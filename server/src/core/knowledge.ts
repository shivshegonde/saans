import routines from "../knowledge/routines.json" with { type: "json" };
import indoorHacks from "../knowledge/indoor-hacks.json" with { type: "json" };
import alternatives from "../knowledge/alternatives.json" with { type: "json" };
import myths from "../knowledge/myths.json" with { type: "json" };

export interface Citation {
  title: string;
  organisation: string;
  year: number;
  url: string;
}

export interface KnowledgeEntry {
  id: string;
  category: "routine" | "indoor_hack" | "alternative" | "myth";
  title: string;
  appliesWhen: string;
  effort: "low" | "medium" | "high";
  costBand: "free" | "₹" | "₹₹" | "₹₹₹";
  evidence: {
    level: "strong" | "moderate" | "limited";
    sources: Citation[];
  };
  effectModel: string;
  verdict?: "supported" | "partly" | "unsupported" | "no evidence";
}

const ALL_ENTRIES: KnowledgeEntry[] = [
  ...(routines as KnowledgeEntry[]),
  ...(indoorHacks as KnowledgeEntry[]),
  ...(alternatives as KnowledgeEntry[]),
  ...(myths as KnowledgeEntry[]),
];

const ENTRY_MAP = new Map<string, KnowledgeEntry>(ALL_ENTRIES.map((e) => [e.id, e]));

export function getAllKnowledge(): KnowledgeEntry[] {
  return ALL_ENTRIES;
}

export function getKnowledgeById(id: string): KnowledgeEntry | undefined {
  return ENTRY_MAP.get(id);
}

export function getKnowledgeByCategory(category: KnowledgeEntry["category"]): KnowledgeEntry[] {
  return ALL_ENTRIES.filter((e) => e.category === category);
}

export function searchKnowledge(query: string): KnowledgeEntry[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  if (terms.length === 0) return ALL_ENTRIES.slice(0, 10);

  return ALL_ENTRIES.filter((entry) => {
    const haystack =
      `${entry.title} ${entry.effectModel} ${entry.appliesWhen} ${entry.id}`.toLowerCase();
    return terms.some((term) => haystack.includes(term));
  });
}

export interface MythCheckResult {
  claim: string;
  verdict: "supported" | "partly" | "unsupported" | "no evidence";
  matchedMyth?: KnowledgeEntry;
  explanation: string;
  citations: Citation[];
}

export function checkMythClaim(claim: string): MythCheckResult {
  const lower = claim.toLowerCase();
  const mythEntries = getKnowledgeByCategory("myth");

  for (const myth of mythEntries) {
    const terms = myth.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const matchCount = terms.filter((term) => lower.includes(term)).length;

    if (matchCount >= 2 || lower.includes(myth.id.replace("myth-", ""))) {
      return {
        claim,
        verdict: myth.verdict ?? "unsupported",
        matchedMyth: myth,
        explanation: myth.effectModel,
        citations: myth.evidence.sources,
      };
    }
  }

  return {
    claim,
    verdict: "no evidence",
    explanation:
      "No rigorous scientific evidence or peer-reviewed literature was found evaluating this specific claim. Please rely on established CPCB and WHO particulate protection guidance.",
    citations: [],
  };
}

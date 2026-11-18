import { CitationDto } from "shared";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  claim?: string;
  verdict?: "supported" | "partly_supported" | "unsupported" | "no_evidence_found" | "partly";
  summary?: string;
  source?: string;
  tags?: string[];
  scientificBasis?: string;
  effectModel?: string;
  evidence?: {
    sources?: Array<{
      title: string;
      organisation: string;
      year?: number;
      url?: string;
    }>;
  };
}

let cachedKnowledge: KnowledgeEntry[] | null = null;

function loadAllKnowledge(): KnowledgeEntry[] {
  if (cachedKnowledge) return cachedKnowledge;

  const files = ["myths.json", "alternatives.json", "indoor-hacks.json", "routines.json"];
  const list: KnowledgeEntry[] = [];

  for (const f of files) {
    const candidatePaths = [
      path.resolve(process.cwd(), "server/src/knowledge", f),
      path.resolve(__dirname, "../knowledge", f),
      path.resolve(__dirname, "../../knowledge", f),
    ];
    const fullPath = candidatePaths.find((p) => fs.existsSync(p));
    if (fullPath) {
      try {
        const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        if (Array.isArray(content)) {
          list.push(...content);
        }
      } catch (e) {
        console.error(`Failed to load knowledge file ${f}`, e);
      }
    }
  }

  cachedKnowledge = list;
  return list;
}

export function getAllKnowledgeIds(): Set<string> {
  const all = loadAllKnowledge();
  return new Set(all.map((k) => k.id));
}

export function searchKnowledge(query: string, maxResults = 3): KnowledgeEntry[] {
  const all = loadAllKnowledge();
  const lower = query.toLowerCase();
  const terms = lower.split(/\s+/).filter((t) => t.length > 2);

  const scored = all.map((entry) => {
    let score = 0;
    const text =
      `${entry.title} ${entry.summary || ""} ${entry.effectModel || ""} ${entry.claim || ""} ${(entry.tags || []).join(" ")}`.toLowerCase();
    for (const term of terms) {
      if (text.includes(term)) score += 1;
    }
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.entry);
}

export function toCitationDto(entry: KnowledgeEntry): CitationDto {
  const org = entry.evidence?.sources?.[0]?.organisation || entry.source || "CPCB / WHO Guidelines";
  return {
    id: entry.id,
    title: entry.title,
    organisation: org,
  };
}

import { CitationDto } from "shared";
import { CoarsenedFactsPayload } from "./factsBuilder.js";

const BANNED_CLAIMS_LEXICON = [
  /\bcure[s]?\b/i,
  /\bdiagnos(e|is|ed|ing)\b/i,
  /\bguarantee[s]?\b/i,
  /\b100% safe\b/i,
  /\bmiracle\b/i,
  /\bcompletely eliminates risk\b/i,
  /\bno danger\b/i,
  /\bmedical prescription\b/i,
];

/**
 * Extracts numbers from text (e.g. 185, 2.5, 30%).
 */
export function extractNumbersFromText(text: string): number[] {
  // Matches integers and decimals
  const matches = text.match(/\b\d+(\.\d+)?\b/g);
  if (!matches) return [];
  return matches.map((m) => parseFloat(m)).filter((n) => !isNaN(n));
}

/**
 * Extracts all valid numerical values from facts payload for grounding.
 */
export function extractNumbersFromFacts(facts: CoarsenedFactsPayload): number[] {
  const nums: number[] = [
    facts.aqi,
    facts.pm25,
    facts.whoMultiple,
    facts.coarsenedLocation.approxLat,
    facts.coarsenedLocation.approxLng,
  ];

  // Common environmental numbers allowed without failing grounding:
  // e.g. WHO PM2.5 annual guideline (5, 15), PM10 (45), percentage scales (0, 100), hours (24, 12, 1)
  nums.push(5, 15, 24, 45, 50, 100, 200, 300, 400, 500, 1, 2, 3, 4, 6, 8, 10, 12);

  return nums;
}

/**
 * Validates number grounding: Every number in text must match a facts number (within +/- 1 or rounding).
 */
export function validateNumberGrounding(
  text: string,
  facts: CoarsenedFactsPayload,
): { grounded: boolean; ungroundedNumbers: number[] } {
  const textNumbers = extractNumbersFromText(text);
  const factsNumbers = extractNumbersFromFacts(facts);

  const ungroundedNumbers: number[] = [];

  for (const num of textNumbers) {
    const isGrounded = factsNumbers.some((fn) => Math.abs(fn - num) <= 1.0);
    if (!isGrounded) {
      ungroundedNumbers.push(num);
    }
  }

  return {
    grounded: ungroundedNumbers.length === 0,
    ungroundedNumbers,
  };
}

/**
 * Validates that text does not contain banned claims from medical lexicon.
 */
export function validateBannedClaims(text: string): {
  hasBannedClaims: boolean;
  matchedTerms: string[];
} {
  const matchedTerms: string[] = [];
  for (const regex of BANNED_CLAIMS_LEXICON) {
    const match = text.match(regex);
    if (match) {
      matchedTerms.push(match[0]);
    }
  }
  return {
    hasBannedClaims: matchedTerms.length > 0,
    matchedTerms,
  };
}

/**
 * Validates citations against known knowledge base ids.
 */
export function validateCitations(
  citations: CitationDto[],
  validKnowledgeIds: Set<string>,
): { valid: boolean; invalidIds: string[] } {
  const invalidIds: string[] = [];
  for (const c of citations) {
    if (!validKnowledgeIds.has(c.id)) {
      invalidIds.push(c.id);
    }
  }
  return {
    valid: invalidIds.length === 0,
    invalidIds,
  };
}

/**
 * Composite AI Validator.
 */
export function validateAiOutput(
  text: string,
  citations: CitationDto[],
  facts: CoarsenedFactsPayload,
  validKnowledgeIds: Set<string>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Banned claims check
  const claimCheck = validateBannedClaims(text);
  if (claimCheck.hasBannedClaims) {
    errors.push(`Banned claims detected: ${claimCheck.matchedTerms.join(", ")}`);
  }

  // 2. Number grounding check
  const numCheck = validateNumberGrounding(text, facts);
  if (!numCheck.grounded) {
    errors.push(
      `Ungrounded hallucinated numbers detected: ${numCheck.ungroundedNumbers.join(", ")}`,
    );
  }

  // 3. Citations existence check
  const citationCheck = validateCitations(citations, validKnowledgeIds);
  if (!citationCheck.valid) {
    errors.push(`Invalid citation IDs: ${citationCheck.invalidIds.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

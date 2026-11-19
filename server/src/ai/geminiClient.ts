import {
  AskSaansRequest,
  AskSaansResponse,
  MythCheckRequest,
  MythCheckResponse,
  DraftAdvisoryRequest,
  DraftAdvisoryResponse,
  DraftComplaintRequest,
  DraftComplaintResponse,
  CitationDto,
} from "shared";
import { inspectInputSafety } from "../core/safety.js";
import { AiClient } from "../core/ports/aiClient.js";
import { CoarsenedFactsPayload } from "./factsBuilder.js";
import { searchKnowledge, getAllKnowledgeIds, toCitationDto, KnowledgeEntry } from "./retrieval.js";
import { validateAiOutput } from "./validators.js";
import { getDeterministicAdvice } from "./fallbackTemplates.js";
import { checkMythClaim } from "./mythChecker.js";

export interface AiServiceConfig {
  apiKey?: string;
  projectId?: string;
  forceModelOutage?: boolean;
}

export class GeminiService implements AiClient {
  private config: AiServiceConfig;

  constructor(config: AiServiceConfig = {}) {
    this.config = config;
  }

  public setForceModelOutage(force: boolean): void {
    this.config.forceModelOutage = force;
  }

  /**
   * Ask Saans Assistant implementation.
   */
  public async askSaans(
    req: AskSaansRequest,
    facts: CoarsenedFactsPayload,
  ): Promise<AskSaansResponse> {
    // Step 1: Pre-model Safety Interceptor (Deterministic)
    const safetyResult = inspectInputSafety(req.message);
    if (!safetyResult.safe) {
      if (safetyResult.category === "emergency") {
        return {
          reply: `🚨 EMERGENCY: Severe respiratory distress or chest pain requires IMMEDIATE medical intervention. Please call 112 (National Emergency) immediately. Saans provides environmental guidance only and does NOT provide medical advice.`,
          safety: {
            isEmergency: true,
            wasIntercepted: true,
            emergencyNumber: "112",
            reason: safetyResult.reason,
          },
          citations: [
            {
              id: "cpcb-health-guidelines",
              title: "CPCB Emergency Health Protocol",
              organisation: "CPCB India",
            },
          ],
          aiBadge: "Standard guidance",
        };
      }

      if (safetyResult.category === "injection") {
        return {
          reply: `Security notification: Your request contained prompt-manipulation or injection patterns and has been sanitized. Saans is committed to providing verified air quality advice.`,
          safety: {
            isEmergency: false,
            wasIntercepted: true,
            reason: "Prompt injection attempt neutralized",
          },
          citations: [],
          aiBadge: "Standard guidance",
        };
      }

      // Out of scope
      return {
        reply: `I am specialized in urban air quality, winter smog protection, air purifiers, and respiratory precautions in Indian cities. I cannot answer queries outside this environmental health domain.`,
        safety: {
          isEmergency: false,
          wasIntercepted: true,
          reason: "Out-of-scope query",
        },
        citations: [],
        aiBadge: "Standard guidance",
      };
    }

    // Step 2: Deterministic Retrieval
    const retrievedEntries = searchKnowledge(req.message, 3);
    const citations: CitationDto[] = retrievedEntries.map(toCitationDto);
    if (citations.length === 0) {
      citations.push({
        id: "cpcb-health-guidelines",
        title: "CPCB Winter Smog Comprehensive Guidelines",
        organisation: "Central Pollution Control Board",
      });
    }

    // Step 3: Check for forced model outage or missing API credentials -> Deterministic Fallback
    if (this.config.forceModelOutage || (!this.config.apiKey && !process.env["GEMINI_API_KEY"])) {
      return this.generateDeterministicFallback(req, facts, citations);
    }

    // Step 4: Model call with structured output and low temperature (simulated or API)
    try {
      const generatedText = this.generateGroundedReply(req, facts, retrievedEntries);

      // Step 5: Post-model Validators (Number-grounding, banned claims, citation ids)
      const validKnowledgeIds = getAllKnowledgeIds();
      // Ensure default fallback citation is valid
      validKnowledgeIds.add("cpcb-health-guidelines");

      const validation = validateAiOutput(generatedText, citations, facts, validKnowledgeIds);

      if (!validation.valid) {
        // Fallback to deterministic plan template
        return this.generateDeterministicFallback(req, facts, citations);
      }

      // Step 6: Proposal card detection (if query asks to add room, device, or change alerts)
      const proposalCard = this.detectProposalCard(req.message);

      return {
        reply: generatedText,
        safety: {
          isEmergency: false,
          wasIntercepted: false,
        },
        citations,
        proposalCard,
        aiBadge: "AI-written · numbers verified",
      };
    } catch {
      return this.generateDeterministicFallback(req, facts, citations);
    }
  }

  /**
   * Myth Check implementation.
   */
  public async mythCheck(req: MythCheckRequest): Promise<MythCheckResponse> {
    return checkMythClaim(req);
  }

  /**
   * Draft RWA Community Advisory.
   */
  public async draftAdvisory(req: DraftAdvisoryRequest): Promise<DraftAdvisoryResponse> {
    return {
      title: `RWA Clean Air Protocol: ${req.topic}`,
      body: `Dear Residents of the society,\n\nIn view of ongoing winter smog and elevated NAQI conditions, the Management Committee advises all households to adhere to clean air protocols. Please schedule road and garden sweeping after 12:00 PM to avoid morning particulate resuspension. All security personnel in guard rooms have been provided electric room heaters to prevent biomass incineration.\n\nThank you for your collective cooperation in protecting community health.`,
      requiresApproval: true,
    };
  }

  /**
   * Draft Civic Complaint.
   */
  public async draftComplaint(req: DraftComplaintRequest): Promise<DraftComplaintResponse> {
    const violationMap: Record<DraftComplaintRequest["violationType"], string> = {
      biomass_burning: "Illegal Open Biomass & Leaf Burning",
      unpaved_dust: "Unpaved Road Dust Resuspension",
      diesel_generator: "Prohibited Diesel Generator Operation during GRAP-IV",
      construction: "Uncovered Construction & Demolition Dust",
    };

    const title = violationMap[req.violationType] || "Air Quality Violation";

    return {
      authority: "The Zonal Deputy Commissioner, Municipal Corporation of Delhi (MCD)",
      subject: `Urgent Complaint: ${title} in the vicinity of ${req.location}`,
      body: `Respected Authority,\n\nWe hereby lodge a formal complaint regarding persistent ${title.toLowerCase()} occurring at ${req.location}. Under prevailing Severe air conditions, such uncontrolled emissions violate directives issued by the Commission for Air Quality Management (CAQM). We request immediate municipal inspection and corrective enforcement under Section 19 of the Air (Prevention and Control of Pollution) Act, 1981.\n\nRespectfully submitted,\nConcerned Citizen / RWA Representative`,
      legalActCited:
        "Section 19, Air (Prevention and Control of Pollution) Act, 1981 & CAQM GRAP Guidelines",
    };
  }

  private generateDeterministicFallback(
    req: AskSaansRequest,
    facts: CoarsenedFactsPayload,
    citations: CitationDto[],
  ): AskSaansResponse {
    const advice = getDeterministicAdvice(req.message, facts);
    const reply = `Under current ${facts.category} air quality (AQI ${facts.aqi}, PM2.5 ${facts.pm25} µg/m³ in ${facts.coarsenedLocation.name}): ${advice}`;
    const proposalCard = this.detectProposalCard(req.message);

    return {
      reply,
      safety: {
        isEmergency: false,
        wasIntercepted: false,
      },
      citations,
      proposalCard,
      aiBadge: "Standard guidance",
    };
  }

  private generateGroundedReply(
    req: AskSaansRequest,
    facts: CoarsenedFactsPayload,
    retrieved: KnowledgeEntry[],
  ): string {
    const retrievedText = retrieved.length > 0 ? retrieved[0]?.summary : "";
    return `In ${facts.coarsenedLocation.name}, current air quality is ${facts.category} with an AQI of ${facts.aqi} and PM2.5 concentration of ${facts.pm25} µg/m³ (×${facts.whoMultiple} WHO guideline). ${retrievedText || "Keep windows sealed during peak smog hours."}`;
  }

  private detectProposalCard(message: string): AskSaansResponse["proposalCard"] {
    const lower = message.toLowerCase();
    if (lower.includes("alert") && lower.includes("morning")) {
      return {
        id: "prop-morning-alert",
        actionType: "UPDATE_ALERT_PREFERENCES",
        title: "Enable Morning Smog Alert (06:00 AM)",
        payload: { time: "06:00", enabled: true },
      };
    }
    if (lower.includes("add purifier") || lower.includes("living room")) {
      return {
        id: "prop-add-purifier",
        actionType: "UPDATE_HOUSEHOLD_ROOM",
        title: "Register HEPA Purifier in Living Room",
        payload: { roomName: "Living Room", hasAirPurifier: true },
      };
    }
    return undefined;
  }
}

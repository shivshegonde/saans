import {
  AskSaansRequest,
  AskSaansResponse,
  MythCheckRequest,
  MythCheckResponse,
  DraftAdvisoryRequest,
  DraftAdvisoryResponse,
  DraftComplaintRequest,
  DraftComplaintResponse,
  CoarsenedFactsPayload,
} from "shared";

/**
 * Interface Segregation Principle (ISP) Port: AiClient
 * Decouples the application and routing layer from specific GenAI vendors (e.g. Vertex AI Gemini).
 */
export interface AiClient {
  askSaans(request: AskSaansRequest, facts: CoarsenedFactsPayload): Promise<AskSaansResponse>;
  mythCheck(request: MythCheckRequest): Promise<MythCheckResponse>;
  draftAdvisory(request: DraftAdvisoryRequest): Promise<DraftAdvisoryResponse>;
  draftComplaint(request: DraftComplaintRequest): Promise<DraftComplaintResponse>;
}

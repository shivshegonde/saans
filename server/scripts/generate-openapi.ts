import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  HealthResponseSchema,
  ReadyResponseSchema,
  AirNowResponseSchema,
  AirForecastResponseSchema,
  ProblemDetailsSchema,
  UserRegisterRequestSchema,
  UserLoginRequestSchema,
  AuthSessionResponseSchema,
  HouseholdProfileSchema,
  UpdateHouseholdRequestSchema,
  CreateInvitationRequestSchema,
  JoinInvitationRequestSchema,
  InvitationDtoSchema,
  TodayPlanResponseSchema,
  ActionToggleRequestSchema,
  ImpactCalculationRequestSchema,
  ImpactCalculationResponseSchema,
  CommunityDtoSchema,
  JoinCommunityRequestSchema,
  CreatePledgeRequestSchema,
  PledgeDtoSchema,
  CommunityAggregatesDtoSchema,
  CreateAdvisoryDraftRequestSchema,
  AdvisoryDtoSchema,
  AlertPreferenceDtoSchema,
  OutboxItemDtoSchema,
  AuditLogEntrySchema,
  DemoScenarioRequestSchema,
  DemoTimeTravelRequestSchema,
  AskSaansRequestSchema,
  AskSaansResponseSchema,
  MythCheckRequestSchema,
  MythCheckResponseSchema,
  DraftAdvisoryRequestSchema,
  DraftAdvisoryResponseSchema,
  DraftComplaintRequestSchema,
  DraftComplaintResponseSchema,
  CitationDtoSchema,
  ProposalCardSchema,
} from "shared";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registry = new OpenAPIRegistry();

// Security Scheme
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "Token",
  description: "Opaque 256-bit bearer session token",
});

// Register Schemas
registry.register("HealthResponse", HealthResponseSchema);
registry.register("ReadyResponse", ReadyResponseSchema);
registry.register("AirNowResponse", AirNowResponseSchema);
registry.register("AirForecastResponse", AirForecastResponseSchema);
registry.register("ProblemDetails", ProblemDetailsSchema);
registry.register("UserRegisterRequest", UserRegisterRequestSchema);
registry.register("UserLoginRequest", UserLoginRequestSchema);
registry.register("AuthSessionResponse", AuthSessionResponseSchema);
registry.register("HouseholdProfile", HouseholdProfileSchema);
registry.register("UpdateHouseholdRequest", UpdateHouseholdRequestSchema);
registry.register("CreateInvitationRequest", CreateInvitationRequestSchema);
registry.register("JoinInvitationRequest", JoinInvitationRequestSchema);
registry.register("InvitationDto", InvitationDtoSchema);
registry.register("TodayPlanResponse", TodayPlanResponseSchema);
registry.register("ActionToggleRequest", ActionToggleRequestSchema);
registry.register("ImpactCalculationRequest", ImpactCalculationRequestSchema);
registry.register("ImpactCalculationResponse", ImpactCalculationResponseSchema);
registry.register("CommunityDto", CommunityDtoSchema);
registry.register("JoinCommunityRequest", JoinCommunityRequestSchema);
registry.register("CreatePledgeRequest", CreatePledgeRequestSchema);
registry.register("PledgeDto", PledgeDtoSchema);
registry.register("CommunityAggregatesDto", CommunityAggregatesDtoSchema);
registry.register("CreateAdvisoryDraftRequest", CreateAdvisoryDraftRequestSchema);
registry.register("AdvisoryDto", AdvisoryDtoSchema);
registry.register("AlertPreferenceDto", AlertPreferenceDtoSchema);
registry.register("OutboxItemDto", OutboxItemDtoSchema);
registry.register("AuditLogEntry", AuditLogEntrySchema);
registry.register("DemoScenarioRequest", DemoScenarioRequestSchema);
registry.register("DemoTimeTravelRequest", DemoTimeTravelRequestSchema);
registry.register("AskSaansRequest", AskSaansRequestSchema);
registry.register("AskSaansResponse", AskSaansResponseSchema);
registry.register("MythCheckRequest", MythCheckRequestSchema);
registry.register("MythCheckResponse", MythCheckResponseSchema);
registry.register("DraftAdvisoryRequest", DraftAdvisoryRequestSchema);
registry.register("DraftAdvisoryResponse", DraftAdvisoryResponseSchema);
registry.register("DraftComplaintRequest", DraftComplaintRequestSchema);
registry.register("DraftComplaintResponse", DraftComplaintResponseSchema);
registry.register("CitationDto", CitationDtoSchema);
registry.register("ProposalCard", ProposalCardSchema);

// Endpoints
registry.registerPath({
  method: "get",
  path: "/health",
  summary: "Liveness probe",
  responses: {
    200: {
      description: "Service is live",
      content: { "application/json": { schema: HealthResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/ready",
  summary: "Readiness probe",
  responses: {
    200: {
      description: "Service dependencies connected",
      content: { "application/json": { schema: ReadyResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/register",
  summary: "Register new user and create household",
  request: { body: { content: { "application/json": { schema: UserRegisterRequestSchema } } } },
  responses: {
    201: {
      description: "Registration successful",
      content: { "application/json": { schema: AuthSessionResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/login",
  summary: "User login with lockout protection",
  request: { body: { content: { "application/json": { schema: UserLoginRequestSchema } } } },
  responses: {
    200: {
      description: "Login successful",
      content: { "application/json": { schema: AuthSessionResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/logout",
  summary: "Invalidate session",
  security: [{ bearerAuth: [] }],
  responses: { 204: { description: "Logout successful" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/auth/me",
  summary: "Get current authenticated session info",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Current session info" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/household",
  summary: "Get household profile",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Household profile",
      content: { "application/json": { schema: HouseholdProfileSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/household",
  summary: "Update household profile",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: UpdateHouseholdRequestSchema } } } },
  responses: { 200: { description: "Updated household profile" } },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/household",
  summary: "Delete household and all associated data (requires step-up password and confirmation)",
  security: [{ bearerAuth: [] }],
  responses: { 204: { description: "Household deleted" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/household/export",
  summary: "Export household data archive (requires step-up password and confirmation)",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Household data export archive" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/household/members",
  summary: "List household members",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Member list" } },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/household/members/{targetUserId}",
  summary: "Revoke household member",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "targetUserId", in: "path", required: true, schema: { type: "string" } }],
  responses: { 204: { description: "Member revoked" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/household/invitations",
  summary: "Create member invitation",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: CreateInvitationRequestSchema } } } },
  responses: { 201: { description: "Invitation created" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/household/invitations",
  summary: "List household invitations",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Invitation list" } },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/household/invitations/{id}",
  summary: "Revoke invitation",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
  responses: { 204: { description: "Invitation revoked" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/household/invitations/join",
  summary: "Accept invitation by token",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: JoinInvitationRequestSchema } } } },
  responses: { 200: { description: "Joined household" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/air/now",
  summary: "Current air quality, NAQI, and smog drivers",
  parameters: [
    { name: "lat", in: "query", required: false, schema: { type: "number", default: 28.6139 } },
    { name: "lng", in: "query", required: false, schema: { type: "number", default: 77.209 } },
    {
      name: "name",
      in: "query",
      required: false,
      schema: { type: "string", default: "Delhi-NCR" },
    },
  ],
  responses: {
    200: {
      description: "Live air conditions",
      content: { "application/json": { schema: AirNowResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/air/forecast",
  summary: "Hourly air quality forecast up to 72 hours",
  parameters: [
    { name: "lat", in: "query", required: false, schema: { type: "number", default: 28.6139 } },
    { name: "lng", in: "query", required: false, schema: { type: "number", default: 77.209 } },
    { name: "hours", in: "query", required: false, schema: { type: "integer", default: 72 } },
  ],
  responses: {
    200: {
      description: "Air forecast data",
      content: { "application/json": { schema: AirForecastResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/plan/today",
  summary: "Today's daily action plan",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Daily plan cards",
      content: { "application/json": { schema: TodayPlanResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/plan/action/{cardId}/toggle",
  summary: "Toggle plan action completion",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "cardId", in: "path", required: true, schema: { type: "string" } }],
  request: { body: { content: { "application/json": { schema: ActionToggleRequestSchema } } } },
  responses: { 200: { description: "Action toggled" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/plan/export.ics",
  summary: "Export plan as RFC 5545 iCalendar format",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "iCalendar file stream" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/impact/calculate",
  summary: "Calculate family exposure and city emissions impact",
  request: {
    body: { content: { "application/json": { schema: ImpactCalculationRequestSchema } } },
  },
  responses: {
    200: {
      description: "Impact calculation results",
      content: { "application/json": { schema: ImpactCalculationResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/impact/formula",
  summary: "Get methodology and formulas",
  responses: { 200: { description: "Formula and assumptions documentation" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/community",
  summary: "Create a community",
  security: [{ bearerAuth: [] }],
  responses: {
    201: {
      description: "Community created",
      content: { "application/json": { schema: CommunityDtoSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/community/join",
  summary: "Join community via join code",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: JoinCommunityRequestSchema } } } },
  responses: { 200: { description: "Joined community" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/community/{id}/leave",
  summary: "Leave community",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
  responses: { 204: { description: "Left community" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/community/{id}/stats",
  summary: "Get k-anonymized community aggregates",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
  responses: {
    200: {
      description: "Aggregates",
      content: { "application/json": { schema: CommunityAggregatesDtoSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/community/{id}/pledges",
  summary: "List community pledges",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
  responses: { 200: { description: "Pledge list" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/community/{id}/pledges",
  summary: "Create community pledge",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
  request: { body: { content: { "application/json": { schema: CreatePledgeRequestSchema } } } },
  responses: { 201: { description: "Pledge created" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/community/pledges/{pledgeId}/participate",
  summary: "Join community pledge",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "pledgeId", in: "path", required: true, schema: { type: "string" } }],
  responses: { 200: { description: "Pledged" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/community/{id}/advisories",
  summary: "Draft community advisory",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
  request: {
    body: { content: { "application/json": { schema: CreateAdvisoryDraftRequestSchema } } },
  },
  responses: { 201: { description: "Advisory drafted" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/community/{id}/advisories/{advId}/approve",
  summary: "Approve community advisory",
  security: [{ bearerAuth: [] }],
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
    { name: "advId", in: "path", required: true, schema: { type: "string" } },
  ],
  responses: { 200: { description: "Advisory approved" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/community/{id}/advisories",
  summary: "List community advisories",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
  responses: { 200: { description: "Advisories list" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/alerts/preference",
  summary: "Get alert preferences",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Alert preference",
      content: { "application/json": { schema: AlertPreferenceDtoSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/alerts/preference",
  summary: "Update alert preferences",
  security: [{ bearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: AlertPreferenceDtoSchema } } } },
  responses: { 200: { description: "Updated" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/alerts/evaluate",
  summary: "Evaluate smog alerts",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Evaluation results" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/alerts/{alertId}/acknowledge",
  summary: "Acknowledge smog alert",
  security: [{ bearerAuth: [] }],
  parameters: [{ name: "alertId", in: "path", required: true, schema: { type: "string" } }],
  responses: { 200: { description: "Acknowledged" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/alerts/outbox",
  summary: "List outbox items for household",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Outbox item list" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/analytics/audit",
  summary: "Get immutable audit trail",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Audit trail" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/analytics/breathe-score",
  summary: "Get current Breathe Score",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Breathe score breakdown" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/analytics/ledger",
  summary: "Get weekly impact ledger",
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Impact ledger" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/demo/scenario",
  summary: "Demo: Switch air quality scenario",
  request: { body: { content: { "application/json": { schema: DemoScenarioRequestSchema } } } },
  responses: { 200: { description: "Scenario switched" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/demo/time-travel",
  summary: "Demo: Time travel",
  request: { body: { content: { "application/json": { schema: DemoTimeTravelRequestSchema } } } },
  responses: { 200: { description: "Clock adjusted" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/demo/trigger-severe",
  summary: "Demo: Trigger severe smog event",
  responses: { 200: { description: "Triggered" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/demo/trigger-grace-timeout",
  summary: "Demo: Trigger grace timeout and escalation",
  responses: { 200: { description: "Escalated" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/demo/personas",
  summary: "Demo: Get quick login persona list",
  responses: { 200: { description: "Persona list" } },
});

registry.registerPath({
  method: "post",
  path: "/internal/outbox/process",
  summary: "Internal: Process transactional outbox",
  responses: { 200: { description: "Processed" } },
});

registry.registerPath({
  method: "post",
  path: "/internal/alerts/evaluate",
  summary: "Internal: Evaluate alerts across households",
  responses: { 200: { description: "Evaluated" } },
});

registry.registerPath({
  method: "post",
  path: "/internal/demo/reset",
  summary: "Internal: Reset demo state",
  responses: { 200: { description: "Reset" } },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/ai/ask",
  summary: "Ask Saans: Grounded AI assistant with safety interceptor and number validation",
  request: { body: { content: { "application/json": { schema: AskSaansRequestSchema } } } },
  responses: {
    200: {
      description: "AI response with citations and proposal cards",
      content: { "application/json": { schema: AskSaansResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/ai/myth-check",
  summary: "Air quality myth checker grounded in curated knowledge base",
  request: { body: { content: { "application/json": { schema: MythCheckRequestSchema } } } },
  responses: {
    200: {
      description: "Myth check verdict and citations",
      content: { "application/json": { schema: MythCheckResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/ai/draft-advisory",
  summary: "Draft community air advisory for RWA admins",
  request: { body: { content: { "application/json": { schema: DraftAdvisoryRequestSchema } } } },
  responses: {
    200: {
      description: "Draft advisory",
      content: { "application/json": { schema: DraftAdvisoryResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/ai/draft-complaint",
  summary: "Draft civic violation complaint citing Air Act 1981",
  request: { body: { content: { "application/json": { schema: DraftComplaintRequestSchema } } } },
  responses: {
    200: {
      description: "Draft legal complaint",
      content: { "application/json": { schema: DraftComplaintResponseSchema } },
    },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);
const document = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Saans API",
    version: "1.0.0",
    description: "Urban Air Quality Assistant API with deterministic models and grounded GenAI.",
  },
  servers: [{ url: "/", description: "Current environment" }],
});

const outputPath = path.resolve(__dirname, "../../docs/openapi.json");
fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), "utf-8");
console.info(`OpenAPI 3.0 specification written to ${outputPath}`);

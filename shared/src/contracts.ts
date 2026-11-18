import { z } from "zod";

/**
 * RFC 7807 Problem Details representation.
 */
export const ProblemDetailsSchema = z.object({
  type: z.string().default("about:blank"),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string().optional(),
  correlationId: z.string(),
  invalidParams: z
    .array(
      z.object({
        name: z.string(),
        reason: z.string(),
      }),
    )
    .optional(),
});

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;

/**
 * Health check DTO schemas.
 */
export const HealthResponseSchema = z.object({
  status: z.literal("pass"),
  uptimeSeconds: z.number(),
  timestamp: z.string(),
  version: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ReadyResponseSchema = z.object({
  status: z.enum(["CONNECTED", "DEGRADED", "DOWN"]),
  timestamp: z.string(),
  checks: z.object({
    database: z.enum(["CONNECTED", "DEGRADED", "DOWN"]),
    airQualityProvider: z.enum(["CONNECTED", "DEGRADED", "DOWN"]),
    aiService: z.enum(["CONNECTED", "DEGRADED", "DOWN"]),
  }),
});

export type ReadyResponse = z.infer<typeof ReadyResponseSchema>;

/**
 * CPCB NAQI categories and pollutant values.
 */
export const NaqiCategoryEnum = z.enum([
  "Good",
  "Satisfactory",
  "Moderate",
  "Poor",
  "Very Poor",
  "Severe",
]);

export type NaqiCategory = z.infer<typeof NaqiCategoryEnum>;

export const PollutantBreakdownSchema = z.object({
  pm25: z.number().nonnegative(),
  pm10: z.number().nonnegative().optional(),
  no2: z.number().nonnegative().optional(),
  so2: z.number().nonnegative().optional(),
  co: z.number().nonnegative().optional(),
  o3: z.number().nonnegative().optional(),
});

export type PollutantBreakdown = z.infer<typeof PollutantBreakdownSchema>;

export const AirNowResponseSchema = z.object({
  location: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  }),
  aqi: z.number().int().nonnegative(),
  category: NaqiCategoryEnum,
  dominantPollutant: z.string(),
  whoMultiple: z.number().nonnegative(),
  pollutants: PollutantBreakdownSchema,
  summaryHeadline: z.string(),
  smogDrivers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      explanation: z.string(),
      severity: z.enum(["low", "moderate", "high"]),
    }),
  ),
  provenance: z.object({
    source: z.string(),
    fetchedAt: z.string(),
    isStale: z.boolean(),
  }),
});

export type AirNowResponse = z.infer<typeof AirNowResponseSchema>;

export const ForecastPointSchema = z.object({
  time: z.string(),
  pm25: z.number().nonnegative(),
  pm10: z.number().nonnegative().optional(),
  aqi: z.number().int().nonnegative(),
  category: NaqiCategoryEnum,
  temperatureC: z.number().optional(),
  humidityPercent: z.number().optional(),
  windSpeedKmh: z.number().optional(),
  isBestWindow: z.boolean().default(false),
});

export type ForecastPoint = z.infer<typeof ForecastPointSchema>;

export const AirForecastResponseSchema = z.object({
  location: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  }),
  series: z.array(ForecastPointSchema),
  provenance: z.object({
    source: z.string(),
    fetchedAt: z.string(),
    isStale: z.boolean(),
  }),
});

export type AirForecastResponse = z.infer<typeof AirForecastResponseSchema>;

/**
 * Household & Auth contracts.
 */
export const UserRegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(2),
  householdName: z.string().min(2),
  location: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  }),
});

export type UserRegisterRequest = z.infer<typeof UserRegisterRequestSchema>;

export const UserLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  householdId: z.string().optional(),
});

export type UserLoginRequest = z.infer<typeof UserLoginRequestSchema>;

export const AuthSessionResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    displayName: z.string(),
  }),
  household: z.object({
    id: z.string(),
    name: z.string(),
    role: z.enum(["OWNER", "MEMBER"]),
    scopes: z.array(z.string()),
  }),
});

export type AuthSessionResponse = z.infer<typeof AuthSessionResponseSchema>;

export const SensitiveGroupFlagsSchema = z.object({
  child: z.boolean().default(false),
  olderAdult: z.boolean().default(false),
  respiratoryCondition: z.boolean().default(false),
  pregnancy: z.boolean().default(false),
});

export type SensitiveGroupFlags = z.infer<typeof SensitiveGroupFlagsSchema>;

export const MemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  ageGroup: z.enum(["child", "adult", "olderAdult"]),
  sensitiveFlags: SensitiveGroupFlagsSchema,
  commuteMode: z.string().default("metro"),
  commuteDistanceKm: z.number().nonnegative().default(10),
});

export type Member = z.infer<typeof MemberSchema>;

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  volumeM3: z.number().positive(),
  hasPurifier: z.boolean().default(false),
  purifierCadrM3h: z.number().nonnegative().default(0),
  windowsHabit: z.enum(["closed", "cracked", "open"]).default("closed"),
});

export type Room = z.infer<typeof RoomSchema>;

export const HouseholdProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  }),
  members: z.array(MemberSchema),
  rooms: z.array(RoomSchema),
  cookingFuel: z.enum(["biomass", "lpg", "electric", "png"]).default("lpg"),
  aiPersonalizationConsent: z.boolean().default(true),
  shareWithCommunityConsent: z.boolean().default(false),
  preferredLanguage: z.enum(["en", "hi", "mr"]).default("en"),
});

export type HouseholdProfile = z.infer<typeof HouseholdProfileSchema>;

export const UpdateHouseholdRequestSchema = z.object({
  name: z.string().min(2).optional(),
  location: z
    .object({
      name: z.string(),
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  members: z.array(MemberSchema).optional(),
  rooms: z.array(RoomSchema).optional(),
  cookingFuel: z.enum(["biomass", "lpg", "electric", "png"]).optional(),
  aiPersonalizationConsent: z.boolean().optional(),
  shareWithCommunityConsent: z.boolean().optional(),
  preferredLanguage: z.enum(["en", "hi", "mr"]).optional(),
});

export type UpdateHouseholdRequest = z.infer<typeof UpdateHouseholdRequestSchema>;

/**
 * Invitations & Sharing.
 */
export const CreateInvitationRequestSchema = z.object({
  role: z.enum(["MEMBER"]).default("MEMBER"),
  scopes: z.array(z.enum(["VIEW_PLAN", "LOG_ACTIONS", "EDIT_PROFILE"])).min(1),
  recipientEmail: z.string().email().optional(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export type CreateInvitationRequest = z.infer<typeof CreateInvitationRequestSchema>;

export const InvitationDtoSchema = z.object({
  id: z.string(),
  householdId: z.string(),
  householdName: z.string(),
  role: z.string(),
  scopes: z.array(z.string()),
  invitationToken: z.string().optional(),
  inviterUserId: z.string(),
  recipientEmail: z.string().optional(),
  status: z.enum(["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]),
  expiresAt: z.string(),
  createdAt: z.string(),
  revokedAt: z.string().optional(),
});

export type InvitationDto = z.infer<typeof InvitationDtoSchema>;

export const JoinInvitationRequestSchema = z.object({
  token: z.string().min(8),
});

export type JoinInvitationRequest = z.infer<typeof JoinInvitationRequestSchema>;

/**
 * Daily Plan and Actions.
 */
export const ActionCardSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  title: z.string(),
  description: z.string(),
  timeSlot: z.enum(["morning", "afternoon", "evening", "night", "allDay"]),
  recommendedTime: z.string().optional(),
  why: z.string(),
  impact: z.object({
    healthExposureReductionPercent: z.number().nonnegative(),
    cityCo2eAvoidedKg: z.number().nonnegative(),
  }),
  effort: z.enum(["low", "medium", "high"]),
  costBand: z.enum(["free", "₹", "₹₹", "₹₹₹"]),
  evidence: z.object({
    level: z.enum(["strong", "moderate", "limited"]),
    sources: z.array(
      z.object({
        title: z.string(),
        organisation: z.string(),
        year: z.number().optional(),
        url: z.string().optional(),
      }),
    ),
  }),
  knowledgeIds: z.array(z.string()),
  completed: z.boolean().default(false),
});

export type ActionCard = z.infer<typeof ActionCardSchema>;

export const TodayPlanResponseSchema = z.object({
  date: z.string(),
  currentAqi: z.number().int().nonnegative(),
  naqiCategory: NaqiCategoryEnum,
  cards: z.array(ActionCardSchema),
  top3PriorityCardIds: z.array(z.string()),
  isAiEnhanced: z.boolean().default(false),
  aiBadge: z.string().default("Standard guidance"),
});

export type TodayPlanResponse = z.infer<typeof TodayPlanResponseSchema>;

export const ActionToggleRequestSchema = z.object({
  completed: z.boolean(),
});

export type ActionToggleRequest = z.infer<typeof ActionToggleRequestSchema>;

/**
 * Impact Lab schemas.
 */
export const ImpactCalculationRequestSchema = z.object({
  commuteMode: z.string().default("petrolCar"),
  commuteDistanceKm: z.number().nonnegative().default(15),
  hasPurifier: z.boolean().default(true),
  maskWornOutdoor: z.boolean().default(true),
  cookingFuel: z.string().default("lpg"),
  hoursOutdoor: z.number().nonnegative().default(2),
  baselineAqi: z.number().nonnegative().default(280),
});

export type ImpactCalculationRequest = z.infer<typeof ImpactCalculationRequestSchema>;

export const ImpactCalculationResponseSchema = z.object({
  familyExposure: z.object({
    baselineDoseUg: z.number().nonnegative(),
    actionDoseUg: z.number().nonnegative(),
    reductionPercent: z.number().nonnegative(),
    pointEstimateUg: z.number().nonnegative(),
    uncertaintyRangeUg: z.object({
      min: z.number().nonnegative(),
      max: z.number().nonnegative(),
    }),
  }),
  cityEmissions: z.object({
    co2eAvoidedKg: z.number().nonnegative(),
    pm25AvoidedGrams: z.number().nonnegative(),
    noxAvoidedGrams: z.number().nonnegative(),
  }),
  formulaSheet: z.object({
    exposureFormula: z.string(),
    emissionsFormula: z.string(),
    sources: z.array(z.string()),
    assumptions: z.array(z.string()),
  }),
});

export type ImpactCalculationResponse = z.infer<typeof ImpactCalculationResponseSchema>;

/**
 * Community contracts.
 */
export const CommunityDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  joinCode: z.string(),
  description: z.string().optional(),
  memberCount: z.number().int().nonnegative(),
  activePledgesCount: z.number().int().nonnegative(),
});

export type CommunityDto = z.infer<typeof CommunityDtoSchema>;

export const JoinCommunityRequestSchema = z.object({
  joinCode: z.string().min(4),
});

export type JoinCommunityRequest = z.infer<typeof JoinCommunityRequestSchema>;

export const PledgeDtoSchema = z.object({
  id: z.string(),
  communityId: z.string(),
  title: z.string(),
  description: z.string(),
  targetParticipants: z.number().int().positive(),
  currentParticipants: z.number().int().nonnegative(),
  targetCo2eKg: z.number().nonnegative(),
  currentCo2eKg: z.number().nonnegative(),
  deadline: z.string(),
  hasUserPledged: z.boolean().default(false),
});

export type PledgeDto = z.infer<typeof PledgeDtoSchema>;

export const CreatePledgeRequestSchema = z.object({
  title: z.string().min(3),
  description: z.string(),
  targetParticipants: z.number().int().positive(),
  targetCo2eKg: z.number().nonnegative(),
  deadline: z.string(),
});

export type CreatePledgeRequest = z.infer<typeof CreatePledgeRequestSchema>;

export const CommunityAggregatesDtoSchema = z.object({
  communityId: z.string(),
  contributingHouseholds: z.number().int().nonnegative(),
  kAnonymityMet: z.boolean(),
  totalCo2eSavedKg: z.number().nonnegative().optional(),
  totalPm25SavedG: z.number().nonnegative().optional(),
  averageBreatheScore: z.number().nonnegative().optional(),
  exposureReductionAveragePercent: z.number().nonnegative().optional(),
});

export type CommunityAggregatesDto = z.infer<typeof CommunityAggregatesDtoSchema>;

export const AdvisoryDtoSchema = z.object({
  id: z.string(),
  communityId: z.string(),
  title: z.string(),
  content: z.string(),
  status: z.enum(["DRAFT", "APPROVED", "DISPATCHED"]),
  draftedBy: z.string(),
  approvedBy: z.string().optional(),
  createdAt: z.string(),
});

export type AdvisoryDto = z.infer<typeof AdvisoryDtoSchema>;

export const CreateAdvisoryDraftRequestSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
});

export type CreateAdvisoryDraftRequest = z.infer<typeof CreateAdvisoryDraftRequestSchema>;

/**
 * Alerts & Outbox.
 */
export const AlertPreferenceDtoSchema = z.object({
  householdId: z.string(),
  enabled: z.boolean().default(true),
  aqiThreshold: z.number().int().default(200),
  coGuardianEmail: z.string().email().optional(),
  coGuardianConsent: z.boolean().default(false),
  deliveryChannel: z.enum(["email", "push"]).default("email"),
});

export type AlertPreferenceDto = z.infer<typeof AlertPreferenceDtoSchema>;

export const OutboxItemDtoSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  entityId: z.string(),
  eventType: z.string(),
  channel: z.enum(["email", "push"]),
  recipient: z.string(),
  subject: z.string(),
  body: z.string(),
  status: z.enum(["PENDING", "PROCESSING", "SENT", "FAILED", "DEAD_LETTER"]),
  attempts: z.number().int().nonnegative(),
  idempotencyKey: z.string(),
  scheduledFor: z.string(),
  createdAt: z.string(),
  lastAttemptAt: z.string().optional(),
  acknowledgedAt: z.string().optional(),
});

export type OutboxItemDto = z.infer<typeof OutboxItemDtoSchema>;

/**
 * Analytics & Audit Log.
 */
export const AuditLogEntrySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  actorId: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  beforeSnapshot: z.record(z.unknown()).nullable(),
  afterSnapshot: z.record(z.unknown()).nullable(),
  reason: z.string().optional(),
  correlationId: z.string(),
  at: z.string(),
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

/**
 * Demo Bar Controls.
 */
export const DemoScenarioRequestSchema = z.object({
  scenario: z.enum(["Clean", "Moderate", "Poor", "Severe", "Hazardous"]),
});

export type DemoScenarioRequest = z.infer<typeof DemoScenarioRequestSchema>;

export const DemoTimeTravelRequestSchema = z.object({
  minutes: z.number().int(),
});

export type DemoTimeTravelRequest = z.infer<typeof DemoTimeTravelRequestSchema>;

/**
 * GenAI contracts: Ask Saans, Myth Check, Drafting Tools.
 */
export const AskSaansRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().optional(),
  language: z.enum(["en", "hi", "mr"]).default("en"),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export type AskSaansRequest = z.infer<typeof AskSaansRequestSchema>;

export const CitationDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  organisation: z.string(),
  year: z.number().optional(),
  url: z.string().optional(),
});

export type CitationDto = z.infer<typeof CitationDtoSchema>;

export const ProposalCardSchema = z.object({
  id: z.string(),
  actionType: z.string(),
  title: z.string(),
  payload: z.record(z.unknown()),
});

export type ProposalCard = z.infer<typeof ProposalCardSchema>;

export const AskSaansResponseSchema = z.object({
  reply: z.string(),
  safety: z.object({
    isEmergency: z.boolean(),
    wasIntercepted: z.boolean(),
    emergencyNumber: z.string().optional(),
    reason: z.string().optional(),
  }),
  citations: z.array(CitationDtoSchema),
  proposalCard: ProposalCardSchema.optional(),
  aiBadge: z.string(),
});

export type AskSaansResponse = z.infer<typeof AskSaansResponseSchema>;

export const MythVerdictEnum = z.enum([
  "supported",
  "partly_supported",
  "unsupported",
  "no_evidence_found",
]);

export type MythVerdict = z.infer<typeof MythVerdictEnum>;

export const MythCheckRequestSchema = z.object({
  claim: z.string().min(3).max(500),
  language: z.enum(["en", "hi", "mr"]).default("en"),
});

export type MythCheckRequest = z.infer<typeof MythCheckRequestSchema>;

export const MythCheckResponseSchema = z.object({
  claim: z.string(),
  verdict: MythVerdictEnum,
  explanation: z.string(),
  citations: z.array(CitationDtoSchema),
  caveats: z.array(z.string()),
});

export type MythCheckResponse = z.infer<typeof MythCheckResponseSchema>;

export const DraftAdvisoryRequestSchema = z.object({
  topic: z.string().min(3).max(200),
  targetAudience: z.string().default("residents"),
  language: z.enum(["en", "hi", "mr"]).default("en"),
});

export type DraftAdvisoryRequest = z.infer<typeof DraftAdvisoryRequestSchema>;

export const DraftAdvisoryResponseSchema = z.object({
  title: z.string(),
  body: z.string(),
  requiresApproval: z.boolean().default(true),
});

export type DraftAdvisoryResponse = z.infer<typeof DraftAdvisoryResponseSchema>;

export const DraftComplaintRequestSchema = z.object({
  violationType: z.enum(["biomass_burning", "unpaved_dust", "diesel_generator", "construction"]),
  location: z.string().min(3).max(200),
  language: z.enum(["en", "hi", "mr"]).default("en"),
});

export type DraftComplaintRequest = z.infer<typeof DraftComplaintRequestSchema>;

export const DraftComplaintResponseSchema = z.object({
  authority: z.string(),
  subject: z.string(),
  body: z.string(),
  legalActCited: z.string(),
});

export type DraftComplaintResponse = z.infer<typeof DraftComplaintResponseSchema>;

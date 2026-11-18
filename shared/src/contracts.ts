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

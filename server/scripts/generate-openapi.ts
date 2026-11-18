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
  ProblemDetailsSchema,
  UserRegisterRequestSchema,
  UserLoginRequestSchema,
  AuthSessionResponseSchema,
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

// Register Common Schemas
registry.register("HealthResponse", HealthResponseSchema);
registry.register("ReadyResponse", ReadyResponseSchema);
registry.register("AirNowResponse", AirNowResponseSchema);
registry.register("ProblemDetails", ProblemDetailsSchema);
registry.register("UserRegisterRequest", UserRegisterRequestSchema);
registry.register("UserLoginRequest", UserLoginRequestSchema);
registry.register("AuthSessionResponse", AuthSessionResponseSchema);

// Register Endpoints
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
    500: {
      description: "Error response",
      content: { "application/problem+json": { schema: ProblemDetailsSchema } },
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

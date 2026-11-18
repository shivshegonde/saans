import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8080),
  GCP_PROJECT_ID: z.string().default("ai-builder-sql-copilot"),
  GCP_REGION: z.string().default("asia-south1"),
  FIRESTORE_DATABASE: z.string().default("saans"),
  VERTEX_LOCATION: z.string().default("us-central1"),
  GEMINI_MODEL_FAST: z.string().default("gemini-1.5-flash-002"),
  GEMINI_MODEL_REASONING: z.string().default("gemini-1.5-pro-002"),
  AQ_PROVIDER_ORDER: z.string().default("google,openmeteo,scenario"),
  EMAIL_PROVIDER: z.enum(["console", "smtp"]).default("console"),
  EMAIL_FROM: z.string().email().default("saans-alerts@ai-builder-sql-copilot.appspot.com"),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:8080"),
  DEMO_MODE: z
    .string()
    .transform((v) => v === "true" || v === "1")
    .default("true"),
  K_ANONYMITY_MIN: z.coerce.number().int().min(2).default(5),
  SESSION_PEPPER: z.string().min(16).default("saans-production-secure-session-pepper-32chars"),
});

export type Config = z.infer<typeof EnvSchema>;

export function loadConfig(overrides?: Partial<Config>): Config {
  const result = EnvSchema.safeParse({ ...process.env, ...overrides });
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join(", ");
    throw new Error(`Configuration validation failed: ${errorDetails}`);
  }
  return result.data;
}

export const config = loadConfig();

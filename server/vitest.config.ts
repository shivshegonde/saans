import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/server.ts",
        "scripts/**",
        "src/core/ports/**",
        "src/repositories/ports/**",
        "src/types/**",
      ],
      thresholds: {
        "src/core/**": {
          lines: 100,
          functions: 100,
          statements: 100,
        },
      },
    },
  },
});

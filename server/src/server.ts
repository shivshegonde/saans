import express from "express";
import cors from "cors";
import compression from "compression";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { config } from "./config.js";
import { container } from "./container.js";
import { securityHeadersMiddleware } from "./middleware/securityHeaders.js";
import { errorHandlerMiddleware } from "./middleware/errorHandler.js";
import { createRootRouter } from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(c = container) {
  const app = express();

  app.use(compression());
  app.use(cors());
  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: "1mb" }));

  // Mount API & health routes
  app.use(createRootRouter(c));

  // Serve SPA frontend in production
  const staticPath = path.resolve(__dirname, "../../web/dist");
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath, { maxAge: "1d" }));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  // Central error handler
  app.use(errorHandlerMiddleware);

  return app;
}

const app = createApp();

if (process.env["NODE_ENV"] !== "test") {
  app.listen(config.PORT, "0.0.0.0", () => {
    console.info(`Saans Server running on http://0.0.0.0:${config.PORT} [${config.NODE_ENV}]`);
  });
}

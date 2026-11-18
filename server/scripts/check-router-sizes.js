import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routesDir = path.resolve(__dirname, "../src/routes");

if (!fs.existsSync(routesDir)) {
  console.info("Routes directory not found yet. Skipping check.");
  process.exit(0);
}

const files = fs.readdirSync(routesDir).filter((f) => f.endsWith(".ts"));
let failed = false;

for (const file of files) {
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, "utf-8");
  const lineCount = content.split("\n").length;
  if (lineCount > 250) {
    console.error(`FAIL: ${file} has ${lineCount} lines (max allowed: 250).`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.info(`PASS: All router files in ${routesDir} are under 250 lines.`);
}

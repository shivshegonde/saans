import { createContainer } from "../src/container.js";
import { seedDemoData } from "../src/services/demoSeed.js";

async function main() {
  console.info("Seeding Saans synthetic demo personas and households...");
  const c = createContainer();
  await seedDemoData(c);
  console.info("Demo data seeded successfully.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

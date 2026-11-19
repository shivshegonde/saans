import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function record() {
  const outputDir = path.resolve(process.cwd(), "docs/demo");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("Launching Chrome for HD video recording (1280x720)...");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  console.log("Navigating to Saans application...");
  const targetUrl = process.env.DEMO_URL || "http://localhost:8080";
  await page.goto(targetUrl, { waitUntil: "networkidle" });

  const recordStart = Date.now();
  async function waitUntil(targetSeconds) {
    const elapsed = (Date.now() - recordStart) / 1000;
    const remaining = targetSeconds - elapsed;
    if (remaining > 0) {
      await sleep(remaining * 1000);
    }
  }

  // ========================================================
  // Segment 1: Hook & Living Sky (0:00 - 0:16)
  // Audio: "Every winter across North India, over three hundred million citizens wake up to hazardous smog and alarming red AQI numbers with zero actionable advice. Welcome to Saans, an environmental health companion built on one core principle: Code Decides, AI Explains."
  // ========================================================
  console.log("[0:00 - 0:16] Segment 1: Living Sky & Severe Smog...");
  await sleep(4000);
  await page.evaluate(() => window.scrollBy({ top: 160, behavior: "smooth" }));
  await sleep(4000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await waitUntil(16.0);

  // ========================================================
  // Segment 2: Judge Demo Bar & Architecture (0:16 - 0:31)
  // Audio: "Under the hood, Saans uses pure TypeScript mathematical engines with one hundred percent test coverage. Built with Vite, React, Google Cloud Run, and Firestore, Saans computes real CPCB NAQI breakpoints and inversion physics without any LLM hallucinations."
  // ========================================================
  console.log("[0:16 - 0:31] Segment 2: Pure TypeScript Engines & Outbox...");
  const severeBtn = page.getByRole("button", { name: "Severe", exact: true });
  if (await severeBtn.isVisible()) {
    await severeBtn.click();
    await sleep(2000);
  }
  // Open Outbox Inspector
  const inspectorBtn = page.getByRole("button", { name: /Outbox/i }).first();
  if (await inspectorBtn.isVisible()) {
    await inspectorBtn.click();
    await sleep(4500);
    const closeBtn = page.getByRole("button", { name: /Close Inspector/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await sleep(1500);
    }
  }
  // Moderate scenario toggle
  const moderateBtn = page.getByRole("button", { name: "Moderate", exact: true });
  if (await moderateBtn.isVisible()) {
    await moderateBtn.click();
    await sleep(2500);
    if (await severeBtn.isVisible()) {
      await severeBtn.click();
      await sleep(1500);
    }
  }
  await waitUntil(31.0);

  // ========================================================
  // Segment 3: Living Sky & 72-Hour Timeline (0:31 - 0:41.5)
  // Audio: "The Living Sky dynamically mirrors atmospheric dispersion. Our seventy-two hour forecast calculates thermal inversion cycles, identifying the midday window when ventilation is safe."
  // ========================================================
  console.log("[0:31 - 0:41.5] Segment 3: 72-Hour Inversion Timeline...");
  await page.evaluate(() => window.scrollBy({ top: 380, behavior: "smooth" }));
  await sleep(1500);
  const chartRegion = page.locator('div[role="region"][aria-label*="Interactive timeline"]').first();
  if (await chartRegion.isVisible()) {
    await chartRegion.click();
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowRight");
      await sleep(500);
    }
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("ArrowLeft");
      await sleep(450);
    }
  }
  await waitUntil(41.5);

  // ========================================================
  // Segment 4: Personalized Smart Plan (0:41.5 - 0:55.5)
  // Audio: "Instead of generic advice, our rule engine generates personalized routines tailored to vulnerable family members, like children with asthma or elderly parents. With a single tap, daily mitigation actions export directly to your phone calendar."
  // ========================================================
  console.log("[0:41.5 - 0:55.5] Segment 4: Smart Plan & Rules...");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(800);
  const planTab = page.locator('#tab-plan').first();
  await planTab.click();
  await sleep(2000);
  await page.evaluate(() => window.scrollBy({ top: 220, behavior: "smooth" }));
  await sleep(1500);
  const whyBtn = page.getByRole("button", { name: /Why this matters/i }).first();
  if (await whyBtn.isVisible()) {
    await whyBtn.click();
    await sleep(2500);
  }
  const actionCheck = page.locator('button[aria-label*="as completed"]').first();
  if (await actionCheck.isVisible()) {
    await actionCheck.click();
    await sleep(2500);
  }
  await waitUntil(55.5);

  // ========================================================
  // Segment 5: Home Air Physics Simulator (0:55.5 - 1:09.5)
  // Audio: "In the Home Air Simulator, we solve continuous differential mass-balance physics in real time. Moving the CADR slider recalculates indoor particle decay to meet the four point eight air-changes-per-hour AHAM standard."
  // ========================================================
  console.log("[0:55.5 - 1:09.5] Segment 5: Home Air Mass-Balance Simulator...");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(800);
  const homeAirTab = page.locator('#tab-homeAir').first();
  await homeAirTab.click();
  await sleep(2000);
  await page.evaluate(() => window.scrollBy({ top: 200, behavior: "smooth" }));
  await sleep(1500);
  const windowBtn = page.getByRole("button", { name: /Window:/i }).first();
  if (await windowBtn.isVisible()) {
    await windowBtn.click();
    await sleep(2000);
  }
  const cookBtn = page.getByRole("button", { name: /Cooking:/i }).first();
  if (await cookBtn.isVisible()) {
    await cookBtn.click();
    await sleep(2000);
  }
  await page.evaluate(() => window.scrollBy({ top: 280, behavior: "smooth" }));
  await waitUntil(69.5);

  // ========================================================
  // Segment 6: Impact Lab - Two Lenses (1:09.5 - 1:24.5)
  // Audio: "In the Impact Lab, Saans strictly separates the Family Exposure Lens from the City Emissions Lens. You see micrograms of inhaled PM two point five prevented, alongside kilograms of CO two saved by taking Delhi Metro."
  // ========================================================
  console.log("[1:09.5 - 1:24.5] Segment 6: Impact Lab Two Lenses...");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(800);
  const impactTab = page.locator('#tab-impact').first();
  await impactTab.click();
  await sleep(2000);
  await page.evaluate(() => window.scrollBy({ top: 180, behavior: "smooth" }));
  await sleep(2000);
  const cityLensBtn = page.getByRole("button", { name: /My City/i }).first();
  if (await cityLensBtn.isVisible()) {
    await cityLensBtn.click();
    await sleep(2500);
  }
  const familyLensBtn = page.getByRole("button", { name: /My Family/i }).first();
  if (await familyLensBtn.isVisible()) {
    await familyLensBtn.click();
    await sleep(2500);
  }
  const ledgerBtn = page.getByRole("button", { name: /Add Simulation to My Ledger/i }).first();
  if (await ledgerBtn.isVisible()) {
    await ledgerBtn.click();
    await sleep(2000);
  }
  await waitUntil(84.5);

  // ========================================================
  // Segment 7: Ask Saans AI & Emergency Interceptor (1:24.5 - 1:38.5)
  // Audio: "When you ask questions, Google Vertex AI Gemini explains the facts warmly. Our deterministic safety shield catches acute respiratory distress and immediately routes emergencies to one-one-two, while debunking viral myths with scientific citations."
  // ========================================================
  console.log("[1:24.5 - 1:38.5] Segment 7: Ask Saans AI & Emergency Shield...");
  const askSaansBtn = page.locator('button[aria-label*="Ask Saans"]').first();
  await askSaansBtn.click();
  await sleep(2000);
  const mythPrompt = page.getByRole("button", { name: /Myth check/i }).first();
  if (await mythPrompt.isVisible()) {
    await mythPrompt.click();
    await sleep(3500);
  }
  const askInput = page.getByPlaceholder(/Ask about smog/i).first();
  if (await askInput.isVisible()) {
    await askInput.fill("My grandmother cannot breathe and has severe chest pain");
    await sleep(1500);
    const sendBtn = page.locator('button[aria-label="Send message to Saans"]').first();
    await sendBtn.click();
    await sleep(3500);
  }
  const closeSheet = page.locator('button[aria-label="Close Ask Saans assistant"]').first();
  if (await closeSheet.isVisible()) {
    await closeSheet.click();
    await sleep(1500);
  }
  await waitUntil(98.5);

  // ========================================================
  // Segment 8: Accessibility & Conclusion (1:38.5 - 1:42.5)
  // Audio: "Saans: science-grounded, privacy-first, and mobile-ready clean air companion for India."
  // ========================================================
  console.log("[1:38.5 - 1:42.5] Segment 8: High Contrast & Closing Summary...");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  const hcToggle = page.locator('button[aria-label*="contrast"]').first();
  if (await hcToggle.isVisible()) {
    await hcToggle.click();
    await sleep(2000);
  }
  await waitUntil(102.5);

  console.log("Recording complete. Finalizing video file...");
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  if (video) {
    const rawVideoPath = await video.path();
    const targetVideoPath = path.join(outputDir, "raw_demo.webm");
    fs.copyFileSync(rawVideoPath, targetVideoPath);
    console.log(`Raw video saved to: ${targetVideoPath}`);
  }
}

record().catch((err) => {
  console.error("Recording error:", err);
  process.exit(1);
});

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve(process.cwd(), "docs/screenshots");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  console.log("Launching Chromium...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  try {
    // 1. Desktop 1440px - Today Screen
    console.log("Capturing 1440px Desktop: Today Living Sky...");
    const page1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page1440.goto("http://localhost:8080/", { waitUntil: "networkidle" });
    await page1440.waitForTimeout(1000);
    await page1440.screenshot({ path: path.join(OUT_DIR, "01-today-living-sky-1440.png") });

    // 2. Plan Screen 1440px
    console.log("Capturing Plan Screen...");
    await page1440.click("#tab-plan");
    await page1440.waitForTimeout(500);
    await page1440.screenshot({ path: path.join(OUT_DIR, "02-plan-slots-1440.png") });

    // 3. Impact Lab Screen 1440px
    console.log("Capturing Impact Lab Screen...");
    await page1440.click("#tab-impact");
    await page1440.waitForTimeout(500);
    await page1440.screenshot({ path: path.join(OUT_DIR, "03-impact-lab-1440.png") });

    // 4. Home Air Screen 1440px
    console.log("Capturing Home Air & Room Simulator...");
    await page1440.click("#tab-homeAir");
    await page1440.waitForTimeout(500);
    await page1440.screenshot({ path: path.join(OUT_DIR, "04-room-simulator-1440.png") });

    // 5. Community Screen 1440px
    console.log("Capturing Community Dashboard...");
    await page1440.click("#tab-community");
    await page1440.waitForTimeout(500);
    await page1440.screenshot({ path: path.join(OUT_DIR, "05-community-dashboard-1440.png") });

    // 6. Ask Saans Drawer
    console.log("Capturing Ask Saans Assistant...");
    await page1440.click('button[aria-label="Open Ask Saans AI assistant dialog"]');
    await page1440.waitForTimeout(500);
    await page1440.screenshot({ path: path.join(OUT_DIR, "06-ask-saans-drawer.png") });
    await page1440.close();

    // 7. Tablet 768px - Today Screen
    console.log("Capturing 768px Tablet View...");
    const page768 = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await page768.goto("http://localhost:8080/", { waitUntil: "networkidle" });
    await page768.waitForTimeout(800);
    await page768.screenshot({ path: path.join(OUT_DIR, "07-today-tablet-768.png") });
    await page768.close();

    // 8. Mobile 390px - Today Screen
    console.log("Capturing 390px Mobile View...");
    const page390 = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await page390.goto("http://localhost:8080/", { waitUntil: "networkidle" });
    await page390.waitForTimeout(800);
    await page390.screenshot({ path: path.join(OUT_DIR, "08-today-mobile-390.png") });

    // 9. Mobile High Contrast Mode
    console.log("Capturing Mobile High Contrast Mode...");
    await page390.click('button[aria-label="Enable high contrast mode"]');
    await page390.waitForTimeout(400);
    await page390.screenshot({ path: path.join(OUT_DIR, "09-high-contrast-mobile-390.png") });
    await page390.close();

    console.log("All screenshots successfully captured into docs/screenshots/!");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});

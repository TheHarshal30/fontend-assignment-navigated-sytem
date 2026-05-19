// Drives the Gooru Learning Navigator through a scripted demo and records it.
// Run with the dev server already serving at http://localhost:5173.
import { chromium } from "playwright";
import { mkdir, rm, readdir, rename } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT, "media", "raw");
const OUT = path.join(ROOT, "media", "demo.webm");

const WIDTH = 1280;
const HEIGHT = 800;

await rm(RAW_DIR, { recursive: true, force: true });
await mkdir(RAW_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
  reducedMotion: "no-preference",
  recordVideo: { dir: RAW_DIR, size: { width: WIDTH, height: HEIGHT } },
});

const page = await context.newPage();

// Make sure we always see the onboarding card on this run.
await page.addInitScript(() => {
  localStorage.removeItem("gooru-onboarded-v2");
  localStorage.removeItem("gooru-navigator-journey-v1");
});

await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
// Wait until the map SVG has been mounted and the initial fit transition runs.
await page.waitForSelector("svg[role='application']");
await page.waitForTimeout(900);

/* ------- 1. Welcome / onboarding ------- */
await page.waitForSelector("text=Begin journey");
await page.waitForTimeout(1400);
await page.getByRole("button", { name: /Begin journey/i }).click();
await page.waitForTimeout(1100);

/* ------- 2. Pan-and-zoom feel: zoom in once to reveal pins ------- */
await page.getByRole("button", { name: "Zoom in" }).click();
await page.waitForTimeout(700);
await page.getByRole("button", { name: "Zoom in" }).click();
await page.waitForTimeout(900);

/* ------- 3. Hover a pin -> tooltip ------- */
const pinBigO = page.locator('[aria-label="video: Big-O, Intuitively"]');
await pinBigO.scrollIntoViewIfNeeded().catch(() => {});
await pinBigO.hover();
await page.waitForTimeout(1100);

/* ------- 4. Click the pin -> side panel + you-are-here flag ------- */
await pinBigO.click();
await page.waitForTimeout(1800);

/* ------- 5. Pick a related resource from the side panel ------- */
const panel = page.getByRole("dialog", { name: /Place card/i });
await panel
  .getByRole("button", { name: /Sorting, Compared/i })
  .first()
  .click();
await page.waitForTimeout(1800);

/* ------- 6. Close the panel with Esc ------- */
await page.keyboard.press("Escape");
await page.waitForTimeout(700);

/* ------- 7. Search workflow ------- */
await page.keyboard.press("/");
await page.waitForTimeout(450);
await page.keyboard.type("tree", { delay: 110 });
await page.waitForTimeout(1100);
// Pick a result
const treeResult = page
  .getByRole("button", { name: /Trees, Visually/i })
  .first();
await treeResult.click();
await page.waitForTimeout(1800);

/* ------- 8. Open the travel log ------- */
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
await page.keyboard.press("j");
await page.waitForTimeout(1700);
await page.keyboard.press("j"); // close
await page.waitForTimeout(500);

/* ------- 9. Reset view ------- */
await page.keyboard.press("0");
await page.waitForTimeout(1600);

await context.close();
await browser.close();

// The recorded video is the only file in RAW_DIR.
const files = await readdir(RAW_DIR);
const webm = files.find((f) => f.endsWith(".webm"));
if (!webm) {
  console.error("No video file produced.");
  process.exit(1);
}
await rename(path.join(RAW_DIR, webm), OUT);
await rm(RAW_DIR, { recursive: true, force: true });
console.log("recorded:", OUT);

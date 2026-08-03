/**
 * Screenshot harness for docs + a full smoke test.
 *
 * Drives a locally installed Chrome (headless, throwaway profile — your
 * real browser data is never touched) through the main user flows:
 *
 *   1. landing page
 *   2. dashboard with synthesized demo data
 *   3. dashboard with a real Cursor CSV export
 *   4. reload persistence via sessionStorage
 *
 * Usage:
 *   pnpm dev            # in one terminal
 *   pnpm screenshots    # in another
 *
 * Screenshots land in docs/screenshots/. Exits non-zero if any
 * console/page error or failed flow is detected.
 */

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const REAL_CSV = process.env.REAL_CSV ?? `${homedir()}/downloads/2026-07-30.csv`;
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
	viewport: { width: 1440, height: 900 },
	deviceScaleFactor: 2,
});

const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e}`));
page.on("console", (m) => {
	if (m.type() === "error") problems.push(`console.error: ${m.text()}`);
});
page.on("requestfailed", (r) => {
	// Ignore font CDN hiccups — the UI falls back to system fonts
	if (!r.url().includes("fonts.g")) problems.push(`requestfailed: ${r.url()}`);
});

// ---- 1. Landing ----
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}landing.png` });
console.log("✓ landing");

// ---- 2. Demo-data dashboard ----
await page.getByText("Load demo data").click();
await page.waitForURL("**/dashboard", { timeout: 8000 });
await page.waitForTimeout(2800); // entrance animations + galaxy spin-up
await page.screenshot({ path: `${OUT}dashboard.png`, fullPage: true });
console.log("✓ demo dashboard");
await page.screenshot({ path: `${OUT}galaxy-view.png` }); // viewport only

// ---- 3. Real CSV upload ----
if (existsSync(REAL_CSV)) {
	await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
	await page.waitForTimeout(800);
	await page.locator("input[type=file]").first().setInputFiles(REAL_CSV);
	await page.waitForURL("**/dashboard", { timeout: 8000 });
	await page.waitForTimeout(2500);
	await page.screenshot({ path: `${OUT}dashboard-real.png`, fullPage: true });
	console.log("✓ real csv dashboard");

	// ---- 4. Reload persistence ----
	await page.reload({ waitUntil: "networkidle" });
	await page.waitForTimeout(1500);
	if (!page.url().includes("/dashboard")) {
		problems.push("reload lost the session — redirected away from /dashboard");
	} else {
		console.log("✓ reload persistence");
	}
} else {
	console.log(`• skipped real csv flow (not found: ${REAL_CSV})`);
}

await browser.close();

if (problems.length > 0) {
	console.error(`\nPROBLEMS:\n${problems.join("\n")}`);
	process.exit(1);
}
console.log("\nAll flows passed, zero console errors.");

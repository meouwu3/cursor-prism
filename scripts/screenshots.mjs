/**
 * Screenshot harness for docs + a full smoke test.
 *
 * Drives a locally installed Chrome (headless, throwaway profile — your
 * real browser data is never touched) through the main user flows, once
 * per theme (print / dark / blueprint):
 *
 *   1. landing page
 *   2. dashboard with a synthesized fixture CSV (scripts/fixture-csv.mjs)
 *   3. dashboard with a real Cursor CSV export (print theme)
 *   4. reload drops in-memory data → back to the landing page
 *
 * Usage:
 *   pnpm dev            # in one terminal
 *   pnpm screenshots    # in another
 *
 * Screenshots land in docs/screenshots/. Exits non-zero if any
 * console/page error or failed flow is detected.
 */

import { existsSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { homedir } from "node:os";
import { chromium } from "playwright-core";
import { generateFixtureCsv } from "./fixture-csv.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const REAL_CSV = process.env.REAL_CSV ?? `${homedir()}/downloads/2026-07-30.csv`;
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;
const THEMES = ["print", "dark", "blueprint"];
const FIXTURE = `${tmpdir()}/cursor-prism-fixture.csv`;

writeFileSync(FIXTURE, generateFixtureCsv());

const browser = await chromium.launch({ channel: "chrome", headless: true });
const problems = [];

async function newPage(theme) {
	const page = await browser.newPage({
		viewport: { width: 1440, height: 900 },
		deviceScaleFactor: 2,
	});
	page.on("pageerror", (e) => problems.push(`pageerror: ${e}`));
	page.on("console", (m) => {
		if (m.type() === "error") problems.push(`console.error: ${m.text()}`);
	});
	page.on("requestfailed", (r) => {
		// Ignore font CDN hiccups — the UI falls back to system fonts
		if (!r.url().includes("fonts.g")) problems.push(`requestfailed: ${r.url()}`);
	});
	// Preset the theme before any app code runs (no flash, no transition)
	await page.addInitScript((t) => {
		try {
			window.localStorage.setItem("cursor-prism:theme", t);
		} catch {
			// storage blocked — default theme is fine for a smoke test
		}
	}, theme);
	return page;
}

// ---- 1 + 2. Landing and fixture dashboard, once per theme ----
for (const theme of THEMES) {
	const page = await newPage(theme);
	await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
	await page.waitForTimeout(1800);
	await page.screenshot({ path: `${OUT}${theme}-landing.png` });
	console.log(`✓ ${theme} landing`);

	await page.locator("input[type=file]").first().setInputFiles(FIXTURE);
	await page.waitForURL("**/dashboard", { timeout: 8000 });
	await page.waitForTimeout(2800); // entrance animations + galaxy spin-up
	await page.screenshot({ path: `${OUT}${theme}-dashboard.png`, fullPage: true });
	console.log(`✓ ${theme} fixture dashboard`);
	await page.screenshot({ path: `${OUT}${theme}-galaxy.png` }); // viewport only
	await page.close();
}

// ---- 3. Real CSV upload (print theme) ----
if (existsSync(REAL_CSV)) {
	const page = await newPage("print");
	await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
	await page.waitForTimeout(800);
	await page.locator("input[type=file]").first().setInputFiles(REAL_CSV);
	await page.waitForURL("**/dashboard", { timeout: 8000 });
	await page.waitForTimeout(2500);
	await page.screenshot({ path: `${OUT}dashboard-real.png`, fullPage: true });
	console.log("✓ real csv dashboard");

	// ---- 4. Reload drops in-memory data → redirect to landing ----
	await page.reload({ waitUntil: "networkidle" });
	await page.waitForTimeout(1500);
	if (new URL(page.url()).pathname !== "/") {
		problems.push("reload kept the session — expected a redirect to /");
	} else {
		console.log("✓ reload returns to landing (in-memory only)");
	}
	await page.close();
} else {
	console.log(`• skipped real csv flow (not found: ${REAL_CSV})`);
}

await browser.close();

if (problems.length > 0) {
	console.error(`\nPROBLEMS:\n${problems.join("\n")}`);
	process.exit(1);
}
console.log("\nAll flows passed, zero console errors.");

/**
 * Fixture CSV generator for the screenshot/smoke harness.
 *
 * Synthesizes realistic-looking Cursor usage rows with a seeded PRNG
 * (reproducible) and serializes them in the exact Cursor dashboard
 * export format. The synthesis deliberately keeps a few traits of real
 * usage:
 * - cache reads dominate (the typical shape of real exports)
 * - weekdays busier than weekends, with hourly peaks during the day
 * - occasional giant requests that concentrate the spend
 */

/** mulberry32 seeded PRNG — fixture data is reproducible. */
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const MODELS = [
	{ model: "cursor-grok-4.5-medium", weight: 0.42, pricePerMillion: 0.55, cacheRatio: 0.86 },
	{ model: "composer-2.5", weight: 0.22, pricePerMillion: 0.24, cacheRatio: 0.8 },
	{ model: "claude-4.5-sonnet", weight: 0.18, pricePerMillion: 3.1, cacheRatio: 0.88 },
	{ model: "gpt-5.2", weight: 0.12, pricePerMillion: 1.9, cacheRatio: 0.82 },
	{ model: "gemini-3-pro", weight: 0.06, pricePerMillion: 1.4, cacheRatio: 0.78 },
];

const KINDS = [
	{ kind: "express", weight: 0.45 },
	{ kind: "agent", weight: 0.3 },
	{ kind: "chat", weight: 0.2 },
	{ kind: "cmdk", weight: 0.05 },
];

function pick(rand, items) {
	let r = rand();
	for (const it of items) {
		r -= it.weight;
		if (r <= 0) return it;
	}
	return items[items.length - 1];
}

/** Log-normal-ish magnitude with occasional giant bursts. */
function tokenMagnitude(rand) {
	const base = Math.exp(rand() * 4.2 + 10.2); // ~ 27K .. 1.8M
	const burst = rand() < 0.06 ? 3 + rand() * 6 : 1;
	return base * burst;
}

const HEADER =
	"Date,Kind,Model,Max Mode,Input (w/ Cache Write),Input (w/o Cache Write),Cache Read,Output Tokens,Total Tokens,Cost";

export function generateFixtureCsv(days = 75, seed = 20260730) {
	const rand = mulberry32(seed);
	const lines = [HEADER];
	const now = new Date();
	now.setMinutes(0, 0, 0);

	for (let d = days - 1; d >= 0; d--) {
		const day = new Date(now.getTime() - d * 86_400_000);
		const weekday = day.getDay();
		const isWeekend = weekday === 0 || weekday === 6;

		// Requests per day: more on weekdays, slow growth over time
		const growth = 1 + ((days - d) / days) * 0.6;
		let count = Math.round((isWeekend ? 4 : 11) * growth * (0.5 + rand()));
		if (rand() < 0.12) count = Math.round(count * 2.2); // crunch day

		for (let i = 0; i < count; i++) {
			// Hourly peaks: late morning, mid afternoon, late night
			const peakRoll = rand();
			const hour =
				peakRoll < 0.35
					? 9 + Math.floor(rand() * 4)
					: peakRoll < 0.7
						? 14 + Math.floor(rand() * 5)
						: 21 + Math.floor(rand() * 3);

			const m = pick(rand, MODELS);
			const k = pick(rand, KINDS);
			const total = Math.round(
				tokenMagnitude(rand) * (k.kind === "agent" ? 1.8 : 1),
			);
			const output = Math.round(total * (0.01 + rand() * 0.05));
			const inputTotal = total - output;
			const cacheRead = Math.round(
				inputTotal * Math.min(0.97, m.cacheRatio + (rand() - 0.5) * 0.12),
			);
			const fresh = inputTotal - cacheRead;
			const inputWithCacheWrite = rand() < 0.12 ? Math.round(fresh * 0.3) : 0;
			const cost = (
				Math.round(
					((total / 1_000_000) * m.pricePerMillion + Number.EPSILON) * 100,
				) / 100
			).toFixed(2);

			const date = new Date(day);
			date.setHours(hour, Math.floor(rand() * 60), Math.floor(rand() * 60), 0);

			lines.push(
				[
					date.toISOString(),
					k.kind,
					m.model,
					rand() < 0.08 ? "Yes" : "No",
					inputWithCacheWrite,
					fresh - inputWithCacheWrite,
					cacheRead,
					output,
					total,
					cost,
				]
					.map((v) => `"${v}"`)
					.join(","),
			);
		}
	}

	return `${lines.join("\n")}\n`;
}

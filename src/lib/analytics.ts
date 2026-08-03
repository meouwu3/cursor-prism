/**
 * Usage-data aggregation: trends, distribution, composition, heat,
 * concentration and auto-generated insights.
 * All functions are pure and take UsageRow[] sorted ascending by time.
 */

import type { UsageRow } from "./csv";
import {
	formatCost,
	formatDateTime,
	formatDay,
	formatPct,
	formatTokens,
	WEEKDAY_LABELS,
} from "./format";

export interface Summary {
	totalTokens: number;
	totalCost: number;
	requestCount: number;
	avgTokens: number;
	cacheRead: number;
	input: number;
	output: number;
	/** cacheRead / (cacheRead + input) — higher means better context reuse */
	cacheHitRate: number;
	outputRatio: number;
	activeDays: number;
	rangeStart: Date;
	rangeEnd: Date;
	topModel: string;
	/** Average USD cost per million tokens */
	costPerMillion: number;
}

export interface DayPoint {
	key: string;
	date: Date;
	tokens: number;
	cost: number;
	output: number;
	count: number;
}

export interface ModelStat {
	model: string;
	tokens: number;
	cost: number;
	count: number;
	output: number;
	input: number;
	cacheRead: number;
	share: number;
}

export interface HeatCell {
	weekday: number;
	hour: number;
	tokens: number;
	count: number;
}

export interface Insight {
	icon: string;
	title: string;
	value: string;
	text: string;
	/** Palette tone: cyan | violet | amber | emerald | pink */
	tone: "cyan" | "violet" | "amber" | "emerald" | "pink";
}

export function summarize(rows: UsageRow[]): Summary {
	let totalTokens = 0;
	let totalCost = 0;
	let cacheRead = 0;
	let output = 0;
	let input = 0;
	const days = new Set<string>();
	const modelTokens = new Map<string, number>();

	for (const r of rows) {
		totalTokens += r.totalTokens;
		totalCost += r.cost;
		cacheRead += r.cacheRead;
		output += r.outputTokens;
		input += r.inputWithCacheWrite + r.inputWithoutCacheWrite;
		days.add(formatDay(r.date));
		modelTokens.set(r.model, (modelTokens.get(r.model) ?? 0) + r.totalTokens);
	}

	let topModel = "—";
	let best = -1;
	for (const [m, t] of modelTokens) {
		if (t > best) {
			best = t;
			topModel = m;
		}
	}

	return {
		totalTokens,
		totalCost,
		requestCount: rows.length,
		avgTokens: rows.length ? totalTokens / rows.length : 0,
		cacheRead,
		input,
		output,
		cacheHitRate: cacheRead + input > 0 ? cacheRead / (cacheRead + input) : 0,
		outputRatio: totalTokens > 0 ? output / totalTokens : 0,
		activeDays: days.size,
		rangeStart: rows[0]?.date ?? new Date(),
		rangeEnd: rows[rows.length - 1]?.date ?? new Date(),
		topModel,
		costPerMillion: totalTokens > 0 ? (totalCost / totalTokens) * 1_000_000 : 0,
	};
}

/** Aggregate by day, filling gaps with zeros so the trend line stays continuous. */
export function dailySeries(rows: UsageRow[]): DayPoint[] {
	const map = new Map<string, DayPoint>();
	for (const r of rows) {
		const key = formatDay(r.date);
		let p = map.get(key);
		if (!p) {
			p = {
				key,
				date: new Date(`${key}T00:00:00`),
				tokens: 0,
				cost: 0,
				output: 0,
				count: 0,
			};
			map.set(key, p);
		}
		p.tokens += r.totalTokens;
		p.cost += r.cost;
		p.output += r.outputTokens;
		p.count += 1;
	}
	const points = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
	if (points.length <= 1) return points;

	// Fill missing days in between
	const filled: DayPoint[] = [];
	const oneDay = 86_400_000;
	let cursor = points[0].date.getTime();
	const end = points[points.length - 1].date.getTime();
	const byKey = new Map(points.map((p) => [p.key, p]));
	while (cursor <= end) {
		const d = new Date(cursor);
		const key = formatDay(d);
		filled.push(
			byKey.get(key) ?? {
				key,
				date: d,
				tokens: 0,
				cost: 0,
				output: 0,
				count: 0,
			},
		);
		cursor += oneDay;
	}
	return filled;
}

/** Moving average, used as the smoothed reference line on the trend chart. */
export function movingAverage(values: number[], window = 7): number[] {
	return values.map((_, i) => {
		const from = Math.max(0, i - window + 1);
		const slice = values.slice(from, i + 1);
		return slice.reduce((a, b) => a + b, 0) / slice.length;
	});
}

export function modelStats(rows: UsageRow[]): ModelStat[] {
	const map = new Map<string, ModelStat>();
	let total = 0;
	for (const r of rows) {
		total += r.totalTokens;
		let s = map.get(r.model);
		if (!s) {
			s = {
				model: r.model,
				tokens: 0,
				cost: 0,
				count: 0,
				output: 0,
				input: 0,
				cacheRead: 0,
				share: 0,
			};
			map.set(r.model, s);
		}
		s.tokens += r.totalTokens;
		s.cost += r.cost;
		s.count += 1;
		s.output += r.outputTokens;
		s.input += r.inputWithCacheWrite + r.inputWithoutCacheWrite;
		s.cacheRead += r.cacheRead;
	}
	const stats = [...map.values()].sort((a, b) => b.tokens - a.tokens);
	for (const s of stats) s.share = total > 0 ? s.tokens / total : 0;
	return stats;
}

export function kindStats(
	rows: UsageRow[],
): { kind: string; count: number; tokens: number }[] {
	const map = new Map<
		string,
		{ kind: string; count: number; tokens: number }
	>();
	for (const r of rows) {
		const s = map.get(r.kind) ?? { kind: r.kind, count: 0, tokens: 0 };
		s.count += 1;
		s.tokens += r.totalTokens;
		map.set(r.kind, s);
	}
	return [...map.values()].sort((a, b) => b.tokens - a.tokens);
}

/** Weekday × hour activity heat matrix (local timezone). */
export function heatMatrix(rows: UsageRow[]): HeatCell[] {
	const cells: HeatCell[] = [];
	for (let w = 0; w < 7; w++)
		for (let h = 0; h < 24; h++)
			cells.push({ weekday: w, hour: h, tokens: 0, count: 0 });
	for (const r of rows) {
		const c = cells[r.date.getDay() * 24 + r.date.getHours()];
		c.tokens += r.totalTokens;
		c.count += 1;
	}
	return cells;
}

export function topRequests(rows: UsageRow[], n = 10): UsageRow[] {
	return [...rows].sort((a, b) => b.totalTokens - a.totalTokens).slice(0, n);
}

/** Pareto concentration: how much spend comes from the priciest 10% of requests. */
export function costConcentration(rows: UsageRow[]): {
	topRatio: number;
	share: number;
} {
	if (rows.length === 0) return { topRatio: 0, share: 0 };
	const sorted = [...rows].sort((a, b) => b.cost - a.cost);
	const total = sorted.reduce((a, r) => a + r.cost, 0);
	if (total === 0) return { topRatio: 0, share: 0 };
	const k = Math.max(1, Math.ceil(sorted.length * 0.1));
	const top = sorted.slice(0, k).reduce((a, r) => a + r.cost, 0);
	return { topRatio: k / sorted.length, share: top / total };
}

/** Rule-based insight cards grown from the data. */
export function buildInsights(rows: UsageRow[]): Insight[] {
	const s = summarize(rows);
	const insights: Insight[] = [];

	// Cache economics
	insights.push({
		icon: "◈",
		title: "Cache Hit Rate",
		value: formatPct(s.cacheHitRate),
		text:
			s.cacheHitRate > 0.7
				? "Context reuse is excellent — cache reads absorb most of your input volume."
				: s.cacheHitRate > 0.4
					? "Over half of your input comes from cache. Longer continuous sessions compound the effect."
					: "Cache share is low. Starting fresh sessions re-pays full price for context every time.",
		tone: "cyan",
	});

	// Output ratio
	insights.push({
		icon: "✦",
		title: "Output Share",
		value: formatPct(s.outputRatio),
		text: `For every 1 output token, about ${
			s.output > 0 ? formatTokens(Math.round(s.totalTokens / s.output)) : "—"
		} tokens flow through in total — most tokens are spent understanding you.`,
		tone: "violet",
	});

	// Peak window
	const cells = heatMatrix(rows);
	const peak = cells.reduce((a, b) => (b.tokens > a.tokens ? b : a), cells[0]);
	insights.push({
		icon: "◔",
		title: "Peak Window",
		value: `${WEEKDAY_LABELS[peak.weekday]} ${String(peak.hour).padStart(2, "0")}:00`,
		text: `Your heaviest burn window — ${formatTokens(peak.tokens)} tokens piled up in this single hour slot.`,
		tone: "amber",
	});

	// Cost concentration
	const c = costConcentration(rows);
	insights.push({
		icon: "◭",
		title: "Cost Concentration",
		value: formatPct(c.share),
		text: `The priciest ${formatPct(c.topRatio, 0)} of requests account for ${formatPct(c.share)} of total spend — a few giant calls dominate the bill.`,
		tone: "pink",
	});

	// Largest single request
	const max = topRequests(rows, 1)[0];
	if (max) {
		insights.push({
			icon: "▲",
			title: "Largest Request",
			value: formatTokens(max.totalTokens),
			text: `${formatDateTime(max.date)} on ${max.model} — ${formatCost(max.cost)} in a single call.`,
			tone: "emerald",
		});
	}

	// Cost efficiency
	insights.push({
		icon: "◍",
		title: "Cost per 1M Tokens",
		value: `$${s.costPerMillion.toFixed(2)}`,
		text: `Primary model: ${s.topModel}. The higher your cache hit rate, the lower this number goes.`,
		tone: "cyan",
	});

	return insights;
}

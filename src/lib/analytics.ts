/**
 * Usage-data aggregation: totals, daily trends, and per-model distribution.
 * All functions are pure and take UsageRow[] sorted ascending by time.
 */

import type { UsageRow } from "./csv";
import { formatDay } from "./format";

export interface Summary {
	totalTokens: number;
	totalCost: number;
	cacheRead: number;
	input: number;
	output: number;
	/** cacheRead / (cacheRead + input) — higher means better context reuse */
	cacheHitRate: number;
	rangeStart: Date;
	rangeEnd: Date;
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

export function summarize(rows: UsageRow[]): Summary {
	let totalTokens = 0;
	let totalCost = 0;
	let cacheRead = 0;
	let output = 0;
	let input = 0;

	for (const r of rows) {
		totalTokens += r.totalTokens;
		totalCost += r.cost;
		cacheRead += r.cacheRead;
		output += r.outputTokens;
		input += r.inputWithCacheWrite + r.inputWithoutCacheWrite;
	}

	return {
		totalTokens,
		totalCost,
		cacheRead,
		input,
		output,
		cacheHitRate: cacheRead + input > 0 ? cacheRead / (cacheRead + input) : 0,
		rangeStart: rows[0]?.date ?? new Date(),
		rangeEnd: rows[rows.length - 1]?.date ?? new Date(),
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

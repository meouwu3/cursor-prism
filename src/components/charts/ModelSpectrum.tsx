/**
 * Model spectrum: per-model token share (donut) fused with token
 * composition (cache reads / fresh input / output). One model list —
 * each row carries its share and its cache composition, and hovering
 * links the ring segment, the row and the center readout.
 * Flat segments from the theme palette; no gradients, no glow.
 */

import { useState } from "react";
import type { ModelStat } from "#/lib/analytics";
import { paletteAt } from "#/lib/colors";
import { formatPct, formatTokens } from "#/lib/format";
import { useChartTokens } from "#/lib/theme";
import { useCountUp } from "../ui";

const R = 70;
const C = 2 * Math.PI * R;

const PARTS = [
	{ key: "cacheRead", label: "Cache reads" },
	{ key: "input", label: "Fresh input" },
	{ key: "output", label: "Output" },
] as const;

function Bar({
	parts,
	height = 12,
	delay = 0,
	track,
}: {
	parts: { value: number; color: string }[];
	height?: number;
	delay?: number;
	track: string;
}) {
	const total = parts.reduce((a, p) => a + p.value, 0) || 1;
	let left = 0;
	return (
		<div
			className="relative w-full overflow-hidden rounded-xs"
			style={{ height, background: track }}
		>
			{parts.map((p) => {
				const width = (p.value / total) * 100;
				const el = (
					<div
						key={p.color}
						className="absolute top-0 bottom-0 origin-left animate-grow-x [animation-delay:var(--d,0ms)] motion-reduce:animate-none"
						style={
							{
								left: `${left}%`,
								width: `${width}%`,
								background: p.color,
								"--d": `${delay}ms`,
							} as React.CSSProperties
						}
					/>
				);
				left += width;
				return el;
			})}
		</div>
	);
}

export function ModelSpectrum({
	stats,
	overall,
}: {
	stats: ModelStat[];
	overall: { cacheRead: number; input: number; output: number };
}) {
	const tokens = useChartTokens();
	const [hover, setHover] = useState<number | null>(null);
	const progress = useCountUp(1, 1100);
	const partColors = [tokens.palette[1], tokens.palette[0], tokens.palette[2]];
	const totalAll = overall.cacheRead + overall.input + overall.output || 1;

	let acc = 0;
	const segments = stats.map((s, i) => {
		const len = s.share * C * progress;
		const seg = {
			...s,
			i,
			offset: acc,
			len,
			color: paletteAt(i, tokens.palette),
		};
		acc += len;
		return seg;
	});

	const active = hover !== null ? segments[hover] : null;

	return (
		<div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center">
			{/* Share donut */}
			<div className="relative shrink-0">
				<svg
					width="196"
					height="196"
					viewBox="0 0 196 196"
					role="img"
					aria-label="Model share donut"
				>
					<g transform="rotate(-90 98 98)">
						{segments.map((s) => (
							// biome-ignore lint/a11y/noStaticElementInteractions: ring hover is a decorative cross-highlight; the rows carry the same data in text
							<circle
								key={s.model}
								cx="98"
								cy="98"
								r={R}
								fill="none"
								stroke={s.color}
								strokeWidth={hover === s.i ? 30 : 22}
								strokeDasharray={`${Math.max(0, s.len - 2)} ${C - s.len + 2}`}
								strokeDashoffset={-s.offset}
								strokeLinecap="butt"
								opacity={hover === null || hover === s.i ? 1 : 0.3}
								style={{
									transition: "stroke-width 0.25s ease, opacity 0.25s ease",
									cursor: "pointer",
								}}
								onMouseEnter={() => setHover(s.i)}
								onMouseLeave={() => setHover(null)}
							/>
						))}
					</g>
				</svg>
				{/* Center readout */}
				<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
					<div className="font-mono text-xs tracking-[0.06em] text-ink-3">
						{active ? "share" : "total tokens"}
					</div>
					<div
						className="font-mono tabular-nums tracking-[-0.01em] mt-0.5 text-xl font-semibold"
						style={{ color: active ? active.color : "var(--ink)" }}
					>
						{active
							? formatPct(active.share)
							: formatTokens(stats.reduce((a, s) => a + s.tokens, 0))}
					</div>
					{active ? (
						<div className="mt-0.5 max-w-[110px] truncate text-xs text-ink-2">
							{active.model}
						</div>
					) : null}
				</div>
			</div>

			{/* Composition: overall bar + one unified row per model */}
			<div className="w-full min-w-0 flex-1 space-y-5">
				{/* Part legend */}
				<div className="flex flex-wrap gap-x-5 gap-y-1.5">
					{PARTS.map((p, i) => (
						<span
							key={p.key}
							className="flex items-center gap-1.5 text-xs text-ink-2"
						>
							<span
								className="h-2 w-2 rounded-[1px]"
								style={{ background: partColors[i] }}
							/>
							{p.label}
							<span className="font-mono tabular-nums tracking-[-0.01em] text-ink-3">
								{formatPct(
									(p.key === "cacheRead"
										? overall.cacheRead
										: p.key === "input"
											? overall.input
											: overall.output) / totalAll,
								)}
							</span>
						</span>
					))}
				</div>

				{/* Overall composition */}
				<div>
					<div className="mb-2 text-sm font-medium text-ink">All requests</div>
					<Bar
						height={24}
						track={tokens.grid}
						parts={[
							{ value: overall.cacheRead, color: partColors[0] },
							{ value: overall.input, color: partColors[1] },
							{ value: overall.output, color: partColors[2] },
						]}
					/>
				</div>

				{/* Per model: share figures + composition bar in a single row */}
				<div className="space-y-1.5">
					{segments.map((s) => (
						// biome-ignore lint/a11y/noStaticElementInteractions: hover only cross-highlights the ring segment; no action
						<div
							key={s.model}
							className={`rounded-xs px-2.5 py-1.5 transition-colors ${hover === s.i ? "bg-line" : "bg-transparent"}`}
							onMouseEnter={() => setHover(s.i)}
							onMouseLeave={() => setHover(null)}
						>
							<div className="mb-1.5 flex items-baseline gap-3">
								<span className="flex min-w-0 flex-1 items-center gap-2 text-sm text-ink">
									<span
										className="h-2 w-2 shrink-0 rounded-[1px]"
										style={{ background: s.color }}
									/>
									<span className="truncate">{s.model}</span>
								</span>
								<span className="shrink-0 font-mono text-xs tabular-nums tracking-[-0.01em] text-ink-2">
									{formatTokens(s.tokens)}
								</span>
								<span
									className="w-12 shrink-0 text-right font-mono text-xs font-medium tabular-nums tracking-[-0.01em]"
									style={{ color: s.color }}
								>
									{formatPct(s.share)}
								</span>
								<span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums tracking-[-0.01em] text-ink-3">
									cache{" "}
									{formatPct(
										s.cacheRead / (s.cacheRead + s.input + s.output || 1),
										0,
									)}
								</span>
							</div>
							<Bar
								height={12}
								delay={s.i * 90}
								track={tokens.grid}
								parts={[
									{ value: s.cacheRead, color: partColors[0] },
									{ value: s.input, color: partColors[1] },
									{ value: s.output, color: partColors[2] },
								]}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

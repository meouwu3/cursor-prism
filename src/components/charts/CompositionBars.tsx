/**
 * Token composition: overall and per-model stacked bars of
 * "cache reads / fresh input / output" — the cache story at a glance.
 */

import type { ModelStat } from "#/lib/analytics";
import { paletteAt } from "#/lib/colors";
import { formatPct, formatTokens } from "#/lib/format";

const PARTS = [
	{ key: "cacheRead", label: "Cache reads", color: "#67e8f9" },
	{ key: "input", label: "Fresh input", color: "#c4b5fd" },
	{ key: "output", label: "Output", color: "#f0abfc" },
] as const;

function Bar({
	parts,
	height = 22,
	delay = 0,
}: {
	parts: { value: number; color: string }[];
	height?: number;
	delay?: number;
}) {
	const total = parts.reduce((a, p) => a + p.value, 0) || 1;
	let left = 0;
	return (
		<div
			className="relative w-full overflow-hidden rounded-full bg-white/[0.04]"
			style={{
				height,
				boxShadow: "inset 0 0 0 1px rgba(148,163,255,0.08)",
			}}
		>
			{parts.map((p) => {
				const width = (p.value / total) * 100;
				const el = (
					<div
						key={p.color}
						className="grow-x absolute top-0 bottom-0"
						style={
							{
								left: `${left}%`,
								width: `${width}%`,
								background: `linear-gradient(180deg, ${p.color}dd, ${p.color}99)`,
								boxShadow: `0 0 12px ${p.color}44`,
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

export function CompositionBars({
	stats,
	overall,
}: {
	stats: ModelStat[];
	overall: { cacheRead: number; input: number; output: number };
}) {
	const totalAll = overall.cacheRead + overall.input + overall.output || 1;

	return (
		<div className="space-y-5">
			{/* Legend */}
			<div className="flex flex-wrap gap-x-5 gap-y-1.5">
				{PARTS.map((p) => (
					<span
						key={p.key}
						className="flex items-center gap-1.5 text-[12px] text-slate-400"
					>
						<span
							className="h-2 w-2 rounded-full"
							style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }}
						/>
						{p.label}
						<span className="num text-slate-500">
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
				<div className="mb-2 flex items-baseline justify-between">
					<span className="text-[13px] font-medium text-white/90">
						All requests
					</span>
					<span className="num text-[12px] text-slate-500">
						{formatTokens(totalAll)}
					</span>
				</div>
				<Bar
					height={26}
					parts={[
						{ value: overall.cacheRead, color: PARTS[0].color },
						{ value: overall.input, color: PARTS[1].color },
						{ value: overall.output, color: PARTS[2].color },
					]}
				/>
			</div>

			{/* Per model */}
			<div className="space-y-3.5">
				{stats.map((s, i) => (
					<div key={s.model}>
						<div className="mb-1.5 flex items-baseline justify-between gap-3">
							<span className="flex min-w-0 items-center gap-2 text-[12.5px] text-slate-300">
								<span
									className="h-2 w-2 shrink-0 rounded-[3px]"
									style={{ background: paletteAt(i) }}
								/>
								<span className="truncate">{s.model}</span>
							</span>
							<span className="num shrink-0 text-[11.5px] text-slate-500">
								cache{" "}
								{formatPct(
									s.cacheRead / (s.cacheRead + s.input + s.output || 1),
									0,
								)}
							</span>
						</div>
						<Bar
							height={13}
							delay={i * 90}
							parts={[
								{ value: s.cacheRead, color: PARTS[0].color },
								{ value: s.input, color: PARTS[1].color },
								{ value: s.output, color: PARTS[2].color },
							]}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Token composition: overall and per-model stacked bars of
 * "cache reads / fresh input / output" — the cache story at a glance.
 * Flat segments from the theme palette; no gradients, no glow.
 */

import type { ModelStat } from "#/lib/analytics";
import { paletteAt } from "#/lib/colors";
import { formatPct, formatTokens } from "#/lib/format";
import { useChartTokens } from "#/lib/theme";

const PARTS = [
	{ key: "cacheRead", label: "Cache reads" },
	{ key: "input", label: "Fresh input" },
	{ key: "output", label: "Output" },
] as const;

function Bar({
	parts,
	height = 22,
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
			className="relative w-full overflow-hidden"
			style={{
				height,
				background: track,
				borderRadius: "var(--radius)",
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

export function CompositionBars({
	stats,
	overall,
}: {
	stats: ModelStat[];
	overall: { cacheRead: number; input: number; output: number };
}) {
	const tokens = useChartTokens();
	const partColors = [tokens.palette[1], tokens.palette[0], tokens.palette[2]];
	const totalAll = overall.cacheRead + overall.input + overall.output || 1;

	return (
		<div className="space-y-5">
			{/* Legend */}
			<div className="flex flex-wrap gap-x-5 gap-y-1.5">
				{PARTS.map((p, i) => (
					<span
						key={p.key}
						className="flex items-center gap-1.5 text-[12px]"
						style={{ color: "var(--ink-2)" }}
					>
						<span
							className="h-2 w-2"
							style={{
								background: partColors[i],
								borderRadius: "calc(var(--radius) - 1px)",
							}}
						/>
						{p.label}
						<span className="num" style={{ color: "var(--ink-3)" }}>
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
					<span
						className="text-[13px] font-medium"
						style={{ color: "var(--ink)" }}
					>
						All requests
					</span>
					<span className="num text-[12px]" style={{ color: "var(--ink-3)" }}>
						{formatTokens(totalAll)}
					</span>
				</div>
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

			{/* Per model */}
			<div className="space-y-3.5">
				{stats.map((s, i) => (
					<div key={s.model}>
						<div className="mb-1.5 flex items-baseline justify-between gap-3">
							<span
								className="flex min-w-0 items-center gap-2 text-[12.5px]"
								style={{ color: "var(--ink)" }}
							>
								<span
									className="h-2 w-2 shrink-0"
									style={{
										background: paletteAt(i, tokens.palette),
										borderRadius: "calc(var(--radius) - 1px)",
									}}
								/>
								<span className="truncate">{s.model}</span>
							</span>
							<span
								className="num shrink-0 text-[11.5px]"
								style={{ color: "var(--ink-3)" }}
							>
								cache{" "}
								{formatPct(
									s.cacheRead / (s.cacheRead + s.input + s.output || 1),
									0,
								)}
							</span>
						</div>
						<Bar
							height={12}
							delay={i * 90}
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
	);
}

/**
 * Model share donut: segments sized by token share, sweep-in animation,
 * hover links the ring, the legend and the center readout.
 * Segments are separated by page-colored hairlines — a flat,
 * print-infographic look in every theme.
 */

import { useState } from "react";
import type { ModelStat } from "#/lib/analytics";
import { paletteAt } from "#/lib/colors";
import { formatPct, formatTokens } from "#/lib/format";
import { useChartTokens } from "#/lib/theme";
import { useCountUp } from "../ui";

const R = 70;
const C = 2 * Math.PI * R;

export function ModelDonut({ stats }: { stats: ModelStat[] }) {
	const tokens = useChartTokens();
	const [hover, setHover] = useState<number | null>(null);
	const progress = useCountUp(1, 1100);

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
		<div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
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
							// biome-ignore lint/a11y/noStaticElementInteractions: ring hover is a visual enhancement; the legend buttons provide the same interaction
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
					<div className="kicker">{active ? "share" : "total tokens"}</div>
					<div
						className="num mt-0.5 text-xl font-semibold"
						style={{ color: active ? active.color : "var(--ink)" }}
					>
						{active
							? formatPct(active.share)
							: formatTokens(stats.reduce((a, s) => a + s.tokens, 0))}
					</div>
					{active ? (
						<div
							className="mt-0.5 max-w-[110px] truncate text-xs"
							style={{ color: "var(--ink-2)" }}
						>
							{active.model}
						</div>
					) : null}
				</div>
			</div>

			{/* Legend */}
			<ul className="w-full min-w-0 flex-1 space-y-1.5">
				{segments.map((s) => (
					<li key={s.model}>
						<button
							type="button"
							className="flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors"
							style={{
								borderRadius: "var(--radius)",
								background: hover === s.i ? "var(--line)" : "transparent",
								opacity: hover === s.i ? 1 : undefined,
							}}
							onMouseEnter={() => setHover(s.i)}
							onMouseLeave={() => setHover(null)}
						>
							<span
								className="h-2.5 w-2.5 shrink-0"
								style={{
									background: s.color,
									borderRadius: "calc(var(--radius) - 1px)",
								}}
							/>
							<span
								className="min-w-0 flex-1 truncate text-sm"
								style={{ color: "var(--ink)" }}
							>
								{s.model}
							</span>
							<span
								className="num shrink-0 text-xs"
								style={{ color: "var(--ink-2)" }}
							>
								{formatTokens(s.tokens)}
							</span>
							<span
								className="num w-12 shrink-0 text-right text-xs font-medium"
								style={{ color: s.color }}
							>
								{formatPct(s.share)}
							</span>
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

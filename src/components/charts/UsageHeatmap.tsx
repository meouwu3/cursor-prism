/**
 * Activity heatmap: token burn intensity across 7 weekdays × 24 hours.
 * Brightness is sqrt-scaled so extreme values don't flatten the rest.
 * Cell color comes from the theme's heat() ramp.
 */

import { useState } from "react";
import type { HeatCell } from "#/lib/analytics";
import { formatTokens, WEEKDAY_LABELS } from "#/lib/format";
import { useChartTokens } from "#/lib/theme";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const HOURS = Array.from({ length: 24 }, (_, h) => h);

export function UsageHeatmap({ cells }: { cells: HeatCell[] }) {
	const tokens = useChartTokens();
	const [hover, setHover] = useState<HeatCell | null>(null);
	const max = Math.max(...cells.map((c) => c.tokens), 1);
	const at = (w: number, h: number) => cells[w * 24 + h];

	return (
		<div className="relative">
			{/* Hour scale */}
			<div className="mb-1.5 grid" style={{ gridTemplateColumns: "38px 1fr" }}>
				<span />
				<div className="grid grid-cols-24">
					{HOURS.map((h) => (
						<span
							key={h}
							className="num text-center text-xs"
							style={{ color: "var(--ink-3)" }}
						>
							{h % 3 === 0 ? h : ""}
						</span>
					))}
				</div>
			</div>

			<div className="space-y-[3px]">
				{DAY_ORDER.map((w, rowIdx) => (
					<div
						key={w}
						className="grid items-center"
						style={{ gridTemplateColumns: "38px 1fr" }}
					>
						<span
							className="pr-2 text-right text-xs"
							style={{ color: "var(--ink-2)" }}
						>
							{WEEKDAY_LABELS[w]}
						</span>
						<div className="grid grid-cols-24 gap-[3px]">
							{HOURS.map((h) => {
								const c = at(w, h);
								const intensity = Math.sqrt(c.tokens / max);
								return (
									// biome-ignore lint/a11y/noStaticElementInteractions: hover is a visual enhancement; the readout bar below mirrors the same info
									<div
										key={`${w}-${h}`}
										className="fade-in aspect-square w-full cursor-pointer transition-transform hover:scale-125 hover:z-10"
										style={
											{
												background: tokens.heat(intensity),
												borderRadius: "calc(var(--radius) - 1px)",
												"--d": `${rowIdx * 45 + h * 8}ms`,
											} as React.CSSProperties
										}
										onMouseEnter={() => setHover(c)}
										onMouseLeave={() => setHover(null)}
									/>
								);
							})}
						</div>
					</div>
				))}
			</div>

			{/* Readout bar */}
			<div
				className="num mt-3 flex h-5 items-center justify-between text-xs"
				style={{ color: "var(--ink-3)" }}
			>
				{hover ? (
					<>
						<span>
							{WEEKDAY_LABELS[hover.weekday]}{" "}
							{String(hover.hour).padStart(2, "0")}:00, {hover.count} requests
						</span>
						<span style={{ color: "var(--accent)" }}>
							{formatTokens(hover.tokens)} tokens
						</span>
					</>
				) : (
					<span>Hover a cell for hourly detail</span>
				)}
			</div>
		</div>
	);
}

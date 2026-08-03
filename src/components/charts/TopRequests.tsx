/**
 * Heaviest requests leaderboard: horizontal bars sorted by token volume,
 * with timestamp and cost. Flat bars colored per model from the theme
 * palette.
 */

import { modelColor } from "#/lib/colors";
import type { UsageRow } from "#/lib/csv";
import { formatCost, formatDateTime, formatTokens } from "#/lib/format";
import { useChartTokens } from "#/lib/theme";

export function TopRequests({ rows }: { rows: UsageRow[] }) {
	const tokens = useChartTokens();
	const max = rows[0]?.totalTokens ?? 1;
	return (
		<ol className="space-y-2.5">
			{rows.map((r, i) => {
				const color = modelColor(r.model, tokens.palette);
				return (
					<li
						key={`${r.date.getTime()}-${r.model}-${r.totalTokens}`}
						className="group"
					>
						<div className="mb-1 flex items-baseline gap-2 text-xs">
							<span
								className="num w-5 shrink-0 text-right"
								style={{ color: "var(--ink-3)" }}
							>
								{String(i + 1).padStart(2, "0")}
							</span>
							<span
								className="num min-w-0 flex-1 truncate"
								style={{ color: "var(--ink-2)" }}
							>
								{formatDateTime(r.date)}
							</span>
							<span className="num shrink-0" style={{ color: "var(--ink-3)" }}>
								{formatCost(r.cost)}
							</span>
							<span
								className="num w-16 shrink-0 text-right font-semibold"
								style={{ color }}
							>
								{formatTokens(r.totalTokens)}
							</span>
						</div>
						<div className="ml-7 flex items-center gap-2">
							<div
								className="h-[8px] flex-1 overflow-hidden"
								style={{
									background: tokens.grid,
									borderRadius: "var(--radius)",
								}}
							>
								<div
									className="grow-x h-full"
									style={
										{
											width: `${Math.max(2, (r.totalTokens / max) * 100)}%`,
											background: color,
											borderRadius: "var(--radius)",
											"--d": `${i * 70}ms`,
										} as React.CSSProperties
									}
								/>
							</div>
							<span
								className="w-24 truncate text-right text-xs"
								style={{ color: "var(--ink-3)" }}
							>
								{r.model}
							</span>
						</div>
					</li>
				);
			})}
		</ol>
	);
}

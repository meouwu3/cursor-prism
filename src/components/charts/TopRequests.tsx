/**
 * Heaviest requests leaderboard: horizontal bars sorted by token volume,
 * with timestamp and cost.
 */

import { modelColor } from "#/lib/colors";
import type { UsageRow } from "#/lib/csv";
import { formatCost, formatDateTime, formatTokens } from "#/lib/format";

export function TopRequests({ rows }: { rows: UsageRow[] }) {
	const max = rows[0]?.totalTokens ?? 1;
	return (
		<ol className="space-y-2.5">
			{rows.map((r, i) => {
				const color = modelColor(r.model);
				return (
					<li
						key={`${r.date.getTime()}-${r.model}-${r.totalTokens}`}
						className="group"
					>
						<div className="mb-1 flex items-baseline gap-2 text-[12px]">
							<span className="num w-5 shrink-0 text-right text-slate-600">
								{String(i + 1).padStart(2, "0")}
							</span>
							<span className="num min-w-0 flex-1 truncate text-slate-400">
								{formatDateTime(r.date)}
							</span>
							<span className="num shrink-0 text-slate-500">
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
							<div className="h-[9px] flex-1 overflow-hidden rounded-full bg-white/[0.04]">
								<div
									className="grow-x h-full rounded-full"
									style={
										{
											width: `${Math.max(2, (r.totalTokens / max) * 100)}%`,
											background: `linear-gradient(90deg, ${color}55, ${color})`,
											boxShadow: `0 0 10px ${color}55`,
											"--d": `${i * 70}ms`,
										} as React.CSSProperties
									}
								/>
							</div>
							<span className="w-24 truncate text-right text-[10.5px] text-slate-600">
								{r.model}
							</span>
						</div>
					</li>
				);
			})}
		</ol>
	);
}

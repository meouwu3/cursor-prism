/** Auto-insight cards: rule-based conclusions from buildInsights. */

import type { Insight } from "#/lib/analytics";
import { TONE_COLORS } from "#/lib/colors";

export function InsightsGrid({ insights }: { insights: Insight[] }) {
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{insights.map((ins, i) => {
				const color = TONE_COLORS[ins.tone];
				return (
					<div
						key={ins.title}
						className="glass glass-hover rise group relative overflow-hidden px-5 py-4"
						style={{ "--d": `${i * 70}ms` } as React.CSSProperties}
					>
						{/* Corner glow */}
						<div
							className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-45"
							style={{ background: color }}
						/>
						<div className="mb-2 flex items-center gap-2">
							<span className="text-[15px] leading-none" style={{ color }}>
								{ins.icon}
							</span>
							<span className="text-[12px] tracking-wide text-slate-400">
								{ins.title}
							</span>
						</div>
						<div
							className="num text-[24px] leading-tight font-semibold"
							style={{ color }}
						>
							{ins.value}
						</div>
						<p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">
							{ins.text}
						</p>
					</div>
				);
			})}
		</div>
	);
}

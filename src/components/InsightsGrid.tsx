/**
 * Auto-insight cards: rule-based conclusions from buildInsights.
 * Numbered like footnotes — the accent edge does the talking,
 * not decorative icons.
 */

import type { Insight } from "#/lib/analytics";

export function InsightsGrid({ insights }: { insights: Insight[] }) {
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{insights.map((ins, i) => (
				<div
					key={ins.title}
					className="insight rise px-5 py-4"
					style={{ "--d": `${i * 70}ms` } as React.CSSProperties}
				>
					<div className="mb-2 flex items-baseline gap-2">
						<span
							className="num text-[11px]"
							style={{ color: "var(--accent)" }}
						>
							{String(i + 1).padStart(2, "0")}
						</span>
						<span className="kicker">{ins.title}</span>
					</div>
					<div className="display text-[24px] leading-tight font-semibold">
						{ins.value}
					</div>
					<p
						className="mt-2 text-[12.5px] leading-relaxed"
						style={{ color: "var(--ink-2)" }}
					>
						{ins.text}
					</p>
				</div>
			))}
		</div>
	);
}

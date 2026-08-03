/** KPI overview row: six headline metrics with rolling-number entrance. */

import type { Summary } from "#/lib/analytics";
import { formatCost, formatInt, formatPct, formatTokens } from "#/lib/format";
import { useCountUp } from "./ui";

function Kpi({
	label,
	value,
	sub,
	delay,
}: {
	label: string;
	value: string;
	sub: string;
	delay: number;
}) {
	return (
		<div
			className="kpi rise px-4.5 py-4"
			style={{ "--d": `${delay}ms` } as React.CSSProperties}
		>
			<div className="kicker mb-2">{label}</div>
			<div
				className={`display font-semibold ${
					value.length > 12
						? "text-base leading-snug break-words"
						: "text-2xl leading-none"
				}`}
			>
				{value}
			</div>
			<div className="num mt-1.5 text-xs" style={{ color: "var(--ink-3)" }}>
				{sub}
			</div>
		</div>
	);
}

function AnimatedKpi({
	label,
	raw,
	format,
	sub,
	delay,
}: {
	label: string;
	raw: number;
	format: (n: number) => string;
	sub: string;
	delay: number;
}) {
	const v = useCountUp(raw);
	return <Kpi label={label} value={format(v)} sub={sub} delay={delay} />;
}

export function KpiRow({ summary }: { summary: Summary }) {
	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
			<AnimatedKpi
				label="Total Tokens"
				raw={summary.totalTokens}
				format={formatTokens}
				sub={formatInt(summary.totalTokens)}
				delay={0}
			/>
			<AnimatedKpi
				label="Total Cost"
				raw={summary.totalCost}
				format={formatCost}
				sub={`≈ $${summary.costPerMillion.toFixed(2)} / 1M tokens`}
				delay={60}
			/>
			<AnimatedKpi
				label="Requests"
				raw={summary.requestCount}
				format={formatInt}
				sub={`${summary.activeDays} active days`}
				delay={120}
			/>
			<AnimatedKpi
				label="Cache Hit Rate"
				raw={summary.cacheHitRate * 100}
				format={(n) => `${n.toFixed(1)}%`}
				sub={`${formatTokens(summary.cacheRead)} from cache`}
				delay={180}
			/>
			<AnimatedKpi
				label="Avg per Request"
				raw={summary.avgTokens}
				format={formatTokens}
				sub={`output share ${formatPct(summary.outputRatio)}`}
				delay={240}
			/>
			<Kpi
				label="Primary Model"
				value={summary.topModel}
				sub={formatDayRange(summary.rangeStart, summary.rangeEnd)}
				delay={300}
			/>
		</div>
	);
}

function formatDayRange(a: Date, b: Date): string {
	const f = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
	return `${f(a)} — ${f(b)}`;
}

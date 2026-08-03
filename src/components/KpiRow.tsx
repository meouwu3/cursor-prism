/** KPI overview row: six headline metrics with rolling-number entrance. */

import type { Summary } from "#/lib/analytics";
import { formatCost, formatInt, formatPct, formatTokens } from "#/lib/format";
import { useCountUp } from "./ui";

function Kpi({
	label,
	value,
	sub,
	accent,
	delay,
}: {
	label: string;
	value: string;
	sub: string;
	accent: string;
	delay: number;
}) {
	return (
		<div
			className="glass glass-hover rise px-4.5 py-4"
			style={{ "--d": `${delay}ms` } as React.CSSProperties}
		>
			<div className="mb-2 flex items-center gap-1.5">
				<span
					className="h-1.5 w-1.5 rounded-full"
					style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
				/>
				<span className="text-[11.5px] tracking-wide text-slate-400">
					{label}
				</span>
			</div>
			<div
				className={`num font-semibold text-white ${
					value.length > 12
						? "text-[16px] leading-snug break-words"
						: "text-[26px] leading-none"
				}`}
			>
				{value}
			</div>
			<div className="num mt-1.5 text-[11px] text-slate-500">{sub}</div>
		</div>
	);
}

function AnimatedKpi({
	label,
	raw,
	format,
	sub,
	accent,
	delay,
}: {
	label: string;
	raw: number;
	format: (n: number) => string;
	sub: string;
	accent: string;
	delay: number;
}) {
	const v = useCountUp(raw);
	return (
		<Kpi
			label={label}
			value={format(v)}
			sub={sub}
			accent={accent}
			delay={delay}
		/>
	);
}

export function KpiRow({ summary }: { summary: Summary }) {
	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
			<AnimatedKpi
				label="Total Tokens"
				raw={summary.totalTokens}
				format={formatTokens}
				sub={formatInt(summary.totalTokens)}
				accent="#67e8f9"
				delay={0}
			/>
			<AnimatedKpi
				label="Total Cost"
				raw={summary.totalCost}
				format={formatCost}
				sub={`≈ $${summary.costPerMillion.toFixed(2)} / 1M tokens`}
				accent="#f0abfc"
				delay={60}
			/>
			<AnimatedKpi
				label="Requests"
				raw={summary.requestCount}
				format={formatInt}
				sub={`${summary.activeDays} active days`}
				accent="#c4b5fd"
				delay={120}
			/>
			<AnimatedKpi
				label="Cache Hit Rate"
				raw={summary.cacheHitRate * 100}
				format={(n) => `${n.toFixed(1)}%`}
				sub={`${formatTokens(summary.cacheRead)} from cache`}
				accent="#6ee7b7"
				delay={180}
			/>
			<AnimatedKpi
				label="Avg per Request"
				raw={summary.avgTokens}
				format={formatTokens}
				sub={`output share ${formatPct(summary.outputRatio)}`}
				accent="#fcd34d"
				delay={240}
			/>
			<Kpi
				label="Primary Model"
				value={summary.topModel}
				sub={formatDayRange(summary.rangeStart, summary.rangeEnd)}
				accent="#93c5fd"
				delay={300}
			/>
		</div>
	);
}

function formatDayRange(a: Date, b: Date): string {
	const f = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
	return `${f(a)} — ${f(b)}`;
}

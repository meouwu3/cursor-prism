import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ModelSpectrum } from "#/components/charts/ModelSpectrum";
import { TimelineChart } from "#/components/charts/TimelineChart";
import { KpiRow } from "#/components/KpiRow";
import { Logo } from "#/components/Logo";
import { ThemeSwitcher } from "#/components/ThemeSwitcher";
import { Card, SectionTitle } from "#/components/ui";
import { dailySeries, modelStats, summarize } from "#/lib/analytics";
import { modelColor } from "#/lib/colors";
import { CsvParseError, type UsageRow } from "#/lib/csv";
import {
	formatCost,
	formatDateTime,
	formatDay,
	formatTokens,
} from "#/lib/format";
import { setUsageCsv, useUsageData } from "#/lib/store";
import { useChartTokens } from "#/lib/theme";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
	const navigate = useNavigate();
	const data = useUsageData();
	const [mode, setMode] = useState<"tokens" | "cost">("tokens");
	const [error, setError] = useState<string | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// Nothing in memory (direct visit / reload) — back to the upload page
		if (data.status === "empty") navigate({ to: "/" });
	}, [data.status, navigate]);

	const rows = data.rows;
	const analytics = useMemo(() => {
		if (!rows) return null;
		return {
			summary: summarize(rows),
			daily: dailySeries(rows),
			models: modelStats(rows),
			recent: [...rows]
				.sort((a, b) => b.date.getTime() - a.date.getTime())
				.slice(0, 50),
			hasCacheWrite: rows.some((r) => r.inputWithCacheWrite > 0),
		};
	}, [rows]);

	const onReupload = (file: File) => {
		setError(null);
		file
			.text()
			.then((text) => {
				try {
					setUsageCsv(text, file.name);
				} catch (e) {
					setError(
						e instanceof CsvParseError ? e.message : "Invalid file format.",
					);
				}
			})
			.catch(() => setError("Failed to read the file."));
	};

	if (data.status !== "ready" || !rows || !analytics) {
		// Skeleton shaped like the real layout while data lands
		return (
			<div className="relative mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6">
				<div className="mb-8 flex items-center justify-between pt-1">
					<div className="h-6 w-36 animate-skel rounded-xs bg-line" />
					<div className="h-8 w-56 animate-skel rounded-xs bg-line" />
				</div>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<div className="h-20 animate-skel rounded-xs bg-line" />
					<div className="h-20 animate-skel rounded-xs bg-line" />
					<div className="h-20 animate-skel rounded-xs bg-line" />
				</div>
				<div className="mt-6 h-72 animate-skel rounded-xs bg-line" />
			</div>
		);
	}

	const { summary } = analytics;

	return (
		<div className="relative min-h-dvh">
			{/* Sticky glass masthead */}
			<header className="sticky top-0 z-40 animate-fade-in border-b border-line bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] backdrop-blur-md motion-reduce:animate-none print:border-b-line-strong">
				<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
					<Link
						to="/"
						className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
					>
						<Logo size={26} />
						<span className="font-display text-balance text-base font-semibold tracking-tight text-ink">
							Cursor Prism
						</span>
					</Link>

					<div className="flex flex-wrap items-center gap-2">
						<span className="inline-flex h-8 items-center gap-[0.5em] rounded-xs border border-line px-[0.9em] font-mono text-xs text-ink-2 blueprint:border-dashed">
							{formatDay(summary.rangeStart)} ~ {formatDay(summary.rangeEnd)}
						</span>
						<button
							type="button"
							onClick={() => fileInput.current?.click()}
							className="inline-flex h-8 cursor-pointer items-center rounded-xs border border-line bg-transparent px-3 font-body text-xs font-medium text-ink-2 [transition:border-color_.25s_var(--ease),color_.25s_var(--ease),translate_.2s_var(--spring),scale_.2s_var(--spring)] hover:-translate-y-px hover:border-line-strong hover:text-ink active:scale-[0.98] blueprint:border-dashed"
						>
							Change CSV
						</button>
						<ThemeSwitcher />
						<input
							ref={fileInput}
							type="file"
							accept=".csv,text/csv"
							className="hidden"
							onChange={(e) => {
								const f = e.target.files?.[0];
								if (f) onReupload(f);
								e.target.value = "";
							}}
						/>
					</div>
				</div>
			</header>

			<div className="relative mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6">
				{error ? (
					<div className="mb-4 rounded-xs border border-accent px-4 py-2.5 text-sm text-accent">
						Parse failed: {error}
					</div>
				) : null}

				{/* KPI overview */}
				<KpiRow summary={summary} />

				{/* Trend */}
				<section
					className="mt-6 animate-rise [animation-delay:var(--d,0ms)] motion-reduce:animate-none"
					style={{ "--d": "200ms" } as React.CSSProperties}
				>
					<Card className="px-5 pt-4 pb-3">
						<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
							<div>
								<div className="font-mono text-xs tracking-[0.06em] text-ink-3">
									timeline
								</div>
								<h2 className="mt-0.5 font-display text-balance text-base font-semibold tracking-[-0.015em] text-ink blueprint:tracking-[-0.04em]">
									Daily rhythm
								</h2>
							</div>
							<div className="flex rounded-xs border border-line p-0.5">
								{(["tokens", "cost"] as const).map((m) => (
									<button
										key={m}
										type="button"
										onClick={() => setMode(m)}
										className={`cursor-pointer rounded-[1px] border-none px-3.5 py-1 font-mono text-xs tabular-nums tracking-[-0.01em] transition-colors ${
											mode === m ? "bg-ink text-bg" : "text-ink-3"
										}`}
									>
										{m === "tokens" ? "Tokens" : "Cost"}
									</button>
								))}
							</div>
						</div>
						<TimelineChart points={analytics.daily} mode={mode} height={290} />
					</Card>
				</section>

				{/* Model spectrum: share fused with composition */}
				<section className="mt-6">
					<Card
						className="animate-rise px-5 py-4 [animation-delay:var(--d,0ms)] motion-reduce:animate-none"
						style={{ "--d": "280ms" } as React.CSSProperties}
					>
						<SectionTitle
							eyebrow="model spectrum"
							title="Model spectrum"
							desc="Which models burn your tokens — and how much the cache absorbs"
						/>
						<ModelSpectrum
							stats={analytics.models}
							overall={{
								cacheRead: summary.cacheRead,
								input: summary.input,
								output: summary.output,
							}}
						/>
					</Card>
				</section>

				{/* Request ledger */}
				<section
					className="mt-8 animate-rise [animation-delay:var(--d,0ms)] motion-reduce:animate-none"
					style={{ "--d": "340ms" } as React.CSSProperties}
				>
					<Card className="overflow-hidden">
						<div className="flex items-baseline justify-between px-5 pt-4 pb-3">
							<div>
								<div className="font-mono text-xs tracking-[0.06em] text-ink-3">
									ledger
								</div>
								<h2 className="mt-0.5 font-display text-balance text-base font-semibold tracking-[-0.015em] text-ink blueprint:tracking-[-0.04em]">
									Request ledger
								</h2>
							</div>
							<span className="font-mono text-xs tabular-nums tracking-[-0.01em] text-ink-3">
								latest {analytics.recent.length} rows
							</span>
						</div>
						<DetailTable
							rows={analytics.recent}
							showCacheWrite={analytics.hasCacheWrite}
						/>
					</Card>
				</section>

				<footer className="mt-14 border-t border-line pt-5 text-center text-xs text-ink-3">
					Cursor Prism — data lives only in browser memory.
				</footer>
			</div>
		</div>
	);
}

function DetailTable({
	rows,
	showCacheWrite,
}: {
	rows: UsageRow[];
	/** The whole dataset decides: no cache writes anywhere, no column */
	showCacheWrite: boolean;
}) {
	const tokens = useChartTokens();
	/** Zero renders as a quiet dash */
	const tok = (n: number) =>
		n > 0 ? formatTokens(n) : <span className="text-ink-3">—</span>;
	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[720px] text-left text-xs">
				<thead>
					<tr className="border-t border-t-line-strong border-b border-b-line text-ink-3">
						<th className="px-5 py-2.5 font-mono font-normal tabular-nums tracking-[-0.01em]">
							Time
						</th>
						<th className="px-2 py-2.5 font-normal">Model</th>
						{showCacheWrite ? (
							<th className="px-2 py-2.5 text-right font-mono font-normal tabular-nums tracking-[-0.01em]">
								Cache Write
							</th>
						) : null}
						<th className="px-2 py-2.5 text-right font-mono font-normal tabular-nums tracking-[-0.01em]">
							Input
						</th>
						<th className="px-2 py-2.5 text-right font-mono font-normal tabular-nums tracking-[-0.01em]">
							Cache Read
						</th>
						<th className="px-2 py-2.5 text-right font-mono font-normal tabular-nums tracking-[-0.01em]">
							Output
						</th>
						<th className="px-2 py-2.5 text-right font-mono font-normal tabular-nums tracking-[-0.01em]">
							Total
						</th>
						<th className="px-5 py-2.5 text-right font-mono font-normal tabular-nums tracking-[-0.01em]">
							Cost
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r) => (
						<tr
							key={r.date.getTime() + r.model}
							className="border-b border-line transition-colors"
						>
							<td className="px-5 py-2 font-mono whitespace-nowrap tabular-nums tracking-[-0.01em] text-ink-2">
								{formatDateTime(r.date)}
							</td>
							<td className="px-2 py-2">
								<span className="flex items-center gap-1.5 text-ink">
									<span
										className="h-1.5 w-1.5 shrink-0 rounded-[1px]"
										style={{
											background: modelColor(r.model, tokens.palette),
										}}
									/>
									<span className="max-w-[180px] truncate">{r.model}</span>
									{r.maxMode ? (
										<span className="rounded-[1px] border border-accent px-1.5 py-0.5 text-xs text-accent">
											MAX
										</span>
									) : null}
								</span>
							</td>
							{showCacheWrite ? (
								<td className="px-2 py-2 text-right font-mono tabular-nums tracking-[-0.01em] text-ink-2">
									{tok(r.inputWithCacheWrite)}
								</td>
							) : null}
							<td className="px-2 py-2 text-right font-mono tabular-nums tracking-[-0.01em] text-ink-2">
								{tok(r.inputWithoutCacheWrite)}
							</td>
							<td className="px-2 py-2 text-right font-mono tabular-nums tracking-[-0.01em] text-accent">
								{tok(r.cacheRead)}
							</td>
							<td className="px-2 py-2 text-right font-mono tabular-nums tracking-[-0.01em] text-ink-2">
								{tok(r.outputTokens)}
							</td>
							<td className="px-2 py-2 text-right font-mono font-medium tabular-nums tracking-[-0.01em] text-ink">
								{formatTokens(r.totalTokens)}
							</td>
							<td className="px-5 py-2 text-right font-mono tabular-nums tracking-[-0.01em] text-ink">
								{formatCost(r.cost)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

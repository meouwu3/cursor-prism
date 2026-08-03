import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Backdrop } from "#/components/Backdrop";
import { CompositionBars } from "#/components/charts/CompositionBars";
import { Galaxy } from "#/components/charts/Galaxy";
import { ModelDonut } from "#/components/charts/ModelDonut";
import { TimelineChart } from "#/components/charts/TimelineChart";
import { TopRequests } from "#/components/charts/TopRequests";
import { UsageHeatmap } from "#/components/charts/UsageHeatmap";
import { InsightsGrid } from "#/components/InsightsGrid";
import { KpiRow } from "#/components/KpiRow";
import { Logo } from "#/components/Logo";
import { Card, SectionTitle } from "#/components/ui";
import {
	buildInsights,
	dailySeries,
	heatMatrix,
	modelStats,
	summarize,
	topRequests,
} from "#/lib/analytics";
import { modelColor } from "#/lib/colors";
import { CsvParseError, type UsageRow } from "#/lib/csv";
import {
	formatCost,
	formatDateTime,
	formatDay,
	formatTokens,
} from "#/lib/format";
import {
	clearUsageData,
	hydrateUsageData,
	setUsageCsv,
	useUsageData,
} from "#/lib/store";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
	const navigate = useNavigate();
	const data = useUsageData();
	const [mode, setMode] = useState<"tokens" | "cost">("tokens");
	const [error, setError] = useState<string | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);

	useEffect(() => {
		hydrateUsageData();
	}, []);

	useEffect(() => {
		if (data.status === "empty") navigate({ to: "/" });
	}, [data.status, navigate]);

	const rows = data.rows;
	const analytics = useMemo(() => {
		if (!rows) return null;
		return {
			summary: summarize(rows),
			daily: dailySeries(rows),
			models: modelStats(rows),
			heat: heatMatrix(rows),
			top: topRequests(rows, 8),
			insights: buildInsights(rows),
			recent: [...rows]
				.sort((a, b) => b.date.getTime() - a.date.getTime())
				.slice(0, 50),
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
		// Skeleton while the session is being restored
		return (
			<div className="relative flex min-h-screen items-center justify-center">
				<Backdrop />
				<div className="num animate-pulse text-[12px] uppercase tracking-[0.35em] text-slate-500">
					loading spectrum…
				</div>
			</div>
		);
	}

	const { summary } = analytics;

	return (
		<div className="relative min-h-screen">
			<Backdrop />

			<div className="relative mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6">
				{/* Top bar */}
				<header className="fade-in mb-8 flex flex-wrap items-center justify-between gap-3">
					<Link
						to="/"
						className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
					>
						<Logo size={26} />
						<span className="text-[14px] font-semibold tracking-wide text-white/95">
							Cursor<span className="text-gradient">Prism</span>
						</span>
					</Link>

					<div className="flex flex-wrap items-center gap-2">
						<span className="num flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[11.5px] text-slate-400">
							{data.isDemo ? (
								<>
									<span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
									demo data · {formatDay(summary.rangeStart)} ~{" "}
									{formatDay(summary.rangeEnd)}
								</>
							) : (
								<>
									<span className="pulse-dot h-1.5 w-1.5 rounded-full bg-cyan-300" />
									{data.fileName} · {formatDay(summary.rangeStart)} ~{" "}
									{formatDay(summary.rangeEnd)}
								</>
							)}
						</span>
						<button
							type="button"
							onClick={() => fileInput.current?.click()}
							className="num rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3.5 py-1.5 text-[11.5px] text-cyan-200 transition-colors hover:border-cyan-300/60"
						>
							Change CSV
						</button>
						<button
							type="button"
							onClick={() => {
								clearUsageData();
								navigate({ to: "/" });
							}}
							className="num rounded-full border border-white/8 px-3.5 py-1.5 text-[11.5px] text-slate-500 transition-colors hover:border-white/20 hover:text-slate-300"
						>
							Clear
						</button>
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
				</header>

				{error ? (
					<div className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-[13px] text-red-300">
						Parse failed: {error}
					</div>
				) : null}

				{/* KPI overview */}
				<KpiRow summary={summary} />

				{/* Token Galaxy */}
				<section
					className="rise mt-6"
					style={{ "--d": "200ms" } as React.CSSProperties}
				>
					<Card className="overflow-hidden">
						<div className="flex items-baseline justify-between px-5 pt-4">
							<div>
								<div className="num text-[10.5px] uppercase tracking-[0.3em] text-cyan-300/70">
									token galaxy
								</div>
								<h2 className="mt-0.5 text-[16px] font-semibold text-white/95">
									Every request is a star
								</h2>
							</div>
							<div className="num hidden text-[11px] text-slate-600 sm:block">
								{rows.length} particles
							</div>
						</div>
						<div className="h-[440px]">
							<Galaxy rows={rows} />
						</div>
					</Card>
				</section>

				{/* Trend */}
				<section
					className="rise mt-6"
					style={{ "--d": "280ms" } as React.CSSProperties}
				>
					<Card className="px-5 pt-4 pb-3">
						<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
							<div>
								<div className="num text-[10.5px] uppercase tracking-[0.3em] text-cyan-300/70">
									timeline
								</div>
								<h2 className="mt-0.5 text-[16px] font-semibold text-white/95">
									Daily rhythm
								</h2>
							</div>
							<div className="flex rounded-full border border-white/10 p-0.5">
								{(["tokens", "cost"] as const).map((m) => (
									<button
										key={m}
										type="button"
										onClick={() => setMode(m)}
										className={`num rounded-full px-3.5 py-1 text-[11.5px] transition-all ${
											mode === m
												? "bg-cyan-300/15 text-cyan-200"
												: "text-slate-500 hover:text-slate-300"
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

				{/* Model spectrum + composition */}
				<section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Card
						className="rise px-5 py-4"
						style={{ "--d": "340ms" } as React.CSSProperties}
					>
						<SectionTitle
							eyebrow="model spectrum"
							title="Model spectrum"
							desc="Which models burn your tokens"
						/>
						<ModelDonut stats={analytics.models} />
					</Card>
					<Card
						className="rise px-5 py-4"
						style={{ "--d": "400ms" } as React.CSSProperties}
					>
						<SectionTitle
							eyebrow="cache economics"
							title="Cache economics"
							desc="Cache reads vs fresh input vs output"
						/>
						<CompositionBars
							stats={analytics.models}
							overall={{
								cacheRead: summary.cacheRead,
								input: summary.input,
								output: summary.output,
							}}
						/>
					</Card>
				</section>

				{/* Heat + leaderboard */}
				<section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
					<Card
						className="rise px-5 py-4 lg:col-span-3"
						style={{ "--d": "460ms" } as React.CSSProperties}
					>
						<SectionTitle
							eyebrow="activity heat"
							title="Activity heat"
							desc="Seven days × twenty-four hours of burn intensity"
						/>
						<UsageHeatmap cells={analytics.heat} />
					</Card>
					<Card
						className="rise px-5 py-4 lg:col-span-2"
						style={{ "--d": "520ms" } as React.CSSProperties}
					>
						<SectionTitle
							eyebrow="heavy hitters"
							title="Heaviest requests"
							desc="The 8 largest single calls"
						/>
						<TopRequests rows={analytics.top} />
					</Card>
				</section>

				{/* Auto insights */}
				<section className="mt-8">
					<SectionTitle
						eyebrow="auto insights"
						title="Auto insights"
						desc="Conclusions grown from the data"
						delay={560}
					/>
					<InsightsGrid insights={analytics.insights} />
				</section>

				{/* Request ledger */}
				<section
					className="rise mt-8"
					style={{ "--d": "620ms" } as React.CSSProperties}
				>
					<Card className="overflow-hidden">
						<div className="flex items-baseline justify-between px-5 pt-4 pb-3">
							<div>
								<div className="num text-[10.5px] uppercase tracking-[0.3em] text-cyan-300/70">
									ledger
								</div>
								<h2 className="mt-0.5 text-[16px] font-semibold text-white/95">
									Request ledger
								</h2>
							</div>
							<span className="num text-[11px] text-slate-600">
								latest {analytics.recent.length} rows
							</span>
						</div>
						<DetailTable rows={analytics.recent} />
					</Card>
				</section>

				<footer className="mt-14 text-center text-[12px] text-slate-600">
					CursorPrism · data lives only in your browser · built with TanStack
					Start
				</footer>
			</div>
		</div>
	);
}

function DetailTable({ rows }: { rows: UsageRow[] }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[760px] text-left text-[12px]">
				<thead>
					<tr className="border-y border-white/6 text-slate-500">
						<th className="num px-5 py-2.5 font-normal">Time</th>
						<th className="px-2 py-2.5 font-normal">Kind</th>
						<th className="px-2 py-2.5 font-normal">Model</th>
						<th className="num px-2 py-2.5 text-right font-normal">
							Cache Read
						</th>
						<th className="num px-2 py-2.5 text-right font-normal">Input</th>
						<th className="num px-2 py-2.5 text-right font-normal">Output</th>
						<th className="num px-2 py-2.5 text-right font-normal">Total</th>
						<th className="num px-5 py-2.5 text-right font-normal">Cost</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r) => (
						<tr
							key={r.date.getTime() + r.model}
							className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]"
						>
							<td className="num px-5 py-2 whitespace-nowrap text-slate-400">
								{formatDateTime(r.date)}
							</td>
							<td className="px-2 py-2">
								<span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10.5px] text-slate-400">
									{r.kind}
								</span>
								{r.maxMode ? (
									<span className="ml-1 rounded-md border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-[10.5px] text-amber-300">
										MAX
									</span>
								) : null}
							</td>
							<td className="px-2 py-2">
								<span className="flex items-center gap-1.5 text-slate-300">
									<span
										className="h-1.5 w-1.5 shrink-0 rounded-full"
										style={{ background: modelColor(r.model) }}
									/>
									<span className="max-w-[180px] truncate">{r.model}</span>
								</span>
							</td>
							<td className="num px-2 py-2 text-right text-cyan-300/80">
								{formatTokens(r.cacheRead)}
							</td>
							<td className="num px-2 py-2 text-right text-slate-400">
								{formatTokens(r.inputWithCacheWrite + r.inputWithoutCacheWrite)}
							</td>
							<td className="num px-2 py-2 text-right text-slate-400">
								{formatTokens(r.outputTokens)}
							</td>
							<td className="num px-2 py-2 text-right font-medium text-white/85">
								{formatTokens(r.totalTokens)}
							</td>
							<td className="num px-5 py-2 text-right text-pink-300/90">
								{formatCost(r.cost)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

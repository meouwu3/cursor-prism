import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CompositionBars } from "#/components/charts/CompositionBars";
import { Galaxy } from "#/components/charts/Galaxy";
import { ModelDonut } from "#/components/charts/ModelDonut";
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
		return (
			<div className="relative flex min-h-dvh items-center justify-center">
				<div className="kicker animate-pulse">loading spectrum…</div>
			</div>
		);
	}

	const { summary } = analytics;

	return (
		<div className="relative min-h-dvh">
			<div className="relative mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6">
				{/* Top bar */}
				<header className="fade-in rule-t-strong mb-8 flex flex-wrap items-center justify-between gap-3 pt-4">
					<Link
						to="/"
						className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
					>
						<Logo size={26} />
						<span className="display text-base font-semibold tracking-tight">
							Cursor Prism
						</span>
					</Link>

					<div className="flex flex-wrap items-center gap-2">
						<span className="chip">
							{formatDay(summary.rangeStart)} ~ {formatDay(summary.rangeEnd)}
						</span>
						<button
							type="button"
							onClick={() => fileInput.current?.click()}
							className="btn"
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
				</header>

				{error ? (
					<div
						className="mb-4 border px-4 py-2.5 text-sm"
						style={{
							borderRadius: "var(--radius)",
							borderColor: "var(--accent)",
							color: "var(--accent)",
						}}
					>
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
								<div className="kicker">token galaxy</div>
								<h2 className="display mt-0.5 text-base font-semibold">
									Every request is a star
								</h2>
							</div>
							<div
								className="num hidden text-xs sm:block"
								style={{ color: "var(--ink-3)" }}
							>
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
								<div className="kicker">timeline</div>
								<h2 className="display mt-0.5 text-base font-semibold">
									Daily rhythm
								</h2>
							</div>
							<div
								className="flex border p-0.5"
								style={{
									borderColor: "var(--line)",
									borderRadius: "var(--radius)",
								}}
							>
								{(["tokens", "cost"] as const).map((m) => (
									<button
										key={m}
										type="button"
										onClick={() => setMode(m)}
										className="num cursor-pointer border-none px-3.5 py-1 text-xs transition-colors"
										style={{
											borderRadius: "calc(var(--radius) - 1px)",
											background: mode === m ? "var(--ink)" : "transparent",
											color: mode === m ? "var(--bg)" : "var(--ink-3)",
										}}
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

				{/* Request ledger */}
				<section
					className="rise mt-8"
					style={{ "--d": "460ms" } as React.CSSProperties}
				>
					<Card className="overflow-hidden">
						<div className="flex items-baseline justify-between px-5 pt-4 pb-3">
							<div>
								<div className="kicker">ledger</div>
								<h2 className="display mt-0.5 text-base font-semibold">
									Request ledger
								</h2>
							</div>
							<span className="num text-xs" style={{ color: "var(--ink-3)" }}>
								latest {analytics.recent.length} rows
							</span>
						</div>
						<DetailTable rows={analytics.recent} />
					</Card>
				</section>

				<footer
					className="rule-t mt-14 pt-5 text-center text-xs"
					style={{ color: "var(--ink-3)" }}
				>
					Cursor Prism — data lives only in browser memory.
				</footer>
			</div>
		</div>
	);
}

function DetailTable({ rows }: { rows: UsageRow[] }) {
	const tokens = useChartTokens();
	/** Zero renders as a quiet dash, so an unused cache-write column stays calm */
	const tok = (n: number) =>
		n > 0 ? formatTokens(n) : <span style={{ color: "var(--ink-3)" }}>—</span>;
	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[880px] text-left text-xs">
				<thead>
					<tr
						className="rule-t-strong"
						style={{
							borderBottom: "1px solid var(--line)",
							color: "var(--ink-3)",
						}}
					>
						<th className="num px-5 py-2.5 font-normal">Time</th>
						<th className="px-2 py-2.5 font-normal">Kind</th>
						<th className="px-2 py-2.5 font-normal">Model</th>
						<th className="num px-2 py-2.5 text-right font-normal">
							Cache Write
						</th>
						<th className="num px-2 py-2.5 text-right font-normal">Input</th>
						<th className="num px-2 py-2.5 text-right font-normal">
							Cache Read
						</th>
						<th className="num px-2 py-2.5 text-right font-normal">Output</th>
						<th className="num px-2 py-2.5 text-right font-normal">Total</th>
						<th className="num px-5 py-2.5 text-right font-normal">Cost</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r) => (
						<tr
							key={r.date.getTime() + r.model}
							className="transition-colors"
							style={{ borderBottom: "1px solid var(--line)" }}
						>
							<td
								className="num px-5 py-2 whitespace-nowrap"
								style={{ color: "var(--ink-2)" }}
							>
								{formatDateTime(r.date)}
							</td>
							<td className="px-2 py-2">
								<span
									className="border px-1.5 py-0.5 text-xs"
									style={{
										borderRadius: "calc(var(--radius) - 1px)",
										borderColor: "var(--line)",
										color: "var(--ink-2)",
									}}
								>
									{r.kind}
								</span>
								{r.maxMode ? (
									<span
										className="ml-1 border px-1.5 py-0.5 text-xs"
										style={{
											borderRadius: "calc(var(--radius) - 1px)",
											borderColor: "var(--accent)",
											color: "var(--accent)",
										}}
									>
										MAX
									</span>
								) : null}
							</td>
							<td className="px-2 py-2">
								<span
									className="flex items-center gap-1.5"
									style={{ color: "var(--ink)" }}
								>
									<span
										className="h-1.5 w-1.5 shrink-0"
										style={{
											background: modelColor(r.model, tokens.palette),
											borderRadius: "calc(var(--radius) - 1px)",
										}}
									/>
									<span className="max-w-[180px] truncate">{r.model}</span>
								</span>
							</td>
							<td
								className="num px-2 py-2 text-right"
								style={{ color: "var(--ink-2)" }}
							>
								{tok(r.inputWithCacheWrite)}
							</td>
							<td
								className="num px-2 py-2 text-right"
								style={{ color: "var(--ink-2)" }}
							>
								{tok(r.inputWithoutCacheWrite)}
							</td>
							<td
								className="num px-2 py-2 text-right"
								style={{ color: "var(--accent)" }}
							>
								{tok(r.cacheRead)}
							</td>
							<td
								className="num px-2 py-2 text-right"
								style={{ color: "var(--ink-2)" }}
							>
								{tok(r.outputTokens)}
							</td>
							<td
								className="num px-2 py-2 text-right font-medium"
								style={{ color: "var(--ink)" }}
							>
								{formatTokens(r.totalTokens)}
							</td>
							<td
								className="num px-5 py-2 text-right"
								style={{ color: "var(--ink)" }}
							>
								{formatCost(r.cost)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

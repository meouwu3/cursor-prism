import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "#/components/Logo";
import { ThemeSwitcher } from "#/components/ThemeSwitcher";
import { UploadZone } from "#/components/UploadZone";
import { CsvParseError } from "#/lib/csv";
import {
	clearUsageData,
	hydrateUsageData,
	setDemoData,
	setUsageCsv,
	useUsageData,
} from "#/lib/store";

export const Route = createFileRoute("/")({ component: Landing });

const FEATURES = [
	{
		title: "Trend Prism",
		desc: "Daily token & cost curves with a 7-day moving average, so your rhythm stands out.",
	},
	{
		title: "Model Spectrum",
		desc: "Per-model share and composition — see exactly which model does the heavy lifting.",
	},
	{
		title: "Cache Economics",
		desc: "Cache reads vs fresh input vs output. Quantify how hard context reuse works for you.",
	},
	{
		title: "Activity Heat",
		desc: "A 7 × 24 heat matrix that exposes your peak coding hours.",
	},
	{
		title: "Token Galaxy",
		desc: "A hand-rolled 3D particle cloud. Every request is a star you can grab and inspect.",
	},
	{
		title: "Auto Insights",
		desc: "Cost concentration, peak windows, cost per million tokens — conclusions, not just charts.",
	},
];

const STEPS = [
	{
		n: "01",
		title: "Export",
		desc: "cursor.com/dashboard → Usage → Export CSV",
	},
	{
		n: "02",
		title: "Drop",
		desc: "Parsed locally in your browser — never uploaded",
	},
	{
		n: "03",
		title: "Explore",
		desc: "Six lenses on where your tokens actually go",
	},
];

function Landing() {
	const navigate = useNavigate();
	const data = useUsageData();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		hydrateUsageData();
	}, []);

	const onFile = (file: File) => {
		setError(null);
		file
			.text()
			.then((text) => {
				try {
					setUsageCsv(text, file.name);
					navigate({ to: "/dashboard" });
				} catch (e) {
					setError(
						e instanceof CsvParseError
							? e.message
							: "The file doesn't match the Cursor usage export format.",
					);
				}
			})
			.catch(() => setError("Failed to read the file. Please try again."));
	};

	const onDemo = () => {
		setDemoData();
		navigate({ to: "/dashboard" });
	};

	return (
		<div className="relative min-h-screen">
			<div className="relative mx-auto max-w-5xl px-5 pt-7 pb-20">
				{/* Top bar */}
				<header className="fade-in rule-t-strong flex items-center justify-between pt-4">
					<div className="flex items-center gap-2.5">
						<Logo size={30} />
						<span className="display text-[17px] font-semibold tracking-tight">
							CursorPrism
						</span>
					</div>
					<div className="flex items-center gap-4">
						<span className="kicker hidden sm:block">open source · MIT</span>
						<ThemeSwitcher />
					</div>
				</header>

				{/* Hero */}
				<section className="mt-16 text-center sm:mt-20">
					<div className="rise kicker">cursor usage observatory</div>
					<h1
						className="display rise mt-4 text-4xl leading-[1.12] font-semibold sm:text-6xl"
						style={{ "--d": "80ms" } as React.CSSProperties}
					>
						Refract every <span className="accent-word">token</span>
						<br />
						into its spectrum
					</h1>
					<p
						className="rise mx-auto mt-5 max-w-xl text-[15px] leading-relaxed"
						style={
							{
								"--d": "160ms",
								color: "var(--ink-2)",
							} as React.CSSProperties
						}
					>
						Cursor hands you a spreadsheet. CursorPrism hands you an
						observatory.
						<br className="hidden sm:block" />
						Trends, models, cache economics, heat — and a 3D galaxy of every
						request.
					</p>
				</section>

				{/* Upload */}
				<section
					className="rise mx-auto mt-12 max-w-2xl"
					style={{ "--d": "240ms" } as React.CSSProperties}
				>
					<UploadZone onFile={onFile} error={error} />
					<div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<button type="button" onClick={onDemo} className="btn btn-solid">
							No CSV handy? Load demo data
						</button>
						{data.status === "ready" && !data.isDemo ? (
							<button
								type="button"
								onClick={() => navigate({ to: "/dashboard" })}
								className="btn"
							>
								Resume · {data.fileName}
							</button>
						) : null}
						{data.status === "ready" ? (
							<button
								type="button"
								onClick={clearUsageData}
								className="num cursor-pointer border-none bg-transparent px-3 py-2 text-[12px]"
								style={{ color: "var(--ink-3)" }}
							>
								Clear local data
							</button>
						) : null}
					</div>
					<p
						className="fade-in mt-4 text-center text-[12px]"
						style={
							{ "--d": "400ms", color: "var(--ink-3)" } as React.CSSProperties
						}
					>
						Local-first — parsed entirely in your browser, nothing is ever
						uploaded
					</p>
				</section>

				{/* Steps */}
				<section className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-x-8 sm:grid-cols-3">
					{STEPS.map((s, i) => (
						<div
							key={s.n}
							className="rule-t rise pt-3 pb-1"
							style={{ "--d": `${300 + i * 90}ms` } as React.CSSProperties}
						>
							<div
								className="num text-[11px]"
								style={{ color: "var(--accent)" }}
							>
								{s.n}
							</div>
							<div className="display mt-1.5 text-[15px] font-semibold">
								{s.title}
							</div>
							<div
								className="mt-1 text-[12px] leading-relaxed"
								style={{ color: "var(--ink-2)" }}
							>
								{s.desc}
							</div>
						</div>
					))}
				</section>

				{/* Six lenses */}
				<section className="mt-16">
					<div
						className="rise mb-6 text-center"
						style={{ "--d": "380ms" } as React.CSSProperties}
					>
						<div className="kicker">the index</div>
						<h2 className="display mt-1.5 text-[24px] font-semibold">
							Six lenses on your usage
						</h2>
					</div>
					<div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
						{FEATURES.map((f, i) => (
							<div
								key={f.title}
								className="rule-t rise pt-3 pb-4"
								style={{ "--d": `${420 + i * 60}ms` } as React.CSSProperties}
							>
								<div
									className="num text-[11px]"
									style={{ color: "var(--ink-3)" }}
								>
									{String(i + 1).padStart(2, "0")}
								</div>
								<div className="display mt-1.5 text-[15px] font-semibold">
									{f.title}
								</div>
								<p
									className="mt-1 text-[12.5px] leading-relaxed"
									style={{ color: "var(--ink-2)" }}
								>
									{f.desc}
								</p>
							</div>
						))}
					</div>
				</section>

				<footer
					className="fade-in rule-t mt-16 pt-5 text-center text-[12px]"
					style={
						{ "--d": "600ms", color: "var(--ink-3)" } as React.CSSProperties
					}
				>
					<p>
						CursorPrism — built with TanStack Start · your data never leaves the
						browser
					</p>
				</footer>
			</div>
		</div>
	);
}

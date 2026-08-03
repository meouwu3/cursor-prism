import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Backdrop } from "#/components/Backdrop";
import { Logo } from "#/components/Logo";
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
		icon: "◢",
		title: "Trend Prism",
		desc: "Daily token & cost curves with a 7-day moving average, so your rhythm stands out.",
	},
	{
		icon: "◈",
		title: "Model Spectrum",
		desc: "Per-model share and composition — see exactly which model does the heavy lifting.",
	},
	{
		icon: "❖",
		title: "Cache Economics",
		desc: "Cache reads vs fresh input vs output. Quantify how hard context reuse works for you.",
	},
	{
		icon: "▦",
		title: "Activity Heat",
		desc: "A 7 × 24 heat matrix that exposes your peak coding hours.",
	},
	{
		icon: "✦",
		title: "Token Galaxy",
		desc: "A hand-rolled 3D particle cloud. Every request is a star you can grab and inspect.",
	},
	{
		icon: "◭",
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
			<Backdrop />

			<div className="relative mx-auto max-w-5xl px-5 pt-7 pb-20">
				{/* Top bar */}
				<header className="fade-in flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<Logo size={30} />
						<span className="text-[15px] font-semibold tracking-wide text-white/95">
							Cursor<span className="text-gradient">Prism</span>
						</span>
					</div>
					<span className="num text-[11px] uppercase tracking-[0.25em] text-slate-500">
						open source · MIT
					</span>
				</header>

				{/* Hero */}
				<section className="mt-16 text-center sm:mt-20">
					<div className="rise num mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/5 px-3.5 py-1.5 text-[10.5px] uppercase tracking-[0.3em] text-cyan-300/90">
						<span className="pulse-dot h-1.5 w-1.5 rounded-full bg-cyan-300" />
						cursor usage observatory
					</div>
					<h1
						className="rise text-4xl leading-[1.15] font-bold tracking-tight text-white sm:text-6xl"
						style={{ "--d": "80ms" } as React.CSSProperties}
					>
						Refract every <span className="text-gradient">token</span>
						<br />
						into its spectrum
					</h1>
					<p
						className="rise mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-slate-400"
						style={{ "--d": "160ms" } as React.CSSProperties}
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
						<button
							type="button"
							onClick={onDemo}
							className="group num rounded-full border border-violet-300/30 bg-violet-300/8 px-5 py-2 text-[13px] text-violet-200 transition-all hover:border-violet-300/60 hover:bg-violet-300/15"
							style={{ boxShadow: "0 0 24px -8px rgba(196,181,253,0.4)" }}
						>
							✦ No CSV handy? Load demo data
						</button>
						{data.status === "ready" && !data.isDemo ? (
							<button
								type="button"
								onClick={() => navigate({ to: "/dashboard" })}
								className="num rounded-full border border-white/10 px-5 py-2 text-[13px] text-slate-400 transition-colors hover:border-cyan-300/40 hover:text-cyan-200"
							>
								Resume last session · {data.fileName}
							</button>
						) : null}
						{data.status === "ready" ? (
							<button
								type="button"
								onClick={clearUsageData}
								className="num px-3 py-2 text-[12px] text-slate-600 transition-colors hover:text-slate-400"
							>
								Clear local data
							</button>
						) : null}
					</div>
					<p
						className="fade-in mt-4 text-center text-[12px] text-slate-600"
						style={{ "--d": "400ms" } as React.CSSProperties}
					>
						🔒 Parsed 100% locally in your browser — nothing is ever uploaded
					</p>
				</section>

				{/* Steps */}
				<section className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
					{STEPS.map((s, i) => (
						<div
							key={s.n}
							className="glass rise px-5 py-4"
							style={{ "--d": `${300 + i * 90}ms` } as React.CSSProperties}
						>
							<div className="num text-[11px] tracking-[0.2em] text-cyan-300/70">
								{s.n}
							</div>
							<div className="mt-1.5 text-[14.5px] font-semibold text-white/90">
								{s.title}
							</div>
							<div className="mt-1 text-[12px] leading-relaxed text-slate-500">
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
						<div className="num text-[11px] uppercase tracking-[0.3em] text-slate-500">
							six lenses
						</div>
						<h2 className="mt-1.5 text-[22px] font-semibold text-white/95">
							Six lenses on your usage
						</h2>
					</div>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{FEATURES.map((f, i) => (
							<div
								key={f.title}
								className="glass glass-hover rise group px-5 py-4.5"
								style={{ "--d": `${420 + i * 60}ms` } as React.CSSProperties}
							>
								<div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-[15px] text-cyan-300 transition-colors group-hover:border-cyan-300/30">
									{f.icon}
								</div>
								<div className="text-[14.5px] font-semibold text-white/90">
									{f.title}
								</div>
								<p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
									{f.desc}
								</p>
							</div>
						))}
					</div>
				</section>

				<footer
					className="fade-in mt-20 text-center text-[12px] text-slate-600"
					style={{ "--d": "600ms" } as React.CSSProperties}
				>
					<p>
						CursorPrism — built with{" "}
						<span className="text-slate-400">TanStack Start</span> · your data
						never leaves the browser
					</p>
				</footer>
			</div>
		</div>
	);
}

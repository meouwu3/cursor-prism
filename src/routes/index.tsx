import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "#/components/Logo";
import { TaglineReveal } from "#/components/TaglineReveal";
import { ThemeSwitcher } from "#/components/ThemeSwitcher";
import { UploadZone } from "#/components/UploadZone";
import { CsvParseError } from "#/lib/csv";
import { setUsageCsv } from "#/lib/store";

export const Route = createFileRoute("/")({ component: Landing });

const META = [
	["Input", "Cursor usage CSV export"],
	["Parsing", "100% in your browser"],
	["Storage", "none, memory only"],
	["Themes", "Print / Blueprint"],
] as const;

const STEPS = [
	{
		n: "01",
		title: "Export",
		desc: "cursor.com/dashboard → Usage → Export CSV",
	},
	{
		n: "02",
		title: "Drop",
		desc: "Drag the file in. Parsed locally, never uploaded.",
	},
	{
		n: "03",
		title: "Explore",
		desc: "Four lenses on where your tokens actually go",
	},
];

const FEATURES = [
	{
		title: "Trend prism",
		desc: "Daily token and cost curves with a seven day moving average, so your rhythm stands out.",
	},
	{
		title: "Model spectrum",
		desc: "Per model share and composition. See exactly which model does the heavy lifting.",
	},
	{
		title: "Cache economics",
		desc: "Cache reads versus fresh input versus output. Quantify how hard context reuse works for you.",
	},
	{
		title: "Token galaxy",
		desc: "A 3D particle cloud built from scratch. Every request is a star you can grab and inspect.",
	},
];

const FAQ = [
	{
		q: "Where do I get the CSV?",
		a: "Open cursor.com/dashboard, go to Usage, and choose Export CSV. The export has one row per request: time, kind, model, token breakdown, and cost.",
	},
	{
		q: "Is my data uploaded anywhere?",
		a: "No. The file is parsed in your browser with FileReader and held in memory. Nothing is transmitted, and nothing survives a page reload.",
	},
	{
		q: "Why is cache read such a large share?",
		a: "Cursor reuses conversation context instead of resending it. Cache reads are billed far below fresh input, so a high cache share usually means lower spend.",
	},
	{
		q: "Which browsers are supported?",
		a: "Any current browser. The circular theme transition needs a recent Chromium based browser; everywhere else the theme simply switches.",
	},
	{
		q: "Does it work offline?",
		a: "Once the page has loaded, yes. There is no server side to talk to.",
	},
	{
		q: "What does it cost?",
		a: "Nothing. Cursor Prism is open source under the MIT license.",
	},
];

function Landing() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

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

	return (
		<div className="relative min-h-dvh">
			<div className="relative mx-auto max-w-6xl px-5 pt-7 pb-20 sm:px-8">
				{/* Top bar */}
				<header className="fade-in rule-t-strong flex items-center justify-between pt-4">
					<div className="flex items-center gap-2.5">
						<Logo size={30} />
						<span className="display text-lg font-semibold tracking-tight">
							Cursor Prism
						</span>
					</div>
					<div className="flex items-center gap-4">
						<span className="kicker hidden sm:block">open source (MIT)</span>
						<ThemeSwitcher />
					</div>
				</header>

				{/* Hero — left aligned, meta column on the right */}
				<section className="mt-14 grid gap-10 sm:mt-20 lg:grid-cols-12">
					<div className="lg:col-span-7">
						<div className="rise kicker">Cursor usage observatory</div>
						<h1
							className="display rise mt-4 max-w-[680px] text-4xl font-semibold sm:text-6xl"
							style={{ "--d": "80ms" } as React.CSSProperties}
						>
							<span className="hero-grad">Refract every</span>{" "}
							<span className="accent-word">token</span>
							<br />
							<span className="hero-grad">into its spectrum</span>
						</h1>
						<p
							className="rise mt-5 max-w-[680px] text-base leading-relaxed"
							style={
								{
									"--d": "160ms",
									color: "var(--ink-2)",
								} as React.CSSProperties
							}
						>
							Cursor hands you a spreadsheet. Cursor Prism hands you an
							observatory — trends, models, cache economics, and a 3D galaxy of
							every request.
						</p>
					</div>
					<dl
						className="rise lg:col-span-5 lg:pt-9"
						style={{ "--d": "240ms" } as React.CSSProperties}
					>
						{META.map(([k, v]) => (
							<div
								key={k}
								className="rule-t flex items-baseline justify-between gap-4 py-2.5"
							>
								<dt className="kicker">{k}</dt>
								<dd className="num text-xs" style={{ color: "var(--ink)" }}>
									{v}
								</dd>
							</div>
						))}
					</dl>
				</section>

				{/* Upload — the one primary action */}
				<section
					className="rise mt-12 max-w-2xl"
					style={{ "--d": "320ms" } as React.CSSProperties}
				>
					<UploadZone onFile={onFile} error={error} />
					<p
						className="fade-in mt-3 text-xs"
						style={
							{ "--d": "400ms", color: "var(--ink-3)" } as React.CSSProperties
						}
					>
						Parsed entirely in your browser. Nothing is uploaded, stored, or
						shared.
					</p>
				</section>

				{/* How it works — full width ruled rows */}
				<section className="mt-20 max-w-3xl">
					<div
						className="rise mb-5"
						style={{ "--d": "380ms" } as React.CSSProperties}
					>
						<div className="kicker">How it works</div>
					</div>
					{STEPS.map((s, i) => (
						<div
							key={s.n}
							className="rule-t rise grid grid-cols-[3rem_8rem_1fr] items-baseline gap-4 py-4"
							style={{ "--d": `${420 + i * 80}ms` } as React.CSSProperties}
						>
							<span className="num text-xs" style={{ color: "var(--accent)" }}>
								{s.n}
							</span>
							<span className="display text-base font-semibold">{s.title}</span>
							<span className="text-sm" style={{ color: "var(--ink-2)" }}>
								{s.desc}
							</span>
						</div>
					))}
				</section>

				{/* Benefits — asymmetric two column index */}
				<section className="mt-20">
					<div
						className="rise mb-6"
						style={{ "--d": "480ms" } as React.CSSProperties}
					>
						<div className="kicker">The index</div>
						<h2 className="display mt-1 text-2xl font-semibold">
							Four lenses on your usage
						</h2>
					</div>
					<div className="grid gap-x-16 sm:grid-cols-2">
						<div>
							{FEATURES.filter((_, i) => i % 2 === 0).map((f, i) => (
								<Feature key={f.title} f={f} d={520 + i * 70} />
							))}
						</div>
						<div className="sm:mt-16">
							{FEATURES.filter((_, i) => i % 2 === 1).map((f, i) => (
								<Feature key={f.title} f={f} d={560 + i * 70} />
							))}
						</div>
					</div>
				</section>

				{/* Tagline reveal — words light up one by one on scroll */}
				<section className="mt-24 sm:mt-32">
					<TaglineReveal
						className="display max-w-[680px] text-4xl font-semibold leading-snug sm:text-5xl"
						text="Every request leaves a trace — when you burn, what you burn on, and what the cache saves you."
					/>
				</section>

				{/* FAQ — side by side, no accordion */}
				<section className="mt-24">
					<div className="mb-6">
						<div className="kicker">Questions</div>
						<h2 className="display mt-1 text-2xl font-semibold">
							Asked and answered
						</h2>
					</div>
					<div className="grid gap-x-16 sm:grid-cols-2">
						{FAQ.map((f) => (
							<div key={f.q} className="rule-t py-4">
								<div className="display text-base font-semibold">{f.q}</div>
								<p
									className="mt-1.5 text-sm leading-relaxed"
									style={{ color: "var(--ink-2)" }}
								>
									{f.a}
								</p>
							</div>
						))}
					</div>
				</section>

				{/* Final CTA — identical to the top */}
				<section className="mt-24 max-w-2xl">
					<h2 className="display mb-5 text-2xl font-semibold">
						Ready when your CSV is.
					</h2>
					<UploadZone onFile={onFile} error={error} compact />
				</section>

				<footer
					className="fade-in rule-t mt-20 pt-5 text-xs"
					style={{ color: "var(--ink-3)" }}
				>
					<p>
						Cursor Prism — built with TanStack Start. Your data never leaves the
						browser.
					</p>
				</footer>
			</div>
		</div>
	);
}

function Feature({ f, d }: { f: { title: string; desc: string }; d: number }) {
	return (
		<div
			className="rule-t rise py-4"
			style={{ "--d": `${d}ms` } as React.CSSProperties}
		>
			<div className="display text-base font-semibold">{f.title}</div>
			<p
				className="mt-1 text-sm leading-relaxed"
				style={{ color: "var(--ink-2)" }}
			>
				{f.desc}
			</p>
		</div>
	);
}

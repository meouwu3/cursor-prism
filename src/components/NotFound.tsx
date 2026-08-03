/** Branded 404 — every page needs a way back. */

import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function NotFound() {
	return (
		<div className="relative flex min-h-dvh flex-col items-center justify-center px-5 text-center">
			<Logo size={40} />
			<div className="mt-6 font-mono text-xs tracking-[0.06em] text-ink-3">
				404
			</div>
			<h1 className="mt-2 font-display text-balance text-3xl font-semibold tracking-[-0.015em] text-ink blueprint:tracking-[-0.04em]">
				This page is off the spectrum
			</h1>
			<p className="mt-3 max-w-md text-sm leading-relaxed text-ink-2">
				The route you asked for does not exist. Your CSV is probably waiting on
				the landing page.
			</p>
			<Link
				to="/"
				className="mt-6 inline-block cursor-pointer rounded-xs border border-line bg-transparent px-3 py-2 font-body text-sm font-semibold text-ink-2 no-underline [transition:background-color_.25s_var(--ease),border-color_.25s_var(--ease),color_.25s_var(--ease),translate_.2s_var(--spring),scale_.2s_var(--spring)] hover:-translate-y-px hover:border-line-strong hover:text-ink active:scale-[0.98] print:border-ink print:text-ink print:hover:bg-ink print:hover:text-bg blueprint:border-dashed blueprint:border-line-strong blueprint:hover:border-ink"
			>
				Back to the observatory
			</Link>
		</div>
	);
}

/** Branded 404 — every page needs a way back. */

import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function NotFound() {
	return (
		<div className="relative flex min-h-dvh flex-col items-center justify-center px-5 text-center">
			<Logo size={40} />
			<div className="kicker mt-6">404</div>
			<h1 className="display mt-2 text-3xl font-semibold">
				This page is off the spectrum
			</h1>
			<p
				className="mt-3 max-w-md text-sm leading-relaxed"
				style={{ color: "var(--ink-2)" }}
			>
				The route you asked for does not exist. Your CSV is probably waiting on
				the landing page.
			</p>
			<Link to="/" className="btn mt-6 inline-block no-underline">
				Back to the observatory
			</Link>
		</div>
	);
}

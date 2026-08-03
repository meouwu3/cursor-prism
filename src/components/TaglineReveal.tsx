/**
 * Tagline reveal: the section's words start muted (~30% ink) and each
 * word crosses to full color individually as it scrolls past the
 * trigger line — IntersectionObserver per word, never a scroll listener.
 */

import { Fragment, useEffect, useRef, useState } from "react";

function Word({ children }: { children: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	const [on, setOn] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setOn(true);
					io.disconnect();
				}
			},
			// Trigger line sits below the vertical center of the viewport
			{ rootMargin: "0px 0px -20% 0px", threshold: 0.1 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);

	return (
		<span
			ref={ref}
			aria-hidden="true"
			className="inline-block"
			style={{
				color: on
					? "var(--ink)"
					: "color-mix(in srgb, var(--ink) 30%, transparent)",
				transition: "color 0.7s var(--ease)",
			}}
		>
			{children}
		</span>
	);
}

export function TaglineReveal({
	text,
	className = "",
}: {
	text: string;
	className?: string;
}) {
	const words = text.split(" ");
	return (
		<p className={className}>
			<span className="sr-only">{text}</span>
			{words.map((w, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static copy, order never changes
				<Fragment key={`${i}-${w}`}>
					<Word>{w}</Word>
					{i < words.length - 1 ? " " : null}
				</Fragment>
			))}
		</p>
	);
}

/** Shared UI primitives: motion hooks, size measurement, panels and titles. */

import {
	type CSSProperties,
	type ReactNode,
	type RefObject,
	useEffect,
	useRef,
	useState,
} from "react";

/** Rolling-number animation; returns the current frame value. */
export function useCountUp(target: number, duration = 1300): number {
	const [value, setValue] = useState(0);
	useEffect(() => {
		let raf = 0;
		const t0 = performance.now();
		const tick = (t: number) => {
			const p = Math.min(1, (t - t0) / duration);
			const eased = 1 - (1 - p) ** 4;
			setValue(target * eased);
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [target, duration]);
	return value;
}

/** Observe container size for responsive SVG / Canvas rendering. */
export function useContainerSize<T extends HTMLElement>(): [
	RefObject<T | null>,
	{ width: number; height: number },
] {
	const ref = useRef<T>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const ro = new ResizeObserver((entries) => {
			const rect = entries[0].contentRect;
			setSize({ width: rect.width, height: rect.height });
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	return [ref, size];
}

/** Whether the client has mounted (SSR-safe gate for browser-only APIs). */
export function useMounted(): boolean {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	return mounted;
}

/** One-shot IntersectionObserver visibility flag for scroll reveals. */
export function useInView<T extends HTMLElement>(): [
	RefObject<T | null>,
	boolean,
] {
	const ref = useRef<T>(null);
	const [inView, setInView] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		// Already scrolled past (scroll restoration, anchor jump) —
		// never trap content in the hidden state
		if (el.getBoundingClientRect().bottom < 0) {
			setInView(true);
			return;
		}
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setInView(true);
					io.disconnect();
				}
			},
			// Fire a little before the element fully enters, so the reveal
			// reads as an arrival rather than a late pop
			{ rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);
	return [ref, inView];
}

/** Scroll-driven reveal: heavy fade up with blur, staggered via --d. */
export function Reveal({
	children,
	className = "",
	style,
	delay = 0,
}: {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
	delay?: number;
}) {
	const [ref, inView] = useInView<HTMLDivElement>();
	return (
		<div
			ref={ref}
			className={`reveal${inView ? " reveal-on" : ""} ${className}`}
			style={{ ...style, "--d": `${delay}ms` } as CSSProperties}
		>
			{children}
		</div>
	);
}

export function SectionTitle({
	eyebrow,
	title,
	desc,
	delay = 0,
}: {
	eyebrow: string;
	title: string;
	desc?: string;
	delay?: number;
}) {
	return (
		<div className="rise mb-5" style={{ "--d": `${delay}ms` } as CSSProperties}>
			<div className="kicker mb-1.5">{eyebrow}</div>
			<h2 className="display text-xl font-semibold">{title}</h2>
			{desc ? (
				<p
					className="mt-1 text-sm leading-relaxed"
					style={{ color: "var(--ink-2)" }}
				>
					{desc}
				</p>
			) : null}
		</div>
	);
}

export function Card({
	children,
	className = "",
	style,
}: {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}) {
	// Cursor position feeds the blueprint spotlight border (--mx / --my);
	// written straight to the node so no re-render is involved
	const track = (e: React.PointerEvent<HTMLDivElement>) => {
		const r = e.currentTarget.getBoundingClientRect();
		e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
		e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
	};
	return (
		<div className={`panel ${className}`} style={style} onPointerMove={track}>
			<div aria-hidden="true" className="panel-spot" />
			{children}
		</div>
	);
}

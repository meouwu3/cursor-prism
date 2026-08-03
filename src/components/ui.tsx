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

/** Scroll-driven reveal: heavy fade up with blur, staggered via --d.
   32px of travel — the blur carries the weight, not the distance. */
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
	// Hidden state is applied only until the element enters the viewport —
	// never fight utility ordering with a permanent "on" counterpart
	return (
		<div
			ref={ref}
			className={`transition-[opacity,translate,filter] duration-900 ease-(--ease) [transition-delay:var(--d,0ms)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-none motion-reduce:transition-none${inView ? "" : " translate-y-8 opacity-0 blur-sm"} ${className}`}
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
		<div
			className="mb-5 animate-rise [animation-delay:var(--d,0ms)] motion-reduce:animate-none"
			style={{ "--d": `${delay}ms` } as CSSProperties}
		>
			<div className="mb-1.5 font-mono text-xs tracking-[0.06em] text-ink-3">
				{eyebrow}
			</div>
			<h2 className="font-display text-balance text-xl font-semibold tracking-[-0.015em] text-ink blueprint:tracking-[-0.04em]">
				{title}
			</h2>
			{desc ? (
				<p className="mt-1 text-sm leading-relaxed text-ink-2">{desc}</p>
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
	// Ruled section on paper (top hairline), hairline box with corner
	// ticks and a tinted shadow on blueprint
	const frame =
		"group/panel relative rounded-xs border-line bg-bg-2 print:rounded-none print:border-t print:border-t-line-strong print:bg-transparent blueprint:border blueprint:bg-[rgba(234,241,255,0.04)] blueprint:shadow-[0_16px_40px_-16px_rgba(4,16,40,0.45)] blueprint:before:pointer-events-none blueprint:before:absolute blueprint:before:-top-px blueprint:before:-left-px blueprint:before:size-2.5 blueprint:before:border-t blueprint:before:border-l blueprint:before:border-line-strong blueprint:before:content-[''] blueprint:after:pointer-events-none blueprint:after:absolute blueprint:after:-right-px blueprint:after:-bottom-px blueprint:after:size-2.5 blueprint:after:border-b blueprint:after:border-r blueprint:after:border-line-strong blueprint:after:content-['']";
	return (
		<div
			className={`${frame} ${className}`}
			style={style}
			onPointerMove={track}
		>
			{/* Spotlight: the hairline illuminates under the cursor. A radial
			    gradient masked down to the 1px border ring; print stays matte.
			    Longhands only — a mask shorthand would reset the composite. */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 hidden rounded-[inherit] p-px opacity-0 transition-opacity duration-450 ease-(--ease) group-hover/panel:opacity-100 blueprint:block [background:radial-gradient(150px_circle_at_var(--mx,50%)_var(--my,50%),color-mix(in_srgb,var(--accent)_60%,transparent),transparent_70%)] [mask-image:linear-gradient(#000_0_0),linear-gradient(#000_0_0)] [mask-clip:content-box,border-box] [mask-composite:exclude] [-webkit-mask-image:linear-gradient(#000_0_0),linear-gradient(#000_0_0)] [-webkit-mask-clip:content-box,border-box] [-webkit-mask-composite:xor]"
			/>
			{children}
		</div>
	);
}

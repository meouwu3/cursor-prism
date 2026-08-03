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
			<div className="num mb-1.5 text-[11px] uppercase tracking-[0.3em] text-cyan-300/70">
				{eyebrow}
			</div>
			<h2 className="text-xl font-semibold text-white/95">{title}</h2>
			{desc ? (
				<p className="mt-1 text-[13px] leading-relaxed text-slate-400">
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
	return (
		<div className={`glass ${className}`} style={style}>
			{children}
		</div>
	);
}

/**
 * Usage trend chart: area + smoothed line + 7-day moving-average
 * reference. Hand-rolled SVG; the draw-in animation uses the pathLength
 * trick, and hovering shows a crosshair with a detail tooltip.
 */

import { useMemo, useState } from "react";
import type { DayPoint } from "#/lib/analytics";
import { formatCost, formatDayShort, formatTokens } from "#/lib/format";
import { useContainerSize } from "../ui";

type Mode = "tokens" | "cost";

const ML = 52;
const MR = 14;
const MT = 14;
const MB = 30;

/** Catmull-Rom to cubic bezier conversion for a smooth curve. */
function smoothPath(pts: [number, number][]): string {
	if (pts.length < 2) return pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : "";
	let d = `M ${pts[0][0]} ${pts[0][1]}`;
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[Math.max(0, i - 1)];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[Math.min(pts.length - 1, i + 2)];
		const c1x = p1[0] + (p2[0] - p0[0]) / 6;
		const c1y = p1[1] + (p2[1] - p0[1]) / 6;
		const c2x = p2[0] - (p3[0] - p1[0]) / 6;
		const c2y = p2[1] - (p3[1] - p1[1]) / 6;
		d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
	}
	return d;
}

export function TimelineChart({
	points,
	mode,
	height = 300,
}: {
	points: DayPoint[];
	mode: Mode;
	height?: number;
}) {
	const [wrapRef, { width }] = useContainerSize<HTMLDivElement>();
	const [hover, setHover] = useState<number | null>(null);
	const [drawn, setDrawn] = useState(false);

	const values = useMemo(
		() => points.map((p) => (mode === "tokens" ? p.tokens : p.cost)),
		[points, mode],
	);

	const geo = useMemo(() => {
		if (width < 80 || points.length === 0) return null;
		const w = width;
		const h = height;
		const max = Math.max(...values, mode === "cost" ? 0.01 : 1);
		const n = points.length;
		const x = (i: number) =>
			n === 1 ? ML + (w - ML - MR) / 2 : ML + (i / (n - 1)) * (w - ML - MR);
		const y = (v: number) => MT + (1 - v / max) * (h - MT - MB);
		const pts = values.map((v, i) => [x(i), y(v)] as [number, number]);
		const line = smoothPath(pts);
		const area = `${line} L ${x(n - 1)} ${h - MB} L ${x(0)} ${h - MB} Z`;
		// 7-day moving average
		const avg = values.map((_, i) => {
			const from = Math.max(0, i - 6);
			const slice = values.slice(from, i + 1);
			return slice.reduce((a, b) => a + b, 0) / slice.length;
		});
		const avgLine = smoothPath(
			avg.map((v, i) => [x(i), y(v)] as [number, number]),
		);
		const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => ({
			v: max * r,
			y: y(max * r),
		}));
		// At most 8 x-axis ticks
		const step = Math.max(1, Math.ceil(n / 8));
		const xTicks = points
			.filter((_, i) => i % step === 0)
			.map((p) => ({
				label: formatDayShort(p.date),
				x: x(points.indexOf(p)),
			}));
		return { w, h, x, y, pts, line, area, avgLine, yTicks, xTicks, max };
	}, [width, points, values, mode, height]);

	// Trigger the draw-in animation after mount
	if (geo && !drawn) requestAnimationFrame(() => setDrawn(true));

	const accent = mode === "tokens" ? "#67e8f9" : "#f0abfc";
	const fmt = mode === "tokens" ? formatTokens : formatCost;

	const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
		if (!geo || points.length === 0) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		let best = 0;
		let bestDist = Number.POSITIVE_INFINITY;
		for (let i = 0; i < points.length; i++) {
			const d = Math.abs(geo.x(i) - mx);
			if (d < bestDist) {
				bestDist = d;
				best = i;
			}
		}
		setHover(best);
	};

	return (
		<div ref={wrapRef} className="relative w-full" style={{ height }}>
			{geo ? (
				<svg
					width={geo.w}
					height={geo.h}
					className="block"
					onMouseMove={onMove}
					onMouseLeave={() => setHover(null)}
					role="img"
					aria-label="Usage trend chart"
				>
					<defs>
						<linearGradient id={`tl-fill-${mode}`} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stopColor={accent} stopOpacity="0.32" />
							<stop offset="1" stopColor={accent} stopOpacity="0" />
						</linearGradient>
					</defs>

					{/* Horizontal grid lines */}
					{geo.yTicks.map((t) => (
						<g key={t.v}>
							<line
								x1={ML}
								x2={geo.w - MR}
								y1={t.y}
								y2={t.y}
								stroke="rgba(148,163,255,0.08)"
								strokeDasharray="3 5"
							/>
							<text
								x={ML - 8}
								y={t.y + 4}
								textAnchor="end"
								fontSize="10"
								fill="rgba(148,163,255,0.45)"
								fontFamily="var(--font-mono)"
							>
								{fmt(t.v)}
							</text>
						</g>
					))}

					{/* Area fill */}
					<path
						d={geo.area}
						fill={`url(#tl-fill-${mode})`}
						className="fade-in"
						style={{ "--d": "300ms" } as React.CSSProperties}
					/>

					{/* Moving-average reference */}
					<path
						d={geo.avgLine}
						fill="none"
						stroke="rgba(226,232,255,0.28)"
						strokeWidth="1.2"
						strokeDasharray="4 5"
					/>

					{/* Main line (draw-in animation) */}
					<path
						d={geo.line}
						fill="none"
						stroke={accent}
						strokeWidth="2.2"
						strokeLinecap="round"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={drawn ? 0 : 1}
						style={{
							transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)",
							filter: `drop-shadow(0 0 6px ${accent}66)`,
						}}
					/>

					{/* X-axis ticks */}
					{geo.xTicks.map((t) => (
						<text
							key={t.label + t.x}
							x={t.x}
							y={geo.h - 8}
							textAnchor="middle"
							fontSize="10"
							fill="rgba(148,163,255,0.45)"
							fontFamily="var(--font-mono)"
						>
							{t.label}
						</text>
					))}

					{/* Markers for very sparse series (a lone point draws no line) */}
					{geo.pts.length <= 3
						? geo.pts.map(([cx, cy]) => (
								<circle
									key={`${cx}-${cy}`}
									cx={cx}
									cy={cy}
									r="5.5"
									fill={accent}
									stroke="#05050e"
									strokeWidth="2"
									opacity={drawn ? 1 : 0}
									style={{
										transition: "opacity 0.6s ease 0.6s",
										filter: `drop-shadow(0 0 8px ${accent})`,
									}}
								/>
							))
						: null}

					{/* Hover crosshair */}
					{hover !== null && geo.pts[hover] ? (
						<g>
							<line
								x1={geo.pts[hover][0]}
								x2={geo.pts[hover][0]}
								y1={MT}
								y2={geo.h - MB}
								stroke="rgba(226,232,255,0.3)"
								strokeDasharray="2 3"
							/>
							<circle
								cx={geo.pts[hover][0]}
								cy={geo.pts[hover][1]}
								r="4.5"
								fill={accent}
								stroke="#05050e"
								strokeWidth="2"
							/>
						</g>
					) : null}
				</svg>
			) : null}

			{/* Hover detail */}
			{hover !== null && geo && points[hover] ? (
				<div
					className="chart-tip"
					style={{
						left: Math.min(Math.max(geo.pts[hover][0] - 70, 4), geo.w - 168),
						top: Math.max(geo.pts[hover][1] - 96, 0),
					}}
				>
					<div className="num text-[11px] text-slate-400">
						{points[hover].key}
					</div>
					<div
						className="num text-[13px] font-semibold"
						style={{ color: accent }}
					>
						{fmt(values[hover])}
						<span className="ml-1.5 font-normal text-slate-500">
							{mode === "tokens" ? "tokens" : "spent"}
						</span>
					</div>
					<div className="num text-[11px] text-slate-500">
						{points[hover].count} requests
					</div>
				</div>
			) : null}
		</div>
	);
}

/**
 * Token Galaxy: a hand-rolled 3D perspective-projected particle cloud.
 * Each particle is one request — x: time, y: log(token volume),
 * z: model dimension. Rendered with Canvas 2D and pre-baked glow
 * sprites; drag to rotate, hover to inspect. Zero dependencies.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { paletteAt } from "#/lib/colors";
import type { UsageRow } from "#/lib/csv";
import { formatCost, formatDateTime, formatTokens } from "#/lib/format";
import { useContainerSize, useMounted } from "../ui";

interface Particle {
	x: number;
	y: number;
	z: number;
	size: number;
	color: string;
	row: UsageRow;
}

function makeSprite(color: string): HTMLCanvasElement | null {
	const s = 64;
	const c = document.createElement("canvas");
	c.width = s;
	c.height = s;
	const ctx = c.getContext("2d");
	if (!ctx) return null;
	const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
	g.addColorStop(0, "rgba(255,255,255,0.95)");
	g.addColorStop(0.25, color);
	g.addColorStop(1, "transparent");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, s, s);
	return c;
}

export function Galaxy({ rows }: { rows: UsageRow[] }) {
	const [wrapRef, { width, height }] = useContainerSize<HTMLDivElement>();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const mounted = useMounted();
	const [tip, setTip] = useState<{
		x: number;
		y: number;
		row: UsageRow;
		color: string;
	} | null>(null);

	const drag = useRef({ active: false, lastX: 0, lastY: 0 });
	const angles = useRef({ yaw: 0.6, pitch: -0.42 });
	const mouse = useRef({ x: -1, y: -1 });
	const tipRef = useRef<typeof tip>(null);

	const { particles, models } = useMemo(() => {
		const models = [...new Set(rows.map((r) => r.model))];
		const maxT = Math.max(...rows.map((r) => r.totalTokens), 1);
		const t0 = rows[0]?.date.getTime() ?? 0;
		const t1 = rows[rows.length - 1]?.date.getTime() ?? 1;
		const span = Math.max(t1 - t0, 1);
		const particles: Particle[] = rows.map((r) => ({
			x: ((r.date.getTime() - t0) / span) * 2 - 1,
			y: Math.log1p(r.totalTokens) / Math.log1p(maxT),
			z:
				models.length > 1
					? (models.indexOf(r.model) / (models.length - 1)) * 2 - 1
					: 0,
			size: 4 + 14 * Math.sqrt(r.totalTokens / maxT),
			color: paletteAt(models.indexOf(r.model)),
			row: r,
		}));
		return { particles, models };
	}, [rows]);

	useEffect(() => {
		if (!mounted || width < 60 || height < 60) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);

		const sprites = new Map<string, HTMLCanvasElement>();
		for (const m of models) {
			const color = paletteAt(models.indexOf(m));
			const sprite = makeSprite(color);
			if (sprite) sprites.set(color, sprite);
		}

		let raf = 0;
		const FOCAL = 3.2;

		const project = (p: { x: number; y: number; z: number }) => {
			const { yaw, pitch } = angles.current;
			const cy1 = Math.cos(yaw);
			const sy1 = Math.sin(yaw);
			const x1 = p.x * cy1 + p.z * sy1;
			const z1 = -p.x * sy1 + p.z * cy1;
			const y1 = p.y - 0.45;
			const cp = Math.cos(pitch);
			const sp = Math.sin(pitch);
			const y2 = y1 * cp - z1 * sp;
			const z2 = y1 * sp + z1 * cp;
			const persp = FOCAL / (FOCAL + z2);
			const R = Math.min(width, height) * 0.42;
			return {
				sx: width / 2 + x1 * R * persp,
				sy: height / 2 - y2 * R * persp,
				depth: z2,
				persp,
			};
		};

		const frame = () => {
			if (!drag.current.active) angles.current.yaw += 0.0016;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, width, height);

			// ---- Floor grid ----
			ctx.lineWidth = 1;
			const gridLines: [number, number, number, number, number, number][] = [];
			for (let i = -4; i <= 4; i++) {
				const t = i / 4;
				gridLines.push([t, 0, -1, t, 0, 1]); // along z
				gridLines.push([-1, 0, t, 1, 0, t]); // along x
			}
			for (const [x1, y1, z1, x2, y2, z2] of gridLines) {
				const a = project({ x: x1, y: y1, z: z1 });
				const b = project({ x: x2, y: y2, z: z2 });
				const alpha = 0.05 + 0.06 * Math.min(a.persp, b.persp);
				ctx.strokeStyle = `rgba(148,163,255,${alpha})`;
				ctx.beginPath();
				ctx.moveTo(a.sx, a.sy);
				ctx.lineTo(b.sx, b.sy);
				ctx.stroke();
			}

			// ---- Particles (depth sorted, far first) ----
			const projected = particles.map((p) => ({ p, pr: project(p) }));
			projected.sort((a, b) => b.pr.depth - a.pr.depth);

			let nearest: { x: number; y: number; p: Particle; dist: number } | null =
				null;

			for (const { p, pr } of projected) {
				const size = p.size * pr.persp;
				const sprite = sprites.get(p.color);
				if (!sprite) continue;
				ctx.globalAlpha = Math.max(0.12, Math.min(1, (pr.persp - 0.72) * 2.2));
				ctx.drawImage(sprite, pr.sx - size / 2, pr.sy - size / 2, size, size);

				// Hover detection (nearest neighbor in screen space)
				const dx = pr.sx - mouse.current.x;
				const dy = pr.sy - mouse.current.y;
				const dist = Math.hypot(dx, dy);
				if (dist < 18 && (!nearest || dist < nearest.dist)) {
					nearest = { x: pr.sx, y: pr.sy, p, dist };
				}
			}
			ctx.globalAlpha = 1;

			// ---- Hover highlight ----
			if (nearest && !drag.current.active) {
				const { x, y, p } = nearest;
				const { row, color } = p;
				ctx.strokeStyle = color;
				ctx.lineWidth = 1.2;
				ctx.beginPath();
				ctx.arc(x, y, 10, 0, Math.PI * 2);
				ctx.stroke();
				// Light beam down to the floor
				const floor = project({ x: p.x, y: 0, z: p.z });
				ctx.strokeStyle = `${color}55`;
				ctx.setLineDash([3, 4]);
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.lineTo(floor.sx, floor.sy);
				ctx.stroke();
				ctx.setLineDash([]);
				if (!tipRef.current || tipRef.current.row !== row) {
					tipRef.current = { x, y, row, color };
					setTip(tipRef.current);
				}
			} else if (tipRef.current) {
				tipRef.current = null;
				setTip(null);
			}

			raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(raf);
	}, [mounted, width, height, particles, models]);

	const onPointerDown = (e: React.PointerEvent) => {
		drag.current = { active: true, lastX: e.clientX, lastY: e.clientY };
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	};
	const onPointerMove = (e: React.PointerEvent) => {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
		if (!drag.current.active) return;
		const dx = e.clientX - drag.current.lastX;
		const dy = e.clientY - drag.current.lastY;
		angles.current.yaw += dx * 0.006;
		angles.current.pitch = Math.max(
			-1.15,
			Math.min(0.5, angles.current.pitch + dy * 0.004),
		);
		drag.current.lastX = e.clientX;
		drag.current.lastY = e.clientY;
	};
	const onPointerUp = () => {
		drag.current.active = false;
	};
	const onLeave = () => {
		mouse.current = { x: -1, y: -1 };
		drag.current.active = false;
	};

	return (
		<div
			ref={wrapRef}
			className="relative h-full w-full cursor-grab touch-none overflow-hidden rounded-[18px] active:cursor-grabbing"
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerLeave={onLeave}
		>
			{mounted ? (
				<canvas ref={canvasRef} style={{ width, height }} className="block" />
			) : null}

			{/* Legend */}
			<div className="pointer-events-none absolute top-3.5 right-4 flex flex-col items-end gap-1.5">
				{models.map((m, i) => (
					<span
						key={m}
						className="flex items-center gap-1.5 text-[11px] text-slate-400"
					>
						{m}
						<span
							className="h-2 w-2 rounded-full"
							style={{
								background: paletteAt(i),
								boxShadow: `0 0 6px ${paletteAt(i)}`,
							}}
						/>
					</span>
				))}
			</div>

			{/* Interaction hint */}
			<div className="num pointer-events-none absolute bottom-3 left-4 text-[10.5px] uppercase tracking-[0.25em] text-slate-600">
				drag to rotate · hover to inspect
			</div>

			{/* Hover detail */}
			{tip ? (
				<div
					className="chart-tip"
					style={{
						left: Math.min(tip.x + 16, width - 210),
						top: Math.max(tip.y - 90, 8),
					}}
				>
					<div className="num text-[11px] text-slate-400">
						{formatDateTime(tip.row.date)}
					</div>
					<div
						className="num text-[13px] font-semibold"
						style={{ color: tip.color }}
					>
						{formatTokens(tip.row.totalTokens)}
						<span className="ml-1.5 font-normal text-slate-500">tokens</span>
					</div>
					<div className="num text-[11px] text-slate-500">
						{tip.row.model} · {formatCost(tip.row.cost)}
					</div>
				</div>
			) : null}
		</div>
	);
}

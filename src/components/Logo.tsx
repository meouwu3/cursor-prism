/**
 * Cursor Prism mark: a beam refracted into a spectrum.
 * On mount it draws itself like a signature — beam first, then the
 * prism, then the refracted rays fan out. Pure stroke-dashoffset,
 * colored from currentColor + the theme accent so it sits correctly
 * on paper, on near-black, and on blueprint blue.
 */
export function Logo({ size = 34 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 48 48"
			fill="none"
			role="img"
			aria-label="Cursor Prism"
			className="text-ink"
		>
			<title>Cursor Prism</title>
			{/* Incoming beam */}
			<path
				d="M2 20 L18 24"
				pathLength={1}
				className="animate-logo-draw [stroke-dasharray:1] [stroke-dashoffset:1] [animation-delay:var(--d,0ms)] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
				style={{ "--d": "0ms", "--dd": "450ms" } as React.CSSProperties}
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				opacity="0.55"
			/>
			{/* The prism */}
			<path
				d="M24 8 L36 36 L12 36 Z"
				pathLength={1}
				className="animate-logo-draw [stroke-dasharray:1] [stroke-dashoffset:1] [animation-delay:var(--d,0ms)] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
				style={{ "--d": "250ms", "--dd": "1000ms" } as React.CSSProperties}
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinejoin="round"
			/>
			{/* Refraction tick */}
			<path
				d="M20 22 L28 26"
				pathLength={1}
				className="animate-logo-draw [stroke-dasharray:1] [stroke-dashoffset:1] [animation-delay:var(--d,0ms)] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
				style={{ "--d": "1000ms", "--dd": "350ms" } as React.CSSProperties}
				stroke="currentColor"
				strokeWidth="1"
				strokeLinecap="round"
				opacity="0.5"
			/>
			{/* Refracted spectrum, fanning out */}
			<path
				d="M30 22 L46 14"
				pathLength={1}
				className="animate-logo-draw [stroke-dasharray:1] [stroke-dashoffset:1] [animation-delay:var(--d,0ms)] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
				style={{ "--d": "950ms", "--dd": "500ms" } as React.CSSProperties}
				stroke="var(--accent)"
				strokeWidth="1.8"
				strokeLinecap="round"
			/>
			<path
				d="M30 24 L46 21"
				pathLength={1}
				className="animate-logo-draw [stroke-dasharray:1] [stroke-dashoffset:1] [animation-delay:var(--d,0ms)] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
				style={{ "--d": "1050ms", "--dd": "500ms" } as React.CSSProperties}
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				opacity="0.85"
			/>
			<path
				d="M30 26 L46 28"
				pathLength={1}
				className="animate-logo-draw [stroke-dasharray:1] [stroke-dashoffset:1] [animation-delay:var(--d,0ms)] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
				style={{ "--d": "1150ms", "--dd": "500ms" } as React.CSSProperties}
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				opacity="0.5"
			/>
			<path
				d="M30 28 L46 35"
				pathLength={1}
				className="animate-logo-draw [stroke-dasharray:1] [stroke-dashoffset:1] [animation-delay:var(--d,0ms)] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
				style={{ "--d": "1250ms", "--dd": "500ms" } as React.CSSProperties}
				stroke="var(--accent)"
				strokeWidth="1.8"
				strokeLinecap="round"
				opacity="0.65"
			/>
		</svg>
	);
}

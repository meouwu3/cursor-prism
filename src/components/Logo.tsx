/**
 * CursorPrism mark: a beam refracted into a spectrum.
 * Drawn entirely in currentColor + the theme accent, so it sits
 * correctly on paper, on near-black, and on blueprint blue.
 */
export function Logo({ size = 34 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 48 48"
			fill="none"
			role="img"
			aria-label="CursorPrism"
			style={{ color: "var(--ink)" }}
		>
			<title>CursorPrism</title>
			{/* Incoming beam */}
			<line
				x1="2"
				y1="20"
				x2="18"
				y2="24"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				opacity="0.55"
			/>
			{/* Refracted spectrum */}
			<line
				x1="30"
				y1="22"
				x2="46"
				y2="14"
				stroke="var(--accent)"
				strokeWidth="1.8"
				strokeLinecap="round"
			/>
			<line
				x1="30"
				y1="24"
				x2="46"
				y2="21"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				opacity="0.85"
			/>
			<line
				x1="30"
				y1="26"
				x2="46"
				y2="28"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				opacity="0.5"
			/>
			<line
				x1="30"
				y1="28"
				x2="46"
				y2="35"
				stroke="var(--accent)"
				strokeWidth="1.8"
				strokeLinecap="round"
				opacity="0.65"
			/>
			{/* The prism */}
			<path
				d="M24 8 L36 36 L12 36 Z"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinejoin="round"
			/>
			<path
				d="M20 22 L28 26"
				stroke="currentColor"
				strokeWidth="1"
				strokeLinecap="round"
				opacity="0.5"
			/>
		</svg>
	);
}

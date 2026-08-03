/** CursorPrism mark: a beam of white light refracted into a spectrum. */
export function Logo({ size = 34 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 48 48"
			fill="none"
			role="img"
			aria-label="CursorPrism"
		>
			<title>CursorPrism</title>
			<defs>
				<linearGradient id="prism-edge" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#67e8f9" />
					<stop offset="0.5" stopColor="#a5b4fc" />
					<stop offset="1" stopColor="#f0abfc" />
				</linearGradient>
			</defs>
			{/* Incoming beam */}
			<line
				x1="2"
				y1="20"
				x2="18"
				y2="24"
				stroke="#e2e8f0"
				strokeWidth="1.6"
				strokeLinecap="round"
				opacity="0.85"
			/>
			{/* Refracted spectrum */}
			<line
				x1="30"
				y1="22"
				x2="46"
				y2="14"
				stroke="#67e8f9"
				strokeWidth="1.8"
				strokeLinecap="round"
			/>
			<line
				x1="30"
				y1="24"
				x2="46"
				y2="21"
				stroke="#a5b4fc"
				strokeWidth="1.8"
				strokeLinecap="round"
			/>
			<line
				x1="30"
				y1="26"
				x2="46"
				y2="28"
				stroke="#f0abfc"
				strokeWidth="1.8"
				strokeLinecap="round"
			/>
			<line
				x1="30"
				y1="28"
				x2="46"
				y2="35"
				stroke="#fcd34d"
				strokeWidth="1.8"
				strokeLinecap="round"
			/>
			{/* The prism */}
			<path
				d="M24 8 L36 36 L12 36 Z"
				fill="rgba(148,163,255,0.08)"
				stroke="url(#prism-edge)"
				strokeWidth="1.6"
				strokeLinejoin="round"
			/>
			<path
				d="M20 22 L28 26"
				stroke="rgba(255,255,255,0.5)"
				strokeWidth="1"
				strokeLinecap="round"
			/>
		</svg>
	);
}

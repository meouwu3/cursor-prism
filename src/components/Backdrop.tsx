/** Site-wide deep-space ambience: grid + drifting glow orbs. */
export function Backdrop() {
	return (
		<div
			aria-hidden
			className="pointer-events-none fixed inset-0 overflow-hidden"
		>
			<div className="grid-bg absolute inset-0" />
			<div
				className="orb orb-a"
				style={{
					width: 560,
					height: 560,
					top: "-12%",
					left: "-8%",
					background:
						"radial-gradient(circle, rgba(34,211,238,0.16), transparent 65%)",
				}}
			/>
			<div
				className="orb orb-b"
				style={{
					width: 640,
					height: 640,
					top: "18%",
					right: "-14%",
					background:
						"radial-gradient(circle, rgba(167,139,250,0.15), transparent 65%)",
				}}
			/>
			<div
				className="orb orb-a"
				style={{
					width: 480,
					height: 480,
					bottom: "-18%",
					left: "30%",
					background:
						"radial-gradient(circle, rgba(240,171,252,0.1), transparent 65%)",
					animationDelay: "-8s",
				}}
			/>
			{/* Top highlight beam */}
			<div
				className="absolute inset-x-0 top-0 h-px"
				style={{
					background:
						"linear-gradient(90deg, transparent, rgba(103,232,249,0.4), transparent)",
				}}
			/>
		</div>
	);
}

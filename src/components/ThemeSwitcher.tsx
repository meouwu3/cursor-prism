/**
 * Theme switcher: mini swatches previewing each design language.
 * The switch fires a circular View-Transition reveal from the click point.
 *
 * The active state is only rendered after mount: SSR always renders the
 * default theme while the bootstrap script may have flipped data-theme
 * pre-paint, so rendering pressed-state pre-hydration would mismatch.
 */

import { THEMES, useTheme } from "#/lib/theme";
import { useMounted } from "./ui";

export function ThemeSwitcher() {
	const { theme, switchTheme } = useTheme();
	const mounted = useMounted();

	return (
		<div
			className="theme-switch flex h-8 items-center gap-1 border px-1"
			style={{
				borderColor: "var(--line)",
				borderRadius: "var(--radius)",
			}}
		>
			{THEMES.map((t) => {
				const active = mounted && t.id === theme;
				return (
					<button
						key={t.id}
						type="button"
						title={t.label}
						disabled={!mounted}
						onClick={(e) => switchTheme(t.id, e.clientX, e.clientY)}
						className="flex cursor-pointer items-center gap-1.5 px-1.5 py-1"
						style={{ borderRadius: "calc(var(--radius) - 1px)" }}
					>
						<span
							className="block h-3.5 w-3.5 rounded-full border"
							style={{
								background: t.swatch.bg,
								borderColor: t.swatch.line,
								boxShadow: `inset 2px -2px 0 0 ${t.swatch.accent}`,
							}}
						/>
						<span
							className="num hidden text-xs sm:block"
							style={{ color: active ? "var(--ink)" : "var(--ink-3)" }}
						>
							{t.label}
						</span>
					</button>
				);
			})}
		</div>
	);
}

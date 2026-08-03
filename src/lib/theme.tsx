/**
 * Theme system: two full design languages sharing one semantic token
 * set — Print (editorial paper) and Blueprint (technical drawing).
 *
 * - Colors/textures live as CSS variables keyed off <html data-theme>.
 * - Chart/canvas colors (which need concrete values, not CSS vars)
 *   live in CHART_TOKENS and reach components via useChartTokens().
 * - Switching uses the View Transitions API with a circular reveal
 *   from the click point, degrading to an instant swap.
 * - The no-flash inline script (THEME_BOOTSTRAP) runs before first
 *   paint and restores the saved choice.
 */

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { flushSync } from "react-dom";

export type ThemeId = "print" | "blueprint";

export const THEME_STORAGE_KEY = "cursor-prism:theme";

export const THEMES: {
	id: ThemeId;
	label: string;
	/** Mini swatch shown in the switcher: page bg, hairline, accent */
	swatch: { bg: string; line: string; accent: string };
}[] = [
	{
		id: "print",
		label: "Print",
		swatch: { bg: "#F6F4EE", line: "#DDD9CB", accent: "#D9481C" },
	},
	{
		id: "blueprint",
		label: "Blueprint",
		swatch: { bg: "#113C82", line: "#4A6DB4", accent: "#FFD447" },
	},
];

/** Concrete colors for SVG/Canvas rendering, per theme. */
export interface ChartTokens {
	/** Page background (donut separators, marker strokes) */
	bg: string;
	/** Ordered model palette */
	palette: string[];
	/** Hairline grid stroke */
	grid: string;
	/** Axis tick text */
	axis: string;
	/** Area fill gradient stops for the main series */
	areaFrom: string;
	areaTo: string;
	/** Moving-average reference line */
	avg: string;
	/** Hover crosshair */
	cross: string;
	/** Accent used for series line, markers, hover rings */
	accent: string;
}

export const CHART_TOKENS: Record<ThemeId, ChartTokens> = {
	print: {
		bg: "#F6F4EE",
		palette: [
			"#1B1A16",
			"#D9481C",
			"#0D6E5F",
			"#B98A0C",
			"#3D5A99",
			"#7A4E8E",
			"#A06B32",
			"#C05A78",
		],
		grid: "rgba(27,26,22,0.10)",
		axis: "rgba(27,26,22,0.48)",
		areaFrom: "rgba(217,72,28,0.13)",
		areaTo: "rgba(217,72,28,0)",
		avg: "rgba(27,26,22,0.35)",
		cross: "rgba(27,26,22,0.35)",
		accent: "#D9481C",
	},
	blueprint: {
		bg: "#113C82",
		palette: [
			"#FFFFFF",
			"#FFD447",
			"#A8C3F2",
			"#7FA3E0",
			"#D8E4FA",
			"#5B84CC",
			"#8FB5EE",
			"#C9D9F5",
		],
		grid: "rgba(234,241,255,0.16)",
		axis: "rgba(234,241,255,0.55)",
		areaFrom: "rgba(255,255,255,0.13)",
		areaTo: "rgba(255,255,255,0)",
		avg: "rgba(234,241,255,0.40)",
		cross: "rgba(255,212,71,0.65)",
		accent: "#FFFFFF",
	},
};

/** Stable per-model palette index (same model → same slot). */
export function paletteIndex(model: string, length: number): number {
	let h = 5381;
	for (let i = 0; i < model.length; i++) h = (h * 33) ^ model.charCodeAt(i);
	return (h >>> 0) % length;
}

// ---------------------------------------------------------------------------

interface ThemeContextValue {
	theme: ThemeId;
	/** Switch theme; pass click coordinates for the circular reveal. */
	switchTheme: (id: ThemeId, x?: number, y?: number) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
	theme: "print",
	switchTheme: () => {},
});

export function useTheme(): ThemeContextValue {
	return useContext(ThemeContext);
}

export function useChartTokens(): ChartTokens {
	return CHART_TOKENS[useContext(ThemeContext).theme];
}

function isThemeId(v: unknown): v is ThemeId {
	return v === "print" || v === "blueprint";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<ThemeId>(() => {
		if (typeof document === "undefined") return "print";
		const attr = document.documentElement.dataset.theme;
		return isThemeId(attr) ? attr : "print";
	});

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		try {
			window.localStorage.setItem(THEME_STORAGE_KEY, theme);
		} catch {
			// private mode — session-only theme is fine
		}
	}, [theme]);

	const switchTheme = (id: ThemeId, x?: number, y?: number) => {
		if (id === theme) return;
		const doc = document;
		const apply = () => flushSync(() => setTheme(id));
		if (
			typeof doc.startViewTransition === "function" &&
			x !== undefined &&
			y !== undefined
		) {
			doc.documentElement.style.setProperty("--vt-x", `${x}px`);
			doc.documentElement.style.setProperty("--vt-y", `${y}px`);
			doc.startViewTransition(apply);
		} else {
			apply();
		}
	};

	return (
		<ThemeContext.Provider value={{ theme, switchTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

/**
 * Inline bootstrap script injected before first paint: restores the
 * saved theme so the page never flashes the wrong one.
 */
export const THEME_BOOTSTRAP = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="print"||t==="blueprint"){document.documentElement.dataset.theme=t}}catch(e){}`;

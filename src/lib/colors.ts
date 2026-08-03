/** Model colors: a fixed neon palette, assigned stably by model name. */

export const MODEL_PALETTE = [
	"#67e8f9", // cyan
	"#c4b5fd", // violet
	"#f0abfc", // pink
	"#fcd34d", // amber
	"#6ee7b7", // emerald
	"#93c5fd", // blue
	"#fca5a5", // red
	"#bef264", // lime
];

function hashString(s: string): number {
	let h = 5381;
	for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
	return h >>> 0;
}

/** The same model gets the same color in every chart. */
export function modelColor(model: string): string {
	return MODEL_PALETTE[hashString(model) % MODEL_PALETTE.length];
}

/** Assign colors by order of appearance (legends and ordered charts). */
export function paletteAt(index: number): string {
	return MODEL_PALETTE[index % MODEL_PALETTE.length];
}

export const TONE_COLORS: Record<string, string> = {
	cyan: "#67e8f9",
	violet: "#c4b5fd",
	pink: "#f0abfc",
	amber: "#fcd34d",
	emerald: "#6ee7b7",
};

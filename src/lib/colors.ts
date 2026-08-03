/**
 * Model colors: charts draw from the active theme's palette
 * (CHART_TOKENS in lib/theme.tsx). These helpers keep the mapping
 * stable — the same model always lands on the same palette slot.
 */

import { paletteIndex } from "./theme";

/** The same model gets the same color in every chart. */
export function modelColor(model: string, palette: string[]): string {
	return palette[paletteIndex(model, palette.length)];
}

/** Assign colors by order of appearance (legends and ordered charts). */
export function paletteAt(index: number, palette: string[]): string {
	return palette[index % palette.length];
}

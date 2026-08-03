/** Display formatting for numbers and timestamps. */

/** 1234567 -> "1.23M" */
export function formatTokens(n: number): string {
	if (n >= 1_000_000_000) return `${trim(n / 1_000_000_000)}B`;
	if (n >= 1_000_000) return `${trim(n / 1_000_000)}M`;
	if (n >= 1_000) return `${trim(n / 1_000)}K`;
	return String(Math.round(n));
}

function trim(n: number): string {
	return n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2).replace(/\.0+$/, "");
}

/** Full number with thousands separators */
export function formatInt(n: number): string {
	return Math.round(n).toLocaleString("en-US");
}

/** USD cost: tiny amounts keep extra precision */
export function formatCost(n: number): string {
	if (n === 0) return "$0.00";
	if (n < 0.01) return `$${n.toFixed(4)}`;
	if (n < 100) return `$${n.toFixed(2)}`;
	return `$${formatInt(n)}`;
}

export function formatPct(ratio: number, digits = 1): string {
	return `${(ratio * 100).toFixed(digits)}%`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 2026-07-30 */
export function formatDay(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 07-30 */
export function formatDayShort(d: Date): string {
	return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 14:32 */
export function formatTime(d: Date): string {
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 2026-07-30 14:32 */
export function formatDateTime(d: Date): string {
	return `${formatDay(d)} ${formatTime(d)}`;
}

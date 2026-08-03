/**
 * Parsing and types for Cursor usage CSV exports.
 *
 * A Cursor dashboard export looks like:
 *   Date,Cloud Agent ID,Automation ID,Kind,Model,Max Mode,
 *   Input (w/ Cache Write),Input (w/o Cache Write),Cache Read,
 *   Output Tokens,Total Tokens,Cost
 *
 * Every field is wrapped in double quotes and numbers arrive as strings.
 */

export interface UsageRow {
	/** Request time (UTC) */
	date: Date;
	/** Request kind, e.g. express / agent / chat */
	kind: string;
	/** Model name, e.g. cursor-grok-4.5-medium */
	model: string;
	/** Whether Max Mode was on */
	maxMode: boolean;
	/** Input tokens including cache writes */
	inputWithCacheWrite: number;
	/** Input tokens excluding cache writes */
	inputWithoutCacheWrite: number;
	/** Tokens served from cache reads */
	cacheRead: number;
	/** Output tokens */
	outputTokens: number;
	/** Total tokens */
	totalTokens: number;
	/** Cost of this request in USD */
	cost: number;
}

export class CsvParseError extends Error {}

/**
 * Generic CSV text parser: handles quoted fields, escaped quotes
 * and CRLF line endings.
 */
export function parseCsvText(text: string): string[][] {
	const rows: string[][] = [];
	let field = "";
	let row: string[] = [];
	let inQuotes = false;
	let i = 0;

	// Strip a UTF-8 BOM if present
	if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

	while (i < text.length) {
		const ch = text[i];
		if (inQuotes) {
			if (ch === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i += 2;
					continue;
				}
				inQuotes = false;
				i++;
				continue;
			}
			field += ch;
			i++;
			continue;
		}
		if (ch === '"') {
			inQuotes = true;
			i++;
			continue;
		}
		if (ch === ",") {
			row.push(field);
			field = "";
			i++;
			continue;
		}
		if (ch === "\n" || ch === "\r") {
			// Treat \r\n as a single newline
			if (ch === "\r" && text[i + 1] === "\n") i++;
			row.push(field);
			field = "";
			// Skip completely empty lines
			if (row.length > 1 || row[0] !== "") rows.push(row);
			row = [];
			i++;
			continue;
		}
		field += ch;
		i++;
	}
	if (field !== "" || row.length > 0) {
		row.push(field);
		if (row.length > 1 || row[0] !== "") rows.push(row);
	}
	return rows;
}

const HEADER_ALIASES: Record<
	keyof Omit<UsageRow, "date" | "maxMode">,
	string[]
> = {
	kind: ["kind"],
	model: ["model"],
	inputWithCacheWrite: ["input (w/ cache write)"],
	inputWithoutCacheWrite: ["input (w/o cache write)"],
	cacheRead: ["cache read"],
	outputTokens: ["output tokens"],
	totalTokens: ["total tokens"],
	cost: ["cost"],
};

function toNumber(raw: string | undefined): number {
	if (raw === undefined || raw.trim() === "") return 0;
	const n = Number(raw.replace(/[$,]/g, ""));
	return Number.isFinite(n) ? n : 0;
}

/**
 * Parse a Cursor usage CSV export into UsageRow[],
 * sorted ascending by time.
 */
export function parseUsageCsv(text: string): UsageRow[] {
	const table = parseCsvText(text);
	if (table.length < 2) {
		throw new CsvParseError("The CSV contains no data rows.");
	}

	const header = table[0].map((h) => h.trim().toLowerCase());
	const dateIdx = header.indexOf("date");
	const maxModeIdx = header.indexOf("max mode");
	if (dateIdx === -1) {
		throw new CsvParseError(
			"Missing the Date column — this doesn't look like a Cursor usage export.",
		);
	}

	const colIdx = {} as Record<keyof typeof HEADER_ALIASES, number>;
	for (const [key, aliases] of Object.entries(HEADER_ALIASES) as [
		keyof typeof HEADER_ALIASES,
		string[],
	][]) {
		colIdx[key] = aliases.reduce(
			(found, a) => (found !== -1 ? found : header.indexOf(a)),
			-1,
		);
	}
	if (colIdx.totalTokens === -1) {
		throw new CsvParseError(
			"Missing the Total Tokens column — this doesn't look like a Cursor usage export.",
		);
	}

	const rows: UsageRow[] = [];
	for (let r = 1; r < table.length; r++) {
		const cells = table[r];
		const date = new Date(cells[dateIdx] ?? "");
		if (Number.isNaN(date.getTime())) continue;
		rows.push({
			date,
			kind: (cells[colIdx.kind] ?? "").trim() || "unknown",
			model: (cells[colIdx.model] ?? "").trim() || "unknown",
			maxMode: (cells[maxModeIdx] ?? "").trim().toLowerCase() === "yes",
			inputWithCacheWrite: toNumber(cells[colIdx.inputWithCacheWrite]),
			inputWithoutCacheWrite: toNumber(cells[colIdx.inputWithoutCacheWrite]),
			cacheRead: toNumber(cells[colIdx.cacheRead]),
			outputTokens: toNumber(cells[colIdx.outputTokens]),
			totalTokens: toNumber(cells[colIdx.totalTokens]),
			cost: toNumber(cells[colIdx.cost]),
		});
	}
	if (rows.length === 0) {
		throw new CsvParseError("No valid records could be parsed.");
	}
	rows.sort((a, b) => a.date.getTime() - b.date.getTime());
	return rows;
}

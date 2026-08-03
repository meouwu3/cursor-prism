/**
 * Global usage-data store: a module-level singleton exposed through
 * useSyncExternalStore. The raw CSV text persists in sessionStorage so
 * a page reload can restore the session.
 * Data lives entirely in the browser — nothing is ever transmitted.
 */

import { useSyncExternalStore } from "react";
import { parseUsageCsv, type UsageRow } from "./csv";
import { generateDemoRows } from "./demo-data";

export interface DataState {
	/** idle = not restored yet; empty = no data; ready = data loaded */
	status: "idle" | "empty" | "ready";
	rows: UsageRow[] | null;
	fileName: string | null;
	isDemo: boolean;
}

const KEY_CSV = "cursor-prism:csv";
const KEY_NAME = "cursor-prism:name";
const KEY_DEMO = "cursor-prism:demo";

let state: DataState = {
	status: "idle",
	rows: null,
	fileName: null,
	isDemo: false,
};
let hydrated = false;
const listeners = new Set<() => void>();

function emit(next: DataState) {
	state = next;
	for (const fn of listeners) fn();
}

function subscribe(fn: () => void): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

function getSnapshot(): DataState {
	return state;
}

export function useUsageData(): DataState {
	return useSyncExternalStore(subscribe, getSnapshot, () => state);
}

/** Call after client mount to restore the previous session from sessionStorage. */
export function hydrateUsageData(): void {
	if (hydrated || typeof window === "undefined") return;
	hydrated = true;
	try {
		if (window.sessionStorage.getItem(KEY_DEMO) === "1") {
			emit({
				status: "ready",
				rows: generateDemoRows(),
				fileName: "demo-data",
				isDemo: true,
			});
			return;
		}
		const raw = window.sessionStorage.getItem(KEY_CSV);
		if (raw) {
			emit({
				status: "ready",
				rows: parseUsageCsv(raw),
				fileName: window.sessionStorage.getItem(KEY_NAME),
				isDemo: false,
			});
			return;
		}
		emit({ status: "empty", rows: null, fileName: null, isDemo: false });
	} catch {
		emit({ status: "empty", rows: null, fileName: null, isDemo: false });
	}
}

export function setUsageCsv(rawCsv: string, fileName: string): UsageRow[] {
	const rows = parseUsageCsv(rawCsv);
	try {
		window.sessionStorage.setItem(KEY_CSV, rawCsv);
		window.sessionStorage.setItem(KEY_NAME, fileName);
		window.sessionStorage.removeItem(KEY_DEMO);
	} catch {
		// Storage failure (e.g. private mode) doesn't block this session
	}
	emit({ status: "ready", rows, fileName, isDemo: false });
	return rows;
}

export function setDemoData(): UsageRow[] {
	const rows = generateDemoRows();
	try {
		window.sessionStorage.setItem(KEY_DEMO, "1");
		window.sessionStorage.removeItem(KEY_CSV);
		window.sessionStorage.removeItem(KEY_NAME);
	} catch {
		// ignore
	}
	emit({ status: "ready", rows, fileName: "demo-data", isDemo: true });
	return rows;
}

export function clearUsageData(): void {
	try {
		window.sessionStorage.removeItem(KEY_CSV);
		window.sessionStorage.removeItem(KEY_NAME);
		window.sessionStorage.removeItem(KEY_DEMO);
	} catch {
		// ignore
	}
	emit({ status: "empty", rows: null, fileName: null, isDemo: false });
}

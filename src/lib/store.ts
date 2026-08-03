/**
 * Global usage-data store: a module-level singleton exposed through
 * useSyncExternalStore. Data lives in memory only — nothing is
 * persisted, restored between page loads, or transmitted anywhere.
 */

import { useSyncExternalStore } from "react";
import { parseUsageCsv, type UsageRow } from "./csv";

export interface DataState {
	/** empty = no data; ready = data loaded */
	status: "empty" | "ready";
	rows: UsageRow[] | null;
	fileName: string | null;
}

let state: DataState = { status: "empty", rows: null, fileName: null };
const listeners = new Set<() => void>();

function emit(next: DataState) {
	state = next;
	for (const fn of listeners) fn();
}

function subscribe(fn: () => void): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

export function useUsageData(): DataState {
	return useSyncExternalStore(
		subscribe,
		() => state,
		() => state,
	);
}

export function setUsageCsv(rawCsv: string, fileName: string): UsageRow[] {
	const rows = parseUsageCsv(rawCsv);
	emit({ status: "ready", rows, fileName });
	return rows;
}

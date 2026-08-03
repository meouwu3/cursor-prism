/**
 * CSV upload zone: click to browse or drop a file; parsed locally,
 * then handed to the caller. Drag state flips the hairline to the
 * accent color; parse errors surface inline.
 */

import { useRef, useState } from "react";

export function UploadZone({
	onFile,
	error,
	compact = false,
}: {
	onFile: (file: File) => void;
	error?: string | null;
	compact?: boolean;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);

	const handle = (files: FileList | null) => {
		const f = files?.[0];
		if (f) onFile(f);
	};

	return (
		<div>
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					handle(e.dataTransfer.files);
				}}
				className={`group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-xs border border-dashed text-center transition-colors duration-200 ${
					compact ? "px-6 py-6" : "px-8 py-14"
				} ${dragging ? "border-accent bg-bg-2" : "border-line-strong bg-transparent"}`}
			>
				{/* Upload icon: hairline circle + arrow */}
				<span
					className={`mb-4 flex items-center justify-center rounded-full border transition-[translate] duration-200 group-hover:-translate-y-0.5 ${
						compact ? "h-11 w-11" : "h-14 w-14"
					} ${dragging ? "border-accent" : "border-line-strong"}`}
				>
					<svg
						width={compact ? 18 : 22}
						height={compact ? 18 : 22}
						viewBox="0 0 24 24"
						fill="none"
						role="img"
					>
						<title>Upload CSV file</title>
						<path
							d="M12 16V4m0 0l-4 4m4-4l4 4"
							stroke="var(--ink)"
							strokeWidth="1.6"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3"
							stroke="var(--ink-3)"
							strokeWidth="1.6"
							strokeLinecap="round"
						/>
					</svg>
				</span>

				<span
					className={`font-display text-balance font-medium tracking-[-0.015em] text-ink blueprint:tracking-[-0.04em] ${compact ? "text-sm" : "text-base"}`}
				>
					{dragging
						? "Release to refract"
						: "Drop your CSV, or click to browse"}
				</span>
				{!compact && (
					<span className="mt-2 text-sm text-ink-3">
						Exported from{" "}
						<span className="font-mono tabular-nums tracking-[-0.01em] text-ink-2">
							cursor.com/dashboard → Usage → Export CSV
						</span>
					</span>
				)}

				<input
					ref={inputRef}
					type="file"
					accept=".csv,text/csv"
					className="hidden"
					onChange={(e) => {
						handle(e.target.files);
						e.target.value = "";
					}}
				/>
			</button>

			{error ? (
				<div className="mt-3 rounded-xs border border-accent px-4 py-2.5 text-sm text-accent">
					Parse failed: {error}
				</div>
			) : null}
		</div>
	);
}

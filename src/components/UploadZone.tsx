/**
 * CSV upload zone: click to browse or drop a file; parsed locally,
 * then handed to the caller. Drag state glows, parse errors surface inline.
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
				className={`group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed text-center transition-all duration-300 ${
					compact ? "px-6 py-6" : "px-8 py-14"
				}`}
				style={{
					borderColor: dragging
						? "rgba(103,232,249,0.8)"
						: "rgba(148,163,255,0.3)",
					background: dragging
						? "rgba(103,232,249,0.06)"
						: "rgba(148,163,255,0.03)",
					boxShadow: dragging
						? "0 0 48px -6px rgba(103,232,249,0.35), inset 0 0 32px rgba(103,232,249,0.06)"
						: undefined,
				}}
			>
				{/* Scan line across the top edge */}
				<span
					className="pointer-events-none absolute inset-x-8 top-0 h-px opacity-60"
					style={{
						background:
							"linear-gradient(90deg, transparent, rgba(103,232,249,0.6), transparent)",
					}}
				/>

				{/* Upload icon */}
				<span
					className={`mb-4 flex items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:-translate-y-1 ${
						compact ? "h-11 w-11" : "h-14 w-14"
					}`}
					style={{
						borderColor: "rgba(103,232,249,0.35)",
						background: "rgba(103,232,249,0.08)",
						boxShadow: "0 0 24px -4px rgba(103,232,249,0.3)",
					}}
				>
					<svg
						width={compact ? 20 : 26}
						height={compact ? 20 : 26}
						viewBox="0 0 24 24"
						fill="none"
						role="img"
					>
						<title>Upload CSV file</title>
						<path
							d="M12 16V4m0 0l-4 4m4-4l4 4"
							stroke="#67e8f9"
							strokeWidth="1.8"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3"
							stroke="#67e8f9"
							strokeWidth="1.8"
							strokeLinecap="round"
							opacity="0.6"
						/>
					</svg>
				</span>

				<span
					className={`font-medium text-white/90 ${compact ? "text-[14px]" : "text-[16px]"}`}
				>
					{dragging
						? "Release to refract"
						: "Drop your CSV, or click to browse"}
				</span>
				{!compact && (
					<span className="mt-2 text-[13px] text-slate-500">
						Exported from{" "}
						<span className="num text-slate-400">
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
				<div className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-[13px] text-red-300">
					Parse failed: {error}
				</div>
			) : null}
		</div>
	);
}

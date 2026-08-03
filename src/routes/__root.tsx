import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { THEME_BOOTSTRAP, ThemeProvider } from "#/lib/theme";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Cursor Prism — Token Observatory",
			},
			{
				name: "description",
				content:
					"Refract your Cursor usage CSV into a spectrum: trends, models and cache economics — parsed 100% locally in your browser.",
			},
			{
				property: "og:title",
				content: "Cursor Prism — Token Observatory",
			},
			{
				property: "og:description",
				content:
					"Refract your Cursor usage CSV into a spectrum: trends, models and cache economics — parsed 100% locally in your browser.",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:image",
				content: "/og.png",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Geist:wght@400..600&family=Geist+Mono:wght@400..600&display=swap",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		// data-theme is set pre-paint by the bootstrap script and may differ
		// from the SSR default ("print") — that divergence is intentional.
		<html lang="en" data-theme="print" suppressHydrationWarning>
			<head>
				{/* Restore the saved theme before first paint */}
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: static bootstrap string, no user input
					dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }}
				/>
				<HeadContent />
			</head>
			<body>
				<a
					href="#main"
					className="fixed top-2 left-2 z-[100] -translate-y-16 rounded-xs border border-line-strong bg-bg-2 px-3 py-2 text-sm text-ink no-underline transition-[translate] duration-250 ease-(--ease) focus-visible:translate-y-0"
				>
					Skip to content
				</a>
				<ThemeProvider>
					<main id="main">{children}</main>
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}

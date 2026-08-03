# CursorPrism

> Refract every Cursor token into its spectrum.

The Cursor dashboard hands you a plain table. **CursorPrism** turns your exported usage CSV into an observatory: trends, models, cache economics, activity heat, cost concentration — plus a 3D token galaxy you can grab and spin.

**100% local parsing** — your CSV never leaves the browser (`FileReader` + `sessionStorage`). Nothing is uploaded, tracked, or stored server-side. There is no server side.

![CursorPrism dashboard — Print theme](docs/screenshots/print-dashboard.png)

## Three design languages

One semantic token system, three complete looks. Switch from the top bar — the change ripples out from your cursor with a circular View-Transition reveal, and your choice is remembered.

| Print | Dark | Blueprint |
| --- | --- | --- |
| Editorial paper: Fraunces serif, ruled hairlines, vermilion accent, flat infographics | Precision tool: near-black, Inter, indigo accent, zero glow | Technical drawing: IBM Plex Mono, graph paper, construction dashes, one amber highlight |
| ![Print](docs/screenshots/print-galaxy.png) | ![Dark](docs/screenshots/dark-galaxy.png) | ![Blueprint](docs/screenshots/blueprint-galaxy.png) |

## Six lenses

| Lens | What it shows |
| --- | --- |
| Trend Prism | Daily token & cost area charts with a 7-day moving-average reference |
| Model Spectrum | Per-model share donut and composition — which model does the heavy lifting |
| Cache Economics | Cache reads vs fresh input vs output — quantify your context reuse |
| Activity Heat | A 7 × 24 heat matrix that exposes your peak coding hours |
| Token Galaxy | A hand-rolled, dependency-free 3D particle cloud. Every request is a star — drag to rotate, hover to inspect |
| Auto Insights | Rule-based conclusions: cache hit rate, Pareto cost concentration, cost per 1M tokens, and more |

## Quick start

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Then:

1. **Export** — open [cursor.com/dashboard](https://cursor.com/dashboard) → Usage → **Export CSV**
2. **Drop** — drag the CSV onto the landing page (or click to browse)
3. **Explore** — no CSV yet? Hit **Load demo data** to tour the dashboard with synthesized data

## Tech stack

- [TanStack Start](https://tanstack.com/start) + React 19 + Vite
- Tailwind CSS v4
- **Zero chart libraries** — every visualization is hand-rolled SVG / Canvas (area chart, donut, stacked bars, heatmap, 3D particle cloud)
- Theme system: CSS variables + the View Transitions API, no runtime theme engine
- Cloudflare Workers ready (`wrangler.jsonc`)

## Project layout

```
src/
├── lib/                    # Pure data layer, UI-agnostic
│   ├── csv.ts              #   CSV parsing (quotes / escapes / BOM) and types
│   ├── analytics.ts        #   Aggregations: trends, distribution, heat,
│   │                       #   concentration, auto insights
│   ├── demo-data.ts        #   Seeded demo-data generator (reproducible)
│   ├── theme.tsx           #   Theme tokens, provider, View-Transition switching
│   ├── colors.ts           #   Stable model → palette-slot mapping
│   ├── format.ts           #   Number / timestamp formatting
│   └── store.ts            #   Global store + sessionStorage persistence
├── components/
│   ├── charts/             # Hand-rolled visuals: TimelineChart / ModelDonut /
│   │                       #   CompositionBars / UsageHeatmap / TopRequests / Galaxy (3D)
│   ├── KpiRow.tsx          # KPI strip with rolling numbers
│   ├── InsightsGrid.tsx    # Auto-insight cards
│   ├── ThemeSwitcher.tsx   # Print / Dark / Blueprint swatches
│   ├── UploadZone.tsx      # Drag & drop upload
│   └── Logo.tsx            # currentColor-driven prism mark
└── routes/
    ├── index.tsx           # Landing: upload + demo-data entry
    └── dashboard.tsx       # The observatory
```

## Scripts

```bash
pnpm dev          # Dev server
pnpm build        # Production build
pnpm check        # Biome lint + format check
pnpm typecheck    # TypeScript type checking
pnpm screenshots  # Headless-Chrome smoke test + docs screenshots
pnpm deploy       # Build & deploy to Cloudflare Workers
```

## Privacy

CursorPrism has no backend, no database, and no analytics. Your CSV lives only in browser memory and `sessionStorage` — hit **Clear** or close the tab and it's gone. The source is right here; audit away.

## License

[MIT](LICENSE)

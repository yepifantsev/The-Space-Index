# Project Architecture & AI Agent Guide

## Core Pattern: Separated Data Pipeline
Every dashboard panel follows a strict 3-layer separation to enable instant Vite HMR without re-fetching external APIs:

1. **Fetch Layer (`scripts/fetchers/*.fetcher.js`)**
   - **Environment:** Node.js only (`npm run fetch`).
   - **Responsibility:** Calls external APIs and writes raw, unmodified payloads to `data/raw/<name>.json`.
   - **Rules:** Do NOT put UI text, labels, or formatting logic here. Never import these files into `src/`.

2. **Transform & Text Layer (`src/formatters/*.formatter.js`)**
   - **Environment:** Browser-safe (Vite HMR tracked).
   - **Responsibility:** Imports raw JSON from `data/raw/<name>.json`, applies business logic, calculations, and UI copy/labels.
   - **Rules:** Must be pure JavaScript (no `fs`, `path`, `process.env`, or Node built-ins) so Vite can hot-reload changes immediately.

3. **Presentation Layer (`src/components/panels/*Panel.vue`)**
   - **Environment:** Vue 3 / Browser.
   - **Responsibility:** Imports processed data from `src/formatters/` and renders the UI.
   - **Registration:** Import and register each panel in the `vuePanels` map in `src/main.js`.
   - **Shared panel utilities:** Keep reusable display formatting and status helpers in `src/components/panels/panel-helpers.js`.
   - **Chart ownership:** Chart DOM/SVG implementations are panel-local: `night-forecast-chart.js` for Cloud Cover and `metric-chart.js` for transparency, dew point, and wind. Panels own the card and mount these chart modules.

## Checklist: Adding or Updating a Panel
- Changing API endpoints or auth? -> Edit `scripts/fetchers/<name>.fetcher.js` and run `npm run fetch`.
- Changing labels, copy, thresholds, or data formatting? -> Edit `src/formatters/<name>.formatter.js`.
- Changing layout, styling, or DOM structure? -> Edit `src/components/panels/<Name>Panel.vue`.

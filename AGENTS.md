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
   - **Chart migrations:** Existing chart DOM/SVG helpers may remain in `src/section-helpers.js` during incremental Vue migration. A panel should own the card and mount its helper, then can gradually replace the helper with Vue/SVG template code.

## Checklist: Adding or Updating a Panel
- Changing API endpoints or auth? -> Edit `scripts/fetchers/<name>.fetcher.js` and run `npm run fetch`.
- Changing labels, copy, thresholds, or data formatting? -> Edit `src/formatters/<name>.formatter.js`.
- Changing layout, styling, or DOM structure? -> Edit `src/components/panels/<Name>Panel.vue`.

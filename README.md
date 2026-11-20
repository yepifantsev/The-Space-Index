# The-Space-Index
All Things Space

A static, database-free site built with Node.js and [Vite](https://vite.dev/).
A scheduled job pulls data from space-related sources into JSON files, then the
site is rebuilt with that data baked in. **Visitors never trigger data pulls or
cross-origin requests** — they only download static files.

| Section            | Source                                                        | File                       |
| ------------------ | ------------------------------------------------------------- | -------------------------- |
| Space weather      | [NOAA SWPC](https://www.swpc.noaa.gov/) planetary K-index     | `data/space-weather.json`  |
| Rocket launches    | [The Space Devs – Launch Library 2](https://thespacedevs.com/) | `data/launches.json`       |
| Night sky forecast | [Open-Meteo](https://open-meteo.com/) cloud cover             | `data/night-forecast.json` |
| Atmosphere transparency | [7Timer!](https://www.7timer.info/) transparency | `data/atmosphere-transparency.json` |
| Dew point spread | [Open-Meteo](https://open-meteo.com/) temperature and dew point | `data/dew-point-spread.json` |
| Wind | [Open-Meteo](https://open-meteo.com/) wind speed | `data/wind.json` |
| Moon timeline | [Open-Meteo](https://open-meteo.com/) rise/set times · [USNO](https://aa.usno.navy.mil/data/AltAz) altitude and lunar sky calculations | `data/moon-timeline.json` |
| Visible planets | [NASA/JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) location-based planet ephemerides | `data/visible-planets.json` |
| Meteor showers & comets | [MeteorShowerCal](https://meteorshowercal.com/api/docs/) ZHR · [COBS](https://www.cobs.si/) comet magnitudes | `data/celestial-events.json` |
| NEO close approaches | [NASA/JPL CNEOS](https://cneos.jpl.nasa.gov/ca/) close-approach data | `data/neo-close-approaches.json` |
| Satellite tracking | [CelesTrak](https://celestrak.org/) brightest-satellite TLE elements | `data/satellites.json` |
| Space news         | [Spaceflight News API](https://spaceflightnewsapi.net/)       | `data/news.json`           |

## How it works

```
scripts/sources/*.js  --(npm run fetch)-->  data/*.json  --(npm run build)-->  dist/  -->  GitHub Pages
```

- `scripts/sources/` – one module per source exporting `{ name, title, attribution, fetch }`.
  Register new sources in `scripts/sources/index.js`.
- `scripts/fetch-data.js` – runs every source and writes `data/<name>.json`.
  If a source fails, its previous file is kept (or a placeholder is written), so a
  build never breaks because one API is down.
- `src/` – the front end. `data/*.json` is imported at build time via
  `import.meta.glob`, and each section has a renderer in `src/sections.js`.
- `data/*.json` is generated and git-ignored.

## Local development (Docker)

```sh
docker compose up --build                 # dev server on http://localhost:5173
docker compose run --rm web npm run fetch # pull fresh data (dev server hot-reloads)
docker compose run --rm web npm test
```

## Local development (without Docker)

Requires Node.js 22.12+ (see `.nvmrc`).

```sh
npm install
npm run fetch          # pull all sources (or e.g. `npm run fetch -- news launches`)
npm run dev            # http://localhost:5173
npm run build          # static site in dist/
npm run preview        # serve dist/ locally
npm test
```

### Configuration

The night sky forecast location is set with environment variables (defaults to Greenwich, UK).
For local fetches, put these in `.env`; `npm run fetch` loads that file automatically.
Variables already set in the shell or CI take precedence.

| Variable             | Example         |
| -------------------- | --------------- |
| `SITE_LAT`           | `51.4769`       |
| `SITE_LON`           | `-0.0005`       |
| `SITE_LOCATION_NAME` | `Greenwich, UK` |
| `SITE_TIME_ZONE` | `America/New_York` |

`BASE_PATH` sets the URL base for the build (set automatically in CI for GitHub Pages).
GitHub Pages builds read `SITE_LOCATION_NAME` and `SITE_TIME_ZONE` from repository Variables,
with the same fallback behavior used by local builds.

## Deployment (GitHub Pages)

GitHub Actions uses `.github/workflows/reusable-deploy.yml` to restore cached data, fetch
selected sources, test and build the site, and deploy `dist/` to GitHub Pages.

Separate scheduled workflows keep each source group on an appropriate refresh cadence:

| Workflow | Schedule | Sources |
| --- | --- | --- |
| `hourly.yml` | Every hour | Night forecast, dew point spread, wind |
| `three-hour.yml` | Every 3 hours | Space weather, atmosphere transparency |
| `six-hour.yml` | Every 6 hours | Launches, satellites, news |
| `twelve-hour.yml` | Every 12 hours | Moon timeline, meteor showers/comets |
| `daily.yml` | Every day | Visible planets, NEO close approaches |
| `deploy-on-push.yml` | Pushes to `main` or manual dispatch | All sources |

Each workflow restores the last-known-good JSON cache before fetching. Failing sources keep
their previous values, while source failures do not prevent the rest of the site from building.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Set `SITE_LAT`, `SITE_LON`, `SITE_LOCATION_NAME`, and `SITE_TIME_ZONE` under
**Settings → Secrets and variables → Actions → Variables**.

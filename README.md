# Algeria Weather Analytics

Interactive weather analytics for Algerian SYNOP stations: fetch historical hourly data from Open‑Meteo, explore charts/tables, and export the result to CSV.

## Features

- Select station (Algerian SYNOP list) + date range
- Fetch historical hourly series (temperature, precipitation, humidity, wind, pressure, cloud cover, dew point)
- Views: charts (Recharts) / table / raw JSON + simulated SYNOP strings
- CSV export of fetched data

## Data Source

- Open‑Meteo Historical Archive API: https://archive-api.open-meteo.com/v1/archive

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS (v4)
- Recharts (charts), date-fns (date formatting)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

The dev server is configured to run on port `3000`.

## Scripts

- `npm run dev` — start Vite dev server (port 3000)
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — TypeScript typecheck (`tsc --noEmit`)

## Project Structure

- `src/App.tsx` — main UI and data-fetching logic
- `src/constants.ts` — Algerian stations list used by the UI
- `src/types.ts` — TypeScript types
- `src/lib/utils.ts` — small utilities (classnames + CSV export)
- `algerian_stations.csv` / `algerian_stations.json` — station datasets (not currently used by the app)

## Notes

- `GEMINI_API_KEY` is referenced in the Vite config, but the current UI does not use Gemini. Avoid exposing secrets to the browser; if AI features are added, use a server-side proxy.

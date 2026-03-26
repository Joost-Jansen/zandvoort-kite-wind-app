# Zandvoort Kite Wind App Deployment Plan

## Goal

Build and deploy a Vercel-hosted web app in English for Zandvoort aan Zee using Open-Meteo data for coordinates `52.3745, 4.5305`.

The app must:

- show the next 7 days of wind data in knots
- calculate the average daytime wind speed for each day from `09:00` through `18:00`
- highlight weekend days in green when the average wind is at least `15 kn`
- provide a kite recommendation per day
- export kite days as an `.ics` file for Apple Calendar

## Recommended Stack

- Framework: Next.js App Router
- Hosting: Vercel
- Data source: Open-Meteo Forecast API
- Styling: native CSS with a custom visual theme
- Calendar export: server-generated `.ics` response from a route handler

## Functional Plan

### 1. Data retrieval

- Call Open-Meteo from the server with:
  - latitude `52.3745`
  - longitude `4.5305`
  - hourly `wind_speed_10m`
  - `wind_speed_unit=kn`
  - `forecast_days=7`
  - `timezone=Europe/Amsterdam`
- Reuse the same transformation logic for both the page and the calendar export.

### 2. Daily aggregation

- Group hourly wind values by date.
- Keep the daytime window from `09:00` to `18:00`, inclusive.
- Compute the arithmetic mean for that window.
- Round to one decimal place for display.

### 3. Kite recommendation logic

Use these bands:

- `15-18.9 kn`: `10m² kite`
- `19-21.9 kn`: `RRD 7m²`
- `22-35 kn`: `RRD 5m²`

Note:

- The original ranges overlap.
- For safety and clarity, the implementation should prefer the smaller kite once wind enters the higher band.
- Above `35 kn`, the UI should warn that conditions are outside the planned recommendation bands.

### 4. Weekend highlighting

- Detect Saturday and Sunday from the forecast date.
- If a weekend day has an average daytime wind speed of at least `15 kn`, render that card in green.

### 5. Calendar export

- Export only kite-worthy days where average daytime wind is at least `15 kn`.
- Generate a standards-compliant `.ics` file from a route such as `/api/kite-days`.
- Use all-day events titled like `Kite day in Zandvoort`.
- Include the average wind and kite recommendation in the event description.

## Delivery Plan

### Phase 1. App scaffold

- Create a Next.js app structure.
- Add shared wind parsing and recommendation utilities.
- Build the main dashboard page.

### Phase 2. Export route

- Add an API route that returns `text/calendar`.
- Reuse the same forecast logic so the export matches the UI.

### Phase 3. Validation

- Install dependencies.
- Run a production build locally.
- Fix any type or runtime issues before deployment.

### Phase 4. Vercel deployment

- Push the project to GitHub.
- Import the repo into Vercel.
- No secrets are required because Open-Meteo does not require an API key.
- Deploy using the default Next.js settings.

## Vercel Checklist

- Framework preset: `Next.js`
- Build command: `next build`
- Output: default Vercel Next.js output
- Environment variables: none required
- Node version: use Vercel default or pin a current LTS version in the project if needed

## Implementation Status

- [x] Architecture chosen
- [x] Deployment plan documented
- [x] App scaffold completed
- [x] Forecast aggregation implemented
- [x] `.ics` export implemented
- [x] Local production build validated
- [ ] Ready for Vercel deployment
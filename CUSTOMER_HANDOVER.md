# Zandvoort Kite Wind App Handover Guide

## Purpose

This document explains, step by step, how the Zandvoort Kite Wind App was set up, how it is deployed, and how to edit and publish future changes.

## Live Website

- Production URL: `https://zandvoort-kite-wind-app.vercel.app/`

## What The Website Does

The website shows a 7-day kite wind forecast for Zandvoort aan Zee.

It does the following:

- fetches weather data from the free Open-Meteo API
- uses the location `52.3745, 4.5305`
- calculates the average daytime wind from `09:00` to `18:00`
- shows wind speed in knots
- highlights weekend days in green when wind is at least `15 kn`
- gives a kite recommendation for each day
- allows export of kite-worthy days as an `.ics` file for Apple Calendar

## Technology Used

- Frontend and backend: Next.js
- Hosting: Vercel
- Source code hosting: GitHub
- Weather API: Open-Meteo

## Important Project Files

- Main page: `app/page.tsx`
- Styling: `app/globals.css`
- Weather fetching: `lib/open-meteo.ts`
- Forecast and kite logic: `lib/kite.ts`
- Calendar export route: `app/api/kite-days/route.ts`
- Project configuration: `package.json`

## How The Initial Setup Was Done

### 1. The app was created

A small Next.js application was created to keep the project simple and easy to host on Vercel.

### 2. The weather source was connected

The app connects to Open-Meteo using:

- latitude `52.3745`
- longitude `4.5305`
- `wind_speed_10m`
- `wind_speed_unit=kn`
- `forecast_days=7`
- timezone `Europe/Amsterdam`

### 3. Wind data was transformed

Hourly wind data is grouped per day.

Only the values from `09:00` to `18:00` are used.

The app calculates the average wind speed for those hours.

### 4. Kite advice was added

The current rules are:

- `15.0` to `18.9 kn`: `10m² kite`
- `19.0` to `21.9 kn`: `RRD 7m²`
- `22.0` to `35.0 kn`: `RRD 5m²`
- above `35.0 kn`: outside planned range

### 5. Calendar export was added

The app exposes an export route:

- `/api/kite-days`

This generates an `.ics` file containing kite-worthy days.

### 6. The project was deployed

The code was pushed to GitHub.

The GitHub repository was connected to Vercel.

Vercel now builds and publishes the website automatically.

## How To View The Website

Open:

- `https://zandvoort-kite-wind-app.vercel.app/`

To test the calendar export, click the export button on the website.

## How To Edit The Website

### Option 1. Edit the code locally

1. Clone the GitHub repository to your computer.
2. Open the project folder in VS Code.
3. Install dependencies:

```bash
npm install
```

4. Start the local development server:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

6. Make changes to the code.

### Option 2. Edit through GitHub

1. Open the repository on GitHub.
2. Open the file you want to change.
3. Click the edit button.
4. Save the change by creating a commit.

This is fine for small text or code changes, but local editing is better for testing larger changes.

## Which File To Edit For Common Changes

### Change the page layout or text

Edit:

- `app/page.tsx`

### Change colors, fonts, spacing, or card styling

Edit:

- `app/globals.css`

### Change where the weather data comes from

Edit:

- `lib/open-meteo.ts`

### Change how wind is averaged or how kite advice is calculated

Edit:

- `lib/kite.ts`

### Change the `.ics` export format

Edit:

- `app/api/kite-days/route.ts`

## How To Test Changes Locally

After making changes, run:

```bash
npm run build
```

This checks whether the project still builds correctly for production.

If the build succeeds, the change is usually safe to deploy.

## How To Publish New Changes

If you are editing locally, use these commands:

```bash
git add .
git commit -m "Describe the change"
git push origin main
```

Once the code is pushed to the `main` branch:

- GitHub stores the updated code
- Vercel automatically detects the new commit
- Vercel builds and deploys the new version
- the live website updates automatically

## How To Check Deployment Status

1. Open the Vercel dashboard.
2. Open the project `zandvoort-kite-wind-app`.
3. Open the `Deployments` tab.
4. Check whether the latest deployment is successful.

If a deployment fails, Vercel will show the error log.

## How To Roll Back If Something Breaks

### Option 1. Redeploy an older deployment in Vercel

1. Open the Vercel project.
2. Go to `Deployments`.
3. Select the last working deployment.
4. Redeploy it.

### Option 2. Revert the GitHub commit

1. Revert the problematic change in Git.
2. Push the revert commit.
3. Vercel will deploy the reverted version automatically.

## Notes About Costs And Maintenance

- Open-Meteo does not require an API key in this setup
- there are currently no environment variables required
- Vercel handles hosting and deployment
- GitHub handles version history and collaboration

## Recommended Workflow For Future Updates

1. Make changes locally
2. Test with `npm run dev`
3. Validate with `npm run build`
4. Push to GitHub
5. Wait for Vercel to deploy
6. Check the live website

## Contact Points For Future Changes

If changes are needed in the future, the fastest way to work is usually:

1. describe the requested change clearly
2. update the code in the correct file
3. test locally
4. push to `main`
5. verify the new production deployment
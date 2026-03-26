# Zandvoort Kite Wind App

This app was basically vibe-coded at irresponsible speed for a non-technical roommate who wanted one thing: a dead-simple answer to the eternal Dutch coastal question:

"Can I go kiting, or am I just dressing up to stand sadly on a beach?"

Live version:
https://kite-wind-app.vercel.app/

## What it does

This Next.js app checks the 14-day wind forecast for Zandvoort aan Zee and translates it into something more useful than raw weather numbers.

Instead of making you interpret a wall of meteorological chaos, it:

- pulls wind data from Open-Meteo
- averages daytime wind between 09:00 and 18:00
- marks days as kiteable when the average reaches 15 knots or more
- suggests a rough kite setup based on wind strength
- lets you export the good days as an `.ics` calendar file
- gives you a feed URL for Google Calendar so your agenda can become dangerously optimistic

## Why this exists

Because weather apps love giving you twelve numbers, three icons, and zero confidence.

This app is for people who do not want to do weather archaeology. It answers the practical version of the question:

"Do I need to work tomorrow, or do I need to suddenly become very unavailable?"

## How the logic works

The app looks at daytime wind, not random 03:00 chaos goblin gusts.

Current rules:

- below 15 kn: no kite recommendation
- 15 to 18.9 kn: 10m2 kite
- 19 to 21.9 kn: RRD 7m2
- 22 to 35 kn: RRD 5m2
- above 35 kn: probably calm down

So the goal is not to predict your spiritual destiny. The goal is to quickly spot realistic session windows.

## Calendar export

If a day looks good, the app can export it as a calendar event.

That means you can:

- import kite-worthy days into Apple Calendar
- subscribe from Google Calendar using the feed URL
- pretend your planning system is extremely professional

## Run it locally

```bash
npm install
npm run dev
```

Then open:

```bash
http://localhost:3000
```

## Stack

- Next.js 14
- React 18
- TypeScript
- Open-Meteo API

## In one sentence

This is a tiny app that turns North Sea wind data into a much simpler decision: kite session, false hope, or character-building disappointment.

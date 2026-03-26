import type { KiteLocation } from "./locations";
import { mapForecast } from "./kite";

function buildForecastUrl(location: KiteLocation) {
  const searchParams = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    hourly: "wind_speed_10m,wind_gusts_10m,wind_direction_10m",
    forecast_days: "14",
    wind_speed_unit: "kn",
    timezone: "Europe/Amsterdam",
  });

  return `https://api.open-meteo.com/v1/forecast?${searchParams.toString()}`;
}

export async function getForecastForLocation(location: KiteLocation) {
  const response = await fetch(buildForecastUrl(location), {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch forecast: ${response.status}`);
  }

  const payload = await response.json();
  return mapForecast(payload);
}
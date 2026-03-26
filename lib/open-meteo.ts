import { mapForecast } from "./kite";

const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=52.3745&longitude=4.5305&hourly=wind_speed_10m&forecast_days=7&wind_speed_unit=kn&timezone=Europe%2FAmsterdam";

export async function getZandvoortForecast() {
  const response = await fetch(OPEN_METEO_URL, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch forecast: ${response.status}`);
  }

  const payload = await response.json();
  return mapForecast(payload);
}
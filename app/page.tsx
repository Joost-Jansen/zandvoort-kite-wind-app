import { getLocationBySlug, KITE_LOCATIONS } from "@/lib/locations";
import { getForecastForLocation } from "@/lib/open-meteo";
import { ForecastPlanner } from "./forecast-planner";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { location?: string };
}) {
  const location = getLocationBySlug(searchParams?.location);
  const locationForecasts = await Promise.all(
    KITE_LOCATIONS.map(async (candidate) => ({
      location: candidate,
      forecast: await getForecastForLocation(candidate),
    })),
  );

  const currentLocationForecast =
    locationForecasts.find((entry) => entry.location.slug === location.slug) ?? locationForecasts[0];

  const spotRankings = locationForecasts
    .map(({ location: candidate, forecast }) => {
      const favorableDays = forecast.filter((day) => day.advice.favorable);
      const bestDay = forecast.reduce((best, day) =>
        day.averageWindKnots > best.averageWindKnots ? day : best,
      );

      return {
        location: candidate,
        bestDay,
        favorableDays: favorableDays.length,
        favorableWeekends: favorableDays.filter((day) => day.weekend).length,
        score: bestDay.averageWindKnots + favorableDays.length * 0.4,
      };
    })
    .sort((left, right) => right.score - left.score);

  return (
    <ForecastPlanner
      forecast={currentLocationForecast.forecast}
      location={location}
      locations={KITE_LOCATIONS}
      spotRankings={spotRankings}
    />
  );
}
import { getLocationBySlug, KITE_LOCATIONS } from "@/lib/locations";
import { getForecastForLocation } from "@/lib/open-meteo";
import { ForecastPlanner } from "./forecast-planner";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { location?: string };
}) {
  const location = getLocationBySlug(searchParams?.location);
  const forecast = await getForecastForLocation(location);

  return <ForecastPlanner forecast={forecast} location={location} locations={KITE_LOCATIONS} />;
}
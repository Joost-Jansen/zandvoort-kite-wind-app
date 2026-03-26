import { getZandvoortForecast } from "@/lib/open-meteo";
import { ForecastPlanner } from "./forecast-planner";

export default async function HomePage() {
  const forecast = await getZandvoortForecast();

  return <ForecastPlanner forecast={forecast} />;
}
import Link from "next/link";

import { getZandvoortForecast } from "@/lib/open-meteo";

function formatWind(value: number) {
  return `${value.toFixed(1)} kn`;
}

export default async function HomePage() {
  const forecast = await getZandvoortForecast();

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Zandvoort aan Zee • 52.3745, 4.5305</p>
          <h1>7-day kite wind window for the Dutch coast.</h1>
          <p className="hero-text">
            Average daytime wind is calculated from 09:00 through 18:00 using
            Open-Meteo data in knots. Weekend days turn green when the outlook
            reaches kiteable range.
          </p>
        </div>

        <div className="hero-actions">
          <Link className="primary-button" href="/api/kite-days">
            Export kite days as .ics
          </Link>
          <p className="microcopy">
            Apple Calendar compatible download for days averaging at least 15 kn.
          </p>
        </div>
      </section>

      <section className="forecast-grid" aria-label="7 day kite forecast">
        {forecast.map((day) => {
          const weekendHighlight = day.weekend && day.averageWindKnots >= 15;

          return (
            <article
              className={`forecast-card ${weekendHighlight ? "is-favorable-weekend" : ""}`}
              key={day.date}
            >
              <div className="card-header">
                <div>
                  <p className="day-label">{day.label}</p>
                  <p className="date-stamp">{day.shortLabel}</p>
                </div>
                <span className={`badge ${day.weekend ? "is-weekend" : ""}`}>
                  {day.weekend ? "Weekend" : "Weekday"}
                </span>
              </div>

              <div className="wind-figure">{formatWind(day.averageWindKnots)}</div>

              <dl className="card-meta">
                <div>
                  <dt>Average daytime wind</dt>
                  <dd>{formatWind(day.averageWindKnots)}</dd>
                </div>
                <div>
                  <dt>Kite advice</dt>
                  <dd>{day.advice.label}</dd>
                </div>
              </dl>

              <p className="advice-detail">{day.advice.detail}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
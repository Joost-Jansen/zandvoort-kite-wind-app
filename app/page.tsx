import Link from "next/link";

import type { ForecastDay } from "@/lib/kite";
import { getZandvoortForecast } from "@/lib/open-meteo";

import { CalendarTools } from "./calendar-tools";

function formatWind(value: number) {
  return `${value.toFixed(1)} kn`;
}

function getDayStatus(day: ForecastDay) {
  if (day.averageWindKnots > 35) {
    return "Caution";
  }

  if (day.averageWindKnots >= 22) {
    return "Powered";
  }

  if (day.averageWindKnots >= 15) {
    return "Kiteable";
  }

  return "Light";
}

function getDayTone(day: ForecastDay) {
  if (day.averageWindKnots > 35) {
    return "is-caution";
  }

  if (day.averageWindKnots >= 22) {
    return "is-powered";
  }

  if (day.averageWindKnots >= 15) {
    return "is-kiteable";
  }

  return "is-light";
}

export default async function HomePage() {
  const forecast = await getZandvoortForecast();
  const favorableDays = forecast.filter((day) => day.advice.favorable);
  const bestDay = forecast.reduce((best, day) =>
    day.averageWindKnots > best.averageWindKnots ? day : best,
  );
  const nextKiteDay = favorableDays[0];
  const favorableWeekends = favorableDays.filter((day) => day.weekend).length;
  const gustiestDay = forecast.reduce((best, day) =>
    day.averageGustKnots > best.averageGustKnots ? day : best,
  );
  const bestWeekendDay = favorableDays.find((day) => day.weekend);

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Zandvoort aan Zee • 52.3745, 4.5305</p>
          <h1>14-day kite wind window for the Dutch coast.</h1>
          <p className="hero-text">
            Average daytime wind is calculated from 09:00 through 18:00 using
            Open-Meteo data in knots. Swipe or scroll sideways to scan further
            into the forecast, and use the export to block out kite-worthy days
            in your calendar.
          </p>

          <div className="hero-highlights">
            <div className="highlight-pill">
              <span>Best day</span>
              <strong>
                {bestDay.label} • {formatWind(bestDay.averageWindKnots)}
              </strong>
            </div>
            <div className="highlight-pill">
              <span>Next kite window</span>
              <strong>
                {nextKiteDay
                  ? `${nextKiteDay.label} • ${nextKiteDay.advice.label}`
                  : "No kiteable day in the current range"}
              </strong>
            </div>
          </div>
        </div>

        <div className="hero-actions">
          <Link className="primary-button" href="/api/kite-days">
            Export kite days as .ics
          </Link>
          <CalendarTools />
          <div className="hero-stats">
            <div>
              <span>Kiteable days</span>
              <strong>{favorableDays.length}</strong>
            </div>
            <div>
              <span>Weekend sessions</span>
              <strong>{favorableWeekends}</strong>
            </div>
            <div>
              <span>Forecast horizon</span>
              <strong>{forecast.length} days</strong>
            </div>
          </div>
          <p className="microcopy">
            Apple Calendar download plus a feed URL you can paste into Google Calendar's
            "Add by URL" flow.
          </p>
        </div>
      </section>

      <section className="insight-strip" aria-label="forecast summary">
        <article className="insight-card">
          <span className="insight-label">How to read it</span>
          <p>
            Every card shows the average wind between 09:00 and 18:00. That
            removes noisy overnight peaks and keeps the forecast closer to a real
            session planning view.
          </p>
        </article>
        <article className="insight-card">
          <span className="insight-label">Weekend logic</span>
          <p>
            Weekend cards turn green when the daytime average reaches at least 15
            knots, making likely session windows easier to spot at a glance.
          </p>
        </article>
        <article className="insight-card">
          <span className="insight-label">Calendar export</span>
          <p>
            The export includes only kite-worthy days, so the `.ics` file stays
            focused on realistic session candidates instead of all forecast days.
          </p>
        </article>
        <article className="insight-card">
          <span className="insight-label">Google Calendar</span>
          <p>
            Use the copied feed URL in Google Calendar under "Add calendar" and
            then "From URL" to subscribe instead of importing manually each time.
          </p>
        </article>
      </section>

      <section className="planning-grid" aria-label="planning extras">
        <article className="planning-card planning-card-map">
          <div className="section-header compact-header">
            <div>
              <p className="section-eyebrow">Beach map</p>
              <h2>Zandvoort at a glance.</h2>
            </div>
          </div>
          <div className="map-frame-wrap">
            <iframe
              className="map-frame"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.openstreetmap.org/export/embed.html?bbox=4.4855%2C52.3545%2C4.5755%2C52.3945&layer=mapnik&marker=52.3745%2C4.5305"
              title="Map of Zandvoort aan Zee"
            />
          </div>
          <p className="section-note map-note">
            Marker is centered on the forecast spot. Use this as a quick location anchor
            when sharing the planning page with riders.
          </p>
        </article>

        <article className="planning-card">
          <p className="section-eyebrow">Wind intelligence</p>
          <h2>What stands out in this run.</h2>
          <div className="mini-stat-list">
            <div>
              <span>Strongest gust profile</span>
              <strong>
                {gustiestDay.label} • {formatWind(gustiestDay.averageGustKnots)} gusts
              </strong>
            </div>
            <div>
              <span>Prevailing direction next session</span>
              <strong>
                {nextKiteDay
                  ? `${nextKiteDay.directionLabel} • ${nextKiteDay.averageDirectionDegrees}°`
                  : `${bestDay.directionLabel} • ${bestDay.averageDirectionDegrees}°`}
              </strong>
            </div>
            <div>
              <span>Best weekend shot</span>
              <strong>
                {bestWeekendDay
                  ? `${bestWeekendDay.label} • ${formatWind(bestWeekendDay.averageWindKnots)}`
                  : "No kiteable weekend day in this run"}
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section className="forecast-section" aria-label="14 day kite forecast">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Forecast timeline</p>
            <h2>Scroll forward to inspect the full wind window.</h2>
          </div>
          <p className="section-note">
            Horizontal scrolling is enabled so the forecast can stretch further
            into the future without crushing each day card.
          </p>
        </div>

        <div className="forecast-scroller">
          <div className="forecast-track">
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

                  <div className="card-status-row">
                    <span className={`signal-pill ${getDayTone(day)}`}>{getDayStatus(day)}</span>
                  </div>

                  <div className="wind-figure">{formatWind(day.averageWindKnots)}</div>

                  <dl className="card-meta">
                    <div>
                      <dt>Average daytime wind</dt>
                      <dd>{formatWind(day.averageWindKnots)}</dd>
                    </div>
                    <div>
                      <dt>Average gusts</dt>
                      <dd>{formatWind(day.averageGustKnots)}</dd>
                    </div>
                    <div>
                      <dt>Prevailing direction</dt>
                      <dd>
                        {day.directionLabel} • {day.averageDirectionDegrees}°
                      </dd>
                    </div>
                    <div>
                      <dt>Kite advice</dt>
                      <dd>{day.advice.label}</dd>
                    </div>
                    <div>
                      <dt>Planning confidence</dt>
                      <dd>{day.confidenceLabel}</dd>
                    </div>
                  </dl>

                  <p className="advice-detail">{day.advice.detail}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="methodology-panel" aria-label="forecast methodology">
        <div>
          <p className="section-eyebrow">Explainability</p>
          <h2>What the app is optimizing for.</h2>
        </div>
        <div className="method-grid">
          <article>
            <h3>Session-first averaging</h3>
            <p>
              The app deliberately averages only daytime hours, because that is
              a better planning signal than taking the full 24-hour day.
            </p>
          </article>
          <article>
            <h3>Safer kite banding</h3>
            <p>
              Where the original ranges overlap, the app prefers the smaller kite
              in the higher wind band so the recommendation remains conservative.
            </p>
          </article>
          <article>
            <h3>Actionable output</h3>
            <p>
              Instead of showing raw API output only, the interface translates it
              into a planning view: likely days, weekend opportunities, and a
              calendar export.
            </p>
          </article>
          <article>
            <h3>Direction and gust context</h3>
            <p>
              Daily cards now include average gusts and a prevailing wind direction,
              making the forecast more useful for deciding whether a day is merely
              windy or actually workable on the beach.
            </p>
          </article>
        </div>
      </section>

      <section className="methodology-panel" aria-label="calendar integration help">
        <div>
          <p className="section-eyebrow">Calendar workflow</p>
          <h2>How to get this into your planning tools.</h2>
        </div>
        <div className="method-grid">
          <article>
            <h3>Apple Calendar</h3>
            <p>
              Use the `.ics` export button for a quick one-off import of kite-worthy days.
            </p>
          </article>
          <article>
            <h3>Google Calendar</h3>
            <p>
              Copy the feed URL, then in Google Calendar choose "Add calendar" and
              "From URL" to subscribe to the live feed.
            </p>
          </article>
          <article>
            <h3>Sharing with friends</h3>
            <p>
              Send the live site link so other riders can inspect the wind window,
              map location, and export or subscribe from their own calendar account.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
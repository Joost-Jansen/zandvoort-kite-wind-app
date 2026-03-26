"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import type { ForecastDay } from "@/lib/kite";
import type { KiteLocation } from "@/lib/locations";

import { CalendarTools } from "./calendar-tools";

type ForecastPlannerProps = {
  forecast: ForecastDay[];
  location: KiteLocation;
  locations: KiteLocation[];
  spotRankings: Array<{
    location: KiteLocation;
    bestDay: ForecastDay;
    favorableDays: number;
    favorableWeekends: number;
    score: number;
  }>;
};

const HEAT_PATCH_LAYOUTS = Array.from({ length: 12 }, (_, index) => {
  const column = index % 4;
  const row = Math.floor(index / 4);

  return {
    left: `${-6 + column * 24 + (row % 2 === 0 ? 0 : 4)}%`,
    top: `${6 + row * 26 + (column % 2 === 0 ? 0 : 4)}%`,
    width: `${24 + ((index * 3) % 8)}%`,
    height: `${18 + ((index * 5) % 9)}%`,
    animationDelay: `${index * 0.45}s`,
  };
});

const FLOW_LINE_LAYOUTS = Array.from({ length: 36 }, (_, index) => {
  const column = index % 6;
  const row = Math.floor(index / 6);

  return {
    left: `${-10 + column * 18 + (row % 2 === 0 ? 0 : 5)}%`,
    top: `${8 + row * 14 + (column % 2 === 0 ? 0 : 2)}%`,
    width: `${14 + ((index * 7) % 10)}%`,
    animationDelay: `-${(row * 0.7 + column * 0.45).toFixed(2)}s`,
  };
});

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

function getDirectionArrowStyle(degrees: number) {
  return { transform: `rotate(${degrees}deg)` };
}

function getHeatStrengthClass(windKnots: number) {
  if (windKnots >= 22) {
    return "is-hot";
  }

  if (windKnots >= 15) {
    return "is-warm";
  }

  return "is-cool";
}

function getWindOverlayStyle(windKnots: number, directionDegrees: number) {
  const normalizedStrength = Math.min(Math.max((windKnots - 8) / 20, 0.2), 1);
  const flowDuration = Math.max(2.4, 5.8 - normalizedStrength * 2.2);
  const tintOpacity = 0.44 + normalizedStrength * 0.4;
  const streakOpacity = 0.4 + normalizedStrength * 0.44;
  const heatOpacity = 0.46 + normalizedStrength * 0.34;
  const arrowOpacity = 0.55 + normalizedStrength * 0.4;
  const lineThickness = 2 + normalizedStrength * 3;
  const arrowSize = 0.8 + normalizedStrength * 0.45;

  const overlayStyle: CSSProperties & Record<string, string> = {
    "--wind-angle": `${directionDegrees}deg`,
    "--wind-strength": `${normalizedStrength}`,
    "--flow-duration": `${flowDuration}s`,
    "--tint-opacity": `${tintOpacity}`,
    "--streak-opacity": `${streakOpacity}`,
    "--heat-opacity": `${heatOpacity}`,
    "--arrow-opacity": `${arrowOpacity}`,
    "--line-thickness": `${lineThickness}px`,
    "--arrow-size": `${arrowSize}rem`,
  };

  return overlayStyle;
}

function buildMapEmbedUrl(location: KiteLocation) {
  const west = (location.longitude - 0.045).toFixed(4);
  const south = (location.latitude - 0.02).toFixed(4);
  const east = (location.longitude + 0.045).toFixed(4);
  const north = (location.latitude + 0.02).toFixed(4);

  return `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`;
}

export function ForecastPlanner({ forecast, location, locations, spotRankings }: ForecastPlannerProps) {
  const favorableDays = useMemo(() => forecast.filter((day) => day.advice.favorable), [forecast]);
  const rankedDays = useMemo(
    () => [...forecast].sort((left, right) => right.averageWindKnots - left.averageWindKnots).slice(0, 3),
    [forecast],
  );
  const bestDay = useMemo(
    () => forecast.reduce((best, day) => (day.averageWindKnots > best.averageWindKnots ? day : best)),
    [forecast],
  );
  const gustiestDay = useMemo(
    () => forecast.reduce((best, day) => (day.averageGustKnots > best.averageGustKnots ? day : best)),
    [forecast],
  );
  const nextKiteDay = favorableDays[0];
  const favorableWeekends = favorableDays.filter((day) => day.weekend).length;
  const bestWeekendDay = favorableDays.find((day) => day.weekend);
  const topPlaces = spotRankings.slice(0, 5);
  const heatScale = [35, 27, 19, 11];

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const selectedDay = forecast[selectedDayIndex] ?? forecast[0];
  const [selectedHourTime, setSelectedHourTime] = useState(selectedDay.daylightHours[0]?.time ?? "09:00");

  useEffect(() => {
    setSelectedHourTime(selectedDay.daylightHours[0]?.time ?? "09:00");
  }, [selectedDay]);

  const selectedHour =
    selectedDay.daylightHours.find((hour) => hour.time === selectedHourTime) ?? selectedDay.daylightHours[0];
  const activeFlowLineCount =
    selectedHour.windKnots >= 24 ? 36 : selectedHour.windKnots >= 19 ? 28 : selectedHour.windKnots >= 15 ? 18 : 8;
  const activeHeatPatchCount =
    selectedHour.windKnots >= 24 ? 12 : selectedHour.windKnots >= 19 ? 9 : selectedHour.windKnots >= 15 ? 7 : 4;

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">{location.name} • {location.latitude}, {location.longitude}</p>
          <h1>Dutch kite forecast planner.</h1>
          <p className="hero-text">
            Average daytime wind is calculated from 09:00 through 18:00 using Open-Meteo data in knots.
            Switch between Dutch kite spots, then select any day and hour below to project that wind slot directly onto the beach map.
          </p>

          <div className="location-switcher" aria-label="Dutch kite locations">
            {locations.map((candidate) => (
              <Link
                className={`location-chip ${candidate.slug === location.slug ? "is-active" : ""}`}
                href={`/?location=${candidate.slug}`}
                key={candidate.slug}
              >
                <span>{candidate.shortName}</span>
                <strong>{candidate.region}</strong>
              </Link>
            ))}
          </div>

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
                {nextKiteDay ? `${nextKiteDay.label} • ${nextKiteDay.advice.label}` : "No kiteable day in range"}
              </strong>
            </div>
          </div>
        </div>

        <div className="hero-actions">
          <Link className="primary-button" href={`/api/kite-days?location=${location.slug}`}>
            Export kite days as .ics
          </Link>
          <CalendarTools locationSlug={location.slug} />
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
            Apple Calendar download plus a feed URL you can paste into Google Calendar&apos;s add-by-URL flow.
          </p>
        </div>
      </section>

      <section className="planning-grid" aria-label="planning extras">
        <article className="planning-card planning-card-map">
          <div className="section-header compact-header">
            <div>
              <p className="section-eyebrow">Selected session map</p>
              <h2>{location.shortName} • {selectedDay.label} at {selectedHour.time}</h2>
            </div>
          </div>

          <div className={`map-frame-wrap map-overlay ${getHeatStrengthClass(selectedHour.windKnots)}`}>
            <iframe
              className="map-frame"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={buildMapEmbedUrl(location)}
              title={`Map of ${location.name}`}
            />
            <div className="wind-overlay-vector" style={getWindOverlayStyle(selectedHour.windKnots, selectedHour.directionDegrees)}>
              <div className="wind-overlay-tint" />
              <div className="wind-heat-layer">
                {HEAT_PATCH_LAYOUTS.map((patch, index) => (
                  <span
                    className={`wind-heat-patch ${index < activeHeatPatchCount ? "is-active" : "is-muted"}`}
                    key={`patch-${index}`}
                    style={patch}
                  />
                ))}
              </div>
              <div className="wind-flow-layer">
                {FLOW_LINE_LAYOUTS.map((line, index) => (
                  <span
                    className={`wind-flow-line ${index < activeFlowLineCount ? "is-active" : "is-muted"}`}
                    key={`line-${index}`}
                    style={line}
                  >
                    <span className="wind-flow-arrow">➜</span>
                  </span>
                ))}
              </div>
              <div className="wind-overlay-scale" aria-hidden="true">
                <span className="scale-unit">kn</span>
                {heatScale.map((value) => (
                  <div className="scale-row" key={value}>
                    <span className={`scale-swatch scale-${value}`} />
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <div className="wind-overlay-direction-chip">
                <span className="wind-overlay-arrow">➜</span>
                <strong>{selectedHour.directionLabel}</strong>
              </div>
            </div>
            <div className="wind-overlay-panel">
              <span>Selected wind slot</span>
              <strong>{formatWind(selectedHour.windKnots)}</strong>
              <p>
                Gusts {formatWind(selectedHour.gustKnots)} • {selectedHour.directionLabel} {selectedHour.directionDegrees}°
              </p>
            </div>
            <div className="wind-overlay-legend">
              <span>Map overlay</span>
              <strong>{selectedHour.directionLabel} flow toward spot</strong>
            </div>
          </div>

          <div className="hour-chip-row" aria-label="selected day hours">
            {selectedDay.daylightHours.map((hour) => (
              <button
                className={`hour-chip ${hour.time === selectedHour.time ? "is-active" : ""}`}
                key={`${selectedDay.date}-${hour.time}`}
                onClick={() => setSelectedHourTime(hour.time)}
                type="button"
              >
                <span>{hour.time}</span>
                <strong>{formatWind(hour.windKnots)}</strong>
              </button>
            ))}
          </div>

          <p className="section-note map-note">
            This is a point-based wind visualization for the selected {location.name} spot, derived from Open-Meteo hourly forecast data.
          </p>
        </article>

        <div className="priority-stack">
          <article className="planning-card">
            <p className="section-eyebrow">Top Dutch spots</p>
            <h2>Best places in this forecast run.</h2>
            <div className="spot-ranking-list">
              {topPlaces.map((entry, index) => (
                <Link
                  className={`spot-ranking-item ${entry.location.slug === location.slug ? "is-selected" : ""}`}
                  href={`/?location=${entry.location.slug}`}
                  key={entry.location.slug}
                >
                  <div className="spot-ranking-index">0{index + 1}</div>
                  <div className="spot-ranking-copy">
                    <strong>
                      {entry.location.shortName} • {formatWind(entry.bestDay.averageWindKnots)}
                    </strong>
                    <p>
                      {entry.bestDay.label} • {entry.favorableDays} kiteable days • {entry.favorableWeekends} weekend shots
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article className="planning-card">
            <p className="section-eyebrow">Top days here</p>
            <h2>Best sessions for {location.shortName}.</h2>
            <div className="ranked-session-list compact-ranked-list">
              {rankedDays.map((day, index) => (
                <button
                  className={`ranked-session ranked-session-button ${day.date === selectedDay.date ? "is-selected" : ""}`}
                  key={day.date}
                  onClick={() => setSelectedDayIndex(forecast.findIndex((item) => item.date === day.date))}
                  type="button"
                >
                  <div className="rank-index">0{index + 1}</div>
                  <div className="rank-copy">
                    <strong>
                      {day.label} • {formatWind(day.averageWindKnots)}
                    </strong>
                    <p>
                      {day.advice.label} • Gusts {formatWind(day.averageGustKnots)} • {day.directionLabel}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="planning-grid planning-grid-ranked" aria-label="forecast guidance">
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

        <article className="planning-card">
          <p className="section-eyebrow">Interactive map</p>
          <h2>How to read the live overlay.</h2>
          <div className="mini-stat-list">
            <div>
              <span>Animated flow</span>
              <strong>The moving stream shows wind direction and relative force for the selected hour.</strong>
            </div>
            <div>
              <span>Map behavior</span>
              <strong>Select a day, then an hour chip, and the map overlay updates instantly for that slot.</strong>
            </div>
            <div>
              <span>Calendar export</span>
              <strong>Exports and feed subscriptions stay location-specific, so each Dutch spot can be tracked separately.</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="insight-strip" aria-label="forecast summary">
        <article className="insight-card">
          <span className="insight-label">Weekend logic</span>
          <p>
            Weekend cards turn green when the daytime average reaches at least 15 knots, making likely session windows easier to spot.
          </p>
        </article>
        <article className="insight-card">
          <span className="insight-label">Calendar export</span>
          <p>
            The export includes only kite-worthy days, so the .ics file stays focused on realistic session candidates.
          </p>
        </article>
        <article className="insight-card">
          <span className="insight-label">Google Calendar</span>
          <p>
            Copy the feed URL and use Google Calendar&apos;s From URL option to subscribe instead of importing manually each time.
          </p>
        </article>
        <article className="insight-card">
          <span className="insight-label">Nationwide planning</span>
          <p>
            The planner now ranks the strongest Dutch kite spots in this forecast run so you can switch locations instead of checking one beach at a time.
          </p>
        </article>
      </section>

      <section className="forecast-section" aria-label="14 day kite forecast">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Forecast timeline</p>
            <h2>Scroll forward to inspect the full wind window.</h2>
          </div>
          <p className="section-note">
            Click any day card to move the map to that forecast window. Use the hour chips on the map panel to refine timing.
          </p>
        </div>

        <div className="forecast-scroller">
          <div className="forecast-track">
            {forecast.map((day, index) => {
              const weekendHighlight = day.weekend && day.averageWindKnots >= 15;
              const showMonthMarker = index === 0 || day.monthLabel !== forecast[index - 1].monthLabel;

              return (
                <div className="timeline-slot" key={day.date}>
                  {showMonthMarker ? <div className="month-marker">{day.monthLabel}</div> : null}
                  <button
                    className={`forecast-card forecast-card-button ${weekendHighlight ? "is-favorable-weekend" : ""} ${index === 0 ? "is-today" : ""} ${selectedDay.date === day.date ? "is-selected" : ""}`}
                    onClick={() => setSelectedDayIndex(index)}
                    type="button"
                  >
                    <div className="card-header">
                      <div>
                        <p className="day-label">{day.label}</p>
                        <p className="date-stamp">{day.shortLabel}</p>
                      </div>
                      <span className={`badge ${day.weekend ? "is-weekend" : ""}`}>
                        {index === 0 ? "Today" : day.weekend ? "Weekend" : "Weekday"}
                      </span>
                    </div>

                    <div className="card-status-row">
                      <span className={`signal-pill ${getDayTone(day)}`}>{getDayStatus(day)}</span>
                      <div className="direction-chip">
                        <span className="direction-arrow" style={getDirectionArrowStyle(day.averageDirectionDegrees)}>
                          ↑
                        </span>
                        <span>
                          {day.directionLabel} • {day.averageDirectionDegrees}°
                        </span>
                      </div>
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
                        <dt>Kite advice</dt>
                        <dd>{day.advice.label}</dd>
                      </div>
                      <div>
                        <dt>Planning confidence</dt>
                        <dd>{day.confidenceLabel}</dd>
                      </div>
                    </dl>

                    <p className="advice-detail">{day.advice.detail}</p>

                    <div className="card-cta">Select day on map</div>
                  </button>
                </div>
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
              The app deliberately averages only daytime hours, because that is a better planning signal than taking the full 24-hour day.
            </p>
          </article>
          <article>
            <h3>Safer kite banding</h3>
            <p>
              Where the original ranges overlap, the app prefers the smaller kite in the higher wind band so the recommendation remains conservative.
            </p>
          </article>
          <article>
            <h3>Point-based map overlay</h3>
            <p>
              The map overlay reflects the selected Dutch spot point forecast. It is not a regional wind field heatmap, but it does visualize direction and intensity for the chosen slot.
            </p>
          </article>
          <article>
            <h3>Direction and gust context</h3>
            <p>
              Daily cards include average gusts and a prevailing wind direction, making the forecast more useful for deciding whether a day is merely windy or actually workable.
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
            <p>Use the .ics export button for a quick one-off import of kite-worthy days.</p>
          </article>
          <article>
            <h3>Google Calendar</h3>
            <p>Copy the feed URL, then in Google Calendar choose Add calendar and From URL to subscribe to the live feed.</p>
          </article>
          <article>
            <h3>Sharing with friends</h3>
            <p>Send the live site link so other riders can inspect the wind window, map location, and export or subscribe from their own calendar account.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
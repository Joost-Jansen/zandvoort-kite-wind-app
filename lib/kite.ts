const FAVORABLE_WIND_KN = 15;

export type KiteAdvice = {
  label: string;
  detail: string;
  favorable: boolean;
};

export type ForecastDay = {
  date: string;
  label: string;
  shortLabel: string;
  monthLabel: string;
  weekend: boolean;
  averageWindKnots: number;
  averageGustKnots: number;
  averageDirectionDegrees: number;
  directionLabel: string;
  confidenceLabel: string;
  daylightHours: Array<{
    time: string;
    windKnots: number;
    gustKnots: number;
    directionDegrees: number;
    directionLabel: string;
  }>;
  advice: KiteAdvice;
};

type OpenMeteoResponse = {
  hourly?: {
    time?: string[];
    wind_speed_10m?: number[];
    wind_gusts_10m?: number[];
    wind_direction_10m?: number[];
  };
};

const formatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Europe/Amsterdam",
});

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "Europe/Amsterdam",
});

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function roundToWholeNumber(value: number) {
  return Math.round(value);
}

function isWeekend(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 || weekday === 6;
}

function formatDate(date: string) {
  return formatter.format(new Date(`${date}T12:00:00+01:00`));
}

function formatMonth(date: string) {
  return monthFormatter.format(new Date(`${date}T12:00:00+01:00`));
}

function degreesToCompass(degrees: number) {
  const sectors = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const normalizedDegrees = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalizedDegrees / 45) % sectors.length;
  return sectors[index];
}

function getConfidenceLabel(dayIndex: number) {
  if (dayIndex <= 2) {
    return "High confidence";
  }

  if (dayIndex <= 6) {
    return "Medium confidence";
  }

  return "Long-range signal";
}

export function getKiteAdvice(averageWindKnots: number): KiteAdvice {
  if (averageWindKnots > 35) {
    return {
      label: "Outside planned range",
      detail: "Average wind is above 35 kn. Review safety and local conditions carefully.",
      favorable: false,
    };
  }

  if (averageWindKnots >= 22 && averageWindKnots <= 35) {
    return {
      label: "RRD 5m²",
      detail: "High-wind setup for powered sessions.",
      favorable: true,
    };
  }

  if (averageWindKnots >= 19) {
    return {
      label: "RRD 7m²",
      detail: "Strong conditions with a smaller all-round kite.",
      favorable: true,
    };
  }

  if (averageWindKnots >= 15) {
    return {
      label: "10m² kite",
      detail: "Solid freeride range for a larger kite.",
      favorable: true,
    };
  }

  return {
    label: "No kite recommendation",
    detail: "Average daytime wind is below 15 kn.",
    favorable: false,
  };
}

export function mapForecast(response: OpenMeteoResponse): ForecastDay[] {
  const times = response.hourly?.time;
  const speeds = response.hourly?.wind_speed_10m;
  const gusts = response.hourly?.wind_gusts_10m;
  const directions = response.hourly?.wind_direction_10m;

  if (
    !times ||
    !speeds ||
    !gusts ||
    !directions ||
    times.length !== speeds.length ||
    times.length !== gusts.length ||
    times.length !== directions.length
  ) {
    throw new Error("Open-Meteo response is missing hourly wind data.");
  }

  const buckets = new Map<
    string,
    {
      speeds: number[];
      gusts: number[];
      directions: number[];
      daylightHours: Array<{
        time: string;
        windKnots: number;
        gustKnots: number;
        directionDegrees: number;
      }>;
    }
  >();

  times.forEach((time, index) => {
    const [date, hourPart] = time.split("T");
    const hour = Number(hourPart.split(":")[0]);

    if (hour < 9 || hour > 18) {
      return;
    }

    const current = buckets.get(date) ?? { speeds: [], gusts: [], directions: [], daylightHours: [] };
    current.speeds.push(speeds[index]);
    current.gusts.push(gusts[index]);
    current.directions.push(directions[index]);
    current.daylightHours.push({
      time: `${hourPart.slice(0, 5)}`,
      windKnots: roundToSingleDecimal(speeds[index]),
      gustKnots: roundToSingleDecimal(gusts[index]),
      directionDegrees: roundToWholeNumber(directions[index]),
    });
    buckets.set(date, current);
  });

  return [...buckets.entries()].map(([date, values], dayIndex) => {
    const averageWindKnots = roundToSingleDecimal(
      values.speeds.reduce((sum, value) => sum + value, 0) / values.speeds.length,
    );
    const averageGustKnots = roundToSingleDecimal(
      values.gusts.reduce((sum, value) => sum + value, 0) / values.gusts.length,
    );
    const averageDirectionDegrees = roundToWholeNumber(
      values.directions.reduce((sum, value) => sum + value, 0) / values.directions.length,
    );
    const advice = getKiteAdvice(averageWindKnots);
    const weekend = isWeekend(date);

    return {
      date,
      label: formatDate(date),
      shortLabel: date,
      monthLabel: formatMonth(date),
      weekend,
      averageWindKnots,
      averageGustKnots,
      averageDirectionDegrees,
      directionLabel: degreesToCompass(averageDirectionDegrees),
      confidenceLabel: getConfidenceLabel(dayIndex),
      daylightHours: values.daylightHours.map((hour) => ({
        ...hour,
        directionLabel: degreesToCompass(hour.directionDegrees),
      })),
      advice,
    };
  });
}

export function getFavorableDays(days: ForecastDay[]) {
  return days.filter((day) => day.averageWindKnots >= FAVORABLE_WIND_KN);
}
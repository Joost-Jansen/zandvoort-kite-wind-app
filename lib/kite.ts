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
  weekend: boolean;
  averageWindKnots: number;
  advice: KiteAdvice;
};

type OpenMeteoResponse = {
  hourly?: {
    time?: string[];
    wind_speed_10m?: number[];
  };
};

const formatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Europe/Amsterdam",
});

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function isWeekend(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 || weekday === 6;
}

function formatDate(date: string) {
  return formatter.format(new Date(`${date}T12:00:00+01:00`));
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

  if (!times || !speeds || times.length !== speeds.length) {
    throw new Error("Open-Meteo response is missing hourly wind data.");
  }

  const buckets = new Map<string, number[]>();

  times.forEach((time, index) => {
    const [date, hourPart] = time.split("T");
    const hour = Number(hourPart.split(":")[0]);

    if (hour < 9 || hour > 18) {
      return;
    }

    const speed = speeds[index];
    const current = buckets.get(date) ?? [];
    current.push(speed);
    buckets.set(date, current);
  });

  return [...buckets.entries()].map(([date, values]) => {
    const averageWindKnots = roundToSingleDecimal(
      values.reduce((sum, value) => sum + value, 0) / values.length,
    );
    const advice = getKiteAdvice(averageWindKnots);
    const weekend = isWeekend(date);

    return {
      date,
      label: formatDate(date),
      shortLabel: date,
      weekend,
      averageWindKnots,
      advice,
    };
  });
}

export function getFavorableDays(days: ForecastDay[]) {
  return days.filter((day) => day.averageWindKnots >= FAVORABLE_WIND_KN);
}
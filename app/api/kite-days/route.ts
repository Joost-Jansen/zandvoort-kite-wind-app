import { getFavorableDays } from "@/lib/kite";
import { getZandvoortForecast } from "@/lib/open-meteo";

function formatCalendarDate(date: string) {
  return date.replaceAll("-", "");
}

function nextDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10).replaceAll("-", "");
}

function escapeText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const forecast = await getZandvoortForecast();
  const kiteDays = getFavorableDays(forecast);
  const stamp = new Date().toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");

  const events = kiteDays
    .map((day) => {
      const summary = escapeText("Kite day in Zandvoort");
      const description = escapeText(
        `Average daytime wind: ${day.averageWindKnots.toFixed(1)} kn\nAdvice: ${day.advice.label}`,
      );

      return [
        "BEGIN:VEVENT",
        `UID:${day.date}@zandvoort-kite-wind`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${formatCalendarDate(day.date)}`,
        `DTEND;VALUE=DATE:${nextDate(day.date)}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zandvoort Kite Wind//EN",
    "CALSCALE:GREGORIAN",
    events,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      ...(mode === "feed"
        ? {}
        : {
            "Content-Disposition": 'attachment; filename="zandvoort-kite-days.ics"',
          }),
    },
  });
}
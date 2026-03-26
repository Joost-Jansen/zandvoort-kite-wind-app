"use client";

import { useState } from "react";

const GOOGLE_CALENDAR_ADD_BY_URL = "https://calendar.google.com/calendar/u/0/r/settings/addbyurl";

export function CalendarTools() {
  const [copyLabel, setCopyLabel] = useState("Copy calendar feed URL");

  async function copyFeedUrl() {
    const feedUrl = `${window.location.origin}/api/kite-days?mode=feed`;
    await navigator.clipboard.writeText(feedUrl);
    setCopyLabel("Feed URL copied");
    window.setTimeout(() => setCopyLabel("Copy calendar feed URL"), 2000);
  }

  return (
    <div className="calendar-tools">
      <button className="secondary-button" onClick={copyFeedUrl} type="button">
        {copyLabel}
      </button>
      <a className="ghost-button" href={GOOGLE_CALENDAR_ADD_BY_URL} rel="noreferrer" target="_blank">
        Open Google Calendar
      </a>
    </div>
  );
}
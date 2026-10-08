import { AnimeMedia } from "./types";

/**
 * Format a Date object into UTC iCalendar format (YYYYMMDDTHHmmssZ)
 */
function formatIcsDate(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Escape text for iCalendar RFC 5545
 */
function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate iCalendar (.ics) string for a list of anime with nextAiringEpisode
 */
export function generateScheduleIcs(animeList: AnimeMedia[]): string {
  const now = new Date();
  const dtStamp = formatIcsDate(now);

  const events: string[] = [];

  for (const anime of animeList) {
    if (!anime.nextAiringEpisode) continue;

    const airTime = new Date(anime.nextAiringEpisode.airingAt * 1000);
    // Typical anime broadcast duration: 25 minutes
    const endTime = new Date(airTime.getTime() + 25 * 60 * 1000);

    const title = anime.title.english || anime.title.romaji;
    const epNum = anime.nextAiringEpisode.episode;
    const summary = `${title} - Episode ${epNum} Broadcast`;
    const description = `New episode of ${title} (Episode ${epNum}) is airing.\n\nWatch details & streaming platforms: https://animedb.org/anime/${anime.id}`;
    const uid = `animedb-${anime.id}-ep${epNum}-${anime.nextAiringEpisode.airingAt}@animedb.org`;

    events.push([
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${formatIcsDate(airTime)}`,
      `DTEND:${formatIcsDate(endTime)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `URL:https://animedb.org/anime/${anime.id}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Episode starting in 15 minutes!",
      "TRIGGER:-PT15M",
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n"));
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AnimeDB//Anime Broadcast Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:AnimeDB Airing Schedule",
    "X-WR-TIMEZONE:UTC",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Trigger client-side download of the .ics file
 */
export function downloadScheduleIcs(animeList: AnimeMedia[], filename = "AnimeDB_Airing_Schedule.ics") {
  const icsContent = generateScheduleIcs(animeList);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a direct Google Calendar web link for a single episode
 */
export function getGoogleCalendarUrl(anime: AnimeMedia): string | null {
  if (!anime.nextAiringEpisode) return null;
  const airTime = new Date(anime.nextAiringEpisode.airingAt * 1000);
  const endTime = new Date(airTime.getTime() + 25 * 60 * 1000);

  const title = anime.title.english || anime.title.romaji;
  const ep = anime.nextAiringEpisode.episode;
  const text = encodeURIComponent(`${title} - Ep ${ep} Airing`);
  const dates = `${formatIcsDate(airTime)}/${formatIcsDate(endTime)}`;
  const details = encodeURIComponent(
    `Official broadcast of ${title} Episode ${ep}.\n\nStreaming Guide: https://animedb.org/anime/${anime.id}`
  );
  const location = encodeURIComponent("Japanese TV / Crunchyroll / Netflix");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}

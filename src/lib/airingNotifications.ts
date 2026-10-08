import { AnimeMedia } from "./types";

const REMINDERS_KEY = "animedb_airing_reminders";

export interface AiringReminderItem {
  animeId: number;
  title: string;
  episode: number;
  airingAt: number;
  coverImage?: string;
}

export function getSubscribedReminders(): Record<number, AiringReminderItem> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(REMINDERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isReminderSubscribed(animeId: number): boolean {
  const reminders = getSubscribedReminders();
  return !!reminders[animeId];
}

export async function toggleAiringReminder(anime: AnimeMedia): Promise<{
  subscribed: boolean;
  permissionGranted: boolean;
}> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { subscribed: false, permissionGranted: false };
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  const reminders = getSubscribedReminders();
  const alreadySubscribed = !!reminders[anime.id];

  if (alreadySubscribed) {
    delete reminders[anime.id];
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    return { subscribed: false, permissionGranted: permission === "granted" };
  }

  if (anime.nextAiringEpisode) {
    const title = anime.title.english || anime.title.romaji;
    reminders[anime.id] = {
      animeId: anime.id,
      title,
      episode: anime.nextAiringEpisode.episode,
      airingAt: anime.nextAiringEpisode.airingAt,
      coverImage: anime.coverImage.medium,
    };
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));

    if (permission === "granted") {
      // Trigger a gentle confirmation notification
      new Notification(`🔔 Reminder Set: ${title}`, {
        body: `You will be alerted 10 minutes before Episode ${anime.nextAiringEpisode.episode} broadcasts!`,
        icon: anime.coverImage.medium || "/favicon.ico",
      });
    }

    return { subscribed: true, permissionGranted: permission === "granted" };
  }

  return { subscribed: false, permissionGranted: permission === "granted" };
}

import { syncAiringAnime } from "./airingSync";
import { getAiringSyncSettings } from "./settings";

declare global {
  // eslint-disable-next-line no-var
  var __airingCronTimer: NodeJS.Timeout | undefined;
  // eslint-disable-next-line no-var
  var __airingCronInitialized: boolean | undefined;
}

const CRON_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export function initAiringCron() {
  if (global.__airingCronInitialized) {
    return;
  }

  global.__airingCronInitialized = true;
  console.log("[Airing Cron] Initializing automated 30-minute airing schedule monitor...");

  // Clear existing if any
  if (global.__airingCronTimer) {
    clearInterval(global.__airingCronTimer);
  }

  // Set recurring 30-minute interval
  global.__airingCronTimer = setInterval(async () => {
    try {
      const settings = await getAiringSyncSettings();
      if (!settings.autoSyncEnabled) {
        return;
      }

      console.log("[Airing Cron] Running scheduled 30-minute airing sync check...");
      const result = await syncAiringAnime({ trigger: "auto_cron" });
      console.log(
        `[Airing Cron] Sync complete: status=${result.status}, checked=${result.checkedCount}, changed=${result.changedCount} (${result.executionTimeMs}ms)`
      );
    } catch (err: any) {
      console.error("[Airing Cron] Scheduled sync error:", err.message);
    }
  }, CRON_INTERVAL_MS);
}

// Automatically invoke on module load so it starts with the server
initAiringCron();

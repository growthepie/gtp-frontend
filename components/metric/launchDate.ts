import { Chains } from "@/types/api/MasterResponse";

export const DAY_MS = 24 * 60 * 60 * 1000;

export type SinceLaunchInterval = "daily" | "weekly" | "monthly";

export const SINCE_LAUNCH_MAX_BY_INTERVAL: Record<SinceLaunchInterval, number> = {
  daily: 100,
  weekly: 52,
  monthly: 36,
};

export const SINCE_LAUNCH_UNIT_BY_INTERVAL: Record<SinceLaunchInterval, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
};

export const SINCE_LAUNCH_TOOLTIP_BY_INTERVAL: Record<SinceLaunchInterval, string> = {
  daily: "This mode shows the first 100 days since public mainnet launch of the chain.",
  weekly: "This mode shows the first 52 weeks since public mainnet launch of the chain.",
  monthly: "This mode shows the first 36 months since public mainnet launch of the chain.",
};

export const getLaunchTimestamp = (
  chains: Chains | undefined,
  chainKey: string,
): number | null => {
  const launchDate = chains?.[chainKey]?.launch_date;
  if (!launchDate) return null;

  const dateOnlyMatch = launchDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timestamp = dateOnlyMatch
    ? Date.UTC(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : new Date(launchDate).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
};

export const isSinceLaunchInterval = (interval: string): interval is SinceLaunchInterval =>
  interval === "daily" || interval === "weekly" || interval === "monthly";

export const getRelativeLaunchIndex = (
  timestamp: number,
  launchTimestamp: number,
  interval: SinceLaunchInterval,
) => {
  if (interval === "monthly") {
    const current = new Date(timestamp);
    const launch = new Date(launchTimestamp);
    const monthIndex =
      (current.getUTCFullYear() - launch.getUTCFullYear()) * 12 +
      current.getUTCMonth() -
      launch.getUTCMonth();
    return Math.max(0, monthIndex);
  }

  const elapsedDays = Math.floor((timestamp - launchTimestamp) / DAY_MS);
  const divisor = interval === "weekly" ? 7 : 1;
  return Math.max(0, Math.floor(elapsedDays / divisor));
};

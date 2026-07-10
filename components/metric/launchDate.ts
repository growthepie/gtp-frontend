import { Chains } from "@/types/api/MasterResponse";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const SINCE_LAUNCH_MAX_DAYS = 100;

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

export const getRelativeLaunchDay = (
  timestamp: number,
  launchTimestamp: number,
) => Math.max(0, Math.round((timestamp - launchTimestamp) / DAY_MS));

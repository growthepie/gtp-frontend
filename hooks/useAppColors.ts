"use client";
import useSWRImmutable from "swr/immutable";

type AppColorsResponse = {
  version: number;
  generated_at: string;
  colors: Record<string, { light: [string, string]; dark: [string, string] }>;
};

const APP_COLORS_URL = "https://api.growthepie.com/v1/apps/scrape/apps-colors.json";

const DEFAULT_APP_COLOR: [string, string] = ["#627EEA", "#627EEA"];

const fetcher = (url: string): Promise<AppColorsResponse> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

export function useAppColors() {
  const { data } = useSWRImmutable<AppColorsResponse>(APP_COLORS_URL, fetcher);

  const getAppColors = (
    ownerProject: string,
    theme: string = "dark",
  ): [string, string] => {
    const colorTheme = theme === "light" ? "light" : "dark";
    return data?.colors?.[ownerProject]?.[colorTheme] ?? DEFAULT_APP_COLOR;
  };

  return { appColorsData: data?.colors, getAppColors };
}

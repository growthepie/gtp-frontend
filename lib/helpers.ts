export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

export const BASE_URLS = {
  development: `http://${process.env.NEXT_PUBLIC_VERCEL_URL}`,
  preview: "https://dev.growthepie.xyz",
  production: `https://www.growthepie.xyz`,
};

export const BASE_URL =
  BASE_URLS[process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development"];

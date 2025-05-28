export const IS_DEVELOPMENT =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development";
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
export const IS_PRODUCTION =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

export const BASE_URLS = {
  development: `http://${process.env.NEXT_PUBLIC_VERCEL_URL}`,
  preview: "https://dev.growthepie.com",
  production: `https://www.growthepie.com`,
};

export const BASE_URL =
  BASE_URLS[
    // IS_DEVELOPMENT added Sep 9 2024 - so notifications show up on local dev
    IS_DEVELOPMENT
      ? "development"
      : process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL?.includes("dev-")
      ? "preview"
      : "production"
  ];

export const IS_DEVELOPMENT =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development";
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
export const IS_PRODUCTION =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

// Helper function to determine if we're on a .com domain
const isComDomain = () => {
  if (typeof window !== "undefined") {
    return window.location.hostname.includes(".com");
  }
  return process.env.NEXT_PUBLIC_VERCEL_URL?.includes(".com") || false;
};

export const BASE_URLS = {
  development: `http://${process.env.NEXT_PUBLIC_VERCEL_URL}`,
  preview: "https://dev.growthepie.xyz",
  production: isComDomain() ? "https://www.growthepie.com" : "https://www.growthepie.xyz",
  "production-com": "https://www.growthepie.com",
  "production-xyz": "https://www.growthepie.xyz",
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

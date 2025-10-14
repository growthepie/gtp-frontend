export const IS_DEVELOPMENT =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development";
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
export const IS_PRODUCTION =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

// get current http or https
export const CURRENT_PROTOCOL = typeof window !== "undefined" ? window.location.protocol : "https:";

export const AUTH_SUBDOMAIN = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN;

export const BASE_URLS = {
  development: `${CURRENT_PROTOCOL}//${process.env.NEXT_PUBLIC_VERCEL_URL}`,
  preview: AUTH_SUBDOMAIN ? `https://${AUTH_SUBDOMAIN}.growthepie.com` : "https://dev.growthepie.com",
  production: AUTH_SUBDOMAIN ? `https://${AUTH_SUBDOMAIN}.growthepie.com` : "https://www.growthepie.com",
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


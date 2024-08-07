export const DOMAINS = {
  FEES: "fees.growthepie.xyz",
  LABELS: "labels.growthepie.xyz",
  MAIN: "www.growthepie.xyz",
};

// PRODUCTION_DOMAIN is a custom ENV variable set on the production, dev, fees, and labels branches on Vercel
export const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || DOMAINS.MAIN;

export const IS_DEVELOPMENT =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development";
export const IS_PREVIEW =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" &&
  PRODUCTION_DOMAIN === DOMAINS.MAIN;
export const IS_PRODUCTION =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

// NEXT_PUBLIC_VERCEL_ENV is a Vercel ENV variable that is set to "preview" when a preview deployment is created
export const IS_VERCEL_PREVIEW =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

export const BASE_URLS = {
  development: `http://${process.env.NEXT_PUBLIC_VERCEL_URL}`,
  preview: `https://dev.growthepie.xyz`,
  production: `https://${PRODUCTION_DOMAIN}`,
};

// if IS_VERCEL_PREVIEW and PRODUCTION_DOMAIN is not www.growthepie.eth, this is a production site and BASE_URL should be the PRODUCTION_DOMAIN

// default BASE_URL is production URL from BASE_URLS
let baseUrl = BASE_URLS.production;

// if IS_VERCEL_PREVIEW and PRODUCTION_DOMAIN is www.growthepie.eth, this is a preview site and BASE_URL should be the preview URL
if (IS_VERCEL_PREVIEW && PRODUCTION_DOMAIN === DOMAINS.MAIN) {
  baseUrl = BASE_URLS.preview;
}

// if IS_VERCEL_PREVIEW and PRODUCTION_DOMAIN is not www.growthepie.eth, this is a production site and BASE_URL should be the production URL
if (IS_VERCEL_PREVIEW && PRODUCTION_DOMAIN !== DOMAINS.MAIN) {
  baseUrl = BASE_URLS.production;
}

export const BASE_URL = baseUrl;

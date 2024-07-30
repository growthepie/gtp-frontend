import {
  IS_DEVELOPMENT,
  IS_PREVIEW,
  IS_PRODUCTION,
  urls,
} from "gtp.branch.config";

export { IS_DEVELOPMENT, IS_PREVIEW, IS_PRODUCTION };

export const BASE_URLS = {
  development: `http://${process.env.NEXT_PUBLIC_VERCEL_URL}`,
  preview: urls.preview,
  production: urls.production,
};

export const BASE_URL = BASE_URLS["production"];

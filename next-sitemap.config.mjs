import { DOMAINS, PRODUCTION_DOMAIN } from "./lib/helpers.mjs";
import { sitemapConfig as feesSiteConfig } from "./gtp.fees.config.mjs";
import { sitemapConfig as labelsSiteConfig } from "./gtp.labels.config.mjs";
import { sitemapConfig as mainSiteConfig } from "./gtp.main.config.mjs";

console.log("PRODUCTION_DOMAIN", PRODUCTION_DOMAIN);

let exportOjb = mainSiteConfig;

if (PRODUCTION_DOMAIN === DOMAINS.LABELS) {
  exportOjb = labelsSiteConfig;
}
if (PRODUCTION_DOMAIN === DOMAINS.FEES) {
  exportOjb = feesSiteConfig;
}

console.log("exportOjb", exportOjb);

/** @type {import('next-sitemap').IConfig} */
export default exportOjb;

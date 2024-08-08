const baseUrl = "https://www.growthepie.xyz";

// for www.growthepie.xyz & dev.growthepie.xyz
const gtpMain = {
  siteUrl: "https://www.growthepie.xyz",
  generateRobotsTxt: true,
  exclude: [
    "/server-sitemap.xml",
    "/blog",
    "/api/*",
    "/embed/*",
    "/embed",
    "/trackers/*",
    "/blockspace/*",
    "/fees",
    "/helpers",
    "/fees-explainer",
    "/contracts",
    "/economics",
    "/scroll",
    "/labels",
    "/refactor",
  ],
  robotsTxtOptions: {
    exclude: ["/server-sitemap.xml"],
    additionalSitemaps: [`https://www.growthepie.xyz/server-sitemap.xml`],
  },
};

// for fees.growthepie.xyz & dev.fees.growthepie.xyz
const gtpFees = {
  siteUrl: "https://fees.growthepie.xyz",
  generateRobotsTxt: true,
  exclude: [
    "/blog",
    "/api/*",
    "/embed/*",
    "/embed",
    "/trackers/*",
    "/blockspace/*",
    "/fees",
    "/contracts",
    "/contributors",
    "/imprint",
    "/privacy-policy",
    "/server-sitemap.xml",
    "/helpers",
    "/fees-explainer",
    "/contracts",
    "/economics",
    "/scroll",
    "/labels",
    "/refactor",
  ],
  robotsTxtOptions: {
    exclude: ["/server-sitemap.xml"],
  },
};

// for labels.growthepie.xyz & dev.labels.growthepie.xyz
const gtpLabels = {
  siteUrl: "https://labels.growthepie.xyz",
  generateRobotsTxt: true,
  exclude: [
    "/blog",
    "/api/*",
    "/embed/*",
    "/embed",
    "/trackers/*",
    "/blockspace/*",
    "/fees",
    "/contracts",
    "/contributors",
    "/imprint",
    "/privacy-policy",
    "/server-sitemap.xml",
    "/helpers",
    "/fees-explainer",
    "/contracts",
    "/economics",
    "/scroll",
    "/labels",
    "/refactor",
  ],
  robotsTxtOptions: {
    exclude: ["/server-sitemap.xml"],
  },
};

let exportOjb = gtpMain;

if (baseUrl.includes("labels.")) {
  exportOjb = gtpLabels;
}
if (baseUrl.includes("fees.")) {
  exportOjb = gtpFees;
}

/** @type {import('next-sitemap').IConfig} */
module.exports = exportOjb;

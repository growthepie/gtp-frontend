const baseUrl = "https://www.growthepie.com";

// for www.growthepie.com & dev.growthepie.com
const gtpMain = {
  siteUrl: "https://www.growthepie.com",
  generateRobotsTxt: true,
  exclude: [
    "/server-sitemap.xml",
    "/applications-sitemap.xml",
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
    exclude: ["/server-sitemap.xml", "/server-applications-sitemap.xml"],
    additionalSitemaps: [
      `https://www.growthepie.com/server-sitemap.xml`,
      `https://www.growthepie.com/server-applications-sitemap.xml`
    ],
  },
};

// for fees.growthepie.com & dev.fees.growthepie.com
const gtpFees = {
  siteUrl: "https://fees.growthepie.com",
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

// for labels.growthepie.com & dev.labels.growthepie.com
const gtpLabels = {
  siteUrl: "https://labels.growthepie.com",
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

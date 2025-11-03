const baseUrl = "https://www.growthepie.com";

// for www.growthepie.com & dev.growthepie.com
const gtpMain = {
  siteUrl: "https://www.growthepie.com",
  generateRobotsTxt: true,

  // Keep non-pages & internals out of XML sitemaps
  exclude: [
    "/server-sitemap.xml",
    "/applications-sitemap.xml",
    // internals
    "/_next/*",
    "/_next/image*",
    "/api/*",
    // existing
    "/embed/*",
    "/embed",
    "/fees",
    "/helpers",
    "/fees-explainer",
    "/contracts",
    "/refactor",
  ],

  robotsTxtOptions: {
    // This actually controls the robots.txt content
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/_next/",          // all Next.js build assets
          "/_next/image",     // the image optimizer endpoint
          "/embed/",          
          "/refactor",
        ],
      },
    ],
    exclude: ["/server-sitemap.xml", "/server-applications-sitemap.xml"],
    additionalSitemaps: [
      "https://www.growthepie.com/server-sitemap.xml",
      "https://www.growthepie.com/server-applications-sitemap.xml",
    ],
  },
};

// fees & labels variants unchanged except add the same robots policies + /_next/* excludes
const gtpFees = {
  siteUrl: "https://fees.growthepie.com",
  generateRobotsTxt: true,
  exclude: [
    "/_next/*",
    "/_next/image*",
    "/api/*",
    "/blog",
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
    "/economics",
    "/scroll",
    "/labels",
    "/refactor",
  ],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/", disallow: ["/_next/", "/_next/image", "/api/"] },
    ],
    exclude: ["/server-sitemap.xml"],
  },
};

const gtpLabels = {
  siteUrl: "https://labels.growthepie.com",
  generateRobotsTxt: true,
  exclude: [
    "/_next/*",
    "/_next/image*",
    "/api/*",
    "/blog",
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
    "/economics",
    "/scroll",
    "/labels",
    "/refactor",
  ],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/", disallow: ["/_next/", "/_next/image", "/api/"] },
    ],
    exclude: ["/server-sitemap.xml"],
  },
};

let exportOjb = gtpMain;
if (baseUrl.includes("labels.")) exportOjb = gtpLabels;
if (baseUrl.includes("fees.")) exportOjb = gtpFees;

module.exports = exportOjb;
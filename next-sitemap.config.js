const path = require("path");
const Module = require("module");

require("ts-node/register/transpile-only");

const projectRoot = __dirname;
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request && request.startsWith("@/")) {
    const resolvedRequest = path.join(projectRoot, request.slice(2));
    return originalResolveFilename.call(
      this,
      resolvedRequest,
      parent,
      isMain,
      options
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const baseUrl = "https://www.growthepie.com";

// for www.growthepie.com & dev.growthepie.com
const gtpMain = {
  siteUrl: "https://www.growthepie.com",
  generateRobotsTxt: true,

  // Keep non-pages & internals out of XML sitemaps
  exclude: [
    "/server-sitemap.xml",
    "/applications-sitemap.xml",
    "/quick-bites-sitemap.xml",
    // internals
    "/_next/*",
    "/_next/image*",
    "/api/*",
    // existing
    "/blog",
    "/trackers/*",
    "/blockspace/*",
    "/economics",
    "/scroll",
    "/labels",
    "/embed/*",
    "/embed",
    "/fees",
    "/helpers",
    "/fees-explainer",
    "/contracts",
    "/refactor",
    "/gtpplayground",
    "/debug/*",
  ],

  robotsTxtOptions: {
    // This actually controls the robots.txt content
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/_next/image",     // the image optimizer endpoint
          "/_next/static",
          "/embed/",
          "/refactor",
          "/gtpplayground",
          "/debug/",
        ],
      },
    ],
    exclude: ["/server-sitemap.xml", "/server-applications-sitemap.xml"],
    additionalSitemaps: [
      "https://www.growthepie.com/server-sitemap.xml",
      "https://www.growthepie.com/server-applications-sitemap.xml",
      "https://www.growthepie.com/chains-sitemap.xml",
      "https://www.growthepie.com/fundamentals-sitemap.xml",
      "https://www.growthepie.com/quick-bites-sitemap.xml",
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
    "/gtpplayground",
    "/debug/*",
  ],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/", disallow: ["/_next/image", "/api/", "/gtpplayground", "/debug/"] },
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
    "/gtpplayground",
    "/debug/*",
  ],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/", disallow: ["/_next/image", "/api/", "/gtpplayground", "/debug/"] },
    ],
    exclude: ["/server-sitemap.xml"],
  },
};

let exportOjb = gtpMain;
if (baseUrl.includes("labels.")) exportOjb = gtpLabels;
if (baseUrl.includes("fees.")) exportOjb = gtpFees;

module.exports = exportOjb;
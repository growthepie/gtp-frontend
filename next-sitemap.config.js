const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : "https://www.growthepie.xyz";

// for www.growthepie.xyz & dev.growthepie.xyz
const gtpMain = {
  siteUrl: baseUrl || "https://www.growthepie.xyz",
  generateRobotsTxt: true,
  exclude: [
    "/server-sitemap.xml",
    "/blog",
    "/api/*",
    "/embed/*",
    "/embed",
    "/trackers/*",
    "/blockspace/*",
  ],
  robotsTxtOptions: {
    exclude: ["/server-sitemap.xml"],
    additionalSitemaps: [`${baseUrl}/server-sitemap.xml`],
  },
};

// for fees.growthepie.xyz & dev.fees.growthepie.xyz
const gtpFees = {
  siteUrl: baseUrl || "https://fees.growthepie.xyz",
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
  ],
  robotsTxtOptions: {
    exclude: ["/server-sitemap.xml"],
  },
};

/** @type {import('next-sitemap').IConfig} */
module.exports = baseUrl.includes("fees.") ? gtpFees : gtpMain;

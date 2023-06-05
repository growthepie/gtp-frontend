/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://www.growthepie.xyz",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        follow: "/",
        index: "/",
      },
    ],
    exclude: ["/server-sitemap.xml"],
    additionalSitemaps: ["https://www.growthepie.xyz/server-sitemap.xml"],
  },
};

// @ts-ignore
import { ISitemapField, getServerSideSitemap } from "next-sitemap";
import { navigationItems } from "@/lib/navigation";
import { MasterURL } from "@/lib/urls";

export async function GET(request: Request) {
  const pages = navigationItems
    .map((item) => {
      return item.options
        .filter(
          (option) =>
            option.excludeFromSitemap !== true &&
            option.url &&
            !option.url.includes("https://"),
        )
        .map((option) => `https://www.growthepie.xyz${option.url}`);
    })
    .flat();

  const getDate = () => {
    const date = new Date();
    // if it is before 8:00 am UTC, set last mod to yesterday at 8:00 am UTC
    if (date.getUTCHours() < 8) {
      date.setDate(date.getDate() - 1);
    }
    return date.toISOString().slice(0, 10) + "T08:00:00.000Z";
  };

  return getServerSideSitemap([
    ...pages
      .filter(
        (page) =>
          !page.includes("/api/") &&
          !page.includes("/[") &&
          !page.includes("/_") &&
          !page.includes("404") &&
          !page.includes("/applications/"), // Exclude applications routes
      )
      .map(
        (page): ISitemapField => ({
          loc: page,
          // set last mod to todays date at 8:00 am UTC
          lastmod: getDate(),
          changefreq: "daily",
          priority: 0.9,
        }),
      ),
  ]);
}

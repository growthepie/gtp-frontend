// @ts-ignore
import { ISitemapField, getServerSideSitemap } from "next-sitemap";
import { navigationItems } from "@/lib/navigation";

export async function GET(request: Request) {
  const fundamentals = navigationItems[1];
  const blockspace = navigationItems[2];
  const chains = navigationItems[3];

  const pages = [
    ...fundamentals.options.map(
      (option) => `https://www.growthepie.xyz/fundamentals/${option.urlKey}`,
    ),
    ...blockspace.options.map(
      (option) => `https://www.growthepie.xyz/blockspace/${option.urlKey}`,
    ),
    ...chains.options
      .filter((c) => c.hide !== true)
      .map((option) => `https://www.growthepie.xyz/chains/${option.urlKey}`),
  ];

  const getDate = () => {
    const date = new Date();
    // if it is before 8:00 am UTC, set last mod to yesterday at 8:00 am UTC
    if (date.getUTCHours() < 8) {
      date.setDate(date.getDate() - 1);
    }
    return date.toISOString().slice(0, 10) + "T08:00:00.000Z";
  };

  return getServerSideSitemap([
    ...pages.map(
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

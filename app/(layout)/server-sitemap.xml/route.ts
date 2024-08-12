// @ts-ignore
import { ISitemapField, getServerSideSitemap } from "next-sitemap";
import { navigationItems } from "@/lib/navigation";
import { MasterURL } from "@/lib/urls";
import { MasterResponse } from "@/types/api/MasterResponse";
import {
  Get_AllChainsNavigationItems,
  Get_SupportedChainKeys,
} from "@/lib/chains";

export async function GET(request: Request) {
  const master = await fetch(MasterURL);
  const masterData: MasterResponse = await master.json();

  const fundamentals = navigationItems[1];
  const blockspace = navigationItems[2];
  const trackers = navigationItems[3];

  const chains = Get_AllChainsNavigationItems(masterData);

  const masterChainKeys = Object.keys(masterData.chains);

  const pages = [
    ...fundamentals.options
      .filter((c) => c.excludeFromSitemap !== true)
      .map(
        (option) => `https://www.growthepie.xyz/fundamentals/${option.urlKey}`,
      ),
    ...blockspace.options
      .filter((c) => c.excludeFromSitemap !== true)
      .map(
        (option) => `https://www.growthepie.xyz/blockspace/${option.urlKey}`,
      ),
    ...Object.keys(masterData.blockspace_categories.main_categories).map(
      (category) =>
        `https://www.growthepie.xyz/blockspace/chain-overview/${category}`,
    ),
    ...chains.options
      .filter(
        (c) =>
          c.key &&
          Get_SupportedChainKeys(masterData).includes(c.key) &&
          c.excludeFromSitemap !== true,
      )
      .map((option) => `https://www.growthepie.xyz/chains/${option.urlKey}`),
    ...trackers.options
      .filter((c) => c.hide !== true && c.excludeFromSitemap !== true)
      .map((option) => `https://www.growthepie.xyz/trackers/${option.urlKey}`),
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
    ...pages
      .filter(
        (page) =>
          !page.includes("/api/") &&
          !page.includes("/[") &&
          !page.includes("/_") &&
          !page.includes("404"),
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

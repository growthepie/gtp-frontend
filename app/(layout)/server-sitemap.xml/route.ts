// @ts-ignore
import { ISitemapField, getServerSideSitemap } from "next-sitemap";
import { navigationItems } from "@/lib/navigation";
import { ApplicationsURLs, MasterURL } from "@/lib/urls";
import { AppOverviewResponse } from "@/types/applications/AppOverviewResponse";



export async function GET(request: Request) {
  // ["1d", "7d", "30d", "90d", "365d", "max"].map((timeframe) => ApplicationsURLs.overview.replace('{timespan}', `${timeframe}`))

  const apps = new Set<string>();
  // we need to fetch all the apps for each timespan and get a SET of the owner_projects
  const timespans = ["1d", "7d", "30d", "90d", "365d", "max"];
  for (const timespan of timespans) {
    const appsResp = await fetch(ApplicationsURLs.overview.replace('{timespan}', `${timespan}`));
    const appsData = await appsResp.json() as AppOverviewResponse;
    const appsTypes = appsData.data.types;
    const owner_project_index = appsTypes.indexOf("owner_project");
    const appsPages = appsData.data.data.map((app) => {
      return `https://www.growthepie.xyz/applications/${app[owner_project_index]}`;
    });
    appsPages.forEach((app) => apps.add(app));
  }




  const pages = [...navigationItems
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
    .flat(),
    ...apps,
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

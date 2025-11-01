"use client";
import { preload } from "react-dom";
import { ApplicationsURLs } from "@/lib/urls";
import { ApplicationsOverviewContent } from "./_components/ApplicationsOverviewContent";

["1d", "7d", "30d", "90d", "365d", "max"].forEach((timespan) => {
  preload(ApplicationsURLs.overview.replace("{timespan}", timespan), {
    as: "fetch",
    crossOrigin: "anonymous",
  });
});

export default function Page() {
  return <ApplicationsOverviewContent />;
}

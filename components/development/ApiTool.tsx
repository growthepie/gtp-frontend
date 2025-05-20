"use client";
import { useLocalStorage } from "usehooks-ts";
import { useSWRConfig } from "swr";
import { useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { track } from "@vercel/analytics/react";

// ability to change the API root between v1 and dev
export default function ApiTool() {
  const { cache, mutate, fetcher } = useSWRConfig();
  const roots = ["v1", "dev"];
  const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");

  // clear cache when changing the API root
  const toggleApiRoot = () => {
    if (apiRoot === "v1") {
      setApiRoot("dev");
    } else {
      setApiRoot("v1");
    }

    mutate(
      (key) => true, // which cache keys are updated
      undefined, // update cache data to `undefined`
      { revalidate: false }, // do not revalidate
    );

    // revalidate after 1 second
    setTimeout(() => {
      mutate(
        (key) => true, // which cache keys are updated
        undefined, // update cache data to `undefined`
        { revalidate: true }, // revalidate
      );
    }, 1000);
  };

  const currentApiRoot = useMemo(() => {
    return apiRoot;
  }, [apiRoot]);

  useEffect(() => {
    // shift the colors of the background container to indicate the API root
    const backgroundContainerElement = document.getElementById(
      "background-container",
    );
    if (backgroundContainerElement) {
      if (apiRoot === "v1") {
        backgroundContainerElement.classList.remove("hue-rotate-180");
      } else {
        backgroundContainerElement.classList.add("hue-rotate-180");
      }
    }
  }, [apiRoot]);

  return (
    <div className="">
      <div className="flex gap-x-0.5">
        <div>API Root:</div>
        <div
          className={`cursor-pointer rounded-sm px-1 ${currentApiRoot === "v1" ? "bg-white/30" : "bg-yellow-500/50"}`}
          onClick={() => toggleApiRoot()}
        >
          /{apiRoot}/
        </div>
      </div>
    </div>
  );
}


export const GlobalSearchToggleButton = () => {
  const [showGlobalSearchBar, setShowGlobalSearchBar] = useLocalStorage("showGlobalSearchBar", false);

  return (
    <div className="flex items-center justify-end h-full cursor-pointer " onClick={() => {
      setShowGlobalSearchBar(!showGlobalSearchBar); 
    }}>
      <Icon icon="feather:search" className="w-[13.15px] h-[13.15px]" />
    </div>
  )
}

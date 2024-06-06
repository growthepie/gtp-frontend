"use client";
import { useLocalStorage } from "usehooks-ts";
import { useSWRConfig } from 'swr';
import { useMemo } from "react";

// ability to change the API root between v1 and dev
export default function ApiTool() {
  const { cache, mutate, fetcher } = useSWRConfig()
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
      key => true, // which cache keys are updated
      undefined, // update cache data to `undefined`
      { revalidate: false } // do not revalidate
    )

    // revalidate after 1 second
    setTimeout(() => {
      mutate(
        key => true, // which cache keys are updated
        undefined, // update cache data to `undefined`
        { revalidate: true } // revalidate
      )
    }, 1000)
  }

  const currentApiRoot = useMemo(() => {
    return apiRoot;
  }, [apiRoot])


  return (
    <div className="">
      <div className="flex gap-x-0.5">
        <div>API Root:</div>
        <div className={`px-1 rounded-sm cursor-pointer ${currentApiRoot === "v1" ? "bg-white/30" : "bg-yellow-500/50"}`} onClick={() => toggleApiRoot()}>/{apiRoot}/</div>
      </div>
    </div>
  )
}

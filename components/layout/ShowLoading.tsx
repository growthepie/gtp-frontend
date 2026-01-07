"use client";
import { useEffect, useState } from "react";
import LoadingAnimation from "./LoadingAnimation";

type Props = {
  dataLoading?: boolean[];
  dataValidating?: boolean[];
  fullScreen?: boolean;
  section?: boolean;
};

export default function ShowLoading({
  dataLoading,
  dataValidating,
  fullScreen,
  section,
}: Props) {
  const [showLoading, setShowLoading] = useState(true);
  const [loadingTimeoutSeconds, setLoadingTimeoutSeconds] = useState(0);

  useEffect(() => {
    if (dataLoading?.some((loading) => loading)) {
      setShowLoading(true);
      if (!dataValidating?.some((validating) => validating))
        setLoadingTimeoutSeconds(1200);
    }

    if (dataLoading?.every((loading) => !loading))
      setTimeout(() => {
        setShowLoading(false);
      }, loadingTimeoutSeconds);
  }, [dataLoading, dataValidating, loadingTimeoutSeconds]);


  if (section)
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
          } transition-opacity duration-300 z-[200]`}
        suppressHydrationWarning
      >
        <LoadingAnimation />
      </div>
    );

  if (fullScreen)
    return (
      <div
        className={`fixed inset-0 flex -ml-2 -mr-2 md:-ml-6 md:-mr-[50px] -mt-[118px] items-center justify-center bg-white dark:bg-color-ui-active z-[200] ${showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
          } transition-opacity duration-300`}
        suppressHydrationWarning
      >
        <LoadingAnimation />
      </div>
    );

  return (
    <div
      className={`absolute inset-0 h-full flex items-center justify-center bg-white dark:bg-color-ui-active z-[200] ${showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        } transition-opacity duration-300 z-[200]`}
      suppressHydrationWarning
    >
      <div className="fixed top-0 bottom-0 flex items-center justify-center z-[200]">
        <LoadingAnimation />
      </div>
    </div>
  );
}
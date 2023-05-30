import { useEffect, useState } from "react";
import LoadingAnimation from "./LoadingAnimation";

type Props = {
  dataLoading: boolean[];
  dataValidating: boolean[];
  fullScreen?: boolean;
};

export default function ShowLoading({
  dataLoading,
  dataValidating,
  fullScreen,
}: Props) {
  const [showLoading, setShowLoading] = useState(true);
  const [loadingTimeoutSeconds, setLoadingTimeoutSeconds] = useState(0);

  useEffect(() => {
    if (dataLoading.some((loading) => loading)) {
      setShowLoading(true);
      if (!dataValidating.some((validating) => validating))
        setLoadingTimeoutSeconds(1200);
    }

    if (dataLoading.every((loading) => !loading))
      setTimeout(() => {
        setShowLoading(false);
      }, loadingTimeoutSeconds);
  }, [dataLoading, dataValidating, loadingTimeoutSeconds]);
  if (fullScreen)
    return (
      <div
        className={`fixed inset-0 flex -ml-2 -mr-2 md:-ml-6 md:-mr-[50px] -mt-[118px] items-center justify-center bg-white dark:bg-forest-1000 z-50 ${
          showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        } transition-opacity duration-300`}
        suppressHydrationWarning
      >
        <LoadingAnimation />
      </div>
    );

  return (
    <div
      className={`absolute w-full h-screen right flex -ml-2 -mr-2 md:-ml-6 md:-mr-[50px] -mt-[118px] items-center justify-center bg-white dark:bg-forest-1000 z-50 ${
        showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      } transition-opacity duration-300`}
      suppressHydrationWarning
    >
      <LoadingAnimation />
    </div>
  );
}

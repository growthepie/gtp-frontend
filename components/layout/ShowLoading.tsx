"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LoadingAnimation from "./LoadingAnimation";
import { useIsMounted } from "@/hooks/useIsMounted";

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
  const isMounted = useIsMounted();

  // Derive current loading state from props
  const isCurrentlyLoading = dataLoading?.some((loading) => loading) ?? false;
  const isValidating = dataValidating?.some((validating) => validating) ?? false;

  // Track previous loading state and visibility
  const [prevIsLoading, setPrevIsLoading] = useState(isCurrentlyLoading);
  const [isHidingDelayed, setIsHidingDelayed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Adjust state during render when loading state changes (React-approved pattern)
  // See: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (isCurrentlyLoading !== prevIsLoading) {
    setPrevIsLoading(isCurrentlyLoading);
    if (isCurrentlyLoading) {
      // Loading started - reset delayed hide state immediately
      setIsHidingDelayed(false);
    }
  }

  // Handle delayed hide when loading stops (setTimeout is async, so this is fine)
  useEffect(() => {
    if (!isCurrentlyLoading && !isHidingDelayed) {
      const delay = isValidating ? 0 : 400;
      timeoutRef.current = setTimeout(() => {
        setIsHidingDelayed(true);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isCurrentlyLoading, isValidating, isHidingDelayed]);

  // Show loading if currently loading OR if we haven't finished the delayed hide
  const showLoading = isCurrentlyLoading || !isHidingDelayed;

  if (section)
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${
          showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        } transition-opacity duration-300 z-show-loading`}
        suppressHydrationWarning
      >
        <LoadingAnimation />
      </div>
    );

  // Render fullScreen loading via portal to ensure it appears above FloatingPortal elements
  if (fullScreen) {
    const content = (
      <div
        className={`fixed inset-0 flex -ml-2 -mr-2 md:-ml-6 md:-mr-[50px] -mt-[118px] items-center justify-center bg-white dark:bg-color-ui-active z-show-loading ${
          showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        } transition-opacity duration-300`}
        suppressHydrationWarning
      >
        <LoadingAnimation />
      </div>
    );

    // Use portal to render at end of body, after other portals
    if (isMounted) {
      return createPortal(content, document.body);
    }

    // SSR fallback - render inline
    return content;
  }

  return (
    <div
      className={`absolute inset-0 h-full flex items-center justify-center bg-white dark:bg-color-ui-active z-show-loading ${
        showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      } transition-opacity duration-300 z-show-loading`}
      suppressHydrationWarning
    >
      <div className="fixed top-0 bottom-0 flex items-center justify-center z-show-loading">
        <LoadingAnimation />
      </div>
    </div>
  );
}
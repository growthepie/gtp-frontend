"use client";
import { useEffect, useState } from "react";
import LoadingAnimation from "./LoadingAnimation";
import { useGlobalConfetti } from "../animations/ConfettiProvider";
import ConfettiAnimation from "../animations/ConfettiAnimation";
import { IS_DEVELOPMENT, IS_PRODUCTION } from "@/lib/helpers";
import { dateFormat } from "highcharts";

type Props = {
  dataLoading?: boolean[];
  dataValidating?: boolean[];
  fullScreen?: boolean;
  section?: boolean;
  showFullAnimation?: boolean;
};
const ETHEREUM_LAUNCH_TIMESTAMP = 1438269973000; // July 30, 2015
// Exact 10-year anniversary: July 30, 2025 16:26:00 GMT (11:26 EST)
const ETHEREUM_10TH_ANNIVERSARY = 1753892760000;


export default function ShowLoading({
  dataLoading,
  dataValidating,
  fullScreen,
  section,
  showFullAnimation = false,
}: Props) {
  const [showLoading, setShowLoading] = useState(true);
  const [loadingTimeoutSeconds, setLoadingTimeoutSeconds] = useState(0);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [confettiStartTime, setConfettiStartTime] = useState<number | null>(null);
  const { triggerConfetti } = useGlobalConfetti(fullScreen);
  const [showBirthday, setShowBirthday] = useState(new Date().getTime() >= ETHEREUM_10TH_ANNIVERSARY);
  // Local confetti state for non-fullscreen mode
  const [localConfettiActive, setLocalConfettiActive] = useState(false);

  const CONFETTI_DURATION = 5000; // 10 seconds to match default confetti duration
  
  // Determine if currently loading
  const isCurrentlyLoading = dataLoading?.some((loading) => loading) || false;

  useEffect(() => {
    if (dataLoading?.some((loading) => loading)) {
      setShowLoading(true);
      if (!dataValidating?.some((validating) => validating))
        setLoadingTimeoutSeconds(1200);
      
      // Trigger confetti if showBirthday is true and not already triggered
      if (showBirthday && !confettiTriggered) {
        if (fullScreen) {
          // Use global confetti for fullscreen
          triggerConfetti({ 
            duration: CONFETTI_DURATION, 
            particleCount: 250, 
            fullScreen: true,
            showFullAnimation,
            isLoading: isCurrentlyLoading
          });
        } else {
          // Use local confetti for non-fullscreen
          setLocalConfettiActive(true);
        }
        setConfettiTriggered(true);
        setConfettiStartTime(Date.now());
      }
    }

    if (dataLoading?.every((loading) => !loading)) {
      if (showBirthday && showFullAnimation && confettiStartTime && confettiTriggered) {
        // If showFullAnimation is true, wait for confetti to complete its full duration
        const elapsed = Date.now() - confettiStartTime;
        const remainingTime = Math.max(0, CONFETTI_DURATION - elapsed);
        
        setTimeout(() => {
          setShowLoading(false);
          setConfettiTriggered(false);
          setConfettiStartTime(null);
          setLocalConfettiActive(false);
        }, remainingTime);
      } else if (showBirthday && !showFullAnimation) {
        // With new logic, confetti will fade when loading completes
        // Add a small delay to ensure confetti has time to start fading
        setTimeout(() => {
          setShowLoading(false);
          setConfettiTriggered(false);
          setConfettiStartTime(null);
          setLocalConfettiActive(false);
        }, 2500); // Slightly longer than confetti fade duration
      } else {
        // Normal loading behavior without birthday
        const timeout = loadingTimeoutSeconds;
        setTimeout(() => {
          setShowLoading(false);
        }, timeout);
      }
    }
  }, [dataLoading, dataValidating, loadingTimeoutSeconds, showBirthday, confettiTriggered, confettiStartTime, triggerConfetti, fullScreen, showFullAnimation, isCurrentlyLoading]);

  // Reset confetti state when showBirthday changes
  useEffect(() => {
    if (!showBirthday) {
      setConfettiTriggered(false);
      setConfettiStartTime(null);
      setLocalConfettiActive(false);
    }
  }, [showBirthday]);

  const renderContent = () => {
    if (showBirthday) {
      // When showing birthday, we rely on confetti animation
      // and don't render any additional loading animation
      return null;
    }
    return <LoadingAnimation />;
  };

  if (section)
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center ${showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
          } transition-opacity duration-300 z-[200]`}
        suppressHydrationWarning
      >
        {renderContent()}
        {/* Local confetti for section mode */}
        {showBirthday && localConfettiActive && (
          <ConfettiAnimation 
            isActive={localConfettiActive}
            duration={CONFETTI_DURATION}
            particleCount={150}
            fullScreen={false}
            showFullAnimation={showFullAnimation}
            isLoading={isCurrentlyLoading}
          />
        )}
      </div>
    );

  if (fullScreen)
    return (
      <div
        className={`fixed inset-0 flex -ml-2 -mr-2 md:-ml-6 md:-mr-[50px] -mt-[118px] items-center justify-center bg-white dark:bg-forest-1000 z-[200] ${showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
          } transition-opacity duration-300`}
        suppressHydrationWarning
      >
        {renderContent()}
        {/* Global confetti is handled by ConfettiProvider for fullscreen */}
      </div>
    );

  return (
    <div
      className={`absolute inset-0 h-full bg-white dark:bg-forest-1000 z-[200] ${showLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        } transition-opacity duration-300 z-[200]`}
      suppressHydrationWarning
    >
      {/* Relative wrapper to provide positioning context for confetti */}
      <div className="relative h-full flex items-center justify-center">
        <div className="fixed top-0 bottom-0 flex items-center justify-center z-[200]">
          {renderContent()}
        </div>
        {/* Local confetti for non-fullscreen mode */}
        {showBirthday && localConfettiActive && (
          <ConfettiAnimation 
            isActive={localConfettiActive}
            duration={CONFETTI_DURATION}
            particleCount={150}
            fullScreen={false}
            showFullAnimation={showFullAnimation}
            isLoading={isCurrentlyLoading}
          />
        )}
      </div>
    </div>
  );
}

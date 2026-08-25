import { useCallback, useEffect, useRef, useState } from "react";
import { getTimeseriesChartRevealDurationMs } from "@/lib/chart-animation";

export function useChartReplay(
  timespan: string,
  xMin: number | undefined,
  xMax: number | undefined,
) {
  const [revealProgress, setRevealProgress] = useState<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (releaseTimerRef.current !== null) clearTimeout(releaseTimerRef.current);
    frameRef.current = null;
    releaseTimerRef.current = null;
    setRevealProgress(null);
  }, []);

  const play = useCallback(() => {
    if (typeof xMin !== "number" || typeof xMax !== "number" || xMax <= xMin) return;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (releaseTimerRef.current !== null) clearTimeout(releaseTimerRef.current);

    const duration = getTimeseriesChartRevealDurationMs(timespan, xMax - xMin);
    setRevealProgress(0);
    let startedAt: number | null = null;

    const step = (now: number) => {
      if (startedAt === null) startedAt = now;
      const progress = Math.min((now - startedAt) / duration, 1);
      setRevealProgress(progress);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        frameRef.current = null;
        releaseTimerRef.current = setTimeout(() => {
          releaseTimerRef.current = null;
          setRevealProgress(null);
        }, 500);
      }
    };

    frameRef.current = requestAnimationFrame(step);
  }, [timespan, xMin, xMax]);

  useEffect(() => stop, [timespan, xMin, xMax, stop]);

  return {
    revealProgress,
    isReplaying: revealProgress !== null,
    play,
    stop,
  };
}

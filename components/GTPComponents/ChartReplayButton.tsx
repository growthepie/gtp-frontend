"use client";

import { GTPButton } from "./ButtonComponents/GTPButton";

export default function ChartReplayButton({
  isReplaying,
  disabled = false,
  onPlay,
  onStop,
  size = "sm",
}: {
  isReplaying: boolean;
  disabled?: boolean;
  onPlay: () => void;
  onStop: () => void;
  size?: "xs" | "sm";
}) {
  return (
    <GTPButton
      leftIconOverride={
        isReplaying ? (
          <div className="size-[8px] rounded-[1px] bg-current" />
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <polygon points="1,0.5 9,5 1,9.5" fill="currentColor" />
          </svg>
        )
      }
      label={isReplaying ? "Stop" : "Play"}
      labelDisplay="hover"
      size={size}
      variant="no-background"
      isSelected={isReplaying}
      visualState={disabled ? "disabled" : "default"}
      disabled={disabled}
      clickHandler={isReplaying ? onStop : onPlay}
    />
  );
}

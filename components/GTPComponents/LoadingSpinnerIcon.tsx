"use client";

/**
 * iOS-style loading spinner: 12 radial spokes with opacity fading around the circle,
 * rotated continuously so the fade "chases". Uses `currentColor` so it picks up the
 * surrounding text color (e.g. a button's icon color). Sized to match a button icon by
 * default; pass `className` to override the size.
 */
export default function LoadingSpinnerIcon({
  className = "!w-[16px] !h-[16px]",
}: {
  className?: string;
}) {
  return (
    <span className={`inline-block ${className}`}>
      <svg viewBox="0 0 24 24" className="size-full animate-spin" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, index) => (
          <rect
            key={index}
            x="11"
            y="1.5"
            width="2"
            height="5.5"
            rx="1"
            fill="currentColor"
            opacity={(index + 1) / 12}
            transform={`rotate(${index * 30} 12 12)`}
          />
        ))}
      </svg>
    </span>
  );
}

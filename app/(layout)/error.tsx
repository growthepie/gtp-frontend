"use client"; // Error components must be Client Components

import ErrorGen from "@/components/ErrorGen";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorGen
      header={"Something went wrong ..."}
      subheader={
        " The page you requested currently has some issues and our devs have been notified. You can try again, or check out one of these pages:"
      }
      onRetry={reset}
    />
  );
}

"use client"; // Error components must be Client Components

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-[80vh]">
      <h2>Whoops.... looks like something went wrong.</h2>
      <h2>
        This error will be reported to our team. Thank you for your patience.
      </h2>
    </div>
  );
}

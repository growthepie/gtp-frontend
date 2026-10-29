"use client"; // Error components must be Client Components

import "./globals.css";

// Shown when a root layout itself fails, so it can't rely on the layout's providers, fonts or theme
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-color-bg-main text-color-text-primary">
        <main className="flex min-h-screen flex-col items-center justify-center gap-y-[15px] px-[20px] text-center font-sans">
          <h1 className="text-[24px] font-bold leading-[133%]">Something went wrong</h1>
          <p className="max-w-[420px] text-[15px] leading-[150%]">
            growthepie couldn&apos;t load this page. Try again, or come back in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border-[3px] border-[#5A6462] px-[20px] py-[10px] text-[16px] leading-[150%] hover:bg-color-ui-hover"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

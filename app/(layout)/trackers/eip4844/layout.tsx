"use client";
import { CompleteDataFeed, WithContext } from "schema-dts";
import Container from "@/components/layout/Container";
import { useEffect, useState } from "react";

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { metric: string };
}) {
  const [loading, setLoading] = useState(true);
  const [jsonLd, setJsonLd] = useState<WithContext<CompleteDataFeed> | null>(
    null,
  );

  useEffect(() => {
    // Simulate async operation, replace with actual data fetching logic
    setTimeout(() => {
      // Once data is fetched, update state and mark loading as false
      const fetchedJsonLd: WithContext<CompleteDataFeed> = fetchData(); // Fetch your JSON-LD data here
      setJsonLd(fetchedJsonLd);
      setLoading(false);
    }, 2000); // Simulated loading time, adjust as needed
  }, []); // Ensure useEffect runs only once on component mount

  return (
    <>
      {loading ? (
        // Render a loading indicator
        <div className="h-[100vh] w-full flex items-center justify-center">
          Loading...
        </div>
      ) : (
        <div>{children}</div>
      )}
    </>
  );
}

// Function to simulate fetching data (replace this with actual fetching logic)
function fetchData(): WithContext<CompleteDataFeed> {
  // Simulated data
  return {
    "@context": "https://schema.org",
    "@type": "CompleteDataFeed",
    // Add your data properties here
  };
}

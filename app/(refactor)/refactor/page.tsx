"use client";
import { useMaster } from "./contexts/MasterContext";

export default function Page() {
  const { data, formatMetric } = useMaster();

  console.log("page.tsx", data);

  return (
    <div>
      <h1>Page</h1>
    </div>
  );
}
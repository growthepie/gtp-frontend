"use client";
import { useSearchParams } from "next/navigation";

// test embeddable page for testing purposes
// this page takes a url from the query params and displays it in an iframe
const EmbedTest = () => {
  const searchParams = useSearchParams();
  const url = searchParams ? searchParams.get("url") : null;
  const width = searchParams ? searchParams.get("width") : null;
  const height = searchParams ? searchParams.get("height") : null;
  const title = searchParams ? searchParams.get("title") : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="text-sm text-black w-3/4 mx-auto font-mono">
        <div className="font-bold">URL:</div>
        <div>{url}</div>
        <div className="font-bold">Width:</div>
        <div>{width}</div>
        <div className="font-bold">Height:</div>
        <div>{height}</div>
      </div>
      <iframe
        src={url || ""} // if no url is provided, the iframe will be empty
        frameBorder="0"
        width={width || "100%"}
        height={height || "100%"}
        title={title || "EmbedTest"}
        allowFullScreen
      />
    </div>
  );
};

export default EmbedTest;
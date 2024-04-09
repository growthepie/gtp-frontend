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

  // extract arguments from the url
  const urlArgs = new URLSearchParams(url?.split("?")[1] || "");


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="text-sm text-black w-3/4 mx-auto font-mono grid grid-cols-2 gap-2">
        <div>
          <div className="font-bold">Width:</div>
          <div>{width}</div>
        </div>
        <div>
          <div className="font-bold">Height:</div>
          <div>{height}</div>
        </div>
        <div>
          <div className="font-bold">URL:</div>
          <div className="w-full overflow-hidden break-words">{url}</div>
        </div>
        <div></div>
        <div className="w-3/4 mx-auto grid grid-cols-2 gap-2">
          {Array.from(urlArgs).map(([key, value]) => (
            <div key={key}>
              <div className="font-bold">{key}:</div>
              <div className="w-full overflow-hidden break-words">{value}</div>
            </div>
          ))}
        </div>

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
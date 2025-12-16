import { getCookie } from "cookies-next";
import Script from "next/script";
import { IS_DEVELOPMENT } from "@/lib/helpers";
import { MasterURL } from "@/lib/urls";
import { Analytics } from "@/components/Analytics";

export default function Head() {
  const gtpGtmId = process.env.NEXT_PUBLIC_GTM_ID || '';

  return (
    <>
      {/* Preload master JSON file with high priority */}
      <link
        rel="preload"
        href={MasterURL}
        as="fetch"
        crossOrigin="anonymous"
        // @ts-ignore
        fetchPriority="high"
      />
      {/* Preload icon JSON files with high priority */}
      <link
        rel="preload"
        href={`/gtp.json`}
        as="fetch"
        crossOrigin="anonymous"
        // @ts-ignore
        fetchPriority="high"
      />
      <link
        rel="preload"
        href={`/gtp-figma-export.json`}
        as="fetch"
        crossOrigin="anonymous"
        // @ts-ignore
        fetchPriority="high"
      />
      {/* Preload favicon files */}
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="msapplication-TileColor" content="#da532c" />
      {!IS_DEVELOPMENT && <Analytics gtmId={gtpGtmId} />}
    </>
  );
}

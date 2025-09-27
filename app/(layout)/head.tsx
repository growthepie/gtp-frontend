import { getCookie } from "cookies-next";
import Script from "next/script";
import { BASE_URL } from "@/lib/helpers";
import { MasterURL } from "@/lib/urls";

export default function Head() {
  const consent = getCookie("gtpCookieConsent");

  return (
    <>
      {/* Preload master JSON file with high priority */}
      <link
        rel="preload"
        href={MasterURL}
        as="fetch"
        crossOrigin="anonymous"
        // @ts-ignore
        fetchpriority="high"
      />
      {/* Preload icon JSON files with high priority */}
      <link
        rel="preload"
        href={`/gtp.json`}
        as="fetch"
        crossOrigin="anonymous"
        // @ts-ignore
        fetchpriority="high"
      />
      <link
        rel="preload"
        href={`/gtp-figma-export.json`}
        as="fetch"
        crossOrigin="anonymous"
        // @ts-ignore
        fetchpriority="high"
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

      {/* {IS_PRODUCTION && ( */}
      <>
        <Script
          id="gtag"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'analytics_storage': 'denied'
            });

            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WK73L5M');`,
          }}
        />
        {consent === true && (
          <Script
            id="consupd"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
            gtag('consent', 'update', {
              'ad_storage': 'granted',
              'analytics_storage': 'granted'
            });
          `,
            }}
          />
        )}
      </>
      {/* )} */}
    </>
  );
}

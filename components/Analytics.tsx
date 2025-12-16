// components/Analytics.tsx
'use client'
import Script from 'next/script'
import { ANALYTICS_CONFIG } from '@/lib/analyticsConfig'

export function Analytics({ gtmId }: { gtmId: string }) {
  const defaultConsent = ANALYTICS_CONFIG.defaultConsent;
  
  return (
    <>
      {/* Set default consent state BEFORE GTM loads */}
      <Script id="consent-defaults" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          
          gtag('consent', 'default', ${JSON.stringify(defaultConsent)});
        `}
      </Script>
      
      {/* Load GTM */}
      <Script id="gtm-init" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){
            w[l]=w[l]||[];
            w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0];
            var j=d.createElement(s);
            j.async=true;
            j.src='${ANALYTICS_CONFIG.proxyPaths.gtm}' + (l!=='dataLayer'?'?l='+encodeURIComponent(l):'');
            f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
    </>
  )
}
// components/Analytics.tsx
'use client'
import Script from 'next/script'
import { ANALYTICS_CONFIG } from '@/lib/analyticsConfig'

export function Analytics({ gtmId }: { gtmId: string }) {
  const defaultConsent = ANALYTICS_CONFIG.defaultConsent;
  
  return (
    <>
      <Script id="consent-defaults" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){dataLayer.push(arguments);}
          
          gtag('consent', 'default', ${JSON.stringify(defaultConsent)});
          
          // Reset old consents (before version 2)
          (function() {
            var cookie = document.cookie.split('; ').find(row => row.startsWith('gtpCookieConsent='));
            var version = document.cookie.split('; ').find(row => row.startsWith('gtpConsentVersion='));
            
            if (cookie && !version) {
              // Delete old cookie to trigger re-consent
              document.cookie = 'gtpCookieConsent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            }
          })();
        `}
      </Script>
      
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
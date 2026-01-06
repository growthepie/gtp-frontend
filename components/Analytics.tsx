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

          // Check for existing consent BEFORE setting defaults
          (function() {
            var consentCookie = document.cookie.split('; ').find(function(row) { return row.startsWith('gtpCookieConsent='); });
            var versionCookie = document.cookie.split('; ').find(function(row) { return row.startsWith('gtpConsentVersion='); });

            // Reset old consents (before version 2)
            if (consentCookie && !versionCookie) {
              document.cookie = 'gtpCookieConsent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              consentCookie = null;
            }

            // Determine consent state from cookie VALUE (not just existence)
            var hasGrantedConsent = consentCookie && consentCookie.split('=')[1] === 'true';

            if (hasGrantedConsent) {
              // User previously accepted - set granted consent
              gtag('consent', 'default', ${JSON.stringify(ANALYTICS_CONFIG.consentTypes)});
            } else {
              // New user or declined - set denied consent
              gtag('consent', 'default', ${JSON.stringify(defaultConsent)});
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
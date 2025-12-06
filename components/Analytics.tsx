// components/Analytics.tsx
'use client'
import Script from 'next/script'

export function Analytics({ gtmId }: { gtmId: string }) {
  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`
        (function(w,d,s,l,i){
          w[l]=w[l]||[];
          w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0];
          var j=d.createElement(s);
          j.async=true;
          j.src='/api/insights/data.js' + (l!=='dataLayer'?'?l='+encodeURIComponent(l):'');
          f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `}
    </Script>
  )
}
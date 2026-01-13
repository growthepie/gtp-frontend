import "../globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Analytics as GTMAnalytics } from "@/components/Analytics";
import { Providers } from "../providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter, Roboto_Mono, Fira_Sans, Fira_Mono, Source_Code_Pro } from "next/font/google";
import Header from "@/components/layout/Header";
// import SidebarContainer from "@/components/layout/SidebarContainer";
import { Metadata } from "next";
import Head from "./head";
import Share from "@/components/Share";
import DeveloperTools from "@/components/development/DeveloperTools";
import Footer from "@/components/layout/Footer";
import GlobalSearchBar from "@/components/layout/GlobalSearchBar";
import { ProjectsMetadataProvider } from "./applications/_contexts/ProjectsMetadataContext";
import dynamic from "next/dynamic";
const SidebarContainer = dynamic(() => import("@/components/layout/SidebarContainer"), { ssr: true });

import { generateJsonLd } from "@/utils/json-ld";
const jsonLd = generateJsonLd({host: "www.growthepie.com", withSearchAction: true});

export const viewport = {
  width: "device-width",
  initialScale: "1.0",
  themeColor: "dark",
};

const gtpMain = {
  title: "growthepie – Ethereum Ecosystem Analytics",
  description:
    "Comprehensive data and insights across Ethereum Layer 1 and Layer 2 networks. Visualize usage, economics, and growth of the entire Ethereum ecosystem.",
};

const gtpFees = {
  title: {
    absolute: "Ethereum Layer 2 Fees - growthepie",
    template: "%s - growthepie",
  },
  description:
    "Fee analytics by the minute for Ethereum L2s — median transaction fees, native / ETH transfer fees, token swap fees, and more...",
};
const isFees = false;

const host = isFees ? "fees.growthepie.com" : "www.growthepie.com";

const title = isFees ? gtpFees.title : gtpMain.title;
const description = isFees ? gtpFees.description : gtpMain.description;

// YYYY-MM-DD UTC
const current_date = new Date().toISOString().split("T")[0];

export const metadata: Metadata = {
  metadataBase: new URL(`https://${host}`),
  title: title,
  description: description,
  openGraph: {
    title: "growthepie",
    description: "Visualizing Ethereum's Story Through Data",
    url: "https://www.growthepie.com",
    images: [
      {
        url: `https://api.growthepie.com/v1/og_images/landing.png?date=${current_date}`,
        width: 1200,
        height: 627,
        alt: "growthepie.com",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "growthepie.com",
    description: "Visualizing Ethereum's Story Through Data",
    site: "@growthepie_eth",
    siteId: "1636391104689094656",
    creator: "@growthepie_eth",
    creatorId: "1636391104689094656",
    images: [`https://www.growthepie.com/gtp_og.png?date=${current_date}`],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// If loading a variable font, you don't need to specify the font weight
const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
  adjustFontFallback: false,
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: false,
  preload: true,
});

const firaMono = Fira_Mono({
  subsets: ["latin"],
  variable: "--font-fira-mono",
  weight: ["400", "500", "700"],
  display: "swap",
  adjustFontFallback: false,
  preload: true,
});

const firaSans = Fira_Sans({
  subsets: ["latin"],
  variable: "--font-fira-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  preload: true,
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code-pro",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  preload: true,
});

const gtpGtmId = process.env.NEXT_PUBLIC_GTM_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inline script to prevent flash of wrong theme on initial load
  // Only sets the class, does NOT touch localStorage to avoid cross-tab conflicts
  const script = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      // If no stored preference or stored as 'dark', use dark theme
      if (!theme || theme === '"dark"' || theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      // Fallback to dark if localStorage fails
      document.documentElement.classList.add('dark');
    }
  })();
`;

  return (
    <html
      lang="en"
      className={`${raleway.variable} ${inter.variable} ${firaMono.variable} ${firaSans.variable} ${sourceCodePro.variable}`}
      suppressHydrationWarning
      style={{
        fontFeatureSettings: "'pnum' on, 'lnum' on",
      }}
    >
      <Head />
      <body className="!overflow-x-hidden overflow-y-scroll bg-forest-50 font-raleway text-forest-900 dark:bg-color-bg-default dark:text-color-text-primary">
        {/* GTM noscript fallback */}
        <noscript>
          <iframe 
            src={`/api/insights/n.html?id=${gtpGtmId}`}
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <script
          dangerouslySetInnerHTML={{
            __html: script,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <div
            id="background-container"
            className="background-container !fixed"
          >
            <div className="background-gradient-group">
              <div className="background-gradient-yellow"></div>
              <div className="background-gradient-green"></div>
            </div>
          </div>
          <div className="flex h-fit w-full justify-center">
            <div className="flex min-h-screen w-full max-w-[1920px] md:pl-[30px]">
              <ProjectsMetadataProvider>
                <GlobalSearchBar />
              </ProjectsMetadataProvider>
              <SidebarContainer />
              <div
                id="content-panel"
                className="relative z-10 flex min-h-full flex-1 flex-col overflow-y-auto overflow-x-hidden bg-inherit"
              >
                <div className="relative min-h-full w-full">
                  <Header />
                  <main className="z-10 mx-auto min-h-[calc(100vh-218px-56px)] w-full flex-1 pb-[165px] md:min-h-[calc(100vh-207px-80px)]">
                    {children}
                  </main>
                  {/* <BottomBanner /> */}
                  <Footer />
                </div>
              </div>
              <div className="pointer-events-none fixed bottom-[20px] z-50 flex w-full max-w-[1920px] justify-end">
                <div className="pointer-events-auto pr-[20px] md:pr-[50px]">
                    {/* <Details /> */}
                    <Share />
                </div>
              </div>
            </div>
          </div>
          <DeveloperTools />
          <CookieConsent />
        </Providers>
        <GTMAnalytics gtmId={gtpGtmId || ''} />
        <Analytics scriptSrc="/api/va/script.js" />
      </body>
    </html>
  );
}

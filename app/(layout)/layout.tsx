import "../globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "../providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter, Roboto_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import SidebarContainer from "@/components/layout/SidebarContainer";
import Backgrounds from "@/components/layout/Backgrounds";
import { Metadata } from "next";
import Head from "./head";
import { Graph } from "schema-dts";
import Share from "@/components/Share";
import Details from "@/components/Details";
import BottomBanner from "@/components/BottomBanner";
import "../background.css";
import DeveloperTools from "@/components/development/DeveloperTools";
import Footer from "@/components/layout/Footer";
import { meta, jsonLd } from "gtp.main.config.mjs";


export const metadata: Metadata = meta;

export const viewport = {
  width: "device-width",
  initialScale: "1.0",
  themeColor: "dark",
};

// If loading a variable font, you don't need to specify the font weight
const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
  adjustFontFallback: false,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: false,
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
  adjustFontFallback: false,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const script = `
  (function() {
    // Set dark theme
    document.documentElement.classList.add('dark');
    // Optionally, set dark theme in local storage
    localStorage.setItem('theme', 'dark');
  })();
`;

  return (
    <html
      lang="en"
      className={`${raleway.variable} ${inter.variable} ${robotoMono.variable}`}
      suppressHydrationWarning
      style={{
        fontFeatureSettings: "'pnum' on, 'lnum' on",
      }}
    >
      <Head />
      <body className="bg-forest-50 dark:bg-[#1F2726] text-forest-900 dark:text-forest-500 font-raleway !overflow-x-hidden overflow-y-scroll">
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
          <div className="flex h-fit w-full justify-center">
            <div className="flex w-full max-w-[1680px] min-h-screen">
              <SidebarContainer />
              <div className="flex flex-col flex-1 overflow-y-auto z-10 overflow-x-hidden relative min-h-full bg-white dark:bg-inherit">
                <div className="w-full relative min-h-full">
                  <div className="background-container !fixed">
                    <div className="background-gradient-group">
                      <div className="background-gradient-yellow"></div>
                      <div className="background-gradient-green"></div>
                    </div>
                  </div>
                  <Header />
                  <main className="flex-1 w-full mx-auto z-10 pb-[165px] min-h-[calc(100vh-218px-56px)] md:min-h-[calc(100vh-207px-80px)]">
                    {children}
                  </main>
                  {/* <BottomBanner /> */}
                  <Footer />
                </div>
              </div>
              <div className="z-50 flex fixed bottom-[20px] w-full max-w-[1680px] justify-end pointer-events-none">
                <div className="pr-[20px] md:pr-[50px] pointer-events-auto">
                  <div className="relative flex gap-x-[15px] z-50 p-[5px] bg-forest-500 dark:bg-[#5A6462] rounded-full shadow-[0px_0px_50px_0px_#00000033] dark:shadow-[0px_0px_50px_0px_#000000]">
                    {/* <Details /> */}
                    <Share />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DeveloperTools />
          <CookieConsent />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

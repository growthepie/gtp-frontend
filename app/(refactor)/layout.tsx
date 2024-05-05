import "../globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "../providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter, Roboto_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import SidebarContainer from "@/components/layout/SidebarContainer";
import Head from "./head";
import Share from "@/components/Share";
import BottomBanner from "@/components/BottomBanner";
import { baseMetadata } from "@/refactor/lib/seo/metadata";
import { baseJsonLd } from "@/refactor/lib/seo/jsonLd";

import "../background.css";
import { Metadata } from "next";

export const metadata: Metadata = baseMetadata;

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
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${raleway.variable} ${inter.variable} ${robotoMono.variable}`}
      suppressHydrationWarning
    >
      <Head />
      <body className="bg-forest-50 dark:bg-[#1F2726] text-forest-900 dark:text-forest-500 font-raleway !overflow-x-hidden overflow-y-scroll">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(baseJsonLd) }}
        />
        <Providers>
          <div className="flex h-fit w-full justify-center">
            <div className="flex w-full max-w-[1680px] min-h-screen">
              <SidebarContainer />
              <div className="flex flex-col flex-1 overflow-y-auto z-10 overflow-x-hidden relative min-h-full bg-white dark:bg-inherit">
                <div className="w-full relative min-h-full">
                  <div className="background-container">
                    <div className="background-gradient-group">
                      <div className="background-gradient-yellow"></div>
                      <div className="background-gradient-green"></div>
                    </div>
                  </div>
                  <Header />
                  <main className="flex-1 w-full mx-auto z-10 mb-[165px]">
                    {children}
                    <div className="bg-blue-200 z-50"></div>
                  </main>
                  <BottomBanner />
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
          {process.env.NEXT_PUBLIC_VERCEL_ENV === "development" && (
            <div className="fixed bottom-0 left-0 z-50 bg-white dark:bg-black text-xs px-1 py-0.5">
              <div className="block sm:hidden">{"< sm"}</div>
              <div className="hidden sm:block md:hidden">{"sm"}</div>
              <div className="hidden md:block lg:hidden">{"md"}</div>
              <div className="hidden lg:block xl:hidden">{"lg"}</div>
              <div className="hidden xl:block 2xl:hidden">{"xl"}</div>
              <div className="hidden 2xl:block">{"2xl"}</div>
            </div>
          )}
          <CookieConsent />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

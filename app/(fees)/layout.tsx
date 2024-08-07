import "../globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "../providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter, Roboto_Mono } from "next/font/google";
import SidebarContainer from "@/components/layout/SidebarContainer";
import { Metadata } from "next";
import { Graph } from "schema-dts";
import BottomBanner from "@/components/BottomBanner";
import Backgrounds from "@/components/layout/Backgrounds";
import "../background.css";
import Share from "@/components/Share";
import Icon from "@/components/layout/Icon";
import FeesContainer from "@/components/layout/FeesContainer";
import Head from "../(layout)/head";
import DeveloperTools from "@/components/development/DeveloperTools";
import { meta, jsonLd } from "gtp.fees.config.mjs";

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
      className={`${raleway.variable} ${inter.variable} ${robotoMono.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <Head />

      <body className="bg-forest-50 dark:bg-[#1F2726] text-forest-900 dark:text-forest-500 font-raleway !overflow-x-hidden min-h-screen relative">
        <div className="background-container !fixed">
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers forcedTheme="dark">
          <main className="relative z-10 select-none min-w-0 max-w-fit mx-auto">
            {children}
          </main>

          <div className="z-50 flex fixed inset-0 w-full justify-center pointer-events-none select-none">
            <div className="flex flex-col items-center justify-end min-h-screen w-full">
              <FeesContainer className="hidden md:flex max-w-[650px] md:min-w-[650px] md:max-w-[750px] pb-[20px] justify-end">
                <div className="pointer-events-auto">
                  <div className="hidden sm:flex relative gap-x-[15px] z-50 p-[5px] bg-forest-500 dark:bg-[#344240] rounded-full shadow-[0px_0px_50px_0px_#00000033] dark:shadow-[0px_0px_50px_0px_#000000]">
                    <Share />
                  </div>
                </div>
              </FeesContainer>
            </div>
          </div>
          {/* {process.env.NEXT_PUBLIC_VERCEL_ENV === "development" && (
            <div className="fixed bottom-0 left-0 z-50 bg-white dark:bg-black text-xs px-1 py-0.5">
              <div className="block sm:hidden">{"< sm"}</div>
              <div className="hidden sm:block md:hidden">{"sm"}</div>
              <div className="hidden md:block lg:hidden">{"md"}</div>
              <div className="hidden lg:block xl:hidden">{"lg"}</div>
              <div className="hidden xl:block 2xl:hidden">{"xl"}</div>
              <div className="hidden 2xl:block">{"2xl"}</div>
            </div>
          )} */}
          {/* <DeveloperTools /> */}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}

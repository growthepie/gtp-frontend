import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "./providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter } from "next/font/google";
import Header from "@/components/layout/Header";
import SidebarContainer from "@/components/layout/SidebarContainer";
import Head from "./head";
import Backgrounds from "@/components/layout/Backgrounds";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${raleway.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <Head />
      <body className="bg-forest-50 dark:bg-[#1F2726] text-forest-900 dark:text-forest-500 font-raleway overflow-x-hidden overflow-y-auto">
        <Providers>
          <div className="flex h-fit w-full justify-center">
            <div className="flex w-full max-w-[1680px] min-h-screen">
              <SidebarContainer />
              <div className="flex flex-col flex-1 overflow-y-auto z-10 overflow-x-hidden relative min-h-full bg-white dark:bg-inherit">
                <div className="w-full relative min-h-full">
                  {/* <div
                    style={{
                      pointerEvents: "none",
                      background: `radial-gradient(75.11% 75.11% at 69.71% 24.89%, #1B2524 0%, #364240 100%) fixed`,
                    }}
                    className="absolute z-0 mouse-events-none overflow-hidden w-full h-full hidden dark:block"
                  ></div> */}
                  <Backgrounds />
                  <Header />
                  <main className="flex-1 w-full mx-auto relative z-10 mb-[165px]">
                    {children}
                  </main>
                  <div className="mt-24 w-full text-center py-6 absolute bottom-0">
                    <div className="text-[0.7rem] text-inherit dark:text-forest-400 leading-[2] ml-8 z-20">
                      © 2023 Grow The Pie 🥧
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <CookieConsent />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

import "./globals.css";
import { Providers } from "./providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter } from "next/font/google";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import SidebarContainer from "@/components/layout/SidebarContainer";
import Head from "./head";

// export const metadata: Metadata = {
//   title: "Home",
//   description: "Welcome to Next.js",
// };

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
      <body className="bg-forest-50 text-forest-900 dark:text-forest-500 font-raleway  overflow-hidden">
        <Providers>
          <div className="flex h-screen w-full justify-center">
            <div className="flex w-full max-w-[1680px]">
              <SidebarContainer />
              <div className="flex flex-col flex-1 overflow-y-auto z-10 overflow-x-hidden relative bg-white dark:bg-inherit">
                <div className="w-full relative">
                  {/* <div
                    style={{
                      pointerEvents: "none",
                      background: `radial-gradient(75.11% 75.11% at 69.71% 24.89%, #1B2524 0%, #364240 100%) fixed`,
                    }}
                    className="absolute z-0 mouse-events-none overflow-hidden w-full h-full hidden dark:block"
                  ></div> */}
                  <div
                    style={{
                      pointerEvents: "none",
                      background: `radial-gradient(90.11% 90.11% at 77.71% 27.89%, #1B2524 0%, #364240 100%) fixed`,
                    }}
                    className="absolute z-0 mouse-events-none overflow-hidden w-full h-full hidden dark:block"
                  ></div>
                  <div
                    style={{
                      mixBlendMode: "overlay",
                      opacity: 0.4,
                      pointerEvents: "none",
                    }}
                    className="absolute z-0 mouse-events-none overflow-hidden w-full h-full hidden dark:block"
                  >
                    <div
                      style={{
                        height: "1215px",
                        width: "1026px",
                        left: "131px",
                        right: "-6px",
                        top: "-90px",
                        bottom: "602px",
                        background: `radial-gradient(45% 45% at 50% 50%, #FBB90D 0%, rgba(217, 217, 217, 0) 100%, rgba(251, 185, 13, 0) 100%)`,
                      }}
                      className="absolute z-0 mouse-events-none"
                    ></div>
                    <div
                      style={{
                        height: "1274px",
                        width: "1405px",
                        left: "410px",
                        right: "-475px",
                        top: "-90px",
                        bottom: "466px",
                        background: `radial-gradient(45% 45% at 50% 50%, #0DF6B9 0%, rgba(217, 217, 217, 0) 100%, rgba(13, 246, 185, 0) 100%)`,
                      }}
                      className="absolute z-0 mouse-events-none"
                    ></div>
                  </div>
                  <Header />
                  <main className="flex-1 w-full mx-auto pl-2 pr-2 md:pl-6 md:pr-[50px] relative z-10">
                    {children}
                  </main>
                  <div className="mt-24 w-full text-center py-6 relative">
                    <div className="text-[0.7rem] text-inherit dark:text-forest-400 leading-[1] ml-8 z-20">
                      © 2023 Grow The Pie 🥧
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}

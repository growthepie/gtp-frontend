"use client";
import "./globals.css";
import { useEffect, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import Link from "next/link";
import { useMediaQuery } from "usehooks-ts";
import { Providers } from "./providers";
import { getCookie } from "cookies-next";
import CookieConsent from "@/components/layout/CookieConsent";
import DarkModeSwitch from "@/components/layout/DarkModeSwitch";
import EthUsdSwitch from "@/components/layout/EthUsdSwitch";
import Sidebar from "@/components/layout/Sidebar";
import { Icon } from "@iconify/react";
import { Raleway } from "next/font/google";
import { addCollection } from "@iconify/react";
import GTPIcons from "@/icons/gtp.json";
import { useTheme } from "next-themes";

// If loading a variable font, you don't need to specify the font weight
const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
});

// load icons
addCollection(GTPIcons);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const consent = getCookie("growthepieCookieConsent");

  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  const [startSidebarOpen, setStartSidebarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { theme } = useTheme();

  useEffect(() => {
    setStartSidebarOpen(isLargeScreen);
  }, [isLargeScreen]);

  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      <Script
        id="gtag"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'analytics_storage': 'denied'
            });

            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WK73L5M');`,
        }}
      />
      {consent === true && (
        <Script
          id="consupd"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            gtag('consent', 'update', {
              'ad_storage': 'granted',
              'analytics_storage': 'granted'
            });
          `,
          }}
        />
      )}
      <body
        className={`bg-forest-50 text-forest-900 dark:text-forest-500 ${raleway.variable} font-raleway  overflow-hidden`}
      >
        <Providers>
          {/* <div className="flex flex-col min-h-screen max-h-screen h-screen"> */}
          {/* <background gradient> */}
          {/* <div className="absolute top-0 left-0 -z-10 flex w-full justify-center">
            <div className="h-[500px] xs:h-[650px] md:h-[700px] xl:h-[800px] 2xl:h-[900px] 3xl:h-[1200px]" />
            <div className="absolute -top-[20px] h-full w-[150vw] select-none xs:-top-[20px] sm:-top-[60px] md:-top-[100px] lg:-top-[120px] xl:-top-[120px] 2xl:-top-[150px]">
              <span className=" box-border block overflow-hidden absolute top-0 left-0 right-0 bottom-0">
                <Image
                  src="/bg-glow.png"
                  alt="Forest"
                  className="opacity-30 box-border block overflow-hidden absolute top-0 left-0 xs:left-[10vw] md:left-[45vw] lg:left-[55vw] xl:left-[65vw] bottom-0 m-auto min-w-full max-w-[150vw] w-[150vw] min-h-full max-h-[150vh] object-cover sm:object-scale-down mix-blend-soft-light"
                  fill={true}
                  quality={100}
                  priority={true}
                />
              </span>
            </div>
          </div> */}
          {/* </background gradient> */}
          <div className="flex h-screen w-full justify-center">
            <div className="flex w-full max-w-[1920px]">
              <div className="pt-8 pl-0 bg-forest-50 dark:bg-forest-900 mix-h-screen max-h-screen hidden md:flex flex-col overflow-hidden space-y-6 border-r-2 border-forest-500 dark:border-black/50">
                {isSidebarOpen ? (
                  <div className="h-[45.07px] mb-[18px]">
                    <div className="flex items-center mx-5 justify-between h-[45.07px]">
                      <Link
                        href="/"
                        className="relative h-[45.07px] w-[192.87px] block"
                      >
                        <div className="h-[45.07px] w-[192.87px] absolute left-3">
                          <Image
                            src="/logo_full.png"
                            alt="Forest"
                            className="mb-6 -ml-[9px] z-10 crisp-edges hidden dark:block"
                            fill={true}
                            quality={100}
                            priority
                          />
                          <Image
                            src="/logo_full_light.png"
                            alt="Forest"
                            className="mb-6 -ml-[9px] z-10 crisp-edges block dark:hidden"
                            fill={true}
                            quality={100}
                            priority
                          />
                        </div>
                      </Link>
                      <div>
                        <Icon
                          icon="feather:log-out"
                          className={`w-[13px] h-[13px] text-forest-900 cursor-pointer mt-2 transition-transform ${
                            isSidebarOpen ? "rotate-180" : ""
                          }`}
                          onClick={() => {
                            setIsSidebarOpen(isSidebarOpen ? false : true);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[45.07px] mt-1 mb-[14px]">
                    <div className="flex items-center ml-8 mr-2 justify-between h-[45.07px]">
                      <Link
                        href="/"
                        className="relative h-[24px] w-[22.29px] block"
                      >
                        <div className="h-[24px] w-[22.29px] absolute left-3">
                          <Image
                            src="/logo_pie_only.png"
                            alt="Forest"
                            className="mb-6 -ml-[9px] z-10 crisp-edges"
                            fill={true}
                            quality={100}
                            priority
                          />
                        </div>
                      </Link>
                      <div>
                        <Icon
                          icon="feather:log-out"
                          className={`w-[13px] h-[13px] text-forest-900 cursor-pointer mt-2`}
                          onClick={() => {
                            setIsSidebarOpen(isSidebarOpen ? false : true);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Sidebar
                  trigger={
                    <button className="flex items-center space-x-2">
                      <Icon icon="feather:menu" className="h-6 w-6" />
                    </button>
                  }
                  open={startSidebarOpen}
                  isOpen={isSidebarOpen}
                  setIsOpen={setIsSidebarOpen}
                />
              </div>
              <div
                className="flex flex-col flex-1 overflow-y-auto z-10 overflow-x-hidden relative bg-white dark:bg-inherit"
                // style={
                //   // theme === "dark"?
                //   // background: `radial-gradient(75.11% 75.11% at 69.71% 24.89%, #1B2524 0%, #364240 100%) fixed`,
                //   // : { background: "white" }
                // }
              >
                <div className="w-full relative">
                  <div
                    style={{
                      // left: "0",
                      // top: "0",
                      // bottom: "0",
                      // right: "0",
                      pointerEvents: "none",
                      background: `radial-gradient(75.11% 75.11% at 69.71% 24.89%, #1B2524 0%, #364240 100%) fixed`,
                    }}
                    className="absolute z-0 mouse-events-none overflow-hidden w-full h-full hidden dark:block"
                  ></div>
                  <div
                    style={{
                      // left: "0",
                      // top: "0",
                      // bottom: "0",
                      // right: "0",
                      mixBlendMode: "overlay",
                      opacity: 0.3,
                      pointerEvents: "none",
                    }}
                    className="absolute z-0 mouse-events-none overflow-hidden w-full h-full hidden dark:block"
                  >
                    <div
                      style={{
                        height: "1215px",
                        width: "1026px",
                        left: "231px",
                        right: "-6px",
                        top: "22px",
                        bottom: "602px",
                        background: `radial-gradient(50% 50% at 50% 50%, #FBB90D 0%, rgba(217, 217, 217, 0) 100%, rgba(251, 185, 13, 0) 100%);`,
                      }}
                      className="absolute z-0 mouse-events-none"
                    ></div>
                    <div
                      style={{
                        height: "1274px",
                        width: "1405px",
                        left: "510px",
                        right: "-475px",
                        top: "22px",
                        bottom: "466px",
                        background: `radial-gradient(50% 50% at 50% 50%, #0DF6B9 0%, rgba(217, 217, 217, 0) 100%, rgba(13, 246, 185, 0) 100%);`,
                      }}
                      className="absolute z-0 mouse-events-none"
                    ></div>
                  </div>
                  <header className="flex justify-between space-x-6 items-center max-w-[1600px] w-full mx-auto p-2 pr-2 md:p-6 md:pr-10">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-6">
                        <div className="block md:hidden relative">
                          <Sidebar
                            trigger={
                              <button className="flex items-center space-x-2">
                                <Icon icon="feather:menu" className="h-8 w-8" />
                              </button>
                            }
                            isMobile={true}
                            open={startSidebarOpen}
                            isOpen={isSidebarOpen}
                            setIsOpen={setIsSidebarOpen}
                          />
                          <Link href="" className="absolute top-2 left-20">
                            <div className="h-[32px] w-[32px] absolute">
                              <Image
                                src="/logo_pie_only.png"
                                alt="Forest"
                                className="mb-6 -ml-[9px] z-10 antialiased hover:scale-105 hover:translate-x-0 transition-transform duration-150 ease-in-out"
                                fill={true}
                                quality={100}
                              />
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-6 items-center">
                      <EthUsdSwitch />
                      <DarkModeSwitch />
                      <Link
                        href="https://twitter.com/growthepie_eth"
                        target="_blank"
                        rel="noopener"
                      >
                        <Icon icon="cib:twitter" className="h-6 w-6" />
                      </Link>
                      <Link
                        href="https://discord.gg/fxjJFe7QyN"
                        target="_blank"
                        rel="noopener"
                      >
                        <Icon icon="cib:discord" className="h-6 w-6" />
                      </Link>
                    </div>
                  </header>

                  <main className="flex-1 w-full mx-auto p-2 pr-2 md:p-6 md:pr-12 relative z-10">
                    {children}
                  </main>
                  <div className="mt-24 w-full text-center py-6">
                    <div className="text-[0.7rem] text-inherit dark:text-forest-400 leading-[1] ml-8">
                      © 2023 Grow The Pie 🥧
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* <Loader /> */}
          {/* </div> */}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}

// export default install(config, RootLayout);

"use client";
import "./globals.css";
import { useEffect, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import { Providers } from "./providers";
import { getCookie } from "cookies-next";
import CookieConsent from "@/components/layout/CookieConsent";
import DarkModeSwitch from "@/components/layout/DarkModeSwitch";
import EthUsdSwitch from "@/components/layout/EthUsdSwitch";
import Sidebar from "@/components/layout/Sidebar";
import Loader from "@/components/Loader";
import { Icon } from "@iconify/react";
import { Raleway } from "@next/font/google";

// If loading a variable font, you don't need to specify the font weight
const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const consent = getCookie("growthepieCookieConsent");

  const isLargeScreen = useMediaQuery("(min-width: 768px)");

  const [startSidebarOpen, setStartSidebarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        className={`bg-forest-50/30 bg-gradient-to-r dark:from-forest-800 dark:via-forest-900 dark:to-forest-900 text-forest-900 ${raleway.variable} font-raleway  overflow-hidden`}
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
          <div className="flex justify-between h-screen w-full">
            <div className="pt-6 pl-0 bg-forest-100 dark:bg-forest-900 mix-h-screen max-h-screen hidden md:flex flex-col overflow-hidden space-y-6 border-r-2 border-black/50">
              {isSidebarOpen ? (
                <div className="h-[45.07px]">
                  <div className="flex items-center mx-5 justify-between h-[45.07px]">
                    <Link
                      href="/"
                      className="relative h-[45.07px] w-[192.87px] block"
                    >
                      <div className="h-[45.07px] w-[192.87px] absolute left-3">
                        <Image
                          src="/logo_full.png"
                          alt="Forest"
                          className="mb-6 -ml-[9px] z-10 crisp-edges"
                          fill={true}
                          quality={100}
                        />
                      </div>
                    </Link>
                    <div>
                      <Icon
                        icon="feather:log-out"
                        className={`w-3 h-3 text-forest-900 cursor-pointer`}
                        onClick={() => {
                          setIsSidebarOpen(isSidebarOpen ? false : true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[45.07px]">
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
                        />
                      </div>
                    </Link>
                    <div>
                      <Icon
                        icon="feather:log-out"
                        className={`w-3 h-3 text-forest-900 cursor-pointer`}
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
            <div className="flex flex-col flex-1 overflow-y-auto pb-40">
              <header className="flex justify-between space-x-6 items-center max-w-[1600px] w-full mx-auto p-2 pr-2 md:p-6 md:pr-12">
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
                    <Icon
                      icon="cib:twitter"
                      className="h-6 w-6 opacity-70 hover:opacity-100"
                    />
                  </Link>
                  <Link
                    href="https://discord.gg/fxjJFe7QyN"
                    target="_blank"
                    rel="noopener"
                  >
                    <Icon
                      icon="cib:discord"
                      className="h-6 w-6 opacity-70 hover:opacity-100"
                    />
                  </Link>
                </div>
              </header>

              <main className="flex-1 max-w-[1600px] w-full mx-auto p-2 pr-2 md:p-6 md:pr-12">
                {children}
              </main>
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

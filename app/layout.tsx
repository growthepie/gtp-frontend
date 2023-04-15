"use client";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";
import DarkModeSwitch from "@/components/layout/DarkModeSwitch";
import { Providers } from "./providers";
import "./globals.css";
import Image from "next/image";

import { motion } from "framer-motion";
import EthUsdSwitch from "@/components/layout/EthUsdSwitch";
import Sidebar from "@/components/layout/Sidebar";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Raleway } from "@next/font/google";
import CookieConsent from "react-cookie-consent";

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
      <body
        className={`bg-forest-50/30 bg-gradient-to-r dark:from-forest-800 dark:via-forest-900 dark:to-forest-900 text-forest-900 ${raleway.variable} font-raleway`}
      >
        <div className="absolute top-0 left-0 -z-10 flex w-full justify-center overflow-clip">
          <div className="h-[500px] xs:h-[650px] md:h-[700px] xl:h-[800px] 2xl:h-[900px] 3xl:h-[1200px]" />
          <div className=" absolute -top-[20px] h-full w-[150vw] select-none xs:-top-[20px] sm:-top-[60px] md:-top-[100px] lg:-top-[120px] xl:-top-[120px] 2xl:-top-[150px]">
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
        </div>

        {/* large centered loading animation */}
        {/* <div
            id="main-loader"
            className="fixed inset-0 flex items-center justify-center"
          >
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 "></div>
          </div> */}
        {/* <div className="min-h-screen max-full mx-auto p-4 sm:p-6 lg:p-8"> */}
        <Providers>
          <CookieConsent
            disableStyles={true}
            contentStyle={{}}
            enableDeclineButton
            flipButtons
            location="bottom"
            cookieName="GrowThePieCookieConsent"
            // style={{ background: "black" }}
            buttonText="Allow All"
            declineButtonText="Decline"
            buttonClasses="bg-white text-forest-900 p-2 lg:p-4 rounded-full text-center whitespace-nowrap w-full lg:w-auto"
            declineButtonClasses="bg-white text-forest-900 p-2 lg:p-4 rounded-full text-center whitespace-nowrap w-full lg:w-auto"
            containerClasses="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0 lg:space-x-8 bg-forest-50 text-forest-900 border-forest-200 border-[1px] bottom-0 mb-10 fixed z-50 w-5/6 mx-auto rounded-3xl lg:rounded-full px-10 py-8 left-[50%] transform -translate-x-1/2 shadow-2xl"
            contentClasses="flex items-center justify-center space-x-4"
            buttonWrapperClasses="flex items-center justify-center w-full lg:w-auto space-y-4 lg:space-y-0 lg:space-x-8 flex-col lg:flex-row"
            expires={450}
          >
            <div>
              <Icon
                icon="feather:shield"
                className="w-24 h-24 lg:w-16 lg:h-16"
              />
            </div>
            <div className="flex items-center space-x-8">
              <div className="">
                Our website uses cookies to analyze how the site is used and to
                ensure your experience is consistent between visits.
                <br />
                Find our{" "}
                <Link href="/privacy-policy" className="underline relative">
                  Privacy Policy here.
                </Link>
                {/* <Link href="/privacy-policy" className="underline relative">
                  <div className="inline-flex underline absolute -bottom-0 left-4 w-40">
                    <Icon icon="fe:link-external" className="w-5 h-5" />
                    <div className="ml-1 text-sm">Privacy Policy</div>
                  </div>
                </Link> */}
              </div>
            </div>
          </CookieConsent>
          {/* <button className="bg-blue-100 w-full">s</button> */}
          <div className="flex justify-between h-fit w-full">
            <div className="pt-6 pl-4 bg-forest-100 dark:bg-forest-900 border-forest-400 mix-h-screen max-h-full hidden md:flex overflow-hidden flex-col">
              <Link href="/" className="relative h-[45px] block mb-4" passHref>
                <div className="h-[45px] w-[192px] absolute">
                  <Image
                    src="/logo-full.svg"
                    alt="Forest"
                    className="mb-6 -ml-[9px] z-10 antialiased hover:scale-105 hover:translate-x-1 transition-transform duration-150 ease-in-out"
                    fill={true}
                    quality={100}
                  />
                </div>
              </Link>
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
              id="main"
              className="min-h-screen flex flex-col flex-1 p-2 pr-2 md:p-6 md:pr-12"
            >
              <div className="flex justify-between items-center">
                <div className="flex space-x-6">
                  <div className="block md:hidden relative">
                    {/* <Link href="/" className="relative h-[45px] block mb-4">
                <div className="h-[45px] w-[192px] absolute">
                  <Image
                    src="/logo-full.svg"
                    alt="Forest"
                    className="mb-6 -ml-[9px] z-10 antialiased hover:scale-105 hover:translate-x-1 transition-transform duration-150 ease-in-out"
                    fill={true}
                    quality={100}
                  />
                </div>
              </Link> */}
                    <Sidebar
                      trigger={
                        <button className="flex items-center space-x-2 my-4">
                          <Icon icon="feather:menu" className="h-8 w-8" />
                        </button>
                      }
                      isMobile={true}
                      open={startSidebarOpen}
                      isOpen={isSidebarOpen}
                      setIsOpen={setIsSidebarOpen}
                    />
                  </div>
                  <Link
                    href="/"
                    className="relative h-[45px] block my-4"
                    passHref
                  >
                    <div className="h-[40px] w-[40px] absolute">
                      <Image
                        src="/logo-pie-only.svg"
                        alt="Forest"
                        className="mb-6 -ml-[9px] z-10 antialiased hover:scale-105 hover:translate-x-0 transition-transform duration-150 ease-in-out"
                        fill={true}
                        quality={100}
                      />
                    </div>
                  </Link>
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
              </div>
              <main className="flex-1 overflow-y-auto max-w-[1600px] w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
          {/* <Loader /> */}
        </Providers>
      </body>
    </html>
  );
}

// export default install(config, RootLayout);

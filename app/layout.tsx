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
const raleway = Raleway({ subsets: ["latin"] });

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
    <html lang="en" suppressHydrationWarning className={raleway.className}>
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      <body className="bg-forest-50/30 bg-gradient-to-r dark:from-forest-800 dark:via-forest-900 dark:to-forest-900 text-forest-900">
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
            enableDeclineButton
            flipButtons
            location="bottom"
            buttonText="Allow All"
            cookieName="GrowThePieCookieConsent"
            style={{ background: "black" }}
            buttonStyle={{
              color: "#000",
              background: "#fff",
              fontSize: "15px",
              borderRadius: "5px",
            }}
            declineButtonStyle={{
              margin: "10px 10px 10px 0",
              color: "#000",
              background: "#fff",
              borderRadius: "5px",
            }}
            expires={450}
          >
            <div className="flex items-center w-5/6">
              <div className="text-white dark:text-white font-medium">
                Our website uses cookies to analyze how the site is used and to
                ensure your experience is consistent between visits.{" "}
                <Link href="/privacy-policy" className="underline relative">
                  <div className="inline-flex underline absolute -bottom-0 left-4 w-40">
                    <Icon icon="fe:link-external" className="w-5 h-5" />
                    <div className="ml-1 text-sm">Privacy Policy</div>
                  </div>
                </Link>
              </div>
              {/* <div className="flex flex-row space-x-2">
                <button
                  className="bg-white text-black px-4 py-2 rounded-md"
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Reload
                </button>
                <button
                  className="bg-white text-black px-4 py-2 rounded-md"
                  onClick={() => {
                    window.location.href = "/privacy";
                  }}
                >
                  Privacy Policy
                </button>

                <button
                  className="bg-white text-black px-4 py-2 rounded-md"
                  onClick={() => {
                    window.location.href = "/terms";
                  }}
                >
                  Terms of Service
                </button>
              </div> */}
            </div>
          </CookieConsent>
          {/* <button className="bg-blue-100 w-full">s</button> */}
          <div className="flex justify-between h-fit w-full">
            <div className="pt-6 pl-4 bg-forest-100 dark:bg-forest-900 border-forest-400 mix-h-screen max-h-full hidden md:flex overflow-hidden flex-col">
              <Link href="/" className="relative h-[45px] block mb-4">
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
                        <button className="flex items-center space-x-2">
                          <Icon icon="feather:menu" className="h-6 w-6" />
                        </button>
                      }
                      isMobile={true}
                      open={startSidebarOpen}
                      isOpen={isSidebarOpen}
                      setIsOpen={setIsSidebarOpen}
                    />
                  </div>
                </div>
                <div className="flex space-x-6 items-center">
                  <EthUsdSwitch />
                  <DarkModeSwitch />
                  <Link href="#" passHref target="_blank" rel="noopener">
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
              <main>{children}</main>
            </div>
          </div>
          {/* <Loader /> */}
        </Providers>
      </body>
    </html>
  );
}

// export default install(config, RootLayout);

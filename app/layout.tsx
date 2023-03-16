"use client";
import "./globals.css";
// import install from '@twind/with-next/app';
import config from "../twind.config";
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import DarkModeSwitch from "@/components/layout/DarkModeSwitch";
import { MetricsProvider } from "@/context/MetricsProvider";
import { setup } from "@twind/core";
import { motion } from "framer-motion";

// activate twind - must be called at least once
// const twind = install(config);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [darkMode, setDarkMode] = useLocalStorage("darkMode", true);

  useEffect(() => {
    // activate twind - must be called at least once
    // install(config);
    // setup the twind instance
    var twind = setup(config);

    // remove the hidden attribute from the main div
    document.getElementById("main").removeAttribute("hidden");
    // hide the loading animation
    // document.getElementById("main-loader").hidden = true;
  }, []);

  return (
    <html lang="en" className={darkMode ? "dark" : ""}>
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      <MetricsProvider>
        <body className="bg-white text-black dark:bg-black dark:text-white transition-colors">
          {/* large centered loading animation */}
          {/* <div
            id="main-loader"
            className="fixed inset-0 flex items-center justify-center"
          >
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
          </div> */}

          {/* bouncy loading animation with solid black bg */}
          <motion.div
            id="main-loader"
            className="fixed inset-0 flex items-center justify-center bg-black z-50 w-full h-full"
            initial={{ opacity: 1 }}
            animate={{
              opacity: 0,
              transitionEnd: {
                display: "none",
              },
            }}
            transition={{ duration: 0.33, delay: 0.89 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="animate-bounce rounded-full h-32 w-32 border-8 border-gray-900 dark:border-white"
              initial={{ y: 0 }}
              animate={{ y: 10 }}
              transition={{ repeat: Infinity, type: "spring", stiffness: 100 }}
            ></motion.div>
          </motion.div>

          {/* <div className="min-h-screen max-full mx-auto p-4 sm:p-6 lg:p-8"> */}
          <div id="main" className="min-h-screen max-full" hidden>
            <div className="flex justify-between items-center p-8">
              <div className="font-bold text-2xl">LOGO</div>
              <DarkModeSwitch />
            </div>
            <main>{children}</main>
          </div>
        </body>
      </MetricsProvider>
    </html>
  );
}

// export default install(config, RootLayout);

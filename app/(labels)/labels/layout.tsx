import { Providers } from "../../providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter, Roboto_Mono, Source_Code_Pro } from "next/font/google";
import { Metadata } from "next";
import { Graph } from "schema-dts";
import Head from "../../(layout)/head";
import DeveloperTools from "@/components/development/DeveloperTools";
import "../../background.css";
import "../../globals.css";
import { MasterProvider } from "@/contexts/MasterContext";
import Share from "@/components/Share";
import { LabelsPageProvider } from "./LabelsContext";
import Footer from "./Footer";
import Header from "./Header";
import { meta, jsonLd } from "gtp.labels.config.mjs";



export const viewport = {
  width: "device-width",
  minimumScale: "1.0",
  maximumScale: "1.0",
  initialScale: "1.0",
  themeColor: "#1F2726",
};

export const metadata: Metadata = meta;

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

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code-pro",
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
      className={`${raleway.variable} ${inter.variable} ${robotoMono.variable} ${sourceCodePro.variable} scroll-smooth`}
      suppressHydrationWarning
      style={{
        fontFeatureSettings: "'pnum' on, 'lnum' on",
      }}
    >
      <Head />
      <body className="bg-forest-50 dark:bg-[#1F2726] text-forest-900 dark:text-forest-500">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers forcedTheme="dark">
          <MasterProvider>
            <LabelsPageProvider>
              <Header />
              <main className="font-raleway relative flex-1 w-full mx-auto min-h-screen select-none">
                <div className="background-container !fixed">
                  <div className="background-gradient-group">
                    <div className="background-gradient-yellow"></div>
                    <div className="background-gradient-green"></div>
                  </div>
                </div>

                {children}
                {/* <div className="z-50 flex fixed bottom-[20px] w-full max-w-[1680px] justify-end pointer-events-none">
                <div className="pr-[20px] md:pr-[50px] pointer-events-auto">
                  <div className="relative flex gap-x-[15px] z-50 p-[5px] bg-forest-500 dark:bg-[#5A6462] rounded-full shadow-[0px_0px_50px_0px_#00000033] dark:shadow-[0px_0px_50px_0px_#000000]">
                    <Share />
                  </div>
                </div>
              </div> */}
              </main>
              <Footer />
            </LabelsPageProvider>
          </MasterProvider>
          {/* <DeveloperTools /> */}
          <CookieConsent />
        </Providers >
      </body >
    </html >
  );
}

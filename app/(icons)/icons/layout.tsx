import { Providers } from "../../providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter, Roboto_Mono } from "next/font/google";
import { Metadata } from "next";
import { Graph } from "schema-dts";
import Head from "../../(layout)/head";
import DeveloperTools from "@/components/development/DeveloperTools";
import "../../background.css";
import "../../globals.css";
import { MasterProvider } from "@/contexts/MasterContext";
import { getPageMetadata } from "@/lib/metadata";
import { ToastProvider } from "@/components/toast/GTPToast";
import { IconLibraryProvider } from "@/contexts/IconLibraryContext";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata(
    "/icons",
    {}
  );
  return {
    ...metadata,
    openGraph: {
      title: "icons.growthepie.com",
      description:
        "Explore and download open source icons from growthepie. Freely available icons designed for the Ethereum ecosystem and beyond.",
      url: `https://icons.growthepie.com`,
      images: [
        {
          url: `https://icons.growthepie.com/gtp_og.png`,
          width: 1200,
          height: 627,
          alt: "growthepie.com",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "icons.growthepie.com",
      description:
        "Explore and download open source icons from growthepie. Freely available icons designed for the Ethereum ecosystem and beyond.",
      site: "@growthepie_eth",
      siteId: "1636391104689094656",
      creator: "@growthepie_eth",
      creatorId: "1636391104689094656",
      images: [`https://icons.growthepie.com/gtp_og.png`],
    },
    robots: {
      index: true,
      follow: true,
      nocache: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// const jsonLd = [jsonLdOrg, jsonLdWebSite];
export const viewport = {
  width: "device-width",
  minimumScale: "1.0",
  maximumScale: "1.0",
  initialScale: "1.0",
  themeColor: "#1F2726",
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
      <body className="bg-forest-50 text-forest-900 dark:bg-[#1F2726] dark:text-forest-500">
        <Providers forcedTheme="dark">
          <MasterProvider>
            <ToastProvider>
              <IconLibraryProvider>
                <main className="relative mx-auto min-h-screen w-full flex-1 select-none font-raleway">
                  <div className="background-container !fixed">
                    <div className="background-gradient-group">
                      <div className="background-gradient-yellow"></div>
                      <div className="background-gradient-green"></div>
                    </div>
                  </div>
                  {children}
                </main>
              </IconLibraryProvider>
            </ToastProvider>
          </MasterProvider>
          <DeveloperTools />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}

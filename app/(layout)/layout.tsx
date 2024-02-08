import "../globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "../providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter, Roboto_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import SidebarContainer from "@/components/layout/SidebarContainer";
import Backgrounds from "@/components/layout/Backgrounds";
import { Metadata } from "next";
import Head from "./head";
import { Graph } from "schema-dts";
import Share from "@/components/Share";
import Embed from "@/components/Embed";

const jsonLd: Graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.growthepie.xyz/#organization",
      name: "growthepie",
      url: "https://www.growthepie.xyz",
      logo: "https://www.growthepie.xyz/logo_full.png",
      sameAs: [
        "https://twitter.com/growthepie_eth",
        "https://mirror.xyz/blog.growthepie.eth",
        "https://github.com/growthepie",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.growthepie.xyz/#website",
      url: "https://www.growthepie.xyz",
      name: "growthepie",
      description:
        "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
      publisher: {
        "@type": "Organization",
        name: "growthepie",
        logo: {
          "@type": "ImageObject",
          url: "https://www.growthepie.xyz/logo_full.png",
        },
      },
    },
  ],
};

// const jsonLdWebSite: WithContext<WebSite> = {
//   "@context": "https://schema.org",
//   "@type": "WebSite",
//   url: "https://www.growthepie.xyz",
//   name: "growthepie",
//   description:
//     "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
//   publisher: {
//     "@type": "Organization",
//     name: "growthepie",
//     logo: {
//       "@type": "ImageObject",
//       url: "https://www.growthepie.xyz/logo_full.png",
//     },
//   },
// };

// const jsonLd = [jsonLdOrg, jsonLdWebSite];
export const viewport = {
  width: "device-width",
  initialScale: "1.0",
  themeColor: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.growthepie.xyz"),
  title: {
    absolute:
      "growthepie - Growing Ethereum’s Ecosystem Together - Layer 2 User Base",
    template: "%s - growthepie",
  },
  description:
    "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
  openGraph: {
    title: "growthepie",
    description: "Growing Ethereum’s Ecosystem Together",
    url: "https://www.growthepie.xyz",
    images: [
      {
        url: "https://www.growthepie.xyz/gtp_og.png",
        width: 1200,
        height: 627,
        alt: "growthepie.xyz",
      },
      {
        url: "https://www.growthepie.xyz/logo_full.png",
        width: 772,
        height: 181,
        alt: "growthepie.xyz",
      },
      {
        url: "https://www.growthepie.xyz/logo_pie_only.png",
        width: 168,
        height: 181,
        alt: "growthepie",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "growthepie.xyz",
    description: "Growing Ethereum’s Ecosystem Together",
    site: "@growthepie_eth",
    siteId: "1636391104689094656",
    creator: "@growthepie_eth",
    creatorId: "1636391104689094656",
    images: ["https://www.growthepie.xyz/gtp_og.png"],
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
      className={`${raleway.variable} ${inter.variable} ${robotoMono.variable}`}
      suppressHydrationWarning
    >
      <Head />
      <body className="bg-forest-50 dark:bg-[#1F2726] text-forest-900 dark:text-forest-500 font-raleway overflow-x-hidden overflow-y-scroll">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <div className="flex h-fit w-full justify-center">
            <div className="flex w-full max-w-[1680px] min-h-screen">
              <SidebarContainer />
              <div className="flex flex-col flex-1 overflow-y-auto z-10 overflow-x-hidden relative min-h-full bg-white dark:bg-inherit">
                <div className="w-full relative min-h-full">
                  <Backgrounds />
                  <Header />
                  <main className="flex-1 w-full mx-auto z-10 mb-[165px] md:px-[14px]">
                    {children}
                    <div className="bg-blue-200 z-50"></div>
                  </main>
                  <div className="mt-24 w-full text-center py-3 absolute bottom-0">
                    <div className="text-[0.7rem] text-inherit dark:text-forest-400 leading-[2] ml-8 z-20">
                      © {new Date().getFullYear()} growthepie 🥧
                    </div>
                  </div>
                </div>
              </div>
              {/* <div className="fixed bottom-[20px] right-[20px] md:right-[50px] flex justify-center items-center z-50">
                <div className="relative flex gap-x-[15px] z-50 p-[5px] bg-forest-500 dark:bg-[#5A6462] rounded-full shadow-[0px_0px_50px_0px_#00000033] dark:shadow-[0px_0px_50px_0px_#000000]">
                  <Share />
                </div>
              </div> */}
            </div>
          </div>
          {process.env.NODE_ENV === "development" && (
            <div className="fixed bottom-0 left-0 z-50 bg-white dark:bg-black text-xs px-1 py-0.5">
              <div className="block sm:hidden">{"< sm"}</div>
              <div className="hidden sm:block md:hidden">{"sm"}</div>
              <div className="hidden md:block lg:hidden">{"md"}</div>
              <div className="hidden lg:block xl:hidden">{"lg"}</div>
              <div className="hidden xl:block 2xl:hidden">{"xl"}</div>
              <div className="hidden 2xl:block">{"2xl"}</div>
            </div>
          )}

          <CookieConsent />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}

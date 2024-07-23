import "../globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "../providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter, Roboto_Mono } from "next/font/google";
import SidebarContainer from "@/components/layout/SidebarContainer";
import { Metadata } from "next";
import { Graph } from "schema-dts";
import BottomBanner from "@/components/BottomBanner";
import Backgrounds from "@/components/layout/Backgrounds";
import "../background.css";
import Share from "@/components/Share";
import Icon from "@/components/layout/Icon";
import FeesContainer from "@/components/layout/FeesContainer";
import Head from "../(layout)/head";

const jsonLd: Graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `https://www.growthepie.xyz/#organization`,
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
      "@id": `https://www.growthepie.xyz/#website`,
      url: `https://www.growthepie.xyz/`,
      name: "growthepie",
      description:
        "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
      publisher: {
        "@type": "Organization",
        name: "growthepie",
        logo: {
          "@type": "ImageObject",
          url: `https://www.growthepie.xyz/logo_full.png`,
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

const gtpMain = {
  title: {
    absolute:
      "Growing Ethereum’s Ecosystem Together - Layer 2 Weekly Engagement - growthepie",
    template: "%s - growthepie",
  },
  description:
    "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
};

const gtpFees = {
  title: {
    absolute: "Ethereum Layer 2 Fees - growthepie",
    template: "%s - growthepie",
  },
  description:
    "Fee analytics by the minute for Ethereum L2s — median transaction fees, native / ETH transfer fees, token swap fees, and more...",
};
const isFees =
  process.env.NEXT_PUBLIC_VERCEL_URL &&
  process.env.NEXT_PUBLIC_VERCEL_URL.includes("fees.");

const host = isFees ? "fees.growthepie.xyz" : "www.growthepie.xyz";

const title = isFees ? gtpFees.title : gtpMain.title;
const description = isFees ? gtpFees.description : gtpMain.description;

export const metadata: Metadata = {
  metadataBase: new URL(`https://${host}`),
  title,
  description,
  openGraph: {
    title: "growthepie",
    description: "Growing Ethereum’s Ecosystem Together",
    url: `https://${host}`,
    images: [
      {
        url: `https://${host}/gtp_og.png`,
        width: 1200,
        height: 627,
        alt: "growthepie.xyz",
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
    images: [`https://${host}/gtp_og.png`],
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
      className={`${raleway.variable} ${inter.variable} ${robotoMono.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <Head />
      <body className="bg-forest-50 dark:bg-[#1F2726] text-forest-900 dark:text-forest-500 font-raleway !overflow-x-hidden overflow-y-scroll relative min-h-screen">
        <div className="background-container">
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers forcedTheme="dark">
          <div className="flex h-fit w-full justify-center">
            <div className="flex w-full max-w-[650px] md:max-w-[900px] min-h-screen">
              <div className="flex flex-col flex-1 overflow-y-auto z-10 overflow-x-hidden relative min-h-full bg-white dark:bg-inherit">
                <div className="w-full mx-auto relative min-h-full">
                  {/* <Header /> */}
                  <main className="relative flex-1 w-full mx-auto z-10 select-none">
                    {children}
                  </main>
                </div>
              </div>
              <div className="z-50 flex fixed inset-0 w-full justify-end pointer-events-none select-none">
                <div className="flex flex-col justify-between w-full max-w-[650px] md:max-w-[900px] mx-auto min-h-screen">
                  <FeesContainer className="invisible pt-[102px] pointer-events-auto">
                    <div className="flex px-[5px] items-center w-full h-[54px] rounded-full bg-[#344240] shadow-[0px_0px_50px_0px_#000000]">
                      <a
                        className="flex items-center w-[162px] h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full px-2 gap"
                        href="https://www.growthepie.xyz/"
                        target="_blank"
                      >
                        <Icon icon="gtp:house" className="h-6 w-6" />
                        <div className="font-bold">Main platform</div>
                      </a>
                    </div>
                  </FeesContainer>
                  <FeesContainer className="flex w-full justify-end pb-[20px]">
                    <div className="pointer-events-auto">
                      <div className="relative flex gap-x-[15px] z-50 p-[5px] bg-forest-500 dark:bg-[#344240] rounded-full shadow-[0px_0px_50px_0px_#00000033] dark:shadow-[0px_0px_50px_0px_#000000]">
                        <Share />
                      </div>
                    </div>
                  </FeesContainer>
                </div>
              </div>
            </div>
          </div>
          {process.env.NEXT_PUBLIC_VERCEL_ENV === "development" && (
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
      </body>
    </html>
  );
}

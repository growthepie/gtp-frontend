import { Providers } from "../../providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter, Roboto_Mono } from "next/font/google";
import { Metadata } from "next";
import { Graph } from "schema-dts";
import Head from "../../(layout)/head";
import DeveloperTools from "@/components/development/DeveloperTools";
import "../../background.css";
import "../../globals.css";
import { MasterProvider } from "@/contexts/Master";

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
  minimumScale: "1.0",
  maximumScale: "1.0",
  initialScale: "1.0",
  themeColor: "#1F2726",
};

const gtpMain = {
  title: {
    absolute:
      "Growing Ethereum’s Ecosystem Together - Layer 2 Weekly Engagement - growthepie",
    template: "%s - growthepie ",
  },
  description:
    "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
};

const gtpLabels = {
  title: {
    absolute: "Labels - Ethereum L2 Smart Contracts - growthepie",
    template: "%s - growthepie",
  },
  description:
    "Discover and analyze Ethereum L2 smart contracts with Labels from growthepie. Explore project associations, categories, deployment details, and usage statistics. Search, filter, and gain insights into the Layer 2 ecosystems.",
};

const isLabels = true;

const host = isLabels ? "labels.growthepie.xyz" : "www.growthepie.xyz";

const title = isLabels ? gtpLabels.title : gtpMain.title;
const description = isLabels ? gtpLabels.description : gtpMain.description;

export const metadata: Metadata = {
  metadataBase: new URL(`https://${host}`),
  title,
  description,
  icons: {
    icon: "/labels.ico",
  },
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
      <body className="bg-forest-50 dark:bg-[#1F2726] text-forest-900 dark:text-forest-500">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers forcedTheme="dark">
          <MasterProvider>
            <main className="font-raleway relative flex-1 w-full mx-auto min-h-screen select-none">
              <div className="background-container !fixed">
                <div className="background-gradient-group">
                  <div className="background-gradient-yellow"></div>
                  <div className="background-gradient-green"></div>
                </div>
              </div>
              {/* <LabelsProviders> */}
              {/* <DuckDBProvider
                parquetFiles={[
                  LabelsParquetURLS.full,
                  LabelsParquetURLS.projects,
                  LabelsParquetURLS.sparkline,
                ]}
              >
                
              </DuckDBProvider> */}
              {children}
              {/* </LabelsProviders> */}
            </main>
          </MasterProvider>
          {/* <div className="flex h-fit w-full justify-center">
            <div className="flex w-full min-h-screen overflow-y-visible">
              <div className="flex flex-col flex-1 overflow-y-clip z-10 overflow-x-clip relative min-h-full bg-white dark:bg-inherit">
                <div className="w-full mx-auto relative min-h-full">
                  <main className="relative flex-1 w-full mx-auto z-10 min-h-screen select-none">
                    {children}
                  </main>
                </div>
              </div>
              <div className="z-50 flex fixed inset-0 w-full justify-end pointer-events-none select-none">
                <div className="flex flex-col justify-end w-full max-w-[650px] md:max-w-full mx-auto min-h-screen"></div>
              </div>
            </div>
          </div> */}
          {/* <DeveloperTools /> */}
          <CookieConsent />
        </Providers>
      </body>
    </html >
  );
}

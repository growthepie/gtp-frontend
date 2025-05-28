import { Providers } from "../../providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter, Roboto_Mono, Fira_Sans } from "next/font/google";
import { Metadata } from "next";
import { Graph } from "schema-dts";
import Head from "../../(layout)/head";
import DeveloperTools from "@/components/development/DeveloperTools";
import "../../background.css";
import "../../globals.css";
import { MasterProvider } from "@/contexts/MasterContext";
import Share from "@/components/Share";
import { meta } from "gtp.branch.config";
import { LabelsPageProvider } from "./LabelsContext";
import Footer from "./Footer";
import Header from "./Header";

const jsonLd: Graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `https://www.growthepie.com/#organization`,
      name: "growthepie",
      url: "https://www.growthepie.com",
      logo: "https://www.growthepie.com/logo_full.png",
      sameAs: [
        "https://twitter.com/growthepie_eth",
        "https://mirror.xyz/blog.growthepie.eth",
        "https://github.com/growthepie",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `https://www.growthepie.com/#website`,
      url: `https://www.growthepie.com/`,
      name: "growthepie",
      description:
        "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
      publisher: {
        "@type": "Organization",
        name: "growthepie",
        logo: {
          "@type": "ImageObject",
          url: `https://www.growthepie.com/logo_full.png`,
        },
      },
    },
  ],
};

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
    template: "%s - growthepie",
  },
  description:
    "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
};

const gtpLabels = {
  title: {
    absolute: "Ethereum Layer 2 Labels - growthepie",
    template: "%s - growthepie",
  },
  description:
    "Labels for Ethereum Layer 2 solutions - growthepie. A comprehensive list of labels for Ethereum Layer 2 solutions.",
};

const isLabels =
  process.env.NEXT_PUBLIC_VERCEL_URL &&
  process.env.NEXT_PUBLIC_VERCEL_URL.includes("labels.");

const host = isLabels ? "labels.growthepie.com" : "www.growthepie.com";

const title = isLabels ? gtpLabels.title : gtpMain.title;
const description = isLabels ? gtpLabels.description : gtpMain.description;

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
        alt: "growthepie.com",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "growthepie.com",
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

const firaSans = Fira_Sans({
  subsets: ["latin"],
  variable: "--font-fira-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${raleway.variable} ${inter.variable} ${robotoMono.variable} ${firaSans.variable} scroll-smooth`}
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
        </Providers>
      </body>
    </html>
  );
}
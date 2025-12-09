import "../globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Providers } from "../providers";
import CookieConsent from "@/components/layout/CookieConsent";
import { Raleway, Inter, Roboto_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import SidebarContainer from "@/components/layout/SidebarContainer";
import Backgrounds from "@/components/layout/Backgrounds";
import { Metadata } from "next";
// import Head from "./head";

import { generateJsonLd } from "@/utils/json-ld";
const jsonLd = generateJsonLd({host: "www.growthepie.com", withSearchAction: false});

export const viewport = {
  width: "device-width",
  initialScale: "1.0",
  themeColor: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.growthepie.com"),
  title: {
    absolute:
      "Growing Ethereum’s Ecosystem Together - Layer 2 Weekly Engagement - growthepie",
    template: "%s - growthepie",
  },
  description:
    "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.",
  openGraph: {
    title: "growthepie",
    description: "Growing Ethereum’s Ecosystem Together",
    url: "https://www.growthepie.com",
    images: [
      {
        url: "https://www.growthepie.com/gtp_og.png",
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
    images: ["https://www.growthepie.com/gtp_og.png"],
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
      {/* <Head /> */}
      <body className="sbg-white sdark:bg-color-bg-default bg-transparent text-forest-900 dark:text-color-text-primary font-raleway">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
        <Analytics scriptSrc="/api/va/script.js" />
      </body>
    </html>
  );
}

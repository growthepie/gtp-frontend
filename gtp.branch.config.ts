import { Metadata } from "next";

const IS_DEVELOPMENT = false;
const IS_PREVIEW = false;
const IS_PRODUCTION = true;

const urls = {
  production: "https://labels.growthepie.xyz",
  preview: "https://dev.labels.growthepie.xyz",
};

const shortUrls = {
  production: "labels.growthepie.xyz",
  preview: "dev.labels.growthepie.xyz",
};

const title = {
  absolute: "Ethereum Layer 2 Labels - growthepie",
  template: "%s - growthepie",
};

const description =
  "Labels for Ethereum Layer 2 solutions - growthepie. A comprehensive list of labels for Ethereum Layer 2 solutions.";
const shortDescription = "Labels for Ethereum Layer 2s";
const image = "https://www.growthepie.xyz/logo_full.png";
const favicon = "/labels.ico";

const og_images = [
  {
    url: `${urls.production}/gtp_og.png`,
    width: 1200,
    height: 627,
    alt: shortUrls.production,
  },
];

const openGraph = {
  title: title.absolute,
  description: description,
  url: urls.production,
  images: [
    {
      url: image,
      width: 800,
      height: 600,
      alt: shortUrls.production,
    },
  ],
  site_name: "growthepie",
};

const twitter_images = [`${urls.production}/gtp_og.png`];

const twitter = {
  card: "summary_large_image",
  title: shortUrls.production,
  description: shortDescription,
  site: "@growthepie_eth",
  siteId: "1636391104689094656",
  creator: "@growthepie_eth",
  creatorId: "1636391104689094656",
  images: twitter_images,
};

const meta: Metadata = {
  metadataBase: new URL(urls.production),
  title: title,
  description: description,
  icons: {
    icon: favicon,
  },
  openGraph: openGraph,
  twitter: twitter,
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

export {
  IS_DEVELOPMENT,
  IS_PREVIEW,
  IS_PRODUCTION,
  urls,
  shortUrls,
  title,
  description,
  shortDescription,
  image,
  favicon,
  og_images,
  openGraph,
  twitter,
  meta,
};

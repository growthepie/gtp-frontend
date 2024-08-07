const IS_DEVELOPMENT = false;
const IS_PREVIEW = false;
const IS_PRODUCTION = true;

const urls = {
  production: "https://www.growthepie.xyz",
  preview: "https://dev.growthepie.xyz",
};

const shortUrls = {
  production: "wwww.growthepie.xyz",
  preview: "dev.growthepie.xyz",
};

const title = {
  absolute:
    "Growing Ethereum’s Ecosystem Together - Layer 2 User Base - growthepie",
  template: "%s - growthepie",
};

const description =
  "At growthepie, our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem, acting as a trusted data aggregator from reliable sources such as L2Beat and DefiLlama, while also developing our own metrics.";
const shortDescription =
  "Our mission is to provide comprehensive and accurate analytics of layer 2 solutions for the Ethereum ecosystem.";
const image = "https://www.growthepie.xyz/logo_full.png";
const favicon = "/favicons/main.favicon.ico";

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

/** @type {import('next').Metadata} */
const meta = {
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

/** @type {import('schema-dts').Graph} */
const jsonLd = {
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

/** @type  {import('next-sitemap').Metadata} */
const sitemapConfig = {
  siteUrl: "https://www.growthepie.xyz",
  generateRobotsTxt: true,
  exclude: [
    "/server-sitemap.xml",
    "/blog",
    "/api/*",
    "/embed/*",
    "/embed",
    "/trackers/*",
    "/blockspace/*",
    "/fees",
    "/helpers",
    "/fees-explainer",
    "/contracts",
    "/economics",
    "/scroll",
    "/labels",
    "/refactor",
    "/refactor/*",
  ],
  robotsTxtOptions: {
    additionalSitemaps: [`https://www.growthepie.xyz/server-sitemap.xml`],
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
  jsonLd,
  sitemapConfig,
};

/**
 * Generates the JSON-LD Graph object for the website.
 * @param options - Configuration options for the JSON-LD object.
 * @param options.host - The domain host (e.g., 'feees.growthepie.com'). Defaults to 'www.growthepie.com'.
 * @param options.withSearchAction - Whether to include the website search action. Defaults to false.
 * @returns The structured data Graph object.
 */

import { Graph, Organization, WebSite } from "schema-dts";

interface JsonLdOptions {
  host?: string;
  withSearchAction?: boolean;
}

// for organization and website schema
export const generateJsonLd = ({
  host = "www.growthepie.com",
  withSearchAction = false,
}: JsonLdOptions = {}): Graph => {
  const baseUrl = `https://${host}`;

  const organization: Organization = {
    "@type": "Organization",
    "@id": "https://www.growthepie.com/#organization",
    name: "growthepie",
    legalName: "orbal GmbH",
    url: "https://www.growthepie.com",
    logo: {
      "@type": "ImageObject",
      url: "https://www.growthepie.com/logo-full.svg",
    },
    sameAs: [
      "https://twitter.com/growthepie_eth",
      "https://mirror.xyz/blog.growthepie.eth",
      "https://github.com/growthepie",
      "https://www.linkedin.com/company/growthepie",
    ],
  };

  const searchAction = withSearchAction
    ? ({
        "@type": "SearchAction",
        target: `${baseUrl}/?search=true&query={search_term_string}`,
        "query-input": "required name=search_term_string",
      } as any)
    : undefined;

  const webSite: WebSite = {
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "growthepie",
    description:
      "At growthepie, our mission is to provide comprehensive and accurate analytics for the Ethereum ecosystem. Ethereum Mainnet, Layer 2s, applications, and data-driven insights all in one place.",
    publisher: {
      "@id": organization["@id"],
    } as Organization,
    ...(searchAction ? { potentialAction: searchAction } : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, webSite],
  };
};

export const serializeJsonLd = (value: unknown) =>
  JSON.stringify(value, null, 2).replace(/</g, "\\u003c");

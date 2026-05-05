// lib/quick-bites/registries.ts
//
// Centralised topic + entity catalogue for quick-bite SEO/JSON-LD enrichment.
// Adding an entry here improves *every* article that mentions it — no per-
// article edits required.

export type RegistryEntry = {
  name: string;
  aliases?: string[];
  wikipedia?: string;
  wikidata?: string;
};

const sameAs = (e: RegistryEntry): string[] | undefined => {
  const urls = [e.wikipedia, e.wikidata].filter(Boolean) as string[];
  return urls.length ? urls : undefined;
};

// Keyed by lowercase canonical name. Lookups are case-insensitive and also
// match against aliases, so an article saying "USDC" or "USD Coin" both hit
// the same entry.
export const ENTITY_REGISTRY: RegistryEntry[] = [
  // L1 / L2 networks
  { name: "Ethereum", aliases: ["Ethereum mainnet", "ETH L1"], wikipedia: "https://en.wikipedia.org/wiki/Ethereum", wikidata: "https://www.wikidata.org/wiki/Q20990683" },
  { name: "Arbitrum", aliases: ["Arbitrum One", "Arbitrum Nova"], wikipedia: "https://en.wikipedia.org/wiki/Arbitrum", wikidata: "https://www.wikidata.org/wiki/Q116376274" },
  { name: "Optimism", aliases: ["OP Mainnet"], wikipedia: "https://en.wikipedia.org/wiki/Optimism_(blockchain)", wikidata: "https://www.wikidata.org/wiki/Q116376268" },
  { name: "Base", wikipedia: "https://en.wikipedia.org/wiki/Base_(blockchain)" },
  { name: "Polygon", aliases: ["Polygon PoS", "MATIC"], wikipedia: "https://en.wikipedia.org/wiki/Polygon_(blockchain)", wikidata: "https://www.wikidata.org/wiki/Q105823327" },
  { name: "Linea", wikipedia: "https://en.wikipedia.org/wiki/Linea_(blockchain)" },
  { name: "zkSync", aliases: ["zkSync Era"], wikipedia: "https://en.wikipedia.org/wiki/ZkSync" },
  { name: "Starknet", wikipedia: "https://en.wikipedia.org/wiki/Starknet" },
  { name: "Scroll", wikipedia: "https://en.wikipedia.org/wiki/Scroll_(blockchain)" },
  { name: "Solana", wikipedia: "https://en.wikipedia.org/wiki/Solana_(blockchain_platform)", wikidata: "https://www.wikidata.org/wiki/Q90405904" },
  { name: "Tron", aliases: ["TRX"], wikipedia: "https://en.wikipedia.org/wiki/Tron_(cryptocurrency)", wikidata: "https://www.wikidata.org/wiki/Q41680189" },
  { name: "Celo", wikipedia: "https://en.wikipedia.org/wiki/Celo_(cryptocurrency)" },
  { name: "MegaETH" },
  { name: "EigenDA" },

  // Stablecoins
  { name: "USD Coin", aliases: ["USDC"], wikipedia: "https://en.wikipedia.org/wiki/USD_Coin", wikidata: "https://www.wikidata.org/wiki/Q105942633" },
  { name: "Tether", aliases: ["USDT"], wikipedia: "https://en.wikipedia.org/wiki/Tether_(cryptocurrency)", wikidata: "https://www.wikidata.org/wiki/Q26210251" },
  { name: "Dai", aliases: ["DAI"], wikipedia: "https://en.wikipedia.org/wiki/Dai_(cryptocurrency)", wikidata: "https://www.wikidata.org/wiki/Q63967587" },
  { name: "EURC" },
  { name: "BUIDL", aliases: ["BlackRock BUIDL"] },

  // Issuers / orgs
  { name: "Circle", aliases: ["Circle Internet Financial"], wikipedia: "https://en.wikipedia.org/wiki/Circle_(company)", wikidata: "https://www.wikidata.org/wiki/Q24732654" },
  { name: "Tether Limited", wikipedia: "https://en.wikipedia.org/wiki/Tether_Limited", wikidata: "https://www.wikidata.org/wiki/Q97154417" },
  { name: "Robinhood", aliases: ["Robinhood Markets"], wikipedia: "https://en.wikipedia.org/wiki/Robinhood_Markets", wikidata: "https://www.wikidata.org/wiki/Q24948462" },
  { name: "Shopify", wikipedia: "https://en.wikipedia.org/wiki/Shopify", wikidata: "https://www.wikidata.org/wiki/Q3395886" },

  // Fiat currencies
  { name: "United States dollar", aliases: ["USD", "US dollar"], wikipedia: "https://en.wikipedia.org/wiki/United_States_dollar", wikidata: "https://www.wikidata.org/wiki/Q4917" },
  { name: "Euro", aliases: ["EUR"], wikipedia: "https://en.wikipedia.org/wiki/Euro", wikidata: "https://www.wikidata.org/wiki/Q4916" },

  // Concepts / standards
  { name: "Stablecoin", aliases: ["stablecoins"], wikipedia: "https://en.wikipedia.org/wiki/Stablecoin", wikidata: "https://www.wikidata.org/wiki/Q56241176" },
  { name: "Layer 2", aliases: ["L2", "rollup", "rollups", "Layer-2"], wikipedia: "https://en.wikipedia.org/wiki/Ethereum#Scalability" },
  { name: "Smart contract", aliases: ["smart contracts"], wikipedia: "https://en.wikipedia.org/wiki/Smart_contract", wikidata: "https://www.wikidata.org/wiki/Q3955018" },
  { name: "Ether", aliases: ["ETH"], wikipedia: "https://en.wikipedia.org/wiki/Ether_(cryptocurrency)" },
];

// Topics declared in qb files use display names like "Stablecoin Supply" or
// "Ethereum" — same lookup table, but matched by the exact topic name first.
export const TOPIC_REGISTRY: RegistryEntry[] = [
  { name: "Stablecoin Supply", wikipedia: "https://en.wikipedia.org/wiki/Stablecoin", wikidata: "https://www.wikidata.org/wiki/Q56241176" },
  { name: "Ethereum", wikipedia: "https://en.wikipedia.org/wiki/Ethereum", wikidata: "https://www.wikidata.org/wiki/Q20990683" },
  { name: "Layer 2", wikipedia: "https://en.wikipedia.org/wiki/Ethereum#Scalability" },
  { name: "Scaling", wikipedia: "https://en.wikipedia.org/wiki/Ethereum#Scalability" },
  { name: "Transaction Costs", wikipedia: "https://en.wikipedia.org/wiki/Ethereum#Gas" },
  ...ENTITY_REGISTRY, // entities also serve as topics
];

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Lookup helpers ------------------------------------------------------------

const findByName = (registry: RegistryEntry[], name: string): RegistryEntry | undefined => {
  const target = name.trim().toLowerCase();
  if (!target) return undefined;
  for (const e of registry) {
    if (e.name.toLowerCase() === target) return e;
    if (e.aliases?.some((a) => a.toLowerCase() === target)) return e;
  }
  return undefined;
};

export const lookupTopic = (name: string) => findByName(TOPIC_REGISTRY, name);
export const lookupEntity = (name: string) => findByName(ENTITY_REGISTRY, name);

export const sameAsForTopic = (name: string): string[] | undefined => {
  const e = lookupTopic(name);
  return e ? sameAs(e) : undefined;
};

// Scan free text and return every entity referenced. Used to auto-populate
// the JSON-LD `about[]` array without per-article curation.
export const detectEntitiesInText = (text: string): { name: string; sameAs?: string[] }[] => {
  if (!text) return [];
  const found = new Map<string, { name: string; sameAs?: string[] }>();
  for (const e of ENTITY_REGISTRY) {
    const candidates = [e.name, ...(e.aliases || [])];
    for (const c of candidates) {
      // Word-boundary match, case-insensitive. Skip very short aliases (< 3 chars)
      // unless they're all-caps tickers in the source text — keeps "Base" /
      // "ETH" / "USD" precise without exploding false positives on single chars.
      const isShort = c.length < 4;
      const re = isShort
        ? new RegExp(`\\b${escapeRegExp(c)}\\b`)
        : new RegExp(`\\b${escapeRegExp(c)}\\b`, "i");
      if (re.test(text)) {
        const key = e.name.toLowerCase();
        if (!found.has(key)) found.set(key, { name: e.name, sameAs: sameAs(e) });
        break;
      }
    }
  }
  return Array.from(found.values());
};

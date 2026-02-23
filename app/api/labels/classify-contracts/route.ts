import { NextResponse } from "next/server";

const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// Inlined from category_definitions.yml
const CATEGORY_CONTEXT = `## CeFi
- trading: Trading - Contracts primarily used for automated trading strategies like arbitrage, market-making, or complex MEV exploitation.
- cex: Centralized Exchange - Wallets and contracts directly managed or operated by centralized exchanges (CEXs).

## DeFi
- dex: Decentralized Exchange - Contracts facilitating peer-to-peer token swaps using automated market makers (AMMs) and liquidity pools.
- lending: Lending - Contracts allowing users to lend their crypto assets to earn interest or borrow assets by providing collateral.
- derivative: Derivative Exchange - Contracts enabling the creation and trading of financial derivatives (futures, options, perpetual swaps).
- staking: Staking - Contracts enabling users to lock up tokens to secure a network, participate in governance, or earn yield.
- index: Index - Crypto indexes designed to represent the overall performance of a specific segment of the cryptocurrency market.
- rwa: Real World Assets - Contracts focused on tokenizing real-world assets (real estate, commodities, bonds) on the blockchain.
- insurance: Insurance - Contracts from protocols offering insurance coverage against specific risks in the crypto space.
- custody: Custody - Services involved in the secure storage and management of digital assets on behalf of individuals or businesses.
- yield_vaults: Yield Vaults - Contracts with automated strategies (vaults) designed to maximize returns on deposited assets.

## NFT
- nft_fi: NFT Finance - Contracts bridging the gap between NFTs and DeFi, enabling lending against NFTs or fractionalizing NFTs.
- nft_marketplace: NFT Marketplace - Contracts from platforms facilitating the discovery, buying, selling, and auctioning of NFTs.
- non_fungible_tokens: Non-Fungible Tokens - The core smart contracts defining specific NFT collections (ERC721, ERC1155).

## Social
- community: Community - Contracts and tools fostering community building, social interaction, or decentralized social networking.
- gambling: Gambling - Contracts where outcomes are primarily determined by chance, involving wagering crypto assets.
- gaming: Gaming - Contracts supporting blockchain-integrated games, managing in-game assets, currencies, and game logic.
- governance: Governance - Contracts enabling decentralized decision-making processes for protocols, including token-based voting.

## Token Transfers
- native_transfer: Native Transfer - Direct transfers of a blockchain's native currency between EOAs or contracts.
- stablecoin: Stablecoin - ERC20 tokens designed to maintain a stable value, typically pegged to a fiat currency.
- fungible_tokens: Fungible Tokens - Standardized token contracts (primarily ERC20) representing interchangeable assets.

## Utility
- erc4337: Account Abstraction (ERC4337) - Contracts implementing ERC-4337 for Account Abstraction (EntryPoint, Paymaster, Smart Account).
- inscriptions: Inscriptions - Contracts or transactions primarily used to embed arbitrary data into transaction calldata.
- oracle: Oracle - Services providing reliable external data to smart contracts (price feeds, weather, etc.).
- depin: Decentralized Physical Infrastructure - Protocols coordinating physical infrastructure networks using blockchain.
- developer_tools: Developer Tool - Tools, contracts, and transactions designed to aid the blockchain development lifecycle.
- identity: Identity - Contracts from protocols managing decentralized digital identities and verification services.
- privacy: Privacy - Protocols using cryptographic techniques to obfuscate transaction details.
- airdrop: Airdrop - Smart contracts designed to distribute tokens or NFTs to a large number of addresses simultaneously.
- payments: Payments - Contracts enabling streamlined payment flows (subscriptions, streaming payments, payroll).
- donation: Donation - Platforms and contracts facilitating charitable donations and fundraising campaigns.
- cybercrime: Cybercrime - Contracts involved in malicious activities (phishing, rug pulls, exploit contracts).
- other: Others - Utility contracts that serve a specific purpose but don't neatly fit into predefined categories.

## Cross-Chain
- cc_communication: Cross-Chain Communication - Protocols enabling messaging and data transfer between different blockchains.
- bridge: Bridge - Contracts facilitating the transfer of assets between different blockchains.
- settlement: Settlement & Data Availability - Contracts used by Layer 2 solutions to post transaction batches or state roots to L1.`;

const CHAIN_MAPPING: Record<string, string> = {
  ethereum: "eip155:1",
  eth: "eip155:1",
  mainnet: "eip155:1",
  base: "eip155:8453",
  basechain: "eip155:8453",
  arbitrum: "eip155:42161",
  arb: "eip155:42161",
  optimism: "eip155:10",
  opt: "eip155:10",
  "polygon zkevm": "eip155:1101",
  zkevm: "eip155:1101",
  zksync: "eip155:324",
  "zksync era": "eip155:324",
  zora: "eip155:7777777",
  scroll: "eip155:534352",
  linea: "eip155:59144",
  swell: "eip155:1923",
  swellchain: "eip155:1923",
  taiko: "eip155:167000",
  mode: "eip155:34443",
  mantle: "eip155:5000",
  redstone: "eip155:690",
  unichain: "eip155:130",
  arbitrum_nova: "eip155:42170",
  celo: "eip155:42220",
};

const getApiKey = (): string =>
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || "";

type GeminiCandidate = { content?: { parts?: Array<{ text?: string }> } };
type GeminiPayload = { candidates?: GeminiCandidate[]; error?: { message?: string } };

async function callGeminiStructured(
  apiKey: string,
  systemInstruction: string,
  userPrompt: string,
  responseSchema: object,
): Promise<string> {
  const RETRY_ATTEMPTS = 3;
  let lastError = "Gemini request failed.";

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    const resp = await fetch(
      `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(DEFAULT_GEMINI_MODEL)}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
        cache: "no-store",
      },
    );

    const raw = await resp.text();

    if (!resp.ok) {
      lastError = raw;
      const shouldRetry = raw.includes("overloaded") || raw.includes("UNAVAILABLE");
      if (attempt < RETRY_ATTEMPTS && shouldRetry) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        continue;
      }
      throw new Error(`Gemini error (${resp.status}): ${raw.slice(0, 200)}`);
    }

    const payload = JSON.parse(raw) as GeminiPayload;
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) throw new Error("Gemini returned empty response.");
    return text;
  }

  throw new Error(lastError);
}

type ExtractedContract = { address: string; name: string; chain: string };

function resolveChain(raw: string, defaultChainId: string): string {
  if (!raw) return defaultChainId;
  if (raw.startsWith("eip155:")) return raw;
  if (/^\d+$/.test(raw)) return `eip155:${raw}`;
  return CHAIN_MAPPING[raw.toLowerCase()] ?? defaultChainId;
}

function fallbackExtract(text: string, defaultChainId: string): ExtractedContract[] {
  const matches = [...text.matchAll(/(?:"|')?0x[a-fA-F0-9]{40}(?:"|')?/g)].map((m) =>
    m[0].replace(/['"]/g, ""),
  );
  const unique = [...new Set(matches)];
  return unique.map((addr) => {
    const propMatch = text.match(new RegExp(`"([^"]+)"\\s*:\\s*["']${addr}["']`));
    return {
      address: addr.toLowerCase(),
      name: propMatch?.[1] ?? `Contract-${addr.substring(0, 8)}`,
      chain: defaultChainId,
    };
  });
}

async function preprocessContracts(
  text: string,
  defaultChainId: string,
  autoDetectChain: boolean,
  apiKey: string,
): Promise<ExtractedContract[]> {
  const systemInstruction = `You are a specialized extraction tool that processes blockchain-related text and extracts contract addresses with their names${autoDetectChain ? " and associated blockchain chains" : ""}. You can handle various input formats including plain text, JSON structures, CSV data, and mixed content. Always return a valid JSON array, even if empty.`;

  const chainInstructions = autoDetectChain
    ? `3. Try to identify which blockchain chain each address belongs to based on context (chain names, chainId values, network mentions). Use the EIP155 format (eip155:CHAIN_ID). If no chain is mentioned, use "${defaultChainId}".`
    : `3. Use "${defaultChainId}" as the chain for ALL contracts — do not attempt to detect the chain from text.`;

  const userPrompt = `Extract all Ethereum contract addresses (0x...) from the following text, along with appropriate names for each contract.

For each address:
1. Assign a meaningful name based on the text immediately preceding or surrounding the address. For JSON structures, use the property name as the contract name. If no name is found, use "Contract-[first 8 chars of address]".
2. If multiple instances of the same address exist, only include it once with its most relevant name.
${chainInstructions}

Input:
${text}`;

  const responseSchema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        address: { type: "STRING", description: "The contract address (0x...)" },
        name: { type: "STRING", description: "The contract name" },
        chain: { type: "STRING", description: "The EIP155 chain ID (e.g., eip155:1)" },
      },
      required: ["address", "name", "chain"],
    },
  };

  try {
    const content = await callGeminiStructured(apiKey, systemInstruction, userPrompt, responseSchema);
    const parsed = JSON.parse(content) as { address?: string; name?: string; chain?: string }[];
    return parsed
      .filter((item) => typeof item.address === "string" && /^0x[a-fA-F0-9]{40}$/i.test(item.address))
      .map((item) => ({
        address: item.address!.trim().toLowerCase(),
        name: item.name?.trim() || `Contract-${item.address!.substring(0, 8)}`,
        chain: resolveChain(item.chain ?? "", defaultChainId),
      }));
  } catch {
    return fallbackExtract(text, defaultChainId);
  }
}

const VALID_CATEGORY_IDS = [
  "trading", "cex", "dex", "lending", "derivative", "staking", "index", "rwa",
  "insurance", "custody", "yield_vaults", "nft_fi", "nft_marketplace",
  "non_fungible_tokens", "community", "gambling", "gaming", "governance",
  "native_transfer", "stablecoin", "fungible_tokens", "erc4337", "inscriptions",
  "oracle", "depin", "developer_tools", "identity", "privacy", "airdrop",
  "payments", "donation", "cybercrime", "other", "cc_communication", "bridge",
  "settlement",
];

async function classifyContracts(
  contracts: ExtractedContract[],
  project: string,
  apiKey: string,
): Promise<Record<string, string>> {
  if (!contracts.length) return {};

  const systemInstruction = `You are a blockchain contract classifier. Assign the most appropriate category_id from the provided list to each contract based on its name and project. Use ONLY the category_ids listed. If unsure, use "other".`;

  const contractList = contracts
    .map((c) => `- address: ${c.address}, name: ${c.name}${project ? `, project: ${project}` : ""}`)
    .join("\n");

  const userPrompt = `# Category Definitions
${CATEGORY_CONTEXT}

# Contracts to Classify
${contractList}

Return a JSON array where each element has "address" (the contract address) and "category_id" (chosen from the allowed list).`;

  // Use ARRAY schema to avoid unreliable dynamic property names (0x... keys)
  const responseSchema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        address: { type: "STRING", description: "The contract address (0x...)" },
        category_id: {
          type: "STRING",
          description: "The usage category",
          enum: VALID_CATEGORY_IDS,
        },
      },
      required: ["address", "category_id"],
    },
  };

  try {
    const content = await callGeminiStructured(apiKey, systemInstruction, userPrompt, responseSchema);
    const parsed = JSON.parse(content) as { address?: string; category_id?: string }[];
    const result: Record<string, string> = {};
    parsed.forEach((item) => {
      if (item.address && item.category_id && VALID_CATEGORY_IDS.includes(item.category_id)) {
        result[item.address.toLowerCase()] = item.category_id;
      }
    });
    return result;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.text?.trim()) {
      return NextResponse.json({ error: "Missing text input." }, { status: 400 });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY on the server." }, { status: 500 });
    }

    const text: string = body.text;
    const project: string = body.project || "";
    const defaultChainId: string = body.chain_id || "eip155:1";
    const autoDetectChain: boolean = body.auto_detect_chain ?? true;

    // Step 1: Extract contract addresses/names/chains from freeform text
    const contracts = await preprocessContracts(text, defaultChainId, autoDetectChain, apiKey);

    if (!contracts.length) {
      return NextResponse.json({ rows: [] });
    }

    // Step 2: Classify each contract into a usage category
    const categories = await classifyContracts(contracts, project, apiKey);

    // Step 3: Map to AttestationRowInput shape
    const rows = contracts.map((c) => ({
      chain_id: c.chain,
      address: c.address,
      contract_name: c.name,
      owner_project: project,
      usage_category: categories[c.address] || "other",
    }));

    return NextResponse.json({ rows });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Classification failed." },
      { status: 500 },
    );
  }
}

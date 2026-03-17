import { NextResponse } from "next/server";
import { createUsageCategoryRegistry } from "@openlabels/oli-sdk/chains";

const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const GTP_MASTER_URL = "https://api.growthepie.com/v1/master.json";

interface OLICategories {
  context: string;
  validIds: string[];
}

async function fetchOLICategories(): Promise<OLICategories> {
  try {
    // Fetch GTP master to determine which categories are supported
    let allowedIds: string[] | undefined;
    const gtpResponse = await fetch(GTP_MASTER_URL);
    if (gtpResponse.ok) {
      try {
        const gtpData = await gtpResponse.json() as { blockspace_categories?: { sub_categories?: Record<string, string> } };
        const subs = gtpData.blockspace_categories?.sub_categories;
        if (subs) allowedIds = Object.keys(subs);
      } catch { /* ignore — use full OLI list as fallback */ }
    }

    // SDK handles in-process caching internally
    const registry = await createUsageCategoryRegistry({ allowedIds, revalidateSeconds: 3600 });
    const categories = registry.allowed;

    const context = categories
      .map((c) => `- ${c.id}: ${c.name}${c.description ? ` - ${c.description}` : ""}`)
      .join("\n");
    const validIds = categories.map((c) => c.id);

    return { context, validIds };
  } catch {
    // Fall back to empty if fetch fails — classifyContracts will handle gracefully
    return { context: "", validIds: [] };
  }
}

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

async function classifyContracts(
  contracts: ExtractedContract[],
  project: string,
  apiKey: string,
  categories: OLICategories,
): Promise<Record<string, string>> {
  if (!contracts.length) return {};

  const { context, validIds } = categories;
  const fallbackId = validIds.includes("other") ? "other" : (validIds[0] ?? "other");

  const systemInstruction = `You are a blockchain contract classifier. Assign the most appropriate category_id from the provided list to each contract based on its name and project. Use ONLY the category_ids listed. If unsure, use "${fallbackId}".`;

  const contractList = contracts
    .map((c) => `- address: ${c.address}, name: ${c.name}${project ? `, project: ${project}` : ""}`)
    .join("\n");

  const userPrompt = `# Category Definitions
${context}

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
          enum: validIds.length ? validIds : undefined,
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
      if (item.address && item.category_id && (validIds.length === 0 || validIds.includes(item.category_id))) {
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

    // Step 2: Fetch OLI usage categories (cached) and classify each contract
    const oliCategories = await fetchOLICategories();
    const categories = await classifyContracts(contracts, project, apiKey, oliCategories);

    // Step 3: Map to AttestationRowInput shape
    const rows = contracts.map((c) => ({
      chain_id: c.chain,
      address: c.address,
      contract_name: c.name,
      owner_project: project,
      usage_category: categories[c.address] || (oliCategories.validIds.includes("other") ? "other" : oliCategories.validIds[0] ?? "other"),
    }));

    return NextResponse.json({ rows });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Classification failed." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { createUsageCategoryRegistry } from "@openlabels/oli-sdk/chains";

export const maxDuration = 60;

const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const GTP_MASTER_URL = "https://api.growthepie.com/v1/master.json";

interface OLICategories {
  context: string;
  validIds: string[];
}

type GtpMaster = {
  blockspace_categories?: { sub_categories?: Record<string, string> };
  chains?: Record<string, { name?: string; url_key?: string; evm_chain_id?: number | string | null }>;
};

async function fetchGtpMaster(): Promise<GtpMaster | null> {
  try {
    const gtpResponse = await fetch(GTP_MASTER_URL);
    if (!gtpResponse.ok) return null;
    return (await gtpResponse.json()) as GtpMaster;
  } catch {
    return null;
  }
}

async function fetchOLICategories(master: GtpMaster | null): Promise<OLICategories> {
  try {
    const subs = master?.blockspace_categories?.sub_categories;
    const allowedIds = subs ? Object.keys(subs) : undefined;
    const registry = await createUsageCategoryRegistry({ allowedIds, revalidateSeconds: 3600 });
    const categories = registry.allowed;
    const context = categories
      .map((c) => `- ${c.id}: ${c.name}${c.description ? ` - ${c.description}` : ""}`)
      .join("\n");
    return { context, validIds: categories.map((c) => c.id) };
  } catch {
    return { context: "", validIds: [] };
  }
}

// Short names and chains not listed in master.json. Everything else is derived from master.json.
const CHAIN_ALIASES: Record<string, string> = {
  eth: "eip155:1",
  mainnet: "eip155:1",
  basechain: "eip155:8453",
  arb: "eip155:42161",
  op: "eip155:10",
  opt: "eip155:10",
  zksync: "eip155:324",
  "polygon zkevm": "eip155:1101",
  zkevm: "eip155:1101",
  zora: "eip155:7777777",
  swell: "eip155:1923",
  swellchain: "eip155:1923",
  redstone: "eip155:690",
};

// Maps chain key, url_key and display name (lowercased, with "_"/"-" also as spaces) to eip155:<id>.
function buildChainMapping(master: GtpMaster | null): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const [chainKey, chain] of Object.entries(master?.chains ?? {})) {
    const chainId = chain.evm_chain_id != null ? String(chain.evm_chain_id).trim() : "";
    if (!/^\d+$/.test(chainId)) continue;
    const names = [chainKey, chain.url_key, chain.name]
      .filter((name): name is string => !!name)
      .flatMap((name) => {
        const lower = name.toLowerCase();
        return [lower, lower.replace(/[_-]/g, " ")];
      });
    for (const name of names) mapping[name] ??= `eip155:${chainId}`;
  }
  return { ...mapping, ...CHAIN_ALIASES };
}

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
        await new Promise((r) => setTimeout(r, 500 * attempt));
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

function resolveChain(raw: string, defaultChainId: string, chainMapping: Record<string, string>): string {
  if (!raw) return defaultChainId;
  if (raw.startsWith("eip155:")) return raw;
  if (/^\d+$/.test(raw)) return `eip155:${raw}`;
  const name = raw.trim().toLowerCase();
  return chainMapping[name] ?? chainMapping[name.replace(/[_-]/g, " ")] ?? defaultChainId;
}

type ContractResult = { address: string; name: string; chain: string; category_id: string };

function fallbackExtract(text: string, defaultChainId: string, fallbackId: string): ContractResult[] {
  const matches = [...text.matchAll(/(?:"|')?0x[a-fA-F0-9]{40}(?:"|')?/g)].map((m) =>
    m[0].replace(/['"]/g, ""),
  );
  return [...new Set(matches)].map((addr) => {
    const propMatch = text.match(new RegExp(`"([^"]+)"\\s*:\\s*["']${addr}["']`));
    return {
      address: addr.toLowerCase(),
      name: propMatch?.[1] ?? `Contract-${addr.substring(0, 8)}`,
      chain: defaultChainId,
      category_id: fallbackId,
    };
  });
}

async function extractAndClassify(
  text: string,
  defaultChainId: string,
  autoDetectChain: boolean,
  project: string,
  apiKey: string,
  categories: OLICategories,
  chainMapping: Record<string, string>,
): Promise<ContractResult[]> {
  const { context, validIds } = categories;
  const fallbackId = validIds.includes("other") ? "other" : (validIds[0] ?? "other");

  const chainInstructions = autoDetectChain
    ? `3. Detect the chain from context (chain names, chainId values, network mentions). Use EIP155 format (eip155:CHAIN_ID). Default to "${defaultChainId}" if unknown.`
    : `3. Use "${defaultChainId}" as the chain for ALL contracts.`;

  const systemInstruction = `You are a blockchain contract extraction and classification tool. Extract all Ethereum contract addresses from freeform text and assign each a name, chain, and usage category in one pass. Handle any input format: plain text, JSON, CSV, mixed content. Always return a valid JSON array, even if empty.`;

  const userPrompt = `Extract all Ethereum contract addresses (0x...) from the text below. For each:
1. Assign a meaningful name from surrounding context. For JSON keys use the key name. Fallback: "Contract-[first 8 chars]".
2. Deduplicate — include each address only once.
${chainInstructions}
4. Assign the most appropriate category_id from the list.${project ? ` Project context: ${project}.` : ""}

# Usage Categories
${context || "(none — use 'other')"}

# Input
${text}`;

  const responseSchema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        address: { type: "STRING", description: "Contract address (0x...)" },
        name: { type: "STRING", description: "Contract name" },
        chain: { type: "STRING", description: "EIP155 chain ID (e.g. eip155:1)" },
        category_id: { type: "STRING", description: "Usage category", ...(validIds.length ? { enum: validIds } : {}) },
      },
      required: ["address", "name", "chain", "category_id"],
    },
  };

  try {
    const content = await callGeminiStructured(apiKey, systemInstruction, userPrompt, responseSchema);
    const parsed = JSON.parse(content) as { address?: string; name?: string; chain?: string; category_id?: string }[];
    return parsed
      .filter((item) => typeof item.address === "string" && /^0x[a-fA-F0-9]{40}$/i.test(item.address))
      .map((item) => ({
        address: item.address!.trim().toLowerCase(),
        name: item.name?.trim() || `Contract-${item.address!.substring(0, 8)}`,
        chain: resolveChain(item.chain ?? "", defaultChainId, chainMapping),
        category_id:
          item.category_id && (validIds.length === 0 || validIds.includes(item.category_id))
            ? item.category_id
            : fallbackId,
      }));
  } catch {
    return fallbackExtract(text, defaultChainId, fallbackId);
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

    // Fetch categories first — needed in prompt, then single Gemini call does extract + classify
    const master = await fetchGtpMaster();
    const oliCategories = await fetchOLICategories(master);
    const chainMapping = buildChainMapping(master);
    const results = await extractAndClassify(text, defaultChainId, autoDetectChain, project, apiKey, oliCategories, chainMapping);

    if (!results.length) {
      return NextResponse.json({ rows: [] });
    }

    const rows = results.map((r) => ({
      chain_id: r.chain,
      address: r.address,
      contract_name: r.name,
      owner_project: project,
      usage_category: r.category_id,
    }));

    return NextResponse.json({ rows });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Classification failed." },
      { status: 500 },
    );
  }
}

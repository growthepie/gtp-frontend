import { NextResponse } from "next/server";

const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

type GeminiApiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

const getGeminiApiKey = (): string =>
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  "";

const extractGeminiText = (payload: GeminiApiResponse): string => {
  for (const candidate of payload.candidates ?? []) {
    const text = (candidate.content?.parts ?? [])
      .map((p) => (typeof p.text === "string" ? p.text : ""))
      .join("\n")
      .trim();
    if (text) return text;
  }
  return "";
};

const stripYamlFence = (v: string): string =>
  v.trim().replace(/^```(?:yaml|yml)?\s*/i, "").replace(/\s*```$/, "").trim();

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json({ error: "Missing url." }, { status: 400 });
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY on the server." }, { status: 500 });
    }

    const prompt = `Visit this URL: ${url}

Based on what you find, return YAML only with these exact keys:

name: <slug, lowercase hyphenated, <=60 chars, ASCII, no TLD, derived from the project name not the domain>
display_name: <human readable brand/project name>
description: <2-3 short neutral sentences about what the project is, no marketing language>
websites:
  - url: ${url}

Return YAML only. Do not include any social links or github.`;

    const toolAttempts: Array<Array<Record<string, unknown>> | undefined> = [
      [{ google_search: {} }],
      [{ google_search_retrieval: {} }],
      undefined,
    ];

    for (const tools of toolAttempts) {
      const reqBody: Record<string, unknown> = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      };
      if (tools) reqBody.tools = tools;

      const res = await fetch(
        `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(DEFAULT_GEMINI_MODEL)}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
          cache: "no-store",
        },
      );

      const raw = await res.text();
      const payload = raw ? (JSON.parse(raw) as GeminiApiResponse) : {};
      const text = extractGeminiText(payload);

      if (res.ok && text) {
        return NextResponse.json({ yaml: stripYamlFence(text), model: DEFAULT_GEMINI_MODEL });
      }
    }

    return NextResponse.json({ error: "Profiler returned no output." }, { status: 502 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected profiler error." },
      { status: 500 },
    );
  }
}

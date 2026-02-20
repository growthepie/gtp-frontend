import { NextResponse } from "next/server";

const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const MAX_PROMPT_LENGTH = 24000;

type GeminiApiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const getGeminiApiKey = (): string =>
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  "";

const extractGeminiText = (payload: GeminiApiResponse): string => {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();

    if (text) {
      return text;
    }
  }

  return "";
};

const stripYamlFence = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:yaml|yml)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
};

const callGemini = async (
  apiKey: string,
  model: string,
  prompt: string,
  tools?: Array<Record<string, unknown>>,
): Promise<{ ok: boolean; status: number; payload: GeminiApiResponse; rawText: string }> => {
  const requestBody: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
    },
  };

  if (tools) {
    requestBody.tools = tools;
  }

  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    },
  );

  const rawText = await response.text();
  let payload: GeminiApiResponse = {};

  try {
    payload = rawText ? (JSON.parse(rawText) as GeminiApiResponse) : {};
  } catch {
    payload = {};
  }

  return {
    ok: response.ok,
    status: response.status,
    payload,
    rawText,
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json({ error: "Prompt is too long." }, { status: 413 });
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY on the server." },
        { status: 500 },
      );
    }

    const toolAttempts: Array<Array<Record<string, unknown>> | undefined> = [
      [{ google_search: {} }],
      [{ google_search_retrieval: {} }],
      undefined,
    ];

    let latestError = "Gemini request failed.";

    for (const tools of toolAttempts) {
      const result = await callGemini(apiKey, DEFAULT_GEMINI_MODEL, prompt, tools);
      const responseText = extractGeminiText(result.payload);

      if (result.ok && responseText) {
        return NextResponse.json({
          yaml: stripYamlFence(responseText),
          model: DEFAULT_GEMINI_MODEL,
        });
      }

      const providerError = result.payload.error?.message?.trim();
      latestError = providerError || result.rawText || `Gemini request failed with status ${result.status}.`;
    }

    return NextResponse.json({ error: latestError }, { status: 502 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected profiler error." },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenAI,
  Content,
  Part,
  FunctionCallingConfigMode,
} from "@google/genai";
import {
  AIInsightsRequest,
  AIInsightsResponse,
  ChainInsightContext,
  TableInsightContext,
} from "@/types/api/AIInsightsResponse";
import { getSystemPrompt, buildInsightPrompt } from "@/lib/prompts/insights";
import { ToolCallRecord } from "@/lib/insights/tools/types";
import {
  getFunctionDeclarations,
  getToolByName,
} from "@/lib/insights/tools/registry";

// Initialize Gemini client - reads GEMINI_API_KEY from environment automatically
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model to use
const MODEL = "gemini-3-flash-preview";

// Max agentic tool turns before forcing a final answer
const MAX_TOOL_TURNS = 3;

// Rate limiting: simple in-memory store (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitKey = getRateLimitKey(request);
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "Retry-After": "60",
          },
        },
      );
    }

    // Parse request body
    const body: AIInsightsRequest = await request.json();
    const { componentType, title, context, customPrompt } = body;

    // Validate required fields
    if (!componentType || !context) {
      return NextResponse.json(
        { error: "Missing required fields: componentType and context" },
        { status: 400 },
      );
    }

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return NextResponse.json(
        { error: "AI service is not configured" },
        { status: 503 },
      );
    }

    // Determine the insight type based on component type
    const insightType = componentType === "chain" ? "chain" : "table";

    // Build the system prompt (includes current date)
    const systemPrompt = getSystemPrompt();

    // Build the prompt
    const userPrompt = buildInsightPrompt(
      insightType,
      context as TableInsightContext | ChainInsightContext,
      customPrompt,
    );

    // Build function declarations for this context
    const functionDeclarations = getFunctionDeclarations(componentType);

    // Build tools config — this model does not support mixing Google Search
    // with function calling in the same request, so we pick one or the other.
    // When function declarations are available, prefer them (the tools fetch
    // live data from the growthepie API). Fall back to Google Search otherwise.
    const tools =
      functionDeclarations.length > 0
        ? [{ functionDeclarations }]
        : [{ googleSearch: {} }];

    // Initialize conversation contents
    const contents: Content[] = [{ role: "user", parts: [{ text: userPrompt }] }];

    // Track tool calls for debug
    const toolCallRecords: ToolCallRecord[] = [];
    let agenticTurns = 0;

    // Agentic loop: max MAX_TOOL_TURNS tool-calling turns
    let thinking = "";
    let answer = "";
    let sources: { title: string; url: string }[] = [];

    for (let turn = 0; turn < MAX_TOOL_TURNS + 1; turn++) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 4096,
          tools,
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
            },
          },
          thinkingConfig: {
            includeThoughts: true,
          },
        },
      });

      // Extract the model's response parts
      const candidate = response.candidates?.[0];
      const modelParts = candidate?.content?.parts ?? [];

      // Append the model's response to conversation history
      contents.push({ role: "model", parts: modelParts });

      // Check if the model made any function calls
      const functionCalls = response.functionCalls;

      if (!functionCalls || functionCalls.length === 0) {
        // No function calls — extract text/thinking/sources and break
        for (const part of modelParts) {
          if (!part.text) continue;
          if (part.thought) {
            thinking += part.text + "\n";
          } else {
            answer += part.text;
          }
        }

        // Extract grounding sources if available
        const groundingMetadata = (response as any).candidates?.[0]
          ?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
          for (const chunk of groundingMetadata.groundingChunks) {
            if (chunk.web?.uri && chunk.web?.title) {
              sources.push({
                title: chunk.web.title,
                url: chunk.web.uri,
              });
            }
          }
        }
        break;
      }

      // We have function calls — execute them in parallel
      agenticTurns++;
      const functionResponseParts: Part[] = await Promise.all(
        functionCalls.map(async (fc) => {
          const name = fc.name ?? "unknown";
          const args = (fc.args ?? {}) as Record<string, unknown>;
          const start = Date.now();

          const tool = getToolByName(name);
          let result: Record<string, unknown>;
          let error: string | undefined;

          if (!tool) {
            result = { error: `Unknown tool: ${name}` };
            error = `Unknown tool: ${name}`;
          } else {
            try {
              result = await tool.execute(args);
              if (result.error) {
                error = String(result.error);
              }
            } catch (e) {
              error = e instanceof Error ? e.message : String(e);
              result = { error };
            }
          }

          const durationMs = Date.now() - start;
          toolCallRecords.push({ turn: agenticTurns, name, args, result, durationMs, error });

          return {
            functionResponse: {
              id: fc.id,
              name,
              response: result,
            },
          } as Part;
        }),
      );

      // Append function responses to conversation
      contents.push({ role: "user", parts: functionResponseParts });
    }

    // Fallback if no answer was extracted (shouldn't happen but just in case)
    if (!answer) {
      // Try to get text from the last model message
      const lastModel = contents
        .filter((c) => c.role === "model")
        .pop();
      if (lastModel?.parts) {
        for (const part of lastModel.parts) {
          if (part.text && !part.thought) {
            answer += part.text;
          }
        }
      }
    }

    if (!answer) {
      return NextResponse.json(
        { error: "No response generated" },
        { status: 500 },
      );
    }

    // Build the response
    const aiResponse: AIInsightsResponse = {
      insight: answer.trim(),
      cached: false,
      thinking: thinking.trim() || undefined,
      sources: sources.length > 0 ? sources : undefined,
      debug: {
        prompt: userPrompt,
        systemPrompt: systemPrompt,
        model: MODEL,
        toolCalls: toolCallRecords.length > 0 ? toolCallRecords : undefined,
        agenticTurns: agenticTurns > 0 ? agenticTurns : undefined,
      },
    };

    return NextResponse.json(aiResponse, {
      headers: {
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating AI insights:", error);

    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message.includes("API_KEY")) {
        return NextResponse.json(
          { error: "Invalid API configuration" },
          { status: 503 },
        );
      }
      if (error.message.includes("SAFETY")) {
        return NextResponse.json(
          { error: "Content was filtered for safety reasons" },
          { status: 400 },
        );
      }
      if (
        error.message.includes("quota") ||
        error.message.includes("RESOURCE_EXHAUSTED")
      ) {
        return NextResponse.json(
          { error: "AI service quota exceeded. Please try again later." },
          { status: 429 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 },
    );
  }
}

// Handle OPTIONS for CORS preflight if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

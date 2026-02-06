import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenAI,
  Content,
  Part,
  FunctionCallingConfigMode,
  FunctionCall,
} from "@google/genai";
import {
  AIInsightsRequest,
  ChainInsightContext,
  TableInsightContext,
} from "@/types/api/AIInsightsResponse";
import { getSystemPrompt, buildInsightPrompt } from "@/lib/prompts/insights";
import { ToolCallRecord } from "@/lib/insights/tools/types";
import {
  getFunctionDeclarations,
  getToolByName,
} from "@/lib/insights/tools/registry";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model to use
const MODEL = "gemini-2.5-flash";

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
  let body: AIInsightsRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { componentType, context, customPrompt, messages } = body;

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

  // Build prompts and tools before opening the stream
  const insightType = componentType === "chain" ? "chain" : "table";
  const systemPrompt = getSystemPrompt();
  const userPrompt = buildInsightPrompt(
    insightType,
    context as TableInsightContext | ChainInsightContext,
    customPrompt,
  );
  const functionDeclarations = getFunctionDeclarations(componentType);
  const tools =
    functionDeclarations.length > 0
      ? [{ functionDeclarations }]
      : [{ googleSearch: {} }];
  const isDebug = process.env.NEXT_PUBLIC_AI_DEBUG === "true";

  // Build initial conversation contents
  const contents: Content[] = [];

  if (messages && messages.length > 0) {
    // Multi-turn: reconstruct history
    // First message is always the original context prompt
    contents.push({ role: "user", parts: [{ text: userPrompt }] });
    for (const msg of messages) {
      if (msg.role === "user") {
        contents.push({ role: "user", parts: [{ text: msg.content }] });
      } else {
        contents.push({ role: "model", parts: [{ text: msg.content }] });
      }
    }
  } else {
    contents.push({ role: "user", parts: [{ text: userPrompt }] });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      }

      try {
        const toolCallRecords: ToolCallRecord[] = [];
        let agenticTurns = 0;
        let thinking = "";
        let answer = "";
        let sources: { title: string; url: string }[] = [];

        for (let turn = 0; turn < MAX_TOOL_TURNS + 1; turn++) {
          // Emit status
          send("status", {
            phase: turn === 0 ? "thinking" : "fetching",
            message: turn === 0 ? "Thinking..." : "Analyzing data...",
          });

          // Use streaming Gemini call
          const streamResponse = await ai.models.generateContentStream({
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
                  mode:
                    turn === 0
                      ? FunctionCallingConfigMode.ANY
                      : FunctionCallingConfigMode.AUTO,
                },
              },
              thinkingConfig: {
                includeThoughts: true,
              },
            },
          });

          // Collect all parts for conversation history + detect function calls
          const modelParts: Part[] = [];
          const detectedFunctionCalls: FunctionCall[] = [];
          let lastChunkResponse: unknown = null;

          for await (const chunk of streamResponse) {
            lastChunkResponse = chunk;
            const parts = chunk.candidates?.[0]?.content?.parts ?? [];

            for (const part of parts) {
              modelParts.push(part);

              if (part.thought && part.text) {
                send("thinking", { text: part.text });
                thinking += part.text;
              }

              if (!part.thought && part.text) {
                send("text", { chunk: part.text });
                answer += part.text;
              }

              if (part.functionCall) {
                detectedFunctionCalls.push(part.functionCall);
              }
            }
          }

          // Append model response to conversation history
          contents.push({ role: "model", parts: modelParts });

          // If no function calls, extract sources and break
          if (detectedFunctionCalls.length === 0) {
            // Extract grounding sources if available
            const groundingMetadata = (lastChunkResponse as any)
              ?.candidates?.[0]?.groundingMetadata;
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

          // Execute function calls
          agenticTurns++;
          send("status", {
            phase: "fetching",
            message: "Fetching data...",
          });

          // Execute all tool calls concurrently for better performance
          const functionResponseParts: Part[] = [];
          const toolPromises = detectedFunctionCalls.map(async (fc) => {
            const name = fc.name ?? "unknown";
            const args = (fc.args ?? {}) as Record<string, unknown>;
            const start = Date.now();

            send("tool_start", { name, args, turn: agenticTurns });

            const tool = getToolByName(name);
            let result: Record<string, unknown>;
            let error: string | undefined;

            if (!tool) {
              result = {
                error: `Unknown tool: ${name}`,
                suggestion: "Use one of the available tools",
                partial_data: null,
              };
              error = `Unknown tool: ${name}`;
            } else {
              try {
                result = await tool.execute(args);
                if (result.error) {
                  error = String(result.error);
                }
              } catch (e) {
                error = e instanceof Error ? e.message : String(e);
                result = {
                  error,
                  suggestion: "Try a different parameter or tool",
                  partial_data: null,
                };
              }
            }

            const durationMs = Date.now() - start;
            toolCallRecords.push({
              turn: agenticTurns,
              name,
              args,
              result,
              durationMs,
              error,
            });

            send("tool_end", {
              name,
              durationMs,
              error: error || null,
              result,
            });

            return {
              functionResponse: {
                id: fc.id,
                name,
                response: result,
              },
            } as Part;
          });

          // Wait for all tool calls — partial success: even if some fail,
          // we still return all results so the model can work with what succeeded
          const settledResults = await Promise.allSettled(toolPromises);
          for (const settled of settledResults) {
            if (settled.status === "fulfilled") {
              functionResponseParts.push(settled.value);
            }
          }

          // Append function responses to conversation
          contents.push({ role: "user", parts: functionResponseParts });
        }

        // Fallback: extract text from last model message if answer is empty
        if (!answer) {
          const lastModel = contents
            .filter((c) => c.role === "model")
            .pop();
          if (lastModel?.parts) {
            for (const part of lastModel.parts) {
              if (part.text && !part.thought) {
                answer += part.text;
                send("text", { chunk: part.text });
              }
            }
          }
        }

        if (!answer) {
          send("error", { message: "No response generated" });
          controller.close();
          return;
        }

        // Send done event with metadata
        send("done", {
          sources: sources.length > 0 ? sources : undefined,
          debug: isDebug
            ? {
                prompt: userPrompt,
                systemPrompt,
                model: MODEL,
                toolCalls:
                  toolCallRecords.length > 0 ? toolCallRecords : undefined,
                agenticTurns:
                  agenticTurns > 0 ? agenticTurns : undefined,
              }
            : undefined,
          cached: false,
        });

        controller.close();
      } catch (error) {
        console.error("Error generating AI insights:", error);

        let message = "Failed to generate insights";
        if (error instanceof Error) {
          if (error.message.includes("API_KEY")) {
            message = "Invalid API configuration";
          } else if (error.message.includes("SAFETY")) {
            message = "Content was filtered for safety reasons";
          } else if (
            error.message.includes("quota") ||
            error.message.includes("RESOURCE_EXHAUSTED")
          ) {
            message = "AI service quota exceeded. Please try again later.";
          }
        }

        send("error", { message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-RateLimit-Remaining": rateLimit.remaining.toString(),
    },
  });
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

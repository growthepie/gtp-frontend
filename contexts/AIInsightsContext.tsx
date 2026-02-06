"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AIInsightsResponse,
  InsightComponentType,
  TableInsightContext,
  ChainInsightContext,
} from "@/types/api/AIInsightsResponse";
import { ToolCallRecord } from "@/lib/insights/tools/types";
import { AIInsightsModal } from "@/components/layout/AIInsightsModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StreamPhase =
  | "idle"
  | "thinking"
  | "fetching"
  | "streaming"
  | "done"
  | "error";

export interface AIInsightsConfig {
  componentType: InsightComponentType;
  title: string;
  context: TableInsightContext | ChainInsightContext;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface AIInsightsContextValue {
  // Modal state
  isOpen: boolean;

  // Stream state
  phase: StreamPhase;
  thinking: string;
  insightText: string;
  toolCalls: ToolCallRecord[];
  sources: { title: string; url: string }[];
  debug: AIInsightsResponse["debug"] | null;
  error: string | null;
  cached: boolean;

  // Current config
  currentConfig: AIInsightsConfig | null;

  // Conversation history (for multi-turn)
  messages: ConversationMessage[];

  // Actions
  openInsights: (config: AIInsightsConfig) => void;
  closeInsights: () => void;
  sendFollowUp: (message: string) => Promise<void>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Cache (module-scope, survives navigation)
// ---------------------------------------------------------------------------

interface CachedInsight {
  insightText: string;
  thinking: string;
  toolCalls: ToolCallRecord[];
  sources: { title: string; url: string }[];
  debug: AIInsightsResponse["debug"] | null;
  timestamp: number;
}

const insightsCache = new Map<string, CachedInsight>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function generateCacheKey(
  context: TableInsightContext | ChainInsightContext,
  componentType: InsightComponentType,
): string {
  if (componentType === "chain") {
    const c = context as ChainInsightContext;
    return `chain:${c.chainKey}:${c.weeklyActiveAddresses}`;
  }
  const t = context as TableInsightContext;
  const chainKeys = t.chains
    .map((c) => c.chainKey)
    .sort()
    .join(",");
  return `table:${t.totalChains}:${chainKeys}:${t.sortedBy || "default"}`;
}

function getCachedInsight(key: string): CachedInsight | null {
  const cached = insightsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }
  insightsCache.delete(key);
  return null;
}

function setCachedInsight(key: string, data: CachedInsight): void {
  insightsCache.set(key, data);
}

// ---------------------------------------------------------------------------
// SSE parser
// ---------------------------------------------------------------------------

interface ParsedSSEEvent {
  type: string;
  data: unknown;
}

function parseSSEBuffer(buffer: string): {
  events: ParsedSSEEvent[];
  remaining: string;
} {
  const events: ParsedSSEEvent[] = [];
  const chunks = buffer.split("\n\n");
  const remaining = chunks.pop() ?? ""; // last chunk may be incomplete

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    const lines = chunk.split("\n");
    let eventType = "message";
    let dataStr = "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7);
      } else if (line.startsWith("data: ")) {
        dataStr = line.slice(6);
      }
    }

    if (dataStr) {
      try {
        events.push({ type: eventType, data: JSON.parse(dataStr) });
      } catch {
        // skip malformed data
      }
    }
  }

  return { events, remaining };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AIInsightsContext = createContext<AIInsightsContextValue | null>(null);

export function useAIInsightsContext(): AIInsightsContextValue {
  const ctx = useContext(AIInsightsContext);
  if (!ctx) {
    throw new Error(
      "useAIInsightsContext must be used within an AIInsightsProvider",
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AIInsightsProvider({ children }: { children: ReactNode }) {
  // Modal state
  const [isOpen, setIsOpen] = useState(false);

  // Stream state
  const [phase, setPhase] = useState<StreamPhase>("idle");
  const [thinking, setThinking] = useState("");
  const [insightText, setInsightText] = useState("");
  const [toolCalls, setToolCalls] = useState<ToolCallRecord[]>([]);
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [debug, setDebug] = useState<AIInsightsResponse["debug"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  // Config
  const [currentConfig, setCurrentConfig] = useState<AIInsightsConfig | null>(
    null,
  );

  // Conversation history
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  // Abort controller for canceling in-flight streams
  const abortRef = useRef<AbortController | null>(null);

  // -----------------------------------------------------------------------
  // Internal: reset stream state for a new request
  // -----------------------------------------------------------------------
  const resetStreamState = useCallback(() => {
    setPhase("idle");
    setThinking("");
    setInsightText("");
    setToolCalls([]);
    setSources([]);
    setDebug(null);
    setError(null);
    setCached(false);
  }, []);

  // -----------------------------------------------------------------------
  // Internal: start SSE stream
  // -----------------------------------------------------------------------
  const startStream = useCallback(
    async (
      config: AIInsightsConfig,
      conversationMessages?: ConversationMessage[],
    ) => {
      // Abort any existing stream
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setPhase("thinking");
      setError(null);

      try {
        const response = await fetch("/api/gemini/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            componentType: config.componentType,
            title: config.title,
            context: config.context,
            messages: conversationMessages?.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: controller.signal,
        });

        // Handle non-SSE error responses (rate limit, validation, etc.)
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(
            body.error || `HTTP error ${response.status}`,
          );
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const { events, remaining } = parseSSEBuffer(buffer);
          buffer = remaining;

          for (const event of events) {
            const d = event.data as Record<string, unknown>;

            switch (event.type) {
              case "status": {
                const p = d.phase as StreamPhase | undefined;
                if (p) setPhase(p);
                break;
              }
              case "thinking": {
                const text = d.text as string;
                if (text) {
                  setPhase("thinking");
                  setThinking((prev) => prev + text);
                }
                break;
              }
              case "tool_start": {
                setPhase("fetching");
                setToolCalls((prev) => [
                  ...prev,
                  {
                    turn: (d.turn as number) ?? 0,
                    name: (d.name as string) ?? "",
                    args: (d.args as Record<string, unknown>) ?? {},
                    result: {},
                    durationMs: 0,
                  },
                ]);
                break;
              }
              case "tool_end": {
                const name = d.name as string;
                const durationMs = (d.durationMs as number) ?? 0;
                const toolError = (d.error as string) || undefined;
                const toolResult =
                  (d.result as Record<string, unknown>) ?? {};
                setToolCalls((prev) =>
                  prev.map((tc) =>
                    tc.name === name && tc.durationMs === 0
                      ? {
                          ...tc,
                          durationMs,
                          error: toolError,
                          result: toolResult,
                        }
                      : tc,
                  ),
                );
                break;
              }
              case "text": {
                const chunk = d.chunk as string;
                if (chunk) {
                  setPhase("streaming");
                  setInsightText((prev) => prev + chunk);
                }
                break;
              }
              case "done": {
                setPhase("done");
                if (d.sources) {
                  setSources(
                    d.sources as { title: string; url: string }[],
                  );
                }
                if (d.debug) {
                  setDebug(d.debug as AIInsightsResponse["debug"]);
                }
                setCached((d.cached as boolean) ?? false);
                break;
              }
              case "error": {
                setPhase("error");
                setError(
                  (d.message as string) || "Unknown error",
                );
                break;
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("AI Insights stream error:", err);
        setPhase("error");
        setError(
          err instanceof Error ? err.message : "Unknown error",
        );
      }
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Public actions
  // -----------------------------------------------------------------------

  const openInsights = useCallback(
    (config: AIInsightsConfig) => {
      setIsOpen(true);
      setCurrentConfig(config);
      setMessages([]);

      // Check cache
      const cacheKey = generateCacheKey(
        config.context,
        config.componentType,
      );
      const cachedData = getCachedInsight(cacheKey);
      if (cachedData) {
        resetStreamState();
        setInsightText(cachedData.insightText);
        setThinking(cachedData.thinking);
        setToolCalls(cachedData.toolCalls);
        setSources(cachedData.sources);
        setDebug(cachedData.debug);
        setCached(true);
        setPhase("done");
        return;
      }

      // Start fresh stream
      resetStreamState();
      startStream(config).then(() => {
        // Cache the result after stream completes (if successful)
        // We need to read from the latest state, but since this runs
        // after setState batching, we use a small timeout
        setTimeout(() => {
          const resultEl = document.querySelector(
            "[data-ai-insight-text]",
          );
          // Caching is done via the cacheOnDone helper below
        }, 0);
      });
    },
    [resetStreamState, startStream],
  );

  // Cache completed insights when phase transitions to "done"
  // This is tracked via a ref to avoid stale closure issues
  const cacheOnDoneRef = useRef<() => void>();
  cacheOnDoneRef.current = () => {
    if (phase === "done" && currentConfig && insightText) {
      const cacheKey = generateCacheKey(
        currentConfig.context,
        currentConfig.componentType,
      );
      if (!insightsCache.has(cacheKey)) {
        setCachedInsight(cacheKey, {
          insightText,
          thinking,
          toolCalls,
          sources,
          debug,
          timestamp: Date.now(),
        });
      }
    }
  };

  // Trigger caching when phase becomes "done"
  const prevPhaseRef = useRef<StreamPhase>("idle");
  if (phase === "done" && prevPhaseRef.current !== "done") {
    // Schedule cache write after render
    setTimeout(() => cacheOnDoneRef.current?.(), 0);
  }
  prevPhaseRef.current = phase;

  const closeInsights = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendFollowUp = useCallback(
    async (message: string) => {
      if (!currentConfig) return;

      // Save the current answer as an assistant message
      const newMessages: ConversationMessage[] = [
        ...messages,
        ...(insightText
          ? [
              {
                role: "assistant" as const,
                content: insightText,
                timestamp: Date.now(),
              },
            ]
          : []),
        {
          role: "user" as const,
          content: message,
          timestamp: Date.now(),
        },
      ];
      setMessages(newMessages);

      // Reset stream state for the new response
      setThinking("");
      setInsightText("");
      setToolCalls([]);
      setSources([]);
      setDebug(null);
      setError(null);
      setCached(false);
      setPhase("thinking");

      // Start stream with conversation history
      await startStream(
        { ...currentConfig, context: currentConfig.context },
        newMessages,
      );
    },
    [currentConfig, messages, insightText, startStream],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    resetStreamState();
    setCurrentConfig(null);
    setMessages([]);
    setIsOpen(false);
  }, [resetStreamState]);

  const value: AIInsightsContextValue = {
    isOpen,
    phase,
    thinking,
    insightText,
    toolCalls,
    sources,
    debug,
    error,
    cached,
    currentConfig,
    messages,
    openInsights,
    closeInsights,
    sendFollowUp,
    reset,
  };

  return (
    <AIInsightsContext.Provider value={value}>
      {children}
      <AIInsightsModal />
    </AIInsightsContext.Provider>
  );
}

import { FunctionDeclaration } from "@google/genai";

/**
 * Bundles a Gemini FunctionDeclaration with a server-side execute function.
 */
export interface InsightTool {
  declaration: FunctionDeclaration;
  execute: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

/**
 * Debug trace for each tool call during the agentic loop.
 */
export interface ToolCallRecord {
  turn: number;
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  durationMs: number;
  error?: string;
}

import { FunctionDeclaration } from "@google/genai";
import { InsightComponentType } from "@/types/api/AIInsightsResponse";
import { InsightTool } from "./types";
import { allTools } from "./growthepie";

/**
 * Maps component types to the subset of tools they can use.
 */
const toolsByContext: Record<InsightComponentType, string[]> = {
  table: [
    "get_landing_summary",
    "get_metric_comparison",
    "get_economics_data",
    "get_blockspace_breakdown",
    "get_top_apps",
  ],
  chain: [
    "get_chain_overview",
    "get_chain_timeseries",
    "get_blockspace_breakdown",
    "get_da_metrics",
    "get_top_apps",
  ],
  chart: [
    "get_chain_timeseries",
    "get_metric_comparison",
  ],
  card: [
    "get_landing_summary",
    "get_economics_data",
    "get_fees_table",
  ],
};

/**
 * Get the InsightTool instances available for a given component type.
 */
export function getToolsForContext(
  componentType: InsightComponentType,
): InsightTool[] {
  const names = toolsByContext[componentType] ?? [];
  return names
    .map((name) => allTools[name])
    .filter((t): t is InsightTool => t !== undefined);
}

/**
 * Get the FunctionDeclarations for a given component type
 * (to pass directly to Gemini's tools config).
 */
export function getFunctionDeclarations(
  componentType: InsightComponentType,
): FunctionDeclaration[] {
  return getToolsForContext(componentType).map((t) => t.declaration);
}

/**
 * Look up a single tool by name.
 */
export function getToolByName(name: string): InsightTool | undefined {
  return allTools[name];
}

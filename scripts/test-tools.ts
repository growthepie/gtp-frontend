/**
 * Test script for AI Insights tools.
 * Run: npx tsx scripts/test-tools.ts
 * Output: scripts/test-tools-output.md
 */

import { allTools } from "../lib/insights/tools/growthepie";
import { writeFileSync } from "fs";
import { resolve } from "path";

const OUTPUT_PATH = resolve(__dirname, "test-tools-output.md");

interface TestCase {
  tool: string;
  label: string;
  args: Record<string, unknown>;
}

const tests: TestCase[] = [
  // Existing tools
  {
    tool: "get_landing_summary",
    label: "Landing Summary (no args)",
    args: {},
  },
  {
    tool: "get_economics_data",
    label: "Economics Data (no args)",
    args: {},
  },
  {
    tool: "get_fees_table",
    label: "Fees Table (no args)",
    args: {},
  },
  {
    tool: "get_chain_overview",
    label: "Chain Overview — Base",
    args: { chain: "base" },
  },
  {
    tool: "get_chain_timeseries",
    label: "Chain Timeseries — Arbitrum DAA",
    args: { chain: "arbitrum", metric: "daa" },
  },

  // New tools
  {
    tool: "get_blockspace_breakdown",
    label: "Blockspace Breakdown — all chains (7d)",
    args: { period: "7d" },
  },
  {
    tool: "get_blockspace_breakdown",
    label: "Blockspace Breakdown — Base only",
    args: { chain: "base", period: "7d" },
  },
  {
    tool: "get_metric_comparison",
    label: "Metric Comparison — DAA top 5",
    args: { metric: "daa", top_n: 5 },
  },
  {
    tool: "get_metric_comparison",
    label: "Metric Comparison — TVL top 10",
    args: { metric: "tvl" },
  },
  {
    tool: "get_top_apps",
    label: "Top Apps — 7d all chains",
    args: { timespan: "7d", limit: 10 },
  },
  {
    tool: "get_top_apps",
    label: "Top Apps — 7d Base only",
    args: { timespan: "7d", chain: "base", limit: 5 },
  },
  {
    tool: "get_da_metrics",
    label: "DA Metrics — all layers",
    args: {},
  },
  {
    tool: "get_da_metrics",
    label: "DA Metrics — ethereum_blobs only",
    args: { da_layer: "ethereum_blobs" },
  },

  // Error cases
  {
    tool: "get_chain_overview",
    label: "Error: invalid chain key",
    args: { chain: "nonexistent_chain_xyz" },
  },
  {
    tool: "get_blockspace_breakdown",
    label: "Error: invalid chain in blockspace",
    args: { chain: "nonexistent_chain_xyz" },
  },
  {
    tool: "get_da_metrics",
    label: "Error: invalid DA layer",
    args: { da_layer: "fake_da_layer" },
  },
];

function truncateJSON(obj: unknown, maxLen = 2000): string {
  const full = JSON.stringify(obj, null, 2);
  if (full.length <= maxLen) return full;
  return full.slice(0, maxLen) + "\n  ... (truncated)";
}

async function main() {
  const lines: string[] = [];
  lines.push("# AI Insights Tool Test Results");
  lines.push("");
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`**Tools available:** ${Object.keys(allTools).join(", ")}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const tool = allTools[test.tool];
    console.log(`Running: ${test.label} ...`);

    if (!tool) {
      lines.push(`## ${test.label}`);
      lines.push("");
      lines.push(`> Tool \`${test.tool}\` not found in allTools!`);
      lines.push("");
      failed++;
      continue;
    }

    const start = Date.now();
    let result: Record<string, unknown>;
    let errored = false;

    try {
      result = await tool.execute(test.args);
    } catch (e) {
      result = { uncaught_error: e instanceof Error ? e.message : String(e) };
      errored = true;
    }

    const durationMs = Date.now() - start;
    const hasError = !!result.error;
    const isExpectedError = test.label.startsWith("Error:");
    const status =
      errored ? "UNCAUGHT ERROR" :
      hasError && isExpectedError ? "PASS (expected error)" :
      hasError ? "FAIL" :
      "PASS";

    if (status.startsWith("PASS")) passed++;
    else failed++;

    lines.push(`## ${test.label}`);
    lines.push("");
    lines.push(`| | |`);
    lines.push(`|---|---|`);
    lines.push(`| **Tool** | \`${test.tool}\` |`);
    lines.push(`| **Args** | \`${JSON.stringify(test.args)}\` |`);
    lines.push(`| **Status** | ${status} |`);
    lines.push(`| **Duration** | ${durationMs}ms |`);
    lines.push("");

    if (result.error) {
      lines.push("**Error response:**");
      lines.push("```json");
      lines.push(JSON.stringify(result, null, 2));
      lines.push("```");
    } else {
      lines.push("<details>");
      lines.push("<summary>Response data (click to expand)</summary>");
      lines.push("");
      lines.push("```json");
      lines.push(truncateJSON(result));
      lines.push("```");
      lines.push("</details>");
    }

    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Summary
  const summary = [
    "## Summary",
    "",
    `| Result | Count |`,
    `|--------|-------|`,
    `| Passed | ${passed} |`,
    `| Failed | ${failed} |`,
    `| Total  | ${tests.length} |`,
    "",
  ];

  // Insert summary right after the header
  const insertIdx = lines.indexOf("---") + 2;
  lines.splice(insertIdx, 0, ...summary);

  const md = lines.join("\n");
  writeFileSync(OUTPUT_PATH, md, "utf-8");
  console.log(`\nDone! ${passed} passed, ${failed} failed.`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});

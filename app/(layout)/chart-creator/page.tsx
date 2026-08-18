"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import GTPChart from "@/components/GTPComponents/GTPChart";
import type { GTPChartSeries } from "@/components/GTPComponents/GTPChart";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { DEFAULT_COLORS } from "@/lib/echarts-utils";
import { useTheme } from "next-themes";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_TYPES = [
  { key: "line" as const, label: "Line" },
  { key: "area" as const, label: "Area" },
  { key: "bar" as const, label: "Bar" },
];

const GRANULARITY_OPTIONS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
] as const;

type Granularity = (typeof GRANULARITY_OPTIONS)[number]["key"];

type Scale = "absolute" | "stacked" | "percentage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChartSeriesType = "line" | "area" | "bar";

type SeriesEntry = {
  id: string;
  name: string;
  color: string;
  colorPair?: [string, string];
  seriesType: ChartSeriesType;
  data: [number, number][];
  visible: boolean;
  yAxisIndex: 0 | 1;
  source: "upload" | "gtp";
  sourceLabel: string;
};

type UploadState = {
  filename: string;
  headers: string[];
  rows: string[][];
  dateColIndex: number;
  valueColIndex: number;
};

// ---------------------------------------------------------------------------
// CSV / file parsing utilities
// ---------------------------------------------------------------------------

function detectDelimiter(line: string): string {
  const counts: Record<string, number> = {
    ",": (line.match(/,/g) ?? []).length,
    "\t": (line.match(/\t/g) ?? []).length,
    ";": (line.match(/;/g) ?? []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function tryParseDate(value: string): number | null {
  if (!value) return null;
  const v = value.trim().replace(/,/g, "");
  if (/^\d{10}$/.test(v)) return Number(v) * 1000;
  if (/^\d{13}$/.test(v)) return Number(v);
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.getTime();
  return null;
}

function isDateColumn(values: string[]): boolean {
  const sample = values.slice(0, Math.min(20, values.length)).filter(Boolean);
  if (sample.length === 0) return false;
  return sample.filter((v) => tryParseDate(v) !== null).length / sample.length >= 0.8;
}

function isNumericColumn(values: string[]): boolean {
  const sample = values.slice(0, Math.min(20, values.length)).filter(Boolean);
  if (sample.length === 0) return false;
  return sample.filter((v) => !isNaN(Number(v.replace(/,/g, "")))).length / sample.length >= 0.8;
}

function detectColumns(
  headers: string[],
  rows: string[][],
): { dateColIndex: number; valueColIndex: number } {
  let dateColIndex = -1;
  for (let i = 0; i < headers.length; i++) {
    if (isDateColumn(rows.map((r) => r[i] ?? ""))) {
      dateColIndex = i;
      break;
    }
  }
  let valueColIndex = -1;
  for (let i = 0; i < headers.length; i++) {
    if (i === dateColIndex) continue;
    if (isNumericColumn(rows.map((r) => r[i] ?? ""))) {
      valueColIndex = i;
      break;
    }
  }
  if (dateColIndex === -1) dateColIndex = 0;
  if (valueColIndex === -1) valueColIndex = dateColIndex === 0 ? 1 : 0;
  return { dateColIndex, valueColIndex };
}

function parseCSVText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("File must have at least 2 rows");
  const delimiter = detectDelimiter(lines[0]);
  return {
    headers: parseLine(lines[0], delimiter),
    rows: lines.slice(1).map((l) => parseLine(l, delimiter)),
  };
}

function parseJSONText(text: string): { headers: string[]; rows: string[][] } {
  const json = JSON.parse(text);
  const arr: unknown[] = Array.isArray(json)
    ? json
    : (json.data ?? json.rows ?? json.values ?? []);
  if (!Array.isArray(arr) || arr.length === 0)
    throw new Error("JSON must be an array");

  if (Array.isArray(arr[0])) {
    const first = arr[0] as unknown[];
    const hasHeader = first.every(
      (v) => typeof v === "string" && isNaN(Number(v)),
    );
    const headers = hasHeader
      ? first.map(String)
      : first.map((_, i) => `col${i}`);
    const rows = (hasHeader ? arr.slice(1) : arr).map((r) =>
      (r as unknown[]).map(String),
    );
    return { headers, rows };
  }

  if (typeof arr[0] === "object" && arr[0] !== null) {
    const headers = Object.keys(arr[0] as object);
    const rows = arr.map((obj) =>
      headers.map((h) => String((obj as Record<string, unknown>)[h] ?? "")),
    );
    return { headers, rows };
  }

  throw new Error(
    "Unrecognised JSON structure — expected array of objects or arrays",
  );
}

function rowsToSeriesData(
  rows: string[][],
  dateColIndex: number,
  valueColIndex: number,
): [number, number][] {
  return rows
    .map((row): [number, number] | null => {
      const ts = tryParseDate(row[dateColIndex] ?? "");
      const val = Number((row[valueColIndex] ?? "").replace(/,/g, ""));
      if (ts === null || isNaN(val)) return null;
      return [ts, val];
    })
    .filter((p): p is [number, number] => p !== null)
    .sort((a, b) => a[0] - b[0]);
}

// ---------------------------------------------------------------------------
// GTP API
// ---------------------------------------------------------------------------

async function fetchGTPMetric(
  chain: string,
  metric: string,
  granularity: Granularity,
): Promise<[number, number][]> {
  const url = `https://api.growthepie.com/v1/metrics/chains/${chain}/${metric}.json`;
  const headers: Record<string, string> = { "Cache-Control": "no-cache" };
  const token = process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN;
  if (token) headers["X-Developer-Token"] = token;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  const json = await res.json();

  const timeseries =
    json?.data?.details?.timeseries ?? json?.details?.timeseries;
  if (!timeseries) throw new Error("No timeseries in response");

  const period = timeseries[granularity] ?? timeseries.daily;
  if (!period?.data || !period?.types)
    throw new Error(`No ${granularity} data available`);

  const types = period.types as string[];
  const unixIdx = types.indexOf("unix");
  const valueIdx = types.findIndex((t: string) => t !== "unix");
  if (unixIdx === -1 || valueIdx === -1)
    throw new Error("Cannot find value column in API response");

  return (period.data as number[][])
    .map((row): [number, number] => [row[unixIdx], row[valueIdx]])
    .filter(([ts, v]) => Number.isFinite(ts) && Number.isFinite(v))
    .sort((a, b) => a[0] - b[0]);
}

type ChainOption = { key: string; name: string; dark: [string, string]; light: [string, string] };
type MetricOption = { key: string; name: string };
type MasterData = { chains: ChainOption[]; metrics: MetricOption[] };

async function fetchMasterData(): Promise<MasterData> {
  try {
    const res = await fetch("https://api.growthepie.com/v1/master.json");
    if (!res.ok) return { chains: [], metrics: [] };
    const json = await res.json();

    // Chains: PROD deployment only, sorted by name; all_l2s pinned first
    const rawChains: Record<string, {
      name?: string;
      deployment?: string;
      colors?: { dark?: [string, string]; light?: [string, string] };
    }> = json?.chains ?? {};
    const chains: ChainOption[] = Object.entries(rawChains)
      .filter(([, c]) => c.deployment === "PROD" && c.name && c.colors?.dark && c.colors?.light)
      .map(([key, c]) => ({
        key,
        name: c.name!,
        dark: c.colors!.dark!,
        light: c.colors!.light!,
      }))
      .sort((a, b) => {
        if (a.key === "all_l2s") return -1;
        if (b.key === "all_l2s") return 1;
        return a.name.localeCompare(b.name);
      });

    // Metrics: fundamental === true, sorted by name
    const rawMetrics: Record<string, { name?: string; fundamental?: boolean }> =
      json?.metrics ?? {};
    const metrics: MetricOption[] = Object.entries(rawMetrics)
      .filter(([, m]) => m.fundamental === true && m.name)
      .map(([key, m]) => ({ key, name: m.name! }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { chains, metrics };
  } catch {
    return { chains: [], metrics: [] };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickColor(index: number): string {
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// UI atoms
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-color-text-secondary">
      {children}
    </p>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return <p className="text-xs text-color-accent-red">{msg}</p>;
}

function NativeSelect({
  value,
  onChange,
  children,
}: {
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      className="w-full rounded-[8px] border border-color-ui-hover/30 bg-color-bg-main px-2 py-1.5 text-xs text-color-text-primary focus:outline-none cursor-pointer"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

// ---------------------------------------------------------------------------
// SeriesRow
// ---------------------------------------------------------------------------

function SeriesRow({
  entry,
  onChange,
  onRemove,
  isLast,
}: {
  entry: SeriesEntry;
  onChange: (patch: Partial<SeriesEntry>) => void;
  onRemove: () => void;
  isLast: boolean;
}) {
  return (
    <div
      className={`py-2.5 ${!isLast ? "border-b border-color-ui-hover/20" : ""}`}
    >
      {/* Name row */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => onChange({ visible: !entry.visible })}
          className="h-2.5 w-2.5 rounded-full flex-shrink-0 border-2 transition-opacity"
          style={{
            backgroundColor: entry.visible ? entry.color : "transparent",
            borderColor: entry.color,
            opacity: entry.visible ? 1 : 0.4,
          }}
          title={entry.visible ? "Hide series" : "Show series"}
        />
        <input
          className="flex-1 min-w-0 bg-transparent text-xs text-color-text-primary outline-none border-b border-transparent focus:border-color-ui-hover transition-colors"
          value={entry.name}
          onChange={(e) => onChange({ name: e.target.value })}
          title="Click to rename"
        />
        <button
          onClick={onRemove}
          className="text-color-text-secondary hover:text-color-accent-red transition-colors flex-shrink-0"
          title="Remove"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="color"
          value={entry.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-4 w-4 rounded cursor-pointer p-0 border-0 bg-transparent flex-shrink-0"
          title="Pick color"
        />

        <div className="flex rounded-[6px] overflow-hidden border border-color-ui-hover/25">
          {CHART_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => onChange({ seriesType: t.key })}
              className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                entry.seriesType === t.key
                  ? "bg-color-text-primary text-color-bg-default"
                  : "text-color-text-secondary hover:text-color-text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={() =>
            onChange({ yAxisIndex: entry.yAxisIndex === 0 ? 1 : 0 })
          }
          className={`ml-auto px-2 py-0.5 rounded-[6px] border text-[10px] font-medium transition-colors ${
            entry.yAxisIndex === 1
              ? "bg-color-text-primary text-color-bg-default border-color-text-primary"
              : "border-color-ui-hover/30 text-color-text-secondary hover:text-color-text-primary"
          }`}
          title="Toggle secondary Y-axis"
        >
          Y2
        </button>
      </div>

      <p className="text-[10px] text-color-text-secondary mt-1.5">
        {entry.data.length.toLocaleString()} pts ·{" "}
        {entry.source === "gtp" ? "growthepie" : entry.sourceLabel}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScaleToggle — matches fundamentals absolute/stacked/% bar
// ---------------------------------------------------------------------------

const SCALE_OPTIONS: { key: Scale; label: string }[] = [
  { key: "absolute", label: "Absolute" },
  { key: "stacked", label: "Stacked" },
  { key: "percentage", label: "% Share" },
];

function ScaleToggle({ value, onChange }: { value: Scale; onChange: (s: Scale) => void }) {
  return (
    <div className="flex rounded-full overflow-hidden border border-color-ui-hover/30 w-fit">
      {SCALE_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            value === opt.key
              ? "bg-color-text-primary text-color-bg-default"
              : "text-color-text-secondary hover:text-color-text-primary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ChartCreatorPage() {
  const { theme } = useTheme();
  const [series, setSeries] = useState<SeriesEntry[]>([]);
  const [scale, setScale] = useState<Scale>("absolute");
  const [chartTitle, setChartTitle] = useState("");
  const [chartSubtitle, setChartSubtitle] = useState("");

  // Chains + metrics from master
  const [masterData, setMasterData] = useState<MasterData>({ chains: [], metrics: [] });
  const masterFetched = useRef(false);
  useEffect(() => {
    if (masterFetched.current) return;
    masterFetched.current = true;
    fetchMasterData().then(setMasterData);
  }, []);

  // Upload
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GTP loader
  const [selectedChain, setSelectedChain] = useState("all_l2s");
  const [selectedMetric, setSelectedMetric] = useState("txcount");
  const [selectedGranularity, setSelectedGranularity] =
    useState<Granularity>("daily");
  const [gtpLoading, setGtpLoading] = useState(false);
  const [gtpError, setGtpError] = useState<string | null>(null);

  const stack = scale === "stacked" || scale === "percentage";
  const percentageMode = scale === "percentage";
  const showLegend = series.filter((s) => s.visible && s.data.length > 0).length > 1;

  const chartSeries = useMemo(
    (): GTPChartSeries[] =>
      series
        .filter((s) => s.visible && s.data.length > 0)
        .map((s) => ({
          name: s.name,
          data: s.data,
          seriesType: s.seriesType,
          color: s.colorPair ?? s.color,
          yAxisIndex: s.yAxisIndex,
        })),
    [series],
  );

  // ---- File handling ----

  const processFile = useCallback(async (file: File) => {
    setUploadError(null);
    try {
      const text = await file.text();
      let headers: string[];
      let rows: string[][];
      if (file.name.toLowerCase().endsWith(".json")) {
        ({ headers, rows } = parseJSONText(text));
      } else {
        ({ headers, rows } = parseCSVText(text));
      }
      const { dateColIndex, valueColIndex } = detectColumns(headers, rows);
      setUploadState({ filename: file.name, headers, rows, dateColIndex, valueColIndex });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to parse file");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  const previewData = useMemo(() => {
    if (!uploadState) return [];
    return rowsToSeriesData(
      uploadState.rows.slice(0, 5),
      uploadState.dateColIndex,
      uploadState.valueColIndex,
    );
  }, [uploadState]);

  const addUploadedSeries = useCallback(() => {
    if (!uploadState) return;
    const data = rowsToSeriesData(
      uploadState.rows,
      uploadState.dateColIndex,
      uploadState.valueColIndex,
    );
    if (data.length === 0) {
      setUploadError("No valid data points found — check the column mapping.");
      return;
    }
    const name = uploadState.filename.replace(/\.(csv|json|tsv)$/i, "");
    setSeries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        color: pickColor(prev.length),
        seriesType: "line",
        data,
        visible: true,
        yAxisIndex: 0,
        source: "upload",
        sourceLabel: uploadState.filename,
      },
    ]);
    setUploadState(null);
    setUploadError(null);
  }, [uploadState]);

  const addGTPSeries = useCallback(async () => {
    setGtpLoading(true);
    setGtpError(null);
    try {
      const data = await fetchGTPMetric(selectedChain, selectedMetric, selectedGranularity);
      if (data.length === 0) throw new Error("API returned no data points");
      const chainEntry = masterData.chains.find((c) => c.key === selectedChain);
      const chainLabel = chainEntry?.name ?? selectedChain;
      const metricLabel = masterData.metrics.find((m) => m.key === selectedMetric)?.name ?? selectedMetric;
      const granLabel = selectedGranularity === "daily" ? "" : ` (${selectedGranularity})`;
      const name = `${chainLabel} — ${metricLabel}${granLabel}`;

      // Use canonical chain color pair from master, fall back to DEFAULT_COLORS
      const colorPair = chainEntry
        ? (theme === "light" ? chainEntry.light : chainEntry.dark)
        : undefined;

      setSeries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name,
          color: colorPair?.[0] ?? pickColor(prev.length),
          colorPair,
          seriesType: "line",
          data,
          visible: true,
          yAxisIndex: 0,
          source: "gtp",
          sourceLabel: `${selectedChain} / ${selectedMetric}`,
        },
      ]);
    } catch (err) {
      setGtpError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setGtpLoading(false);
    }
  }, [selectedChain, selectedMetric, selectedGranularity, masterData, theme]);

  const updateSeries = useCallback((id: string, patch: Partial<SeriesEntry>) => {
    setSeries((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const removeSeries = useCallback((id: string) => {
    setSeries((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <div className="px-[20px] md:px-[50px] pt-[20px] pb-[60px]">
      {/* Page header */}
      <header className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-[24px] md:text-[30px] font-bold leading-tight text-color-text-primary">
            Chart Creator
          </h1>
          <span className="rounded-full border border-color-ui-hover/40 px-2.5 py-0.5 text-xs font-medium text-color-text-secondary">
            Internal
          </span>
        </div>
        <p className="text-sm text-color-text-secondary">
          Combine growthepie metrics with external datasets (CSV / JSON) on a
          single chart.
        </p>
      </header>

      <div className="flex flex-col xl:flex-row gap-[15px]">
        {/* ---------------------------------------------------------------- */}
        {/* Sidebar                                                           */}
        {/* ---------------------------------------------------------------- */}
        <div className="xl:w-[380px] flex-shrink-0 space-y-[15px]">

          {/* ---- growthepie Data ---- */}
          <div className="rounded-[18px] bg-color-bg-default p-[15px] space-y-[15px]">
            <SectionLabel>growthepie Data</SectionLabel>

            <div className="space-y-[10px]">
              <div>
                <p className="text-xs text-color-text-secondary mb-1">Chain</p>
                <NativeSelect value={selectedChain} onChange={setSelectedChain}>
                  {masterData.chains.map((c) => (
                    <option key={c.key} value={c.key}>{c.name}</option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <p className="text-xs text-color-text-secondary mb-1">Metric</p>
                <NativeSelect value={selectedMetric} onChange={setSelectedMetric}>
                  {masterData.metrics.map((m) => (
                    <option key={m.key} value={m.key}>{m.name}</option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <p className="text-xs text-color-text-secondary mb-1">Granularity</p>
                <div className="flex gap-1">
                  {GRANULARITY_OPTIONS.map((g) => (
                    <GTPButton
                      key={g.key}
                      label={g.label}
                      clickHandler={() => setSelectedGranularity(g.key)}
                      variant="primary"
                      size="xs"
                      isSelected={selectedGranularity === g.key}
                    />
                  ))}
                </div>
              </div>
            </div>

            {gtpError && <ErrorMsg msg={gtpError} />}

            <GTPButton
              label={gtpLoading ? "Loading…" : "Add to Chart"}
              clickHandler={addGTPSeries}
              variant="primary"
              size="sm"
              disabled={gtpLoading}
            />
          </div>

          {/* ---- External Data Upload ---- */}
          <div className="rounded-[18px] bg-color-bg-default p-[15px] space-y-[15px]">
            <SectionLabel>External Data (CSV / JSON)</SectionLabel>

            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              className={`flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed py-5 px-4 transition-colors cursor-pointer select-none ${
                isDragOver
                  ? "border-color-text-secondary bg-color-bg-main"
                  : "border-color-ui-hover/40 hover:border-color-ui-hover"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.json"
                className="hidden"
                onChange={handleFileChange}
              />
              <svg
                className="h-7 w-7 text-color-text-secondary mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <p className="text-xs font-medium text-color-text-primary text-center">
                Drag & drop or click to upload
              </p>
              <p className="text-[10px] text-color-text-secondary mt-0.5">
                CSV, TSV, or JSON · Bitcoin CSVs from CoinGecko work out of the box
              </p>
            </div>

            {uploadError && <ErrorMsg msg={uploadError} />}

            {/* File mapping UI */}
            {uploadState && (
              <div className="space-y-[10px]">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-medium text-color-text-primary truncate max-w-[200px]">
                    {uploadState.filename}
                  </p>
                  <p className="text-[10px] text-color-text-secondary flex-shrink-0 ml-2">
                    {uploadState.rows.length.toLocaleString()} rows
                  </p>
                </div>

                {/* Column mapping */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-color-text-secondary mb-1">Date / X column</p>
                    <NativeSelect
                      value={uploadState.dateColIndex}
                      onChange={(v) =>
                        setUploadState((p) => p ? { ...p, dateColIndex: Number(v) } : null)
                      }
                    >
                      {uploadState.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `col${i}`}</option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div>
                    <p className="text-[10px] text-color-text-secondary mb-1">Value / Y column</p>
                    <NativeSelect
                      value={uploadState.valueColIndex}
                      onChange={(v) =>
                        setUploadState((p) => p ? { ...p, valueColIndex: Number(v) } : null)
                      }
                    >
                      {uploadState.headers.map((h, i) => (
                        <option key={i} value={i}>{h || `col${i}`}</option>
                      ))}
                    </NativeSelect>
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-[8px] overflow-hidden border border-color-ui-hover/20 text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-color-bg-main">
                        <th className="text-left px-2 py-1.5 font-medium text-color-text-secondary">
                          {uploadState.headers[uploadState.dateColIndex] || "Date"}
                        </th>
                        <th className="text-right px-2 py-1.5 font-medium text-color-text-secondary">
                          {uploadState.headers[uploadState.valueColIndex] || "Value"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadState.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className={i % 2 === 1 ? "bg-color-bg-main/50" : ""}>
                          <td className="px-2 py-1 text-color-text-primary">
                            {row[uploadState.dateColIndex]}
                          </td>
                          <td className="px-2 py-1 text-right text-color-text-primary">
                            {row[uploadState.valueColIndex]}
                          </td>
                        </tr>
                      ))}
                      {uploadState.rows.length > 5 && (
                        <tr>
                          <td colSpan={2} className="px-2 py-1 text-center text-color-text-secondary">
                            +{(uploadState.rows.length - 5).toLocaleString()} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {previewData.length === 0 && (
                  <ErrorMsg msg="No parseable rows with the current mapping." />
                )}

                <div className="flex gap-2">
                  <GTPButton
                    label={`Add${previewData.length > 0 ? ` (${uploadState.rows.length.toLocaleString()} pts)` : ""}`}
                    clickHandler={addUploadedSeries}
                    variant="primary"
                    size="sm"
                    disabled={previewData.length === 0}
                  />
                  <GTPButton
                    label="Cancel"
                    clickHandler={() => { setUploadState(null); setUploadError(null); }}
                    variant="no-background"
                    size="sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ---- Series list ---- */}
          {series.length > 0 && (
            <div className="rounded-[18px] bg-color-bg-default p-[15px]">
              <div className="flex items-center justify-between mb-[10px]">
                <SectionLabel>Series ({series.length})</SectionLabel>
                {series.length > 1 && (
                  <button
                    onClick={() => setSeries([])}
                    className="text-[10px] text-color-text-secondary hover:text-color-accent-red transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div>
                {series.map((s, i) => (
                  <SeriesRow
                    key={s.id}
                    entry={s}
                    onChange={(patch) => updateSeries(s.id, patch)}
                    onRemove={() => removeSeries(s.id)}
                    isLast={i === series.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Chart area                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex-1 min-w-0 space-y-[15px]">
          {chartSeries.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[18px] bg-color-bg-default h-[500px]">
              <svg
                className="h-12 w-12 mb-4 text-color-text-secondary opacity-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-sm font-medium text-color-text-primary">
                No data yet
              </p>
              <p className="text-xs mt-1 text-color-text-secondary text-center max-w-[220px]">
                Load a growthepie metric or upload a CSV from the left panel
              </p>
            </div>
          ) : (
            <>
              {/* Chart card — matches GTPCardLayout look */}
              <div className="rounded-[18px] bg-color-bg-default">
                {/* Title + subtitle inputs */}
                <div className="px-[20px] pt-[16px] pb-[4px] space-y-[6px]">
                  <input
                    className="w-full bg-transparent text-[18px] font-bold text-color-text-primary placeholder:text-color-text-secondary/40 outline-none border-b border-transparent focus:border-color-ui-hover/40 transition-colors pb-1"
                    placeholder="Add a chart title…"
                    value={chartTitle}
                    onChange={(e) => setChartTitle(e.target.value)}
                  />
                  <input
                    className="w-full bg-transparent text-sm text-color-text-secondary placeholder:text-color-text-secondary/40 outline-none border-b border-transparent focus:border-color-ui-hover/40 transition-colors pb-1"
                    placeholder="Add a subtitle…"
                    value={chartSubtitle}
                    onChange={(e) => setChartSubtitle(e.target.value)}
                  />
                </div>
                <GTPChart
                  series={chartSeries}
                  stack={stack}
                  percentageMode={percentageMode}
                  showLegend={showLegend}
                  showWatermark
                  snapToCleanBoundary={false}
                  limitTooltipRows={10}
                  showTotal={stack && !percentageMode}
                  height={520}
                  className={showLegend ? "mb-[30px]" : "mb-[10px]"}
                />
              </div>

              {/* Scale toggle bar — matches fundamentals chart controls */}
              <div className="flex items-center justify-between rounded-[18px] bg-color-bg-default px-[15px] py-[10px]">
                <ScaleToggle value={scale} onChange={setScale} />
                <p className="text-[10px] text-color-text-secondary">
                  {chartSeries.length} series
                </p>
              </div>

              {/* Series summary table */}
              <div className="rounded-[18px] bg-color-bg-default overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-color-ui-hover/20">
                      <th className="text-left px-4 py-2.5 font-medium text-color-text-secondary">
                        Series
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-color-text-secondary">
                        Points
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-color-text-secondary hidden sm:table-cell">
                        From
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-color-text-secondary hidden sm:table-cell">
                        To
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-color-text-secondary">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {series
                      .filter((s) => s.data.length > 0)
                      .map((s, i) => (
                        <tr
                          key={s.id}
                          className={`border-b border-color-ui-hover/10 last:border-0 ${i % 2 === 1 ? "bg-color-bg-main/40" : ""}`}
                        >
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: s.color, opacity: s.visible ? 1 : 0.3 }}
                              />
                              <span className={`text-color-text-primary truncate max-w-[180px] xl:max-w-none ${!s.visible ? "opacity-40" : ""}`}>
                                {s.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-color-text-secondary">
                            {s.data.length.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right text-color-text-secondary hidden sm:table-cell">
                            {fmtDate(s.data[0][0])}
                          </td>
                          <td className="px-4 py-2 text-right text-color-text-secondary hidden sm:table-cell">
                            {fmtDate(s.data[s.data.length - 1][0])}
                          </td>
                          <td className="px-4 py-2 text-right text-color-text-secondary">
                            {s.source === "gtp" ? "growthepie" : "upload"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

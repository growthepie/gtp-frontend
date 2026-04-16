"use client";
import { SectionBar, SectionBarItem } from "@/components/SectionBar";
import Container from "@/components/layout/Container";
import { useLocalStorage } from "usehooks-ts";
import { useTheme } from "next-themes";
import { useMaster } from "@/contexts/MasterContext";
import { useState, useMemo, memo, useEffect, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChainInfo } from "@/types/api/MasterResponse";
import ChainTabs from "@/components/layout/SingleChains/ChainTabs";
import ChainChartECharts from "@/components/layout/SingleChains/ChainChartECharts";
import OverviewMetrics from "@/components/layout/OverviewMetrics";
import AppsChain from "@/components/layout/SingleChains/AppsChain";
import { TimespanProvider } from "@/app/(layout)/applications/_contexts/TimespanContext";
import { MetricsProvider } from "@/app/(layout)/applications/_contexts/MetricsContext";
import { SortProvider } from "@/app/(layout)/applications/_contexts/SortContext";
import { ApplicationsDataProvider, useApplicationsData } from "@/app/(layout)/applications/_contexts/ApplicationsDataContext";
import { ProjectsMetadataProvider } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import useSWR from "swr";
import { PageTitleAndDescriptionAndControls } from "@/app/(layout)/applications/_components/Components";
import Controls from "@/app/(layout)/applications/_components/Controls";
import Image from "next/image";
import Heading from "@/components/layout/Heading";
import ShowLoading from "@/components/layout/ShowLoading";
import { ChainData, Chains } from "@/types/api/ChainOverviewResponse";
import { ChainsData } from "@/types/api/ChainResponse";
import ChainsOverview from "@/components/layout/SingleChains/ChainsOverview";
import RelatedQuickBites from "@/components/RelatedQuickBites";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { ChainOverview } from "@/lib/chains";
import UserInsights from "@/components/layout/SingleChains/UserInsights";
import { getAllQuickBites } from "@/lib/quick-bites/quickBites";
import { processDynamicContent } from "@/lib/utils/dynamicContent";
import { processMarkdownContent } from "@/lib/utils/markdownParser";
import { ContentBlock } from "@/lib/types/blockTypes";
import Block from "@/components/quick-bites/Block";
import { QuickBiteProvider } from "@/contexts/QuickBiteContext";
import ChainSectionHead from "@/components/layout/SingleChains/ChainSectionHead";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { IS_PRODUCTION } from "@/lib/helpers";

// Fetcher function for API calls
const fetcher = (url: string) => fetch(url).then((res) => res.json());
const STANDARDIZED_CHAIN_QUICK_BITE_CHART_HEIGHT = 506;
const STANDARDIZED_CHAIN_QUICK_BITE_CHART_WIDTH = "100%";
const CHAIN_QUICK_BITES_TAB_BLOCK_CLASS = "chain-quick-bites-tab-block";
const CHAIN_QUICK_BITES_TAB_RENDERED_CARD_HEIGHT = 587;
const CHAIN_QUICK_BITES_TAB_STACKED_GAP_Y = 30;
const CHAIN_QUICK_BITES_TAB_CONTENT_VERTICAL_PADDING = 45; // pt-[30px] + pb-[15px]
const CHAIN_QUICK_BITES_TAB_HEIGHT_SAFETY_BUFFER = 30;

const getQuickBiteTabChildrenHeight = (chartCount: number) => {
  const normalizedCount = Math.max(chartCount, 1);
  const stackedGapsHeight = Math.max(normalizedCount - 1, 0) * CHAIN_QUICK_BITES_TAB_STACKED_GAP_Y;
  return (
    normalizedCount * CHAIN_QUICK_BITES_TAB_RENDERED_CARD_HEIGHT +
    stackedGapsHeight +
    CHAIN_QUICK_BITES_TAB_CONTENT_VERTICAL_PADDING +
    CHAIN_QUICK_BITES_TAB_HEIGHT_SAFETY_BUFFER
  );
};

const getQuickBiteDefaultSeriesNames = (chainName: string, chainShortName: string) => {
  return [chainName, chainShortName].map((value) => value?.trim()).filter((value): value is string => Boolean(value));
};

type QuickBiteDropdownBlock = Extract<ContentBlock, { type: "dropdown" }>;
type QuickBiteChartBlock = Extract<ContentBlock, { type: "chart" }>;

interface QuickBiteDropdownOption {
  value: string;
  label: string;
}

const normalizeChainMatchValue = (value: string) => value.toLowerCase().replace(/[\s:_-]+/g, "");
const parseChainUrlKey = (value: string): string | null => {
  const match = value.match(/\/chains\/([^/?#]+)/i);
  return match?.[1] || null;
};

const extractPathCandidates = (value: unknown): string[] => {
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];

  const candidates = new Set<string>([trimmed]);
  const dotParts = trimmed.split(".");
  dotParts.forEach((part) => {
    const token = part.trim();
    if (!token) return;
    candidates.add(token);
    candidates.add(token.replace(/[_-]+/g, " "));
  });

  return Array.from(candidates);
};

const extractSeriesChainCandidates = (series: unknown): string[] => {
  if (!series || typeof series !== "object") return [];

  const entry = series as Record<string, unknown>;
  const candidates: string[] = [];
  const pushCandidate = (value: unknown) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) return;
    candidates.push(trimmed);

    const withoutChainWord = trimmed.replace(/\bchain\b/gi, "").trim();
    if (withoutChainWord && withoutChainWord !== trimmed) {
      candidates.push(withoutChainWord);
    }

    const urlKey = parseChainUrlKey(trimmed);
    if (urlKey) {
      candidates.push(urlKey);
    }
  };

  pushCandidate(entry.key);
  pushCandidate(entry.urlKey);
  pushCandidate(entry.name);
  pushCandidate(entry.url);

  return candidates;
};

const getChartSeriesCandidates = (data: unknown): string[] => {
  if (!Array.isArray(data)) return [];
  const candidates: string[] = [];
  data.forEach((series) => {
    candidates.push(...extractSeriesChainCandidates(series));
  });
  return candidates;
};

const extractDataAsJsonChainCandidates = (dataAsJson: unknown): string[] => {
  if (!dataAsJson || typeof dataAsJson !== "object") return [];

  const jsonConfig = dataAsJson as Record<string, unknown>;
  const candidates: string[] = [];
  const pushCandidate = (value: unknown) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) return;
    candidates.push(trimmed);
    candidates.push(...extractPathCandidates(trimmed));
  };

  const metaEntries = Array.isArray(jsonConfig.meta) ? jsonConfig.meta : [];
  metaEntries.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const metaEntry = entry as Record<string, unknown>;
    pushCandidate(metaEntry.name);
    pushCandidate(metaEntry.nameFromPath);
    pushCandidate(metaEntry.pathToData);
    pushCandidate(metaEntry.url);
  });

  const dynamicSeries = jsonConfig.dynamicSeries;
  if (dynamicSeries && typeof dynamicSeries === "object") {
    const dynamicConfig = dynamicSeries as Record<string, unknown>;
    const names = dynamicConfig.names;
    if (typeof names === "string") {
      pushCandidate(names);
    } else if (Array.isArray(names)) {
      names.forEach(pushCandidate);
    }
    pushCandidate(dynamicConfig.pathToData);
    pushCandidate(dynamicConfig.url);
  }

  const pieData = jsonConfig.pieData;
  if (Array.isArray(pieData)) {
    pieData.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;
      pushCandidate((entry as Record<string, unknown>).name);
    });
  } else if (pieData && typeof pieData === "object") {
    const pieConfig = pieData as Record<string, unknown>;
    pushCandidate(pieConfig.pathToData);
    pushCandidate(pieConfig.url);
  }

  return candidates;
};

const collectChainCandidatesFromBlocks = (blocks: ContentBlock[]): string[] => {
  const candidates: string[] = [];

  const walk = (block: ContentBlock) => {
    if (block.type === "chart") {
      candidates.push(...getChartSeriesCandidates(block.data));
      candidates.push(...extractDataAsJsonChainCandidates(block.dataAsJson));
      return;
    }

    if (block.type === "chart-toggle") {
      block.charts.forEach((chart) => {
        candidates.push(...getChartSeriesCandidates(chart.data));
        candidates.push(...extractDataAsJsonChainCandidates(chart.dataAsJson));
      });
      return;
    }

    if (block.type === "container") {
      block.blocks.forEach((group) => group.forEach(walk));
    }
  };

  blocks.forEach(walk);
  return candidates;
};

const hasChainTopicMatch = (
  topics: Array<{ name: string; url: string }> | undefined,
  normalizedChainCandidates: Set<string>,
) => {
  if (!topics?.length) return false;

  return topics.some((topic) => {
    const name = typeof topic?.name === "string" ? topic.name : "";
    const url = typeof topic?.url === "string" ? topic.url : "";
    const urlKey = parseChainUrlKey(url);
    const normalizedValues = [name, url, urlKey || ""]
      .filter((value) => value.length > 0)
      .map((value) => normalizeChainMatchValue(value));

    return normalizedValues.some((value) => normalizedChainCandidates.has(value));
  });
};

const hasChainChartMatch = (blocks: ContentBlock[], normalizedChainCandidates: Set<string>) => {
  const candidates = collectChainCandidatesFromBlocks(blocks);
  return candidates.some((candidate) => normalizedChainCandidates.has(normalizeChainMatchValue(candidate)));
};

const chartContainsChainMatch = (
  chart: QuickBiteChartBlock,
  normalizedChainCandidates: Set<string>,
) => {
  const candidates = [
    ...getChartSeriesCandidates(chart.data),
    ...extractDataAsJsonChainCandidates(chart.dataAsJson),
  ];

  if (typeof chart.title === "string") {
    candidates.push(chart.title);
  }
  if (typeof chart.subtitle === "string") {
    candidates.push(chart.subtitle);
  }

  return candidates.some((candidate) =>
    normalizedChainCandidates.has(normalizeChainMatchValue(candidate)),
  );
};

const getNestedPathValue = (obj: any, path: string) =>
  path.split(".").reduce((current, key) => (current && typeof current === "object" ? current[key] : undefined), obj);

const extractTemplateVariables = (text: string) => {
  const variables = new Set<string>();
  const matches = text.matchAll(/{{\s*([\w.]+)\s*}}/g);
  for (const match of matches) {
    if (match[1]) {
      variables.add(match[1]);
    }
  }
  return Array.from(variables);
};

const getTemplateVariablesFromChart = (chart: QuickBiteChartBlock) => {
  const values: string[] = [];

  if (typeof chart.title === "string") {
    values.push(...extractTemplateVariables(chart.title));
  }
  if (typeof chart.subtitle === "string") {
    values.push(...extractTemplateVariables(chart.subtitle));
  }

  const meta = chart.dataAsJson?.meta || [];
  meta.forEach((metaEntry) => {
    if (typeof metaEntry.url === "string") {
      values.push(...extractTemplateVariables(metaEntry.url));
    }
  });

  if (typeof chart.dataAsJson?.dynamicSeries?.url === "string") {
    values.push(...extractTemplateVariables(chart.dataAsJson.dynamicSeries.url));
  }

  if (!Array.isArray(chart.dataAsJson?.pieData) && typeof chart.dataAsJson?.pieData?.url === "string") {
    values.push(...extractTemplateVariables(chart.dataAsJson.pieData.url));
  }

  return Array.from(new Set(values));
};

const collectDropdownBlocks = (blocks: ContentBlock[]): QuickBiteDropdownBlock[] => {
  const dropdowns: QuickBiteDropdownBlock[] = [];

  for (const block of blocks) {
    if (block.type === "dropdown") {
      dropdowns.push(block);
      continue;
    }

    if (block.type === "container" && Array.isArray(block.blocks)) {
      for (const nestedBlockGroup of block.blocks) {
        dropdowns.push(...collectDropdownBlocks(nestedBlockGroup));
      }
    }
  }

  return dropdowns;
};

const collectDropdownStateKeys = (dropdownBlocks: QuickBiteDropdownBlock[]) => {
  return new Set(dropdownBlocks.map((dropdown) => dropdown.stateKey).filter((key): key is string => Boolean(key)));
};

const mapDropdownOptions = (
  rawOptions: any,
  valueField = "value",
  labelField = "label",
): QuickBiteDropdownOption[] => {
  if (Array.isArray(rawOptions)) {
    return rawOptions
      .map((item, index) => {
        if (typeof item === "string") {
          const value = item.trim();
          return value ? { value, label: value } : null;
        }

        if (item && typeof item === "object") {
          const rawValue = item[valueField] ?? item.value ?? item.id ?? item.key;
          const rawLabel = item[labelField] ?? item.label ?? item.name ?? rawValue;

          if (rawValue === undefined || rawValue === null) {
            return null;
          }

          const value = String(rawValue).trim();
          const label = String(rawLabel ?? "").trim() || value || `Option ${index + 1}`;

          if (!value) {
            return null;
          }

          return { value, label };
        }

        return null;
      })
      .filter((option): option is QuickBiteDropdownOption => option !== null);
  }

  if (rawOptions && typeof rawOptions === "object") {
    return Object.entries(rawOptions)
      .map(([key, value]) => {
        const optionValue = String(key).trim();
        if (!optionValue) {
          return null;
        }

        return {
          value: optionValue,
          label: typeof value === "string" && value.trim() ? value.trim() : optionValue,
        };
      })
      .filter((option): option is QuickBiteDropdownOption => option !== null);
  }

  return [];
};

const getDropdownOptions = async (
  dropdown: QuickBiteDropdownBlock,
  dropdownDataCache: Map<string, Promise<any>>,
): Promise<QuickBiteDropdownOption[]> => {
  if (dropdown.readFromJSON && dropdown.jsonData) {
    const { url, pathToOptions, valueField, labelField } = dropdown.jsonData;
    if (!url || !pathToOptions) {
      return [];
    }

    if (!dropdownDataCache.has(url)) {
      dropdownDataCache.set(
        url,
        fetch(url)
          .then((response) => response.json())
          .catch(() => null),
      );
    }

    const jsonData = await dropdownDataCache.get(url);
    if (!jsonData) {
      return [];
    }

    const rawOptions = getNestedPathValue(jsonData, pathToOptions);
    return mapDropdownOptions(rawOptions, valueField || "value", labelField || "label");
  }

  return mapDropdownOptions(dropdown.options || []);
};

const matchesChainOption = (optionValueOrLabel: string, normalizedChainCandidates: Set<string>) => {
  const normalizedOption = normalizeChainMatchValue(optionValueOrLabel);
  if (!normalizedOption || normalizedChainCandidates.size === 0) {
    return false;
  }

  return normalizedChainCandidates.has(normalizedOption);
};

const resolveChainMatchedDropdownState = async (
  dropdownBlocks: QuickBiteDropdownBlock[],
  chainKey: string,
  chainName: string,
  chainShortName: string,
  dropdownDataCache: Map<string, Promise<any>>,
) => {
  const matchedStateByKey: Record<string, string> = {};
  const normalizedChainCandidates = new Set(
    [chainKey, chainName, chainShortName]
      .map((value) => normalizeChainMatchValue(value))
      .filter((value) => value.length > 0),
  );

  for (const dropdown of dropdownBlocks) {
    const stateKey = dropdown.stateKey;
    if (!stateKey || matchedStateByKey[stateKey]) {
      continue;
    }

    const options = await getDropdownOptions(dropdown, dropdownDataCache);
    const matchedOption = options.find(
      (option) =>
        matchesChainOption(option.value, normalizedChainCandidates) ||
        matchesChainOption(option.label, normalizedChainCandidates),
    );

    if (matchedOption) {
      matchedStateByKey[stateKey] = matchedOption.value;
    }
  }

  return matchedStateByKey;
};

const shouldIncludeChainQuickBitesChart = (
  chart: QuickBiteChartBlock,
  matchedDropdownStateByKey: Record<string, string>,
  dropdownStateKeys: Set<string>,
  normalizedChainCandidates: Set<string>,
  enforceChainMatchInChartContent: boolean,
) => {
  if (chart.hideOnChainTabs) {
    return false;
  }

  if (Array.isArray(chart.showOnChainTabs) && chart.showOnChainTabs.length > 0) {
    const hasChainMatch = chart.showOnChainTabs.some((chain) =>
      matchesChainOption(chain, normalizedChainCandidates),
    );

    if (!hasChainMatch) {
      return false;
    }
  }

  const filterStateKey = chart.filterOnStateKey?.stateKey;
  if (filterStateKey && !matchedDropdownStateByKey[filterStateKey]) {
    return false;
  }

  const requiredTemplateStateKeys = getTemplateVariablesFromChart(chart).filter((stateKey) => dropdownStateKeys.has(stateKey));
  if (requiredTemplateStateKeys.some((stateKey) => !matchedDropdownStateByKey[stateKey])) {
    return false;
  }

  if (enforceChainMatchInChartContent && !chartContainsChainMatch(chart, normalizedChainCandidates)) {
    return false;
  }

  return true;
};

const extractChartBlocks = (
  blocks: ContentBlock[],
  matchedDropdownStateByKey: Record<string, string>,
  dropdownStateKeys: Set<string>,
  normalizedChainCandidates: Set<string>,
  enforceChainMatchInChartContent: boolean,
): ContentBlock[] => {
  const extracted: ContentBlock[] = [];

  for (const block of blocks) {
    if (block.type === "chart") {
      if (
        shouldIncludeChainQuickBitesChart(
          block,
          matchedDropdownStateByKey,
          dropdownStateKeys,
          normalizedChainCandidates,
          enforceChainMatchInChartContent,
        )
      ) {
        extracted.push(block);
      }
      continue;
    }

    if (block.type === "chart-toggle") {
      const visibleCharts = block.charts.filter((chart) =>
        shouldIncludeChainQuickBitesChart(
          chart,
          matchedDropdownStateByKey,
          dropdownStateKeys,
          normalizedChainCandidates,
          enforceChainMatchInChartContent,
        ),
      );
      if (!visibleCharts.length) {
        continue;
      }

      extracted.push({
        ...block,
        charts: visibleCharts,
      });
      continue;
    }

    if (block.type === "container" && Array.isArray(block.blocks)) {
      for (const nestedBlockGroup of block.blocks) {
        extracted.push(
          ...extractChartBlocks(
            nestedBlockGroup,
            matchedDropdownStateByKey,
            dropdownStateKeys,
            normalizedChainCandidates,
            enforceChainMatchInChartContent,
          ),
        );
      }
    }
  }

  return extracted;
};

const withStandardizedQuickBiteChartHeight = (
  block: ContentBlock,
  defaultFilteredSeriesNames: string[],
): ContentBlock => {
  if (block.type === "chart") {
    return {
      ...block,
      className: `${block.className || ""} ${CHAIN_QUICK_BITES_TAB_BLOCK_CLASS}`.trim(),
      defaultFilteredSeriesNames,
      width: STANDARDIZED_CHAIN_QUICK_BITE_CHART_WIDTH,
      height: STANDARDIZED_CHAIN_QUICK_BITE_CHART_HEIGHT,
    };
  }

  if (block.type === "chart-toggle") {
    return {
      ...block,
      className: `${block.className || ""} ${CHAIN_QUICK_BITES_TAB_BLOCK_CLASS}`.trim(),
      charts: block.charts.map((chart) => ({
        ...chart,
        className: `${chart.className || ""} ${CHAIN_QUICK_BITES_TAB_BLOCK_CLASS}`.trim(),
        defaultFilteredSeriesNames,
        width: STANDARDIZED_CHAIN_QUICK_BITE_CHART_WIDTH,
        height: STANDARDIZED_CHAIN_QUICK_BITE_CHART_HEIGHT,
      })),
    };
  }

  return block;
};

const appendQuickBiteLayoutClass = (block: ContentBlock, className: string): ContentBlock => {
  if (block.type === "chart" || block.type === "chart-toggle") {
    return {
      ...block,
      className: `${block.className ?? ""} ${className}`.trim(),
    };
  }
  return block;
};

// Memoized tab content components
const OverviewContent = memo(({ chainKey, chain, master }: { chainKey: string, chain: string, master: any }) => {
  const chainData = master.chains[chainKey];
  const { data: chainDataOverview, isLoading: chainDataOverviewLoading, isValidating: chainDataOverviewValidating } = useSWR<ChainOverview>(`https://api.growthepie.com/v1/chains/${chainKey}/overview.json`);

  if(!master || !chainData || !chainDataOverview) return (
  <div className="w-full h-[60vh] overflow-hidden">
    <ShowLoading dataLoading={[chainDataOverviewLoading, chainDataOverviewValidating]} dataValidating={[chainDataOverviewValidating]} section={true} />
  </div>
  );
  
  return (
    <>
          <ChainsOverview chainKey={chainKey} chainData={chainData} master={master} chainDataOverview={chainDataOverview} />
    </>
  );
});

const FundamentalsContent = memo(({ chainKey, chain, master }: { chainKey: string, chain: string, master: any }) => {
  // Create a minimal initial ChainsData structure — ChainChartECharts fetches
  // individual metrics via getChainMetricURL and overwrites this immediately.
  const initialChainData = useMemo<ChainsData>(() => ({
    chain_id: chainKey,
    chain_name: master.chains[chainKey]?.name || chain,
    description: "",
    symbol: "",
    website: "",
    explorer: "",
    metrics: {},
    ranking: {},
    hottest_contract: { data: [], types: [] },
  }), [chainKey, chain, master]);

  return (
    <div className="flex flex-col gap-y-[15px]">
      <ChainChartECharts
        chain={chain}
        master={master}
        chainData={initialChainData}
        defaultChainKey={chainKey}
      />
    </div>
  );
});

const QuickBitesContent = memo(({ chainKey, master }: { chainKey: string, master: any }) => {
  const router = useRouter();
  const chainName = master?.chains?.[chainKey]?.name || "";
  const chainShortName = master?.chains?.[chainKey]?.name_short || "";
  const defaultFilteredSeriesNames = useMemo(
    () => getQuickBiteDefaultSeriesNames(chainName, chainShortName),
    [chainName, chainShortName],
  );
  const [groupedChartBlocks, setGroupedChartBlocks] = useState<Array<{
    slug: string;
    title: string;
    date: string;
    chartBlocks: ContentBlock[];
    initialSharedState: Record<string, string>;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartTopPaddingById, setChartTopPaddingById] = useState<Record<string, number>>({});
  const chartItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let isCancelled = false;

    const loadQuickBiteCharts = async () => {
      if (!chainName) {
        setGroupedChartBlocks([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const dropdownDataCache = new Map<string, Promise<any>>();
        const normalizedChainCandidates = new Set(
          [chainKey, chainName, chainShortName]
            .map((value) => normalizeChainMatchValue(value))
            .filter((value) => value.length > 0),
        );
        const eligibleQuickBites = (
          IS_PRODUCTION
            ? getAllQuickBites().filter((quickBite) => quickBite.showInMenu !== false)
            : getAllQuickBites()
        ).filter((quickBite) => quickBite.showInChainTab !== false);
        const sortedQuickBites = eligibleQuickBites.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        const grouped = await Promise.all(
          sortedQuickBites.map(async (quickBite) => {
            const { slug } = quickBite;
            const data = quickBite;
            const processedContent = await processDynamicContent(data.content);
            const blocks = await processMarkdownContent(processedContent);
            const topicMatch = hasChainTopicMatch(data.topics as Array<{ name: string; url: string }> | undefined, normalizedChainCandidates);
            const chartMatch =
              data.autoAddChartChainsToTopics === true &&
              hasChainChartMatch(blocks, normalizedChainCandidates);
            if (!topicMatch && !chartMatch) {
              return null;
            }

            const dropdownBlocks = collectDropdownBlocks(blocks);
            const dropdownStateKeys = collectDropdownStateKeys(dropdownBlocks);
            const initialSharedState = await resolveChainMatchedDropdownState(
              dropdownBlocks,
              chainKey,
              chainName,
              chainShortName,
              dropdownDataCache,
            );
            const enforceChainMatchInChartContent = data.autoAddChartChainsToTopics === true;
            const chartBlocks = extractChartBlocks(
              blocks,
              initialSharedState,
              dropdownStateKeys,
              normalizedChainCandidates,
              enforceChainMatchInChartContent,
            );

            return {
              slug,
              title: data.title,
              date: data.date,
              chartBlocks,
              initialSharedState,
            };
          }),
        );

        if (!isCancelled) {
          setGroupedChartBlocks(
            grouped.filter(
              (
                item,
              ): item is {
                slug: string;
                title: string;
                date: string;
                chartBlocks: ContentBlock[];
                initialSharedState: Record<string, string>;
              } => {
                if (!item) {
                  return false;
                }
                return item.chartBlocks.length > 0;
              },
            ),
          );
        }
      } catch (error) {
        console.error("Failed to load related quick bite charts:", error);
        if (!isCancelled) {
          setGroupedChartBlocks([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadQuickBiteCharts();

    return () => {
      isCancelled = true;
    };
  }, [chainKey, chainName, chainShortName]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const computeTopAlignment = () => {
      if (window.innerWidth < 1024) {
        setChartTopPaddingById((prev) => (Object.keys(prev).length ? {} : prev));
        return;
      }

      const nextPaddingById: Record<string, number> = {};

      groupedChartBlocks.forEach((group) => {
        const itemIds = group.chartBlocks.map((block) => `${group.slug}-${block.id}`);

        for (let index = 0; index < itemIds.length; index += 2) {
          const leftId = itemIds[index];
          const rightId = itemIds[index + 1];

          if (!leftId || !rightId) {
            continue;
          }

          const leftContainer = chartItemRefs.current[leftId];
          const rightContainer = chartItemRefs.current[rightId];

          if (!leftContainer || !rightContainer) {
            continue;
          }

          const leftAnchor = leftContainer.querySelector(".chain-quick-bites-tab-chart-anchor") as HTMLElement | null;
          const rightAnchor = rightContainer.querySelector(".chain-quick-bites-tab-chart-anchor") as HTMLElement | null;

          if (!leftAnchor || !rightAnchor) {
            continue;
          }

          const leftOffset = leftAnchor.getBoundingClientRect().top - leftContainer.getBoundingClientRect().top;
          const rightOffset = rightAnchor.getBoundingClientRect().top - rightContainer.getBoundingClientRect().top;
          const maxOffset = Math.max(leftOffset, rightOffset);

          const leftPadding = Math.max(0, Math.round(maxOffset - leftOffset));
          const rightPadding = Math.max(0, Math.round(maxOffset - rightOffset));

          if (leftPadding > 0) {
            nextPaddingById[leftId] = leftPadding;
          }
          if (rightPadding > 0) {
            nextPaddingById[rightId] = rightPadding;
          }
        }
      });

      setChartTopPaddingById((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(nextPaddingById);

        if (prevKeys.length !== nextKeys.length) {
          return nextPaddingById;
        }

        for (const key of nextKeys) {
          if (prev[key] !== nextPaddingById[key]) {
            return nextPaddingById;
          }
        }

        return prev;
      });
    };

    const scheduleAlignment = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(computeTopAlignment);
      });
    };

    scheduleAlignment();
    window.addEventListener("resize", scheduleAlignment);

    return () => {
      window.removeEventListener("resize", scheduleAlignment);
    };
  }, [groupedChartBlocks]);

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] overflow-hidden">
        <ShowLoading dataLoading={[true]} dataValidating={[]} section={true} />
      </div>
    );
  }

  if (!groupedChartBlocks.length) {
    return (
      <div className="text-color-text-secondary text-sm">
        No related Quick Bite charts available for this chain yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-[15px]">
      <div className="flex gap-x-[8px] items-center scroll-mt-8" id="quick-bites">
        <GTPIcon icon="gtp-quick-bites" size="lg" className="!w-[32px] !h-[32px]" containerClassName="w-[36px] h-[36px]" />
        <Heading className="font-bold leading-[120%] text-[20px] md:text-[30px] break-inside-avoid" as="h2">
          {chainName ? `Quick Bites Featuring ${chainName}` : "Quick Bites"}
        </Heading>
      </div>

      {groupedChartBlocks.map((group) => (
        <QuickBiteProvider key={group.slug} initialSharedState={group.initialSharedState}>
          <ChainSectionHead
            title={group.title}
            icon="gtp:gtp-quick-bites"
            enableDropdown={true}
            defaultDropdown={true}
            adjustRadiusForMultiline
            multilineCornerRadiusPx={20}
            removeChildrenTopPadding
            childrenHeight={getQuickBiteTabChildrenHeight(group.chartBlocks.length)}
            rowEnd={
              <div onClick={(event) => event.stopPropagation()}>
                <GTPButton
                  size="sm"
                  variant="primary"
                  visualState="active"
                  leftIcon="in-button-right-monochrome"
                  clickHandler={() => router.push(`/quick-bites/${group.slug}`)}
                  className="cursor-pointer"
                />
              </div>
            }
          >
            <div className="pt-[30px] pb-[15px]">
              <div
                className={
                  group.chartBlocks.length > 1
                    ? "grid grid-cols-1 lg:grid-cols-2 gap-y-[30px] gap-x-[30px]"
                    : "flex flex-col items-center gap-y-[30px]"
                }
              >
                {group.chartBlocks.map((block, blockIndex) => {
                  const chartItemId = `${group.slug}-${block.id}`;
                  const topPadding = chartTopPaddingById[chartItemId] ?? 0;
                  const isSingleChartGroup = group.chartBlocks.length === 1;
                  const standardizedBlock = withStandardizedQuickBiteChartHeight(block, defaultFilteredSeriesNames);
                  const shouldFlushRightEdge = group.chartBlocks.length > 1 && blockIndex % 2 === 1;
                  const shouldFlushLeftEdge = group.chartBlocks.length > 1 && blockIndex % 2 === 0;
                  const blockWithLayoutClass = shouldFlushRightEdge
                    ? appendQuickBiteLayoutClass(standardizedBlock, "chain-quick-bites-tab-right-flush")
                    : shouldFlushLeftEdge
                      ? appendQuickBiteLayoutClass(standardizedBlock, "chain-quick-bites-tab-left-flush")
                      : standardizedBlock;

                  return (
                    <div
                      key={chartItemId}
                      className={`min-w-0 ${isSingleChartGroup ? "w-full" : ""}`}
                      ref={(node) => {
                        chartItemRefs.current[chartItemId] = node;
                      }}
                      style={topPadding > 0 ? { paddingTop: `${topPadding}px` } : undefined}
                    >
                      <Block
                        block={blockWithLayoutClass}
                        chainQuickBitesTitleSuffix={chainName}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </ChainSectionHead>
        </QuickBiteProvider>
      ))}
    </div>
  );
});

const EconomicsContent = memo(({ chainKey, master }: { chainKey: string, master: any }) => {
  if (!chainKey) return <div className="p-8 text-center">No chain data available</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Economics</h2>
      <div className="p-8 text-center text-gray-500">
        Economics content will be implemented here
      </div>
    </div>
  );
});

// Inner component that can access the ApplicationsDataContext
const AppsContentInner = memo(({ chainInfo, chainKey }: { chainInfo: any, chainKey: string }) => {
  const { getIsLoading } = useApplicationsData();
  
  if (getIsLoading()) {
    return (
      <div className="w-full h-[60vh] overflow-hidden">
        <ShowLoading
          dataLoading={[true]}
          dataValidating={[]}
          section={true}
        />
      </div>
    );
  }

  return <AppsChain chainInfo={chainInfo} chainKey={chainKey} defaultQuery={chainInfo?.name || ""} />;
});

const AppsContent = memo(({ chainKey, master }: { chainKey: string, master: any }) => {
  const chainInfo = master?.chains?.[chainKey];
  
  return (
    <div className="mt-[5px]">
      <TimespanProvider timespans={{
        "1d": {
          shortLabel: "1d",
          label: "1 day",
          value: 1,
        },
        "7d": {
          shortLabel: "7d",
          label: "7 days",
          value: 7,
        },
        "30d": {
          shortLabel: "30d",
          label: "30 days",
          value: 30,
        },
        "90d": {
          shortLabel: "90d",
          label: "90 days",
          value: 90,
        },
        "365d": {
          shortLabel: "1y",
          label: "1 year",
          value: 365,
        },
        max: {
          shortLabel: "Max",
          label: "Max",
          value: 0,
        },
      } as {
        [key: string]: {
          label: string;
          shortLabel: string;
          value: number;
        };
      }}>
        <MetricsProvider>
          <SortProvider defaultOrder="desc" defaultKey="txcount">
            <ProjectsMetadataProvider>
              <ApplicationsDataProvider disableShowLoading={true}>
                {/* <Container className="sticky top-0 z-[10] flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] overflow-visible" isPageRoot> */}
                <AppsContentInner chainInfo={chainInfo} chainKey={chainKey} />
              </ApplicationsDataProvider>
            </ProjectsMetadataProvider>
          </SortProvider>
        </MetricsProvider>
      </TimespanProvider>
    </div>  
  );
});

const BlockspaceContent = memo(({ chainKey, master }: { chainKey: string, master: any }) => {
  const {
    data: usageData,
    error: usageError,
    isLoading: usageLoading,
    isValidating: usageValidating,
  } = useSWR<ChainData>(`https://api.growthepie.com/v1/chains/blockspace/${chainKey}.json`);

  const overviewData: Chains | null = useMemo(() => {
    if (!usageData) return null;

    return { [chainKey]: usageData };
  }, [chainKey, usageData]);

  const [selectedTimespan, setSelectedTimespan] = useState<string>("180d");

  


  if (usageLoading || !overviewData) return (
    <div className="w-full h-[60vh] overflow-hidden">
      <ShowLoading
        dataLoading={[usageLoading, !overviewData]}
        dataValidating={[usageValidating]}
        section={true}
        
      />
    </div>
  )

  

  return (
    <>
        <div className="flex items-center justify-between md:text-[36px] mb-[15px] relative">
          <div
            className="flex gap-x-[8px] items-center scroll-mt-[30px] mt-[10px]"
            id="blockspace"
          >

            <GTPIcon icon="gtp-blockspace" size="lg" className="!w-[32px] !h-[32px]" containerClassName="w-[36px] h-[36px]" />
            <Heading
              className="font-bold leading-[120%] text-[20px] md:text-[30px] break-inside-avoid"
              as="h2"
            >
              {master.chains[chainKey].name} Blockspace
            </Heading>
          </div>
        </div>
        <div className="flex items-center mb-[30px]">
          <div className="text-[16px]">
            We label smart contracts based on their usage type and aggregate usage per category. 
            You can toggle between share of chain
            usage or absolute numbers. The category definitions can 
            be found <a
              href="https://github.com/openlabelsinitiative/OLI/blob/main/1_label_schema/tags/valuesets/usage_category.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >here</a>.
          </div>
        </div>

      <div>
        <div className="-mx-[20px] md:-mx-[50px]">
          <OverviewMetrics
            selectedTimespan={selectedTimespan}
            setSelectedTimespan={setSelectedTimespan}
            data={overviewData}
            master={master.data}
            forceSelectedChain={chainKey}
            isSingleChainView={true}
          />
        </div>
      </div>
    </>
  );
});

// Add display names for debugging
OverviewContent.displayName = 'OverviewContent';
FundamentalsContent.displayName = 'FundamentalsContent';
EconomicsContent.displayName = 'EconomicsContent';
AppsContentInner.displayName = 'AppsContentInner';
AppsContent.displayName = 'AppsContent';
BlockspaceContent.displayName = 'BlockspaceContent';
QuickBitesContent.displayName = "QuickBitesContent";

const UserInsightsContent = memo(({ chainKey }: { chainKey: string }) => {
  return (
    <ProjectsMetadataProvider>
      <UserInsights chainKey={chainKey} />
    </ProjectsMetadataProvider>
  );
});
UserInsightsContent.displayName = 'UserInsightsContent';

const Chain = (props: { params: Promise<{ chain: string }> }) => {
    const { chain } = use(props.params);
    const master = useMaster();
    const [apiRoot, setApiRoot] = useLocalStorage("apiRoot", "v1");
    const { theme } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showUsd, setShowUsd] = useLocalStorage("showUsd", true);
    
    // Initialize selectedTab based on URL parameter, defaulting to "overview"
    const [selectedTab, setSelectedTab] = useState<string>(() => {
      const tabFromUrl = searchParams.get("tab");
      return tabFromUrl || "overview";
    });
  
    const { AllChains, AllChainsByKeys } = useMaster();
  
    const [chainKey, setChainKey] = useState<string>(
      AllChains.find((c) => c.urlKey === chain)?.key
        ? (AllChains.find((c) => c.urlKey === chain)?.key as string)
        : "",
    );

    // Update URL when selectedTab changes
    useEffect(() => {
      const currentTabInUrl = searchParams.get("tab");
      const targetTab = selectedTab === "overview" ? null : selectedTab;

      // Only update URL if the tab parameter actually needs to change
      if (currentTabInUrl === targetTab) return;

      const currentParams = new URLSearchParams(searchParams.toString());

      if (selectedTab === "overview") {
        // Remove tab parameter for overview (default)
        currentParams.delete("tab");
      } else {
        // Set tab parameter for other tabs
        currentParams.set("tab", selectedTab);
      }

      const newUrl = `${window.location.pathname}${currentParams.toString() ? `?${currentParams.toString()}` : ''}`;
      router.replace(newUrl, { scroll: false });
    }, [selectedTab, router, searchParams]);



    // Memoized tab content renderer
    const TabContent = useMemo(() => {
      const props = { chainKey, chain, master };
      
      switch (selectedTab) {
        case "overview":
          return <OverviewContent {...props} />;
        case "fundamentals":
          return <FundamentalsContent {...props} />;
        case "quick_bites":
          return <QuickBitesContent chainKey={chainKey} master={master} />;
        case "economics":
          return <EconomicsContent chainKey={chainKey} master={master} />;
        case "apps":
          return <AppsContent chainKey={chainKey} master={master} />;
        case "blockspace":
          return <BlockspaceContent chainKey={chainKey} master={master} />;
        case "user_insights":
          return <UserInsightsContent chainKey={chainKey} />;
        default:
          return <div className="p-8 text-center">Tab not found</div>;
      }
    }, [selectedTab, chainKey, chain, master, theme]);



    return(
        <Container className="flex flex-col gap-y-[15px] pt-[45px] md:pt-[30px] select-none"
     
        >
            <ChainTabs 
              chainInfo={master.chains[chainKey]} 
              selectedTab={selectedTab} 
              setSelectedTab={setSelectedTab} 
              
            />
            <div className={`${selectedTab !== "overview" ? "pt-[15px]" : ""}`}  >
              {TabContent}
            </div>
            <RelatedQuickBites slug={AllChainsByKeys[chainKey].label} isTopic={true} />
        </Container>
    )
}


export default Chain;

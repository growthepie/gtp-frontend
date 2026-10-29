"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import QuickBitesGrid from "@/components/quick-bites/QuickBitesGrid";
import QuickBitesTopicBar from "@/components/quick-bites/QuickBitesTopicBar";
import QuickBitesFilterBar, {
  QuickBitesChainOption,
  QuickBitesFilterKey,
  QuickBitesFilters,
} from "@/components/quick-bites/QuickBitesFilterBar";
import { useMaster } from "@/contexts/MasterContext";
import { getChainInfoFromUrl } from "@/lib/chains";
import { QuickBiteTopicKey } from "@/lib/quick-bites/themes";
import { QuickBiteKind, QuickBiteWithSlug } from "@/lib/types/quickBites";

type BrowserProps = {
  quickBites: QuickBiteWithSlug[];
  activeTopic: QuickBiteTopicKey | "all";
};

const NO_FILTERS: QuickBitesFilters = { strings: [], chains: [], types: [] };
const PARAM_BY_KEY: Record<QuickBitesFilterKey, string> = { strings: "q", chains: "chain", types: "type" };

const chainUrlKeysOf = (quickBite: QuickBiteWithSlug) =>
  (quickBite.topics ?? [])
    .map((topic) => topic.url.match(/^\/chains\/([^/?#]+)/)?.[1])
    .filter((urlKey): urlKey is string => Boolean(urlKey));

const matchesText = (quickBite: QuickBiteWithSlug, text: string) => {
  const haystack = [quickBite.title, quickBite.shortTitle, quickBite.subtitle, ...(quickBite.topics?.map((topic) => topic.name) ?? [])]
    .join(" ")
    .toLowerCase();
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
};

/**
 * /quick-bites and /quick-bites/topic/<key>: the topic tab bar (each topic is its own
 * page, so it can be linked and indexed), the applications-style filter bar, and the
 * cards. Filters live in the URL (?q=…&chain=…&type=…), so they can be shared and
 * survive switching topics. The server renders the unfiltered view (every card in the
 * HTML); the URL filters apply once the page runs in the browser.
 */
export default function QuickBitesBrowser(props: BrowserProps) {
  return (
    <Suspense fallback={<QuickBitesBrowserView {...props} filters={NO_FILTERS} />}>
      <QuickBitesBrowserWithUrlFilters {...props} />
    </Suspense>
  );
}

function QuickBitesBrowserWithUrlFilters(props: BrowserProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo<QuickBitesFilters>(() => {
    const list = (param: string) => searchParams.get(param)?.split(",").filter(Boolean) ?? [];
    return {
      strings: list(PARAM_BY_KEY.strings),
      chains: list(PARAM_BY_KEY.chains),
      types: list(PARAM_BY_KEY.types) as QuickBiteKind[],
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (next: QuickBitesFilters) => {
      const params = new URLSearchParams();
      (Object.keys(PARAM_BY_KEY) as QuickBitesFilterKey[]).forEach((key) => {
        if (next[key].length) params.set(PARAM_BY_KEY[key], next[key].join(","));
      });
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  return <QuickBitesBrowserView {...props} filters={filters} onFiltersChange={setFilters} queryString={searchParams.toString()} />;
}

function QuickBitesBrowserView({
  quickBites,
  activeTopic,
  filters,
  onFiltersChange,
  queryString = "",
}: BrowserProps & {
  filters: QuickBitesFilters;
  onFiltersChange?: (filters: QuickBitesFilters) => void;
  queryString?: string;
}) {
  const { AllChainsByKeys } = useMaster();
  const { resolvedTheme } = useTheme();
  const [text, setText] = useState("");

  // Chains covered by the Quick Bites on this page, for the filter bar.
  const chainOptions = useMemo<QuickBitesChainOption[]>(() => {
    if (!AllChainsByKeys) return [];
    const seen = new Map<string, QuickBitesChainOption>();
    quickBites.forEach((quickBite) =>
      chainUrlKeysOf(quickBite).forEach((urlKey) => {
        if (seen.has(urlKey)) return;
        const chain = getChainInfoFromUrl(`/chains/${urlKey}`, AllChainsByKeys, resolvedTheme === "light" ? "light" : "dark");
        if (chain) seen.set(urlKey, { urlKey, name: chain.name, icon: chain.icon, color: chain.color });
      }),
    );
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [quickBites, AllChainsByKeys, resolvedTheme]);

  const results = useMemo(
    () =>
      quickBites.filter(
        (quickBite) =>
          filters.strings.every((string) => matchesText(quickBite, string)) &&
          matchesText(quickBite, text) &&
          (filters.chains.length === 0 || chainUrlKeysOf(quickBite).some((urlKey) => filters.chains.includes(urlKey))) &&
          (filters.types.length === 0 || filters.types.includes(quickBite.kind ?? "article")),
      ),
    [quickBites, filters, text],
  );

  const toggle = (key: QuickBitesFilterKey, value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    onFiltersChange?.({ ...filters, [key]: next });
  };

  return (
    <div className="flex flex-col gap-y-[15px]">
      <QuickBitesTopicBar activeTopic={activeTopic} queryString={queryString} />

      <QuickBitesFilterBar
        text={text}
        onTextChange={setText}
        filters={filters}
        onToggle={toggle}
        onClearAll={() => {
          setText("");
          onFiltersChange?.(NO_FILTERS);
        }}
        chainOptions={chainOptions}
        resultCount={results.length}
      />

      {results.length > 0 ? (
        <QuickBitesGrid QuickBites={results} IsLanding={false} />
      ) : (
        <div className="py-[30px] text-center text-md text-color-text-secondary">No Quick Bites match these filters.</div>
      )}
    </div>
  );
}

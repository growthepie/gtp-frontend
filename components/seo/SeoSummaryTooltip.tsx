"use client";

import useSWR from "swr";
import { GTPIcon } from "@/components/layout/GTPIcon";
import {
  GTPTooltipNew,
  TooltipBody,
  TooltipFooter,
  TooltipHeader,
} from "@/components/tooltip/GTPTooltip";
import { IS_PRODUCTION } from "@/lib/helpers";

type SeoSummaryFamily = "chains" | "apps";

type SeoSummaryEntry = {
  slug: string;
  name: string;
  title?: string;
  summary?: string;
  facts?: string[];
  methodology?: string;
  last_updated_utc?: string;
};

type SeoSummaryResponse = {
  last_updated_utc?: string;
  data?: Record<string, SeoSummaryEntry | undefined>;
};

const SEO_SUMMARY_URLS: Record<SeoSummaryFamily, string> = {
  chains: "https://api.growthepie.xyz/v1/seo/chains.json",
  apps: "https://api.growthepie.xyz/v1/seo/apps.json",
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SeoSummaryTooltip({
  family,
  slug,
  placement = "top",
}: {
  family: SeoSummaryFamily;
  slug?: string | null;
  placement?: "top" | "bottom" | "top-start" | "top-end" | "bottom-start" | "bottom-end";
}) {
  const normalizedSlug = slug?.toLowerCase();

  const { data } = useSWR<SeoSummaryResponse>(
    !IS_PRODUCTION && normalizedSlug ? SEO_SUMMARY_URLS[family] : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  );

  if (IS_PRODUCTION) return null;

  const entry = normalizedSlug ? data?.data?.[normalizedSlug] : null;
  if (!entry?.summary) return null;

  const facts = entry.facts?.filter(Boolean).slice(0, 4) ?? [];
  const lastUpdated = entry.last_updated_utc || data?.last_updated_utc;

  return (
    <GTPTooltipNew
      placement={placement}
      size="lg"
      allowInteract={true}
      trigger={
        <button
          type="button"
          aria-label="Show AI-readable summary"
          className="flex h-[26px] items-center gap-x-[5px] rounded-full bg-color-bg-medium px-[8px] text-[10px] font-semibold uppercase leading-none text-color-text-secondary transition-colors hover:bg-color-ui-hover hover:text-color-text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <GTPIcon
            icon="gtp-info-monochrome"
            size="sm"
            className="!size-[12px]"
          />
          AI
        </button>
      }
      containerClass="flex flex-col gap-y-[10px] max-w-[420px]"
      positionOffset={{ mainAxis: 8, crossAxis: 0 }}
    >
      <TooltipHeader title="AI-readable summary" />
      <TooltipBody className="gap-y-[10px] pl-[20px] text-xs leading-[1.45]">
        <p>{entry.summary}</p>
        {facts.length > 0 && (
          <ul className="list-disc space-y-[4px] pl-[16px]">
            {facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        )}
      </TooltipBody>
      {lastUpdated && (
        <TooltipFooter className="pl-[20px] text-[10px] text-color-text-secondary">
          Updated {lastUpdated}
        </TooltipFooter>
      )}
    </GTPTooltipNew>
  );
}

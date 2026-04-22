"use client";
import { useState, memo, useMemo, use, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { useApplicationDetailsData } from "@/app/(layout)/applications/_contexts/ApplicationDetailsDataContext";
import { useMaster } from "@/contexts/MasterContext";
import { ProjectMetadata, useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { ApplicationsURLs } from "@/lib/urls";
import Container from "@/components/layout/Container";
import { LinkButton, LinkDropdown } from "@/components/layout/SingleChains/ChainsOverview";
import { SectionBar, SectionBarItem } from "@/components/SectionBar";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName, iconNames } from "@/icons/gtp-icon-names";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import GTPButtonContainer from "@/components/GTPComponents/ButtonComponents/GTPButtonContainer";
import GTPButtonRow from "@/components/GTPComponents/ButtonComponents/GTPButtonRow";
import GTPMetricCard from "@/components/layout/Applications/AppMetricCard";
import useSWR from "swr";
import ScreenshotsSection from "@/components/layout/Applications/Screenshots";
import AboutApp from "@/components/layout/Applications/AboutSection";
import MostActiveContracts from "@/components/layout/Applications/MostActiveContracts";
import MetricsBody from "@/components/layout/Applications/MetricsBody";
import { useAppColors } from "@/hooks/useAppColors";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { ApplicationDisplayName, ApplicationTooltip } from "@/app/(layout)/applications/_components/Components";
import { useMediaQuery } from "usehooks-ts";
type ApplicationDetailsData = ReturnType<typeof useApplicationDetailsData>["data"];



type ApplicationEnrichmentFeature = {
  feature: string;
};

type ApplicationEnrichmentScreenshot = {
  alt_text: string | null;
  caption: string | null;
  page_id: string;
  priority: number | null;
  title: string | null;
  url: string | null;
};

type ApplicationEnrichmentData = {
  screenshots?: ApplicationEnrichmentScreenshot[] | null;
  features?: {
    product_features?: ApplicationEnrichmentFeature[] | null;
  } | null;
};




const GTP_ICON_NAMES_SET = new Set<string>(iconNames);

function normalizeAppMetricIcon(value: unknown): GTPIconName | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const rawIcon = value.trim();
  if (!rawIcon) {
    return undefined;
  }

  const candidates = rawIcon.startsWith("gtp:")
    ? [rawIcon.slice(4)]
    : [rawIcon, `gtp-${rawIcon}`];

  const matchedIcon = candidates.find((candidate) => GTP_ICON_NAMES_SET.has(candidate));
  return matchedIcon as GTPIconName | undefined;
}

// ─── Fake Data ───────────────────────────────────────────────────────────────

function generateSparkline(points: number, base: number, variance: number) {
  const values: number[] = [];
  let current = base;
  for (let i = 0; i < points; i++) {
    current = current + (Math.random() - 0.45) * variance;
    if (current < 0) current = base * 0.1;
    values.push(current);
  }
  return values;
}

function createEnrichmentHeaders(url: string): Headers {
  const headers = new Headers();

  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");

  if (
    url.includes("api.growthepie.com") &&
    process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN
  ) {
    headers.set(
      "X-Developer-Token",
      process.env.NEXT_PUBLIC_X_DEVELOPER_TOKEN,
    );
  }

  return headers;
}

async function applicationEnrichmentFetcher(
  url: string,
): Promise<ApplicationEnrichmentData | null> {
  const response = await fetch(url, {
    method: "GET",
    headers: createEnrichmentHeaders(url),
  });

  if (response.ok) {
    return response.json();
  }

  if (response.status === 404 || response.status === 403) {
    return null;
  }

  const error: Error & { status?: number } = new Error(
    `HTTP ${response.status}: ${response.statusText}`,
  );
  error.status = response.status;
  throw error;
}



const FAKE_APP = {
  name: "Uniswap",
  owner_project: "uniswap",
  description:
    "Uniswap is the world's leading decentralized exchange protocol, enabling permissionless token swaps across Ethereum and EVM-compatible networks. Uniswap pioneered the automated market maker (AMM) model and introduced concentrated liquidity, allowing liquidity providers to earn fees within custom price ranges with greater capital efficiency.",
  category: "DeFi",
  sub_category: "DEX",
  first_contract_date: "2018-11-02",
  ecosystem_rank: 12,
  ecosystem_total: 1247,
  token: "UNI",
  accent_color: "#FF007A",
  links: {
    website: "https://uniswap.org",
    github: "https://github.com/Uniswap",
    docs: "https://docs.uniswap.org",
    socials: {
      Twitter: "https://twitter.com/Uniswap",
      Discord: "https://discord.com/invite/FCfyBSbCU5",
    },
    governance: "https://gov.uniswap.org",
  },
  chains: [
    { key: "ethereum", name: "Ethereum", color: "#627EEA", share: 42 },
    { key: "arbitrum", name: "Arbitrum One", color: "#12AAFF", share: 28 },
    { key: "base", name: "Base", color: "#0052FF", share: 18 },
    { key: "optimism", name: "OP Mainnet", color: "#FF0420", share: 8 },
    { key: "polygon_pos", name: "Polygon", color: "#8247E5", share: 4 },
  ],
  kpi_cards: [
    {
      key: "dau",
      label: "Daily Active Users",
      icon: "gtp-metrics-activeaddresses" as GTPIconName,
      value: 42350,
      prev_value: 38120,
      prefix: "",
      suffix: "",
      sparkline: generateSparkline(30, 42350, 8000),
    },
    {
      key: "txcount",
      label: "Daily Transactions",
      icon: "txcount" as GTPIconName,
      value: 187420,
      prev_value: 165000,
      prefix: "",
      suffix: "",
      sparkline: generateSparkline(30, 187420, 30000),
    },
    {
      key: "volume",
      label: "Daily Volume",
      icon: "gtp-metrics-economics" as GTPIconName,
      value: 340_000_000,
      prev_value: 290_000_000,
      prefix: "$",
      suffix: "",
      sparkline: generateSparkline(30, 340_000_000, 80_000_000),
    },
    {
      key: "fees",
      label: "Daily Fees",
      icon: "gtp-metrics-feespaidbyusers" as GTPIconName,
      value: 1_250_000,
      prev_value: 980_000,
      prefix: "$",
      suffix: "",
      sparkline: generateSparkline(30, 1_250_000, 300_000),
    },
  ],
};


type ContractEntry = {
  name: string;
  address: string;
  category: string;
  subcategory: string;
  txcount: number;
  activeAddresses: number;
  feesPaid: number;
};

// ─── Small shared components ──────────────────────────────────────────────────



const PartitionLine = ({
  title,
}: {
  title?: string;
}) => (
  <div
    className={`flex items-center gap-x-[10px] w-full px-[10px] text-[#5A6462] ${title ? "h-fit" : "h-[0px] overflow-y-visible"}`}
  >
    <div
      className="w-full h-[1px]"
      style={{
        backgroundImage: `linear-gradient(to right, #344240 50%, transparent 50%)`,
        backgroundSize: "4px 1px",
        backgroundRepeat: "repeat-x",
      }}
    />
    {title && (
      <div className="heading-large-xxs h-[17px] flex items-center whitespace-nowrap pr-[5px]">
        {title}
      </div>
    )}
  </div>
);


// ─── Chain Activity Card ──────────────────────────────────────────────────────

const ChainActivityCard = ({ chains }: { chains: typeof FAKE_APP.chains }) => {
  const [timeZone, setTimeZone] = useState("utc");
  const total = chains.reduce((sum, c) => sum + c.share, 0);

  return (
    <div className="flex flex-col w-full rounded-[15px] bg-color-bg-default pl-[15px] pr-[10px] py-[15px] gap-y-[15px]">
      <div className="flex items-start justify-between gap-x-[15px]">
        <div className="flex items-center gap-x-[5px] w-full  flex-1">
          <GTPIcon icon="gtp-users" className="!size-[16px]" containerClassName="!size-[16px] flex items-center justify-center"/>
          <div className="heading-large-md text-nowrap text-color-text-primary">
             When have users been active in the last 24 hours?
          </div>
        </div>
        <GTPButtonContainer style={{width: "auto"}}>
            <GTPButtonRow>
              <GTPButton
                label="UTC"
                size="sm"
                isSelected={timeZone === "utc"}
                clickHandler={() => setTimeZone("utc")}
              />
              <GTPButton
                label="Local Time"
                size="sm"
                isSelected={timeZone === "local"}
                clickHandler={() => setTimeZone("local")}
              />
            </GTPButtonRow>
          </GTPButtonContainer>
      </div>
      <div>
        <TimedotRow data={{ time: "12:00", value: 24, color: "yellow" }} />
      </div>
      <div className="flex items-center justify-center gap-x-[10px] w-full">
        <GTPButton
          label="Low Activity"
          size="xs"
          variant="primary"
          leftIconOverride={
            <div className="w-[6px] h-[6px] rounded-full bg-color-accent-turquoise" />
          }
          className=""
        />
        <GTPButton
          label="Medium Activity"
          size="xs"
          variant="primary"
          leftIconOverride={
            <div className="w-[6px] h-[6px] rounded-full bg-color-accent-yellow" />
          }
          className=""
        />
        <GTPButton
          label="High Activity"
          size="xs"
          variant="primary"
          leftIconOverride={
            <div className="w-[6px] h-[6px] rounded-full bg-color-accent-red" />
          }
          className=""
        />
      </div>
    </div>
  );
};

const TimedotRow = ({ data }: { data: { time: string, value: number, color: string } }) => {
  return (
    <div>
      <div className="flex items-center justify-between px-[30px]">
        {(Array.from({ length: data.value }).map((_, i) => (
          <div key={i} className="w-[15px] h-[15px] rounded-full bg-yellow-500"></div>
        )))}

      </div>
      <div className="flex items-center justify-between px-[37.5px]">
        <div className="h-[5px] border-l-[1px] border-color-text-secondary"></div>
        <div className="h-[5px] w-[1px] bg-color-text-secondary"></div>
        <div className="h-[5px] border-r-[1px] border-color-text-secondary"></div>

      </div>
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between w-full  px-[5px]">
          <div className="w-[70px] text-xxs flex items-center justify-center">{data.time}AM</div>
          <div className="w-[70px] text-xxs flex items-center justify-center">{data.time}AM</div>
          <div className="w-[70px] text-xxs flex items-center justify-center">{data.time}PM</div>
        </div>
        <div className="flex items-center justify-between w-full  px-[5px]">
          <div className="w-[70px] text-xxs flex items-center justify-center text-color-text-secondary"><span className="text-color-text-primary">24</span>/12/2025</div>
          <div className="w-[70px] text-xxs flex items-center justify-center text-color-text-secondary"><span className="text-color-text-secondary">24</span>/12/2025</div>
          <div className="w-[70px] text-xxs flex items-center justify-center text-color-text-secondary"><span className="text-color-text-primary">25</span>/12/2025</div>
        </div>
      </div>

    </div>
  );
};

// ─── Placeholder Card ─────────────────────────────────────────────────────────

const PlaceholderCard = ({ title }: { title: string }) => (
  <div className="flex flex-col w-full rounded-[15px] bg-color-bg-default xs:px-[30px] px-[15px] py-[15px] min-h-[200px] items-center justify-center gap-y-[10px]">
    <div className="heading-large-md opacity-50">{title}</div>
    <div className="text-sm text-color-text-secondary text-center">
      Data coming soon
    </div>
  </div>
);




const FeaturedSection = memo(({
  features,
}: {
  features: string[];
}) => {
  if (!features.length) {
    return null;
  }

  return (
    <div className="flex w-full flex-wrap gap-[10px] rounded-[15px] select-none">
      {features.map((feature: string, i: number) => (
        <FeaturedCard key={i} feature={feature} />
      ))}
    </div>
  );
});


const SimilarAppsSection = memo(({ owner_project, projectMetadata }: { owner_project: string, projectMetadata: ProjectMetadata }) => {

  const { filteredProjectsData } = useProjectsMetadata();
  const [randomIndices, setRandomIndices] = useState<number[] | null>(null);
  const isMobile = useMediaQuery("(max-width: 728px)");
  const isXS = useMediaQuery("(max-width: 530px)");

  useEffect(() => {
      if (!filteredProjectsData || randomIndices !== null) return;
      const iconIndex = filteredProjectsData.types.indexOf("logo_path");
      const ownerIndex = filteredProjectsData.types.indexOf("owner_project");
      const txcountIndex = filteredProjectsData.types.indexOf("txcount");
      const subCategoryIndex = filteredProjectsData.types.indexOf("sub_category");
      if (iconIndex === -1 || txcountIndex === -1) return;
      const dataLen = filteredProjectsData.data.length;
      const indices: number[] = [];
      const seenOwners = new Set<string>();
      let attempts = 0;
      while (indices.length < 6 && attempts < dataLen * 3) {
          attempts++;
          const idx = Math.floor(Math.random() * dataLen);
          const project = filteredProjectsData.data[idx];
          const owner = ownerIndex !== -1 ? project?.[ownerIndex] : null;
          const txcount = Number(project?.[txcountIndex]);
          const subCategory = subCategoryIndex !== -1 ? project?.[subCategoryIndex] : null;
          if (
              typeof project?.[iconIndex] === "string" &&
              txcount >= 10000 &&
              !indices.includes(idx) &&
              (ownerIndex === -1 || (typeof owner === "string" && owner !== owner_project && !seenOwners.has(owner))) &&
              (subCategoryIndex === -1 || !projectMetadata.sub_category || subCategory === projectMetadata.sub_category)
          ) {
              indices.push(idx);
              if (typeof owner === "string") seenOwners.add(owner);
          }
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRandomIndices(indices);
  }, [filteredProjectsData, randomIndices]); // eslint-disable-line react-hooks/exhaustive-deps

  const randomProjects = useMemo(() => {
      if (!filteredProjectsData || !randomIndices) return [];
      return randomIndices.map((i) => filteredProjectsData.data[i]);
  }, [filteredProjectsData, randomIndices]);



  if (!randomProjects.length) return <></>;

  return (
    <div className={`flex justify-between gap-y-[10px] bg-color-bg-default rounded-[15px] ${isXS ? "flex-col items-start" : "flex-row items-center"} px-[30px] py-[15px]`}>
      <div className="flex items-center gap-x-[8px]">
        <GTPIcon icon={"gtp:gtp-project" as GTPIconName} className="!size-[20px] sm:!size-[24px]" containerClassName="!size-[20px] sm:!size-[24px] relative bottom-[2px] flex items-center justify-center"/>
        <div className=" sm:block hidden heading-large-md text-color-text-primary">
          Similar Applications
        </div>
        <div className="block sm:hidden heading-small-sm text-color-text-primary">
          Similar Apps
        </div>
      </div>
      <div className="flex items-center gap-x-[8px]">
        {randomProjects.map((project, index) => {
          return (

          <GTPTooltipNew
            size="md"
            key={project.name ?? index + "_RandomAppsSection"}
            placement="bottom-start"
            allowInteract={true}
            trigger={
              <Link key={project.name} className="p-[5px] sm:p-[8px] bg-color-bg-medium rounded-full hover:bg-color-ui-hover"
              href={`/applications/${project[filteredProjectsData?.types?.indexOf("owner_project") ?? 0]}`}
              >
                <Image
                  className="rounded-full"
                  src={`https://api.growthepie.com/v1/apps/logos/${project[filteredProjectsData?.types?.indexOf("logo_path") ?? 0]}`}
                  alt={project[filteredProjectsData?.types?.indexOf("display_name") ?? 0] as string}
                  width={isMobile ? 20 : 28}
                  height={isMobile ? 20 : 28}
                />
                <div className="text-sm text-color-text-primary">{project.display_name}</div>
              </Link>

            }
            containerClass="flex flex-col gap-y-[10px]"
            positionOffset={{ mainAxis: 0, crossAxis: 20 }}
        >
          <ApplicationTooltip application={{
            owner_project: project[filteredProjectsData?.types?.indexOf("owner_project") ?? 0],
            origin_keys: project[filteredProjectsData?.types?.indexOf("origin_keys") ?? 0],
            num_contracts: project[filteredProjectsData?.types?.indexOf("num_contracts") ?? 0],
            gas_fees_eth: project[filteredProjectsData?.types?.indexOf("gas_fees_eth") ?? 0],
            gas_fees_usd: project[filteredProjectsData?.types?.indexOf("gas_fees_usd") ?? 0],
            prev_gas_fees_eth: project[filteredProjectsData?.types?.indexOf("prev_gas_fees_eth") ?? 0],
            txcount: project[filteredProjectsData?.types?.indexOf("txcount") ?? 0],
            prev_txcount: project[filteredProjectsData?.types?.indexOf("prev_txcount") ?? 0],
            daa: project[filteredProjectsData?.types?.indexOf("daa") ?? 0],
            prev_daa: project[filteredProjectsData?.types?.indexOf("prev_daa") ?? 0],
            gas_fees_eth_change_pct: project[filteredProjectsData?.types?.indexOf("gas_fees_eth_change_pct") ?? 0],
            gas_fees_usd_change_pct: project[filteredProjectsData?.types?.indexOf("gas_fees_usd_change_pct") ?? 0],
            txcount_change_pct: project[filteredProjectsData?.types?.indexOf("txcount_change_pct") ?? 0],
            daa_change_pct: project[filteredProjectsData?.types?.indexOf("daa_change_pct") ?? 0],
            rank_gas_fees_eth: project[filteredProjectsData?.types?.indexOf("rank_gas_fees_eth") ?? 0],
            rank_gas_fees_usd: project[filteredProjectsData?.types?.indexOf("rank_gas_fees_usd") ?? 0],
            rank_txcount: project[filteredProjectsData?.types?.indexOf("rank_txcount") ?? 0],
            rank_daa: project[filteredProjectsData?.types?.indexOf("rank_daa") ?? 0],
        }} />
        </GTPTooltipNew>

        )})}
      </div>
    </div>
  );
});
SimilarAppsSection.displayName = "SimilarAppsSection";

const FeaturedCard = memo(({ feature }: { feature: string }) => {

  return (
    <div className="flex flex-1 gap-[6px] min-h-[60px] items-center justify-center rounded-[11px] bg-color-bg-default px-[13px] py-[8px] select-none">
      <GTPIcon icon="gtp-defi" size="md" />
      <div className="text-center text-md text-color-text-primary whitespace-nowrap">
        {feature}
      </div>
    </div>
  );
});
FeaturedCard.displayName = "FeaturedCard";
FeaturedSection.displayName = "FeaturedSection";

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewContent = memo(({
  data,
  owner_project,
  projectMetadata,
  enrichmentData,
  setSelectedTab,
  navigateToMetric,
}: {
  data: ApplicationDetailsData;
  owner_project: string;
  projectMetadata: ProjectMetadata;
  enrichmentData: ApplicationEnrichmentData | null | undefined;
  setSelectedTab: (tab: string) => void;
  navigateToMetric: (metric: string) => void;
}) => {
  const { data: masterData } = useMaster();
  const { resolvedTheme } = useTheme();
  const { getAppColors } = useAppColors();
  const appColor = getAppColors(owner_project, resolvedTheme);
  // Callback ref pattern: ResizeObserver is set up the moment React attaches the
  // element, so leftColHeight is correct even on the first mount (avoids the
  // useElementSizeObserver issue where ref.current is null on the first render).
  const [leftColHeight, setLeftColHeight] = useState(0);
  const leftColObserverRef = useRef<ResizeObserver | null>(null);
  const leftColRef = useCallback((node: HTMLDivElement | null) => {
    leftColObserverRef.current?.disconnect();
    leftColObserverRef.current = null;
    if (node) {
      const observer = new ResizeObserver(([entry]) => {
        const h = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        setLeftColHeight(h);
      });
      observer.observe(node, { box: "border-box" });
      leftColObserverRef.current = observer;
    }
  }, []);
  const screenshots = useMemo(
    () =>
      [...(enrichmentData?.screenshots ?? [])]
        .filter((screenshot) => Boolean(screenshot?.page_id))
        .sort((a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER)),
    [enrichmentData],
  );
  const features = useMemo(
    () =>
      Array.from(
        new Set(
          (enrichmentData?.features?.product_features ?? [])
            .map((entry) => entry.feature.trim())
            .filter(Boolean),
        ),
      ),
    [enrichmentData],
  );



  return (
    <div className="flex flex-col w-full gap-[15px]">
      {/* ScreenshotsSection must live OUTSIDE the @container div below.
          container-type: inline-size (set by @container) acts as a containing block
          for position:fixed descendants, which traps the backdrop overlay and breaks
          its z-index against siblings like the SectionBar. */}
      <ScreenshotsSection owner_project={owner_project} screenshots={screenshots} />
    <div id="content-container" className="@container flex flex-col w-full gap-[15px] ">
      {/*<FeaturedSection features={features} />*/}
      <div className="flex flex-col gap-y-[15px] py-[15px]">
        <div className="flex items-center gap-x-[8px] ">
          <GTPIcon icon={"gtp:gtp-fundamentals" as GTPIconName} className="!size-[24px]" containerClassName="!size-[24px] flex items-center justify-center"/>
          <div className="heading-large-md text-color-text-primary">
            Metrics and contracts at a glance
          </div>
        </div>
        <div className="text-sm ">
          The Market Cap is the total value of all circulating tokens, calculated by multiplying the current price of a single token by the total number of tokens in circulation.
        </div>
      </div>
      {/* Two-column grid: side cards left, main cards right */}
      <div className="grid grid-flow-row grid-cols-1 @[995px]:grid-cols-[minmax(480px,auto)_minmax(490px,auto)] gap-[10px] items-start">
        {/* Left column: KPI side cards */}
        <div ref={leftColRef} className="flex flex-col gap-y-[10px]">
          <PartitionLine title="Yesterday" />
          {data.kpi_cards && (
            <>
          {Object.keys(data.kpi_cards).map((metric) => (
            <GTPMetricCard
              key={metric}
              label={masterData?.app_metrics[metric].name ?? metric}
              value={data.kpi_cards[metric].current_values.data[0]}
              wowChange={data.kpi_cards[metric].wow_change.data[0] * 100}
              sparkline={data.kpi_cards[metric].sparkline.data.map((item: any) => item[1])}
              color={appColor[0]}
              icon={normalizeAppMetricIcon(masterData?.app_metrics[metric].icon) ?? "gtp-metrics-marketcap"}
              onClick={() => navigateToMetric(metric)}
            />

          ))}
          </>
          )}
                  <PartitionLine />
          <div className="w-full ">
            <GTPButton
              label="See all metrics"
              size="sm"
              variant="primary"
              leftIcon="gtp-fundamentals"
              rightIconOverride={
                <GTPIcon icon="gtp-chevronright-monochrome" containerClassName="!size-[11px] flex items-center justify-center" className="!size-[11px]" size="sm" />
              }
              rightIconPushToEdge
              textClassName="w-full text-left"
              className="w-full bg-"
              clickHandler={() => setSelectedTab("metrics")}
            />
          </div>
        </div>


        {/* Right column: main content */}
        <div className="flex flex-col gap-y-[10px] h-full">
          {/* <ChainActivityCard chains={FAKE_APP.chains} /> */}
          <MostActiveContracts data={data} containerHeight={leftColHeight} owner_project={owner_project} />

        </div>
      </div>
      <SimilarAppsSection owner_project={owner_project} projectMetadata={projectMetadata} />
    </div>
    </div>
  );
});
OverviewContent.displayName = "OverviewContent";

// ─── Metrics Tab ──────────────────────────────────────────────────────────────

const MetricsContent = memo(({ data, owner_project, projectMetadata, highlightMetric, onHighlightConsumed }: { data: ApplicationDetailsData, owner_project: string, projectMetadata: ProjectMetadata, highlightMetric?: string | null, onHighlightConsumed?: () => void }) => (
  <div id="content-container" className="flex flex-col w-full gap-[15px]">
    <MetricsBody data={data} owner_project={owner_project} projectMetadata={projectMetadata} highlightMetric={highlightMetric} onHighlightConsumed={onHighlightConsumed} />
  </div>
));
MetricsContent.displayName = "MetricsContent";

// ─── User Insights Tab ────────────────────────────────────────────────────────

const UserInsightsContent = memo(() => (
  <div className="flex flex-col gap-y-[15px]">
    <div className="flex flex-col w-full rounded-[15px] bg-color-bg-default xs:px-[30px] px-[15px] py-[15px] min-h-[400px] items-center justify-center gap-y-[10px]">
      <GTPIcon icon="gtp-users" size="lg" className="opacity-30" />
      <div className="heading-large-md opacity-50">User Insights</div>
      <div className="text-sm text-color-text-secondary text-center max-w-[400px]">
        User behavior analytics and wallet cohort analysis will appear here.
      </div>
    </div>
  </div>
));
UserInsightsContent.displayName = "UserInsightsContent";

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TABS = [
  {
    key: "overview",
    icon: "gtp:gtp-project",

  },
  {
    key: "metrics",
    icon: "gtp:gtp-fundamentals",
    getHeader: () => "Metrics",
  },
  {
    key: "user_insights",
    icon: "gtp:gtp-users",
    getHeader: () => "User Insights",
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page({
  params,
}: {
  params: Promise<{ owner_project: string }>;
}) {
  use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, owner_project } = useApplicationDetailsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();

  const { data: enrichmentData } = useSWR<ApplicationEnrichmentData | null>(
    owner_project
      ? ApplicationsURLs.enrichment.replace("{owner_project}", owner_project)
      : null,
    applicationEnrichmentFetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    },
  );

  const projectMetadata = ownerProjectToProjectData[owner_project];

  const [selectedTab, setSelectedTab] = useState<string>(() => {
    return searchParams.get("tab") || "overview";
  });
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [pendingHighlightMetric, setPendingHighlightMetric] = useState<string | null>(null);

  // Switches to the metrics tab and queues a scroll-to + highlight for the given metric key.
  const navigateToMetric = useCallback((metric: string) => {
    setSelectedTab("metrics");
    setPendingHighlightMetric(metric);
  }, []);

  // Sync tab selection to URL
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    const targetTab = selectedTab === "overview" ? null : selectedTab;
    if (currentTab === targetTab) return;

    const currentParams = new URLSearchParams(searchParams.toString());
    if (selectedTab === "overview") {
      currentParams.delete("tab");
    } else {
      currentParams.set("tab", selectedTab);
    }
    const newUrl = `${window.location.pathname}${
      currentParams.toString() ? `?${currentParams.toString()}` : ""
    }`;
    router.replace(newUrl, { scroll: false });
  }, [selectedTab, router, searchParams]);

  const TabContent = useMemo(() => {
    switch (selectedTab) {
      case "overview":
        return (
          <OverviewContent
            data={data}
            owner_project={owner_project}
            projectMetadata={projectMetadata}
            enrichmentData={enrichmentData}
            setSelectedTab={setSelectedTab}
            navigateToMetric={navigateToMetric}
          />
        );
      case "metrics":
        return (
          <MetricsContent
            data={data}
            owner_project={owner_project}
            projectMetadata={projectMetadata}
            highlightMetric={pendingHighlightMetric}
            onHighlightConsumed={() => setPendingHighlightMetric(null)}
          />
        );
      case "user_insights":
        return <UserInsightsContent />;
      default:
        return <div className="p-8 text-center">Tab not found</div>;
    }
  }, [data, selectedTab, owner_project, projectMetadata, enrichmentData, navigateToMetric, pendingHighlightMetric]);

  return (
    <>
    {owner_project && projectMetadata && (
    <Container className="flex flex-col gap-y-[10px] pt-[45px] md:pt-[30px] select-none">
      {/* Tab bar */}
      <SectionBar>
        {TABS.map((tab, index) => (
          <div
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            onMouseEnter={() => setHoveredTab(tab.key)}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <SectionBarItem
              isSelected={selectedTab === tab.key}
              isLocked={false}
              comingSoon={ tab.key === "user_insights" ? true : false}
              icon={tab.icon as GTPIconName}
              appIconOverride={tab.key === "overview"
                ? <Image src={`https://api.growthepie.com/v1/apps/logos/${projectMetadata.logo_path}`} alt={projectMetadata.display_name} width={24} height={24} className="rounded-full" />
                : undefined
              }
              header={tab.key === "overview" ? projectMetadata.display_name : tab.getHeader?.()}
              index={index + 1}
              isHovered={hoveredTab === tab.key}
            />
          </div>
        ))}
      </SectionBar>

      {/* Shared AboutApp — rendered once above tab content for overview and metrics */}
      {data && projectMetadata && (
        <AboutApp
          data={data}
          owner_project={owner_project}
          projectMetadata={projectMetadata}
          defaultOpen={selectedTab === "overview"}
        />
      )}

      {/* Tab content */}
      <div>
        {TabContent}
      </div>
    </Container>
    )}
    </>
  );
}

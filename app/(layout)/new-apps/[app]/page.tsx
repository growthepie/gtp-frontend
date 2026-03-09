"use client";
import { useState, memo, useMemo, use, useEffect } from "react";
import { useApplicationDetailsData } from "@/app/(layout)/applications/_contexts/ApplicationDetailsDataContext";
import { useMaster } from "@/contexts/MasterContext";
import { ProjectMetadata, useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import Container from "@/components/layout/Container";
import { LinkButton, LinkDropdown } from "@/components/layout/SingleChains/ChainsOverview";
import { SectionBar, SectionBarItem } from "@/components/SectionBar";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { GTPButton } from "@/components/GTPButton/GTPButton";
import GTPButtonDropdown from "@/components/GTPButton/GTPButtonDropdown";
import AppMetricCard from "@/components/apps/AppMetricCard";
import GTPButtonRow from "@/components/GTPButton/GTPButtonRow";
import GTPButtonContainer from "@/components/GTPButton/GTPButtonContainer";
import {
  GridTableHeader,
  GridTableRow,
} from "@/components/layout/GridTable";
import { Icon } from "@iconify/react";

type ApplicationDetailsData = ReturnType<typeof useApplicationDetailsData>["data"];

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

// Fake screenshots — first entry is the feature/hero image (wider flex-[2]),
// the rest are standard UI screenshots (flex-[1]).
const FAKE_SCREENSHOTS = [
  {
    label: "Swap Interface",
    bg: "linear-gradient(135deg, #d4f500 0%, #a3e635 40%, #c084fc 100%)",
    flex: 2,
  },
  {
    label: "Token Selection",
    bg: "linear-gradient(160deg, #1e1b4b 0%, #4c1d95 50%, #312e81 100%)",
    flex: 1,
  },
  {
    label: "Chain Selector",
    bg: "linear-gradient(160deg, #1e1b4b 0%, #6d28d9 50%, #4c1d95 100%)",
    flex: 1,
  },
  {
    label: "Route Preview",
    bg: "linear-gradient(160deg, #1e1b4b 0%, #5b21b6 50%, #3b0764 100%)",
    flex: 1,
  },
  {
    label: "Settings",
    bg: "linear-gradient(160deg, #1e1b4b 0%, #7c3aed 50%, #4c1d95 100%)",
    flex: 1,
  },
];

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


const FAKE_CONTRACTS: ContractEntry[] = [
  { name: "UniswapV3Pool", address: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", category: "Finance", subcategory: "DEX", txcount: 19825301, activeAddresses: 90, feesPaid: 557350.37 },
  { name: "SwapRouter02", address: "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", category: "Finance", subcategory: "DEX", txcount: 14203847, activeAddresses: 74, feesPaid: 412890.12 },
  { name: "NonfungiblePositionManager", address: "0xc36442b4a4522e871399cd717abdd847ab11fe88", category: "Finance", subcategory: "Liquidity", txcount: 9541200, activeAddresses: 55, feesPaid: 289430.50 },
  { name: "QuoterV2", address: "0x61ffe014ba17989e743c5f6cb21bf9697530b21e", category: "Finance", subcategory: "Price Oracle", txcount: 7823150, activeAddresses: 41, feesPaid: 198750.22 },
  { name: "FeeModule", address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", category: "Finance", subcategory: "Prediction Markets", txcount: 5102340, activeAddresses: 36, feesPaid: 143200.88 },
  { name: "UniswapV3Factory", address: "0x1f98431c8ad98523631ae4a59f267346ea31f984", category: "Finance", subcategory: "Infrastructure", txcount: 3984720, activeAddresses: 29, feesPaid: 98540.15 },
  { name: "WETH9", address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", category: "Finance", subcategory: "Wrapped Asset", txcount: 2861050, activeAddresses: 21, feesPaid: 67320.44 },
  { name: "Multicall3", address: "0xcA11bde05977b3631167028862bE2a173976CA11", category: "Finance", subcategory: "Utility", txcount: 1547800, activeAddresses: 14, feesPaid: 34102.18 },
];

const CONTRACT_GRID_COLS = "grid-cols-[minmax(130px,1fr),100px,145px,125px,105px,110px]";

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




const MostActiveContracts = () => {
  const [sort, setSort] = useState<{ metric: string; sortOrder: string }>({
    metric: "txcount",
    sortOrder: "desc",
  });
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const sortedContracts = useMemo(() => {
    return [...FAKE_CONTRACTS].sort((a, b) => {
      const dir = sort.sortOrder === "asc" ? 1 : -1;
      switch (sort.metric) {
        case "name": return dir * a.name.localeCompare(b.name);
        case "category": return dir * a.category.localeCompare(b.category);
        case "subcategory": return dir * a.subcategory.localeCompare(b.subcategory);
        case "txcount": return dir * (a.txcount - b.txcount);
        case "activeAddresses": return dir * (a.activeAddresses - b.activeAddresses);
        case "feesPaid": return dir * (a.feesPaid - b.feesPaid);
        default: return 0;
      }
    });
  }, [sort]);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 1000);
  };

  return (
    <div className="flex flex-col w-full rounded-[15px] bg-color-bg-default px-[15px] py-[15px] gap-y-[10px]">
      {/* Header */}
      <div className="flex items-center gap-x-[5px]">
        <GTPIcon
          icon="gtp-labeled"
          className="!size-[16px]"
          containerClassName="!size-[16px] flex items-center justify-center"
        />
        <div className="heading-large-md text-nowrap text-color-text-primary">
          Most Active Contracts
        </div>
      </div>
      <div className="text-xxs text-color-text-secondary">
        See the most active contracts for this application in the last 7 days.
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto w-full">
        <div className="min-w-[650px]">
          <GridTableHeader
            gridDefinitionColumns={CONTRACT_GRID_COLS}
            className="!pt-[5px] !pb-[5px] !gap-x-[10px] !pl-0"
          >
            {/* ml-[31px] = icon (30px) + gap (6px) - button internal left-padding (5px) */}
            {(["name", "category", "subcategory", "txcount", "activeAddresses", "feesPaid"] as const).map((metric, i) => {
              const labels = ["Contract", "Category", "Subcategory", "Transaction Count", "Active Addresses", "Fees Paid (USD)"];
              const isActive = sort.metric === metric;
              const arrowIcon = (isActive && sort.sortOrder === "asc" ? "feather:arrow-up" : "feather:arrow-down") as GTPIconName;
              return (
                <GTPButton
                  key={metric}
                  label={labels[i]}
                  size="xs"
                  variant="primary"
                  isSelected={isActive}
                  rightIcon={arrowIcon}
                  rightIconClassname={isActive ? "opacity-100" : "opacity-30"}
                  className={i === 0 ? "ml-[31px]" : ""}
                  clickHandler={() =>
                    setSort((prev) => ({
                      metric,
                      sortOrder: prev.metric === metric ? (prev.sortOrder === "asc" ? "desc" : "asc") : "desc",
                    }))
                  }
                />
              );
            })}
          </GridTableHeader>

          <div className="flex flex-col gap-y-[3px] pt-[5px]">
            {sortedContracts.map((contract) => (
              <GridTableRow
                key={contract.address}
                gridDefinitionColumns={CONTRACT_GRID_COLS}
                className="h-[34px] text-[12px] !py-0 !gap-x-[10px]"
                style={{ paddingLeft: "0px" }}
              >
                {/* Contract name + copy + explorer */}
                
                <div className="flex items-center gap-x-[6px] min-w-0" >
                  <GTPIcon
                    icon="gtp-labeled"
                    className="!size-[16px] "
                    containerClassName="!size-[30px] flex items-center justify-center bg-color-ui-active rounded-full"
                  />
               
                  <span className="truncate font-medium">{contract.name}</span>
                  <div className="flex items-center gap-x-[4px] shrink-0">
                    <button
                      onClick={() => handleCopy(contract.address)}
                      className="text-color-text-secondary hover:text-color-text-primary transition-colors"
                    >
                      <Icon
                        icon={copiedAddress === contract.address ? "feather:check" : "feather:copy"}
                        className="w-[11px] h-[11px]"
                      />
                    </button>
                    <Icon
                      icon="gtp:gtp-block-explorer-alt"
                      className="w-[11px] h-[11px] text-color-text-secondary"
                    />
                  </div>
                </div>

                {/* Category badge */}
                <div className="flex items-center bg-color-bg-medium h-full p-1 gap-x-[8px] ">
                  <GTPIcon icon={"gtp-defi" as GTPIconName} className="!size-[16px]" containerClassName="bg-color-ui-active rounded-full flex items-center justify-center" />
                  <div className="text-xs">{contract.category}</div>
                </div>

                {/* Subcategory */}
                <div className="truncate text-[11px] text-color-text-secondary">
                  {contract.subcategory}
                </div>

                {/* Transaction Count */}
                <div className="flex items-center justify-end numbers-xs">
                  {contract.txcount.toLocaleString("en-GB")}
                </div>

                {/* Active Addresses */}
                <div className="flex items-center justify-end numbers-xs">
                  {contract.activeAddresses.toLocaleString("en-GB")}
                </div>

                {/* Fees Paid */}
                <div className="flex items-center justify-end numbers-xs">
                  ${contract.feesPaid.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </GridTableRow>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex justify-end pt-[2px]">
        <GTPButton
          label="Don't see your app? Label here."
          size="sm"
          rightIcon={"in-button-right-monochrome" as GTPIconName}
        />
      </div>
    </div>
  );
};

// ─── About App ────────────────────────────────────────────────────────────────

const AppOverviewMetaCol = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-y-[4px] shrink-0">
    <div className="heading-xxs text-color-text-secondary whitespace-nowrap">{label}</div>
    <div className="text-md">{children}</div>
  </div>
);

// ─── Active On Section ────────────────────────────────────────────────────────

const ActiveOnSection = ({ active_on, txcount }: { active_on: { [chainKey: string]: number }; txcount: number }) => {
  const { AllChainsByKeys } = useMaster();
  const { resolvedTheme } = useTheme();
  const chainColorTheme = resolvedTheme === "light" ? "light" : "dark";
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);

  const sorted = useMemo(
    () => Object.entries(active_on).sort((a, b) => b[1] - a[1]),
    [active_on],
  );


  const handleBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    let cumulative = 0;
    for (const [chain, count] of sorted) {
      cumulative += (count / txcount) * rect.width;
      if (mouseX <= cumulative) {
        setHoveredChain(chain);
        return;
      }
    }
  };

  const hoveredEntry = hoveredChain ? sorted.find(([c]) => c === hoveredChain) : null;
  const hoveredCount = hoveredEntry?.[1] ?? 0;
  const hoveredPct = txcount > 0 ? ((hoveredCount / txcount) * 100).toFixed(1) : "0";
  const hoveredColor = AllChainsByKeys[hoveredChain ?? ""]?.colors[chainColorTheme][0];
  const hoveredLabel = AllChainsByKeys[hoveredChain ?? ""]?.label ?? hoveredChain;
  const hoveredUrlKey = AllChainsByKeys[hoveredChain ?? ""]?.urlKey;

  return (
    <div className="flex flex-col gap-y-[6px] flex-1 min-w-[160px] max-w-[360px]">
      <div className="heading-xxs text-color-text-secondary">Active on</div>

      {/* Icon row */}
      <div
        className="flex flex-wrap items-center gap-[3px]"
        onMouseLeave={() => setHoveredChain(null)}
      >
        {sorted.map(([chain]) => {
          const chainData = AllChainsByKeys[chain];
          const chainColor = AllChainsByKeys[chain]?.colors[chainColorTheme][0];
          const isHovered = hoveredChain === chain;
          return (
            <div
              key={chain}
              className="flex items-center justify-center size-[22px] rounded-full transition-colors duration-150 cursor-default"
              style={{ backgroundColor: isHovered ? "rgba(var(--ui-active), 1)" : "transparent" }}
              onMouseEnter={() => setHoveredChain(chain)}
            >
              <GTPIcon
                icon={`gtp:${chainData?.urlKey}-logo-monochrome` as GTPIconName}
                className="!size-[24px]"
                containerClassName="!size-[24px] flex items-center justify-center"
                style={{ color: chainColor }}
              />
            </div>
          );
        })}
      </div>

      {/* Bar — visual uses overlapping pills; hover uses proportional math on container */}
      <div
        className="flex h-[13px] w-full rounded-full overflow-hidden cursor-default"
        onMouseMove={handleBarMouseMove}
        onMouseLeave={() => setHoveredChain(null)}
      >
        {sorted.map(([chain, count], index) => (
          <div
            key={chain + "-bar"}
            className="relative h-full shrink-0 pointer-events-none"
            style={{
              marginRight: "-4px",
              zIndex: 100 - index,
              width: `${(count / txcount) * 100}%`,
              backgroundColor: AllChainsByKeys[chain]?.colors[chainColorTheme][0],
              borderTopRightRadius: "999px",
              borderBottomRightRadius: "999px",
            }}
          >
            {/* Solid overlay for dimming — avoids bleed-through in overlap zone */}
            <div
              className="absolute inset-0 bg-color-bg-default transition-opacity duration-150"
              style={{
                borderTopRightRadius: "999px",
                borderBottomRightRadius: "999px",
                opacity: hoveredChain && hoveredChain !== chain ? 0.65 : 0,
              }}
            />
          </div>
        ))}
      </div>

      {/* Hover info — fixed height prevents layout shift */}
      <div className="flex items-center gap-x-[6px] h-[16px]">
        {hoveredChain && hoveredEntry && (
          <>
            <GTPIcon
              icon={`gtp:${hoveredUrlKey}-logo-monochrome` as GTPIconName}
              className="!size-[12px]"
              containerClassName="!size-[12px] flex items-center justify-center"
              style={{ color: hoveredColor }}
            />
            <span className="text-xs font-medium" style={{ color: hoveredColor }}>
              {hoveredLabel}
            </span>
            <span className="text-xs text-color-text-secondary">{hoveredPct}%</span>
            <span className="text-xs text-color-text-secondary">
              ({hoveredCount.toLocaleString("en-GB")} transactions)
            </span>
          </>
        )}
      </div>
    </div>
  );
};

// ─── About App ────────────────────────────────────────────────────────────────

const AboutApp = memo(({ data, owner_project, projectMetadata }: { data: ApplicationDetailsData, owner_project: string, projectMetadata: ProjectMetadata }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col w-full rounded-[15px] bg-color-bg-default xs:px-[30px] px-[15px] py-[15px] select-none">
      {/* Header: toggle + "App Overview" */}
      <div
        className="flex items-center gap-x-[10px] cursor-pointer w-fit"
        onClick={() => setOpen((v) => !v)}
      >
        <GTPIcon
          icon="in-button-right-monochrome"
          size="sm"
          className="!size-[14px]"
          containerClassName={`!size-[26px] !flex !justify-center !items-center bg-color-bg-medium hover:bg-color-ui-hover rounded-[20px] transition-all duration-300 ${
            open ? "rotate-90" : "rotate-0"
          }`}
        />
        <div className="heading-large-md text-color-text-secondary">App Overview</div>
      </div>

      {/* Collapsible body */}
      <div
        style={{
          maxHeight: open ? 400 : 0,
          paddingTop: open ? "12px" : 0,
          overflow: "visible",
          opacity: open ? 1 : 0,
          transition: "max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, padding-top 0.3s ease-in-out",
        }}
      >
        {/* Description */}
        <p className="text-sm pb-[15px]">{projectMetadata.description}</p>

        {/* Metadata row */}
        <div className="flex flex-wrap items-start gap-x-[30px] gap-y-[12px]">

          {/* First Contract Seen */}
          <AppOverviewMetaCol label="First Contract Seen">
            {data.first_seen && (
              <div>{new Date(data.first_seen).toLocaleDateString()}</div>
            )}

          </AppOverviewMetaCol>

          {/* Ecosystem Rank */}
          <AppOverviewMetaCol label="Ethereum Ecosystem Rank">
            #{projectMetadata.ecosystem_rank}
          </AppOverviewMetaCol>

          {/* Active on: icons + stacked bar */}
          {projectMetadata.active_on && projectMetadata.txcount && (
            <ActiveOnSection
              active_on={projectMetadata.active_on}
              txcount={projectMetadata.txcount}
            />
          )}

          {/* Token */}
          <AppOverviewMetaCol label="Token">
            {projectMetadata.token_symbol ?? "—"}
          </AppOverviewMetaCol>

          {/* Links */}
          <div className="flex flex-col gap-y-[4px]">
            <div className="heading-xxs text-color-text-secondary whitespace-nowrap">Links</div>
            <div className="flex flex-wrap items-center gap-[5px]">
              {projectMetadata.website && (
                <GTPButton
                  size="sm"
                  leftIcon={"feather:globe" as GTPIconName}
                  label="Website"
                  clickHandler={() => window.open(projectMetadata.website ?? "", "_blank", "noopener,noreferrer")}
                />
              )}
              {projectMetadata.twitter && (
                <LinkDropdown
                  icon="gtp-socials"
                  label="Socials"
                  links={[
                    { icon: "ri:twitter-x-fill", label: "Twitter", href: `https://x.com/${projectMetadata.twitter}` },
                  ]}
                />
              )}
              {projectMetadata.main_github && (
                <GTPButton
                  size="sm"
                  leftIcon={"github" as GTPIconName}
                  label="Github"
                  clickHandler={() => window.open(projectMetadata.main_github ?? "", "_blank", "noopener,noreferrer")}
                />
              )}
              {projectMetadata.website && (
                <GTPButton
                  size="sm"
                  leftIcon="gtp-read"
                  label="Docs"
                  clickHandler={() => window.open(projectMetadata.website ?? "", "_blank", "noopener,noreferrer")}
                />
              )}
              {projectMetadata.website && (
                <GTPButton
                  size="sm"
                  leftIcon={"gtp-file-text" as GTPIconName}
                  label="Governance"
                  clickHandler={() => window.open(projectMetadata.website ?? "", "_blank", "noopener,noreferrer")}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});
AboutApp.displayName = "AboutApp";

// ─── Screenshots Section ──────────────────────────────────────────────────────

const ScreenshotsSection = memo(() => {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col w-full rounded-[15px] bg-color-bg-default xs:px-[30px] px-[15px] py-[15px] select-none">
      {/* Header: toggle + "Screenshots" */}
      <div
        className="flex items-center gap-x-[10px] cursor-pointer w-fit"
        onClick={() => setOpen((v) => !v)}
      >
        <GTPIcon
          icon="in-button-right-monochrome"
          size="sm"
          className="!size-[14px]"
          containerClassName={`!size-[26px] !flex !justify-center !items-center bg-color-bg-medium hover:bg-color-ui-hover rounded-[20px] transition-all duration-300 ${
            open ? "rotate-90" : "rotate-0"
          }`}
        />
        <div className="heading-large-md text-color-text-secondary">Screenshots</div>
      </div>

      {/* Collapsible body */}
      <div
        style={{
          maxHeight: open ? 300 : 0,
          paddingTop: open ? "12px" : 0,
          overflow: "hidden",
          opacity: open ? 1 : 0,
          transition: "max-height 0.35s ease-in-out, opacity 0.3s ease-in-out, padding-top 0.3s ease-in-out",
        }}
      >
        <div className="flex gap-x-[8px] h-[168px]">
          {FAKE_SCREENSHOTS.map((shot, i) => (
            <div
              key={i}
              className="rounded-[10px] overflow-hidden min-w-0 flex items-end"
              style={{
                flex: shot.flex,
                background: shot.bg,
              }}
            >
              {/* Ghost label for placeholder legibility */}
              <div className="w-full px-[10px] py-[8px] text-[11px] font-semibold text-white/60 truncate">
                {shot.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
ScreenshotsSection.displayName = "ScreenshotsSection";


const FeaturedSection = memo(({ owner_project, projectMetadata }: { owner_project: string, projectMetadata: ProjectMetadata }) => {
  return (
    <div className="flex w-full rounded-[15px] gap-x-[15px] select-none">
      {projectMetadata.features?.map((feature: string, i: number) => (
        <FeaturedCard key={i} feature={feature} />
      ))}
    </div>
  );
});


const FeaturedCard = memo(({ feature }: { feature: string }) => {
 
  return (
    <div className="flex w-full items-center justify-center h-[50px] rounded-[11px] bg-color-bg-default px-[13px] py-[5px] gap-x-[5px] select-none">
     
        <GTPIcon icon={`gtp:${feature}-logo-monochrome` as GTPIconName} className="!size-[24px]" containerClassName="!size-[24px] flex items-center justify-center"/>
        
        <div className="text-lg text-color-text-primary">
          {feature}
        </div>

    </div>
  );
});
FeaturedCard.displayName = "FeaturedCard";
FeaturedSection.displayName = "FeaturedSection";

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewContent = memo(({ data, owner_project, projectMetadata }: { data: ApplicationDetailsData, owner_project: string, projectMetadata: ProjectMetadata }) => {
  const { data: masterData } = useMaster();

  

  return (
    <div id="content-container" className="@container flex flex-col w-full gap-[15px]">
      <AboutApp data={data} owner_project={owner_project} projectMetadata={projectMetadata} />
      <ScreenshotsSection />
      <FeaturedSection owner_project={owner_project} projectMetadata={projectMetadata} />
      <div className="flex flex-col gap-y-[15px] pb-[10px]">
        <div className="flex items-center gap-x-[8px]">
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
      <div className="grid grid-flow-row grid-cols-1 @[995px]:grid-cols-[minmax(480px,505px)_minmax(505px,auto)] gap-[10px] items-start">
        {/* Left column: KPI side cards */}
        <div className="flex flex-col gap-y-[10px]">
          <PartitionLine title="Yesterday" />
          {Object.keys(data.kpi_cards).map((metric) => (
            <AppMetricCard 
              key={metric} 
              label={masterData?.app_metrics[metric].name ?? metric} 
              value={data.kpi_cards[metric].current_values.data[0]} 
              prevValue={data.kpi_cards[metric].wow_change.data[0]} 
              sparkline={data.kpi_cards[metric].sparkline.data.map((item: any) => item[1])} 
              color={"#627EEA"} 
              icon={masterData?.app_metrics[metric].icon_name as GTPIconName} 
            />
          ))} 
        </div>

        {/* Right column: main content */}
        <div className="flex flex-col gap-y-[10px]">
          <ChainActivityCard chains={FAKE_APP.chains} />
          <MostActiveContracts />
        
        </div>
      </div>
    </div>
  );
});
OverviewContent.displayName = "OverviewContent";

// ─── Metrics Tab ──────────────────────────────────────────────────────────────

const MetricsContent = memo(() => (
  <div className="flex flex-col gap-y-[15px]">
    <div className="flex flex-col w-full rounded-[15px] bg-color-bg-default xs:px-[30px] px-[15px] py-[15px] min-h-[400px] items-center justify-center gap-y-[10px]">
      <GTPIcon icon="gtp-fundamentals" size="lg" className="opacity-30" />
      <div className="heading-large-md opacity-50">Metrics</div>
      <div className="text-sm text-color-text-secondary text-center max-w-[400px]">
        Detailed on-chain metrics for this application will appear here.
      </div>
    </div>
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
    getHeader: (app: typeof FAKE_APP) => app.name,
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

export default function NewAppPage({
  params,
}: {
  params: Promise<{ app: string }>;
}) {
  use(params);
  const router = useRouter();
  const searchParams = useSearchParams();



  const { data, owner_project } = useApplicationDetailsData();
  const { ownerProjectToProjectData } = useProjectsMetadata();

  const projectMetadata = ownerProjectToProjectData[owner_project];

  const [selectedTab, setSelectedTab] = useState<string>(() => {
    return searchParams.get("tab") || "overview";
  });
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);


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
        return <OverviewContent data={data} owner_project={owner_project} projectMetadata={projectMetadata} />;
      case "metrics":
        return <MetricsContent />;
      case "user_insights":
        return <UserInsightsContent />;
      default:
        return <div className="p-8 text-center">Tab not found</div>;
    }
  }, [data, selectedTab, owner_project, projectMetadata]);


  console.log(projectMetadata)
  console.log(data)
  return (
    <>
    {owner_project && projectMetadata && (
    <Container className="flex flex-col gap-y-[15px] pt-[45px] md:pt-[30px] select-none">
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
              comingSoon={false}
              icon={tab.icon as GTPIconName}
              header={tab.getHeader(FAKE_APP)}
              index={index + 1}
              isHovered={hoveredTab === tab.key}
            />
          </div>
        ))}
      </SectionBar>

      {/* Tab content */}
      <div className={selectedTab !== "overview" ? "pt-[15px]" : ""}>
        {TabContent}
      </div>
    </Container>
    )}
    </>
  );
}

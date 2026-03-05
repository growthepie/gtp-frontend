"use client";
import { useState, memo, useMemo, use, useEffect } from "react";
import Container from "@/components/layout/Container";
import { SectionBar, SectionBarItem } from "@/components/SectionBar";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GTPButton } from "@/components/GTPButton/GTPButton";
import GTPButtonDropdown from "@/components/GTPButton/GTPButtonDropdown";
import AppMetricCard from "@/components/apps/AppMetricCard";

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
  const total = chains.reduce((sum, c) => sum + c.share, 0);

  return (
    <div className="flex flex-col w-full rounded-[15px] bg-color-bg-default xs:px-[30px] px-[15px] py-[15px] gap-y-[15px]">
      <div className="heading-large-md">Chain Activity</div>
      <div className="flex flex-col gap-y-[10px]">
        {chains.map((chain) => (
          <div key={chain.key} className="flex flex-col gap-y-[4px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-[8px]">
                <GTPIcon
                  icon={`gtp:${chain.key}-logo-monochrome` as GTPIconName}
                  size="sm"
                  containerClassName="!size-[20px] flex items-center justify-center"
                  style={{ color: chain.color }}
                />
                <div className="text-sm">{chain.name}</div>
              </div>
              <div className="text-sm text-color-text-secondary">
                {((chain.share / total) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="w-full h-[4px] rounded-full bg-color-bg-medium overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(chain.share / total) * 100}%`,
                  backgroundColor: chain.color,
                }}
              />
            </div>
          </div>
        ))}
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

const AboutApp = memo(({ app }: { app: typeof FAKE_APP }) => {
  const [open, setOpen] = useState(true);
  const total = app.chains.reduce((sum, c) => sum + c.share, 0);

  const firstContractFormatted = new Date(app.first_contract_date)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\//g, ".");

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
        <p className="text-sm pb-[15px]">{app.description}</p>

        {/* Metadata row */}
        <div className="flex flex-wrap items-start gap-x-[30px] gap-y-[12px]">

          {/* First Contract Seen */}
          <AppOverviewMetaCol label="First Contract Seen">
            {firstContractFormatted}
          </AppOverviewMetaCol>

          {/* Ecosystem Rank */}
          <AppOverviewMetaCol label="Ethereum Ecosystem Rank">
            #{app.ecosystem_rank} out of {app.ecosystem_total.toLocaleString()} apps
          </AppOverviewMetaCol>

          {/* Active on: icons + stacked bar */}
          <div className="flex flex-col gap-y-[4px] flex-1 min-w-[160px] max-w-[360px]">
            <div className="heading-xxs text-color-text-secondary">Active on</div>
            <div className="flex items-center gap-x-[4px]">
              {app.chains.map((chain) => (
                <GTPIcon
                  key={chain.key}
                  icon={`gtp:${chain.key}-logo-monochrome` as GTPIconName}
                  size="sm"
                  containerClassName="!size-[20px] flex items-center justify-center"
                  style={{ color: chain.color }}
                />
              ))}
            </div>
            <div className="flex h-[13px] w-full rounded-full overflow-hidden mt-[2px]">
              {app.chains.map((chain) => (
                <div
                  key={chain.key}
                  style={{
                    width: `${(chain.share / total) * 100}%`,
                    backgroundColor: chain.color,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Token */}
          <AppOverviewMetaCol label="Token">
            {app.token ?? "—"}
          </AppOverviewMetaCol>

          {/* Links */}
          <div className="flex flex-col gap-y-[4px]">
            <div className="heading-xxs text-color-text-secondary whitespace-nowrap">Links</div>
            <div className="flex flex-wrap items-center gap-[5px]">
              {app.links.website && (
                <GTPButton
                  size="sm"
                  leftIcon={"feather:globe" as GTPIconName}
                  label="Website"
                  clickHandler={() => window.open(app.links.website, "_blank", "noopener,noreferrer")}
                />
              )}
              {app.links.socials && Object.keys(app.links.socials).length > 0 && (
                <GTPButtonDropdown
                  buttonProps={{
                    size: "sm",
                    leftIcon: "gtp-socials",
                    rightIcon: "in-button-right-monochrome",
                    label: "Socials",
                  }}
                  matchTriggerWidthToDropdown={true}
                  openDirection="bottom"
                  
                  dropdownWidthClassName="w-[160px]"
                  dropdownContent={
                    <div className="flex flex-col gap-y-[2px] pb-[10px]">
                      {Object.entries(app.links.socials).map(([name, href]) => (
                        <Link
                          key={name}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center gap-x-[10px] justify-start text-sm font-semibold hover:bg-color-ui-hover px-[22px] py-[5px] transition-colors duration-200 whitespace-nowrap"
                        >
                          {name}
                        </Link>
                      ))}
                    </div>
                  }
                />
              )}
              {app.links.github && (
                <GTPButton
                  size="sm"
                  leftIcon={"github" as GTPIconName}
                  label="Github"
                  clickHandler={() => window.open(app.links.github, "_blank", "noopener,noreferrer")}
                />
              )}
              {app.links.docs && (
                <GTPButton
                  size="sm"
                  leftIcon="gtp-read"
                  label="Docs"
                  clickHandler={() => window.open(app.links.docs, "_blank", "noopener,noreferrer")}
                />
              )}
              {app.links.governance && (
                <GTPButton
                  size="sm"
                  leftIcon={"gtp-file-text" as GTPIconName}
                  label="Governance"
                  clickHandler={() => window.open(app.links.governance!, "_blank", "noopener,noreferrer")}
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


const FeaturedSection = memo(({ app }: { app: typeof FAKE_APP }) => {
  return (
    <div className="flex w-full rounded-[15px] gap-x-[15px] select-none">
      {Array.from({ length: 4 }).map((_, i) => (
        <FeaturedCard key={i} app={app} />
      ))}
    </div>
  );
});


const FeaturedCard = memo(({ app: _app }: { app: typeof FAKE_APP }) => {
  return (
    <div className="flex w-full items-center justify-center h-[50px] rounded-[11px] bg-color-bg-default px-[13px] py-[5px] gap-x-[5px] select-none">
     
        <GTPIcon icon="gtp-metrics-marketcap" className="!size-[24px]" containerClassName="!size-[24px] flex items-center justify-center"/>
        
        <div className="text-lg text-color-text-primary">
          Featured
        </div>

    </div>
  );
});
FeaturedCard.displayName = "FeaturedCard";
FeaturedSection.displayName = "FeaturedSection";

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewContent = memo(({ app }: { app: typeof FAKE_APP }) => {
  return (
    <div id="content-container" className="@container flex flex-col w-full gap-[15px]">
      <AboutApp app={app} />
      <ScreenshotsSection />
      <FeaturedSection app={app} />
      {/* Two-column grid: side cards left, main cards right */}
      <div className="grid grid-flow-row grid-cols-1 @[995px]:grid-cols-[minmax(480px,505px)_minmax(505px,auto)] gap-[10px] items-start">
        {/* Left column: KPI side cards */}
        <div className="flex flex-col gap-y-[10px]">
          <PartitionLine title="Yesterday" />
          {app.kpi_cards.map((card) => (
            <AppMetricCard
              key={card.key}
              label={card.label}
              icon={card.icon}
              value={card.value}
              prevValue={card.prev_value}
              prefix={card.prefix}
              suffix={card.suffix}
              sparkline={card.sparkline}
              color={app.accent_color}
            />
          ))}
          <PartitionLine />
        </div>

        {/* Right column: main content */}
        <div className="flex flex-col gap-y-[10px]">
          <ChainActivityCard chains={app.chains} />
          <PlaceholderCard title="Top Contracts" />
          <PlaceholderCard title="Related Applications" />
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
  // params.app will be used to fetch real app data once API is wired up
  use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // In a real implementation, app data would be fetched based on appSlug.
  // For now we use fake data regardless of the slug.
  const appData = FAKE_APP;

  const TabContent = useMemo(() => {
    switch (selectedTab) {
      case "overview":
        return <OverviewContent app={appData} />;
      case "metrics":
        return <MetricsContent />;
      case "user_insights":
        return <UserInsightsContent />;
      default:
        return <div className="p-8 text-center">Tab not found</div>;
    }
  }, [selectedTab, appData]);

  return (
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
              header={tab.getHeader(appData)}
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
  );
}

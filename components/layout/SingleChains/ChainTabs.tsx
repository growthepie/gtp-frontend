"use client";
import { ChainInfo } from "@/types/api/MasterResponse";
import { track } from "@/lib/tracking";
import { IS_PRODUCTION } from "@/lib/helpers";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { CascadingTabs, TabDef } from "@/components/layout/CascadingTabs"; // Import your new generic component
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";

const TAB_INFO = {
  "overview": {
    "header": "Overview",
    "icon": "gtp:gtp-overview",
  },
  "fundamentals": {
    "header": "Fundamentals",
    "icon": "gtp:gtp-fundamentals",
  },
  "quick_bites": {
    "header": "Quick Bites",
    "icon": "gtp:gtp-quick-bites",
  },
  "economics": {
    "header": "Economics",
    "icon": "gtp:gtp-metrics-economics",
  },
  "apps": {
    "header": "Apps",
    "icon": "gtp:gtp-project",
  },
  "blockspace": {
    "header": "Blockspace",
    "icon": "gtp:gtp-blockspace",
  },
  "user_insights": {
    "header": "User Insights",
    "icon": "gtp:gtp-users",
  }
}

// Tabs that should show a "NEW" badge. Add / remove ids here as tabs launch.
const NEW_TABS = new Set<string>([
  "user_insights",
]);

// Gradient pill used for "SOON" / "NEW" tags (matches legacy SectionBar styling).
const GradientTag = ({ label }: { label: string }) => (
  <div className="flex items-center py-[2px] px-[8px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full overflow-hidden">
    <div className="heading-small-xxxs text-nowrap text-background uppercase tracking-wide leading-none">
      {label}
    </div>
  </div>
);

// Pill containing the lock icon for "locked" tabs.
const LockTag = () => (
  <div className="flex items-center justify-center p-[3px] bg-color-bg-default rounded-full">
    <Icon icon="feather:lock" className="w-[12px] h-[12px]" />
  </div>
);

type ChainTabsProps = {
  chainInfo: ChainInfo;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  fillWidth?: boolean;
};

export default function ChainTabs({ chainInfo, selectedTab, setSelectedTab, fillWidth }: ChainTabsProps) {
  const { theme } = useTheme();

  const tabStatus = {
    ...chainInfo.tab_status,
    quick_bites: "active",
    ...(IS_PRODUCTION ? {} : { user_insights: "active" }),
  };

  // 1. Build the data array
  const tabsData: TabDef[] = Object.keys(tabStatus)
    .sort((a, b) => {
      const order: Record<string, number> = { active: 0, soon: 1, locked: 2 };
      return (order[tabStatus[a]] ?? 3) - (order[tabStatus[b]] ?? 3);
    })
    .map((tabId) => {
      const status = tabStatus[tabId];
      const isLocked = status === "locked";
      const isSoon = status === "soon";

      // Look up the specific icon and header from TAB_INFO
      const tabData = TAB_INFO[tabId] || { header: "Unknown", icon: "gtp:gtp-project" };

      const isDisabled = isLocked || isSoon;
      // Overview tab already uses the monochrome chain logo; other tabs swap
      // to their `-monochrome` variant when locked/soon for a muted look.
      const iconString = tabId === "overview"
        ? `gtp:${chainInfo.url_key}-logo-monochrome`
        : `${tabData.icon}${isDisabled ? "-monochrome" : ""}`;
      const iconColor = tabId === "overview" ? chainInfo.colors[theme ?? "dark"][0] : undefined;
      const header = tabId === "overview" ? chainInfo.name_short : tabData.header;

      // Create the accessory: gradient pill for soon/new, lock pill for locked.
      // Priority: locked > soon > new (active-but-new tabs still get a NEW badge).
      let accessory: React.ReactNode = null;
      if (isLocked) accessory = <LockTag />;
      else if (isSoon) accessory = <GradientTag label="SOON" />;
      else if (NEW_TABS.has(tabId)) accessory = <GradientTag label="NEW" />;

      // Explanatory tooltip on disabled tabs (matches legacy SectionBar copy).
      let disabledTooltip: React.ReactNode = null;
      if (isSoon) {
        disabledTooltip = (
          <div className="px-[15px] py-[5px]">
            This section is still in the works and will be released soon. Stay tuned!
          </div>
        );
      } else if (isLocked) {
        disabledTooltip = (
          <div className="px-[15px] py-[5px]">
            This section isn&apos;t available yet for this chain. Please reach out to our team for more information on how to unlock it.
          </div>
        );
      }

      return {
        id: tabId,
        label: header,
        isDisabled,
        fallbackW: 130, // Rough guess for SSR
        accessory: accessory,
        iconString: iconString,
        iconColor: iconColor,
        disabledTooltip,
      };
    });

  // 2. Handle the selection and tracking
  const handleTabChange = (tabId: string) => {
    track(`clicked chain tab ${tabId}`, {
      page: window.location.pathname,
      info: `${chainInfo.name.toLowerCase()}: ${tabId}`,
    });
    setSelectedTab(tabId);
  };

  // 3. Render the generic component
  return (
    <HorizontalScrollContainer includeMargin={false} hideScrollbar enableDragScroll>
    <CascadingTabs
      tabs={tabsData}
      selectedId={selectedTab}
      onChange={handleTabChange}
      fillWidth={fillWidth}
    />
    </HorizontalScrollContainer>
  );
}

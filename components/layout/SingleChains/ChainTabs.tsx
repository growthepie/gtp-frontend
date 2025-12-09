"use client"
import { SectionBar, SectionBarItem } from "@/components/SectionBar";
import { ChainInfo } from "@/types/api/MasterResponse";
import { useState } from "react";
import { track } from "@vercel/analytics/react";
import { IS_PRODUCTION } from "@/lib/helpers";

const TAB_INFO = {
    "overview": {
        "header": "Overview",
        "icon": "gtp:gtp-overview",
    },
    "fundamentals": {
        "header": "Fundamentals",
        "icon": "gtp:gtp-fundamentals",
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


export default function ChainTabs({ chainInfo, selectedTab, setSelectedTab }: { chainInfo: ChainInfo, selectedTab: string, setSelectedTab: (tab: string) => void }){
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);

    // add user_insights to chainInfo.tab_status if on DEV
    const tabStatus = {
        ...chainInfo.tab_status,
        ...(IS_PRODUCTION ? {} : { user_insights: "active" })
    }

    return(
        <SectionBar>
        {Object.keys(tabStatus)
            .sort((a, b) => {
            const statusOrder = { active: 0, soon: 1, locked: 2 };
            return (statusOrder[tabStatus[a]] ?? 3) - (statusOrder[tabStatus[b]] ?? 3);
            })
            .map((tab, index) => (
            <div
                key={tab}
                onClick={() => {
                    if (!(chainInfo.tab_status[tab] === "locked" || chainInfo.tab_status[tab] === "soon")) {
                        track(`clicked chain tab ${tab}`, {
                            page: window.location.pathname,
                            info: `${chainInfo.name.toLowerCase()}: ${tab}`
                        });
                        setSelectedTab(tab);
                    }
                }}
                onMouseEnter={() => setHoveredTab(tab)}
                onMouseLeave={() => setHoveredTab(null)}
            >
                <SectionBarItem
                    isSelected={selectedTab === tab}
                    isLocked={chainInfo.tab_status[tab] === "locked"}
                    comingSoon={chainInfo.tab_status[tab] === "soon"}
                    icon={tab === "overview" ? `gtp:${chainInfo.url_key}-logo-monochrome` : TAB_INFO[tab].icon}
                    header={tab === "overview" ? chainInfo.name_short : TAB_INFO[tab].header}
                    iconColor={tab === "overview" ? chainInfo.colors.dark[0] : undefined}
                    index={index + 1}
                    isHovered={hoveredTab === tab}
                />
            </div>
            ))}
        </SectionBar>
    )
}
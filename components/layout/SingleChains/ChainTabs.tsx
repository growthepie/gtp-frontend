"use client"
import { SectionBar, SectionBarItem } from "@/components/SectionBar";
import { ChainInfo } from "@/types/api/MasterResponse";
import { useState } from "react";
import { track } from "@vercel/analytics/react";

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
    }
}


export default function ChainTabs({ chainInfo, selectedTab, setSelectedTab }: { chainInfo: ChainInfo, selectedTab: string, setSelectedTab: (tab: string) => void }){
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);
    return(
        <SectionBar>
        {Object.keys(chainInfo.tab_status)
            .sort((a, b) => {
            const statusOrder = { active: 0, soon: 1, locked: 2 };
            return (statusOrder[chainInfo.tab_status[a]] ?? 3) - (statusOrder[chainInfo.tab_status[b]] ?? 3);
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
                    header={tab === "overview" ? chainInfo.name : TAB_INFO[tab].header}
                    iconColor={tab === "overview" ? chainInfo.colors.dark[0] : undefined}
                    index={index + 1}
                    isHovered={hoveredTab === tab}
                />
            </div>
            ))}
        </SectionBar>
    )
}
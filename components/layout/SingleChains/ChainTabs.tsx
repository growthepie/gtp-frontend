"use client"
import { SectionBar, SectionBarItem } from "@/components/SectionBar";
import { ChainInfo } from "@/types/api/MasterResponse";
import { useState } from "react";

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
        "icon": "gtp:economics",
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
    return(
        <SectionBar>
        {chainInfo.active_tabs.map((tab) => {
            return(
                <div key={tab} onClick={() => setSelectedTab(tab)}>
                    <SectionBarItem
                        isSelected={selectedTab === tab}
                        isLocked={false}
                        comingSoon={false}
                        icon={tab === "overview" ? `gtp:${chainInfo.url_key}-logo-monochrome` : TAB_INFO[tab].icon}
                        header={TAB_INFO[tab].header}
                        iconColor={tab === "overview" ? chainInfo.colors.dark[0] : undefined}
                    />
                </div>
            )
        })}
        </SectionBar>
    )
}
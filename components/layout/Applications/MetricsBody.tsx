import { GTPButton } from "@/components/GTPButton/GTPButton";
import { useTimespan } from "@/app/(layout)/applications/_contexts/TimespanContext";
import { useApplicationDetailsData } from "@/app/(layout)/applications/_contexts/ApplicationDetailsDataContext";
import { ProjectMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useTheme } from "next-themes";
import { GTPIcon } from "../GTPIcon";
import GTPButtonContainer from "@/components/GTPButton/GTPButtonContainer";
import GTPButtonRow from "@/components/GTPButton/GTPButtonRow";
import { useState } from "react";
type ApplicationDetailsData = ReturnType<typeof useApplicationDetailsData>["data"];

const INTERVALS = {
    hourly: {
        label: "Hourly",
        value: "hourly",
    },
    daily: {
        label: "Daily",
        value: "daily",
    },
    weekly: {
        label: "Weekly",
        value: "weekly",
    },
} as const;

export default function MetricsBody({ data, owner_project, projectMetadata }: { data: ApplicationDetailsData, owner_project: string, projectMetadata: ProjectMetadata }) {
    const { timespans, selectedTimespan, setSelectedTimespan } = useTimespan();
    const [selectedTotal, setSelectedTotal] = useState(false);
    const [timeInterval, setTimeInterval] = useState("hourly");
    const { AllChainsByKeys, data: master } = useMaster();
    const { theme } = useTheme();
    



    return (
        <div className="pt-[30px] w-full">
            <div className="w-full flex justify-between items-center  ">
                <div className="flex items-center gap-x-[5px] bg-color-bg-medium rounded-full pl-[15px] pr-[2px] py-[3px]">
                    <div className="text-sm ">Chains Selected</div>
                    <div className="flex items-center gap-x-[2px] border-color-bg-default border rounded-full ">
                    {Object.keys(projectMetadata.active_on ?? {}).map((chain) => {
                        const chainColor = AllChainsByKeys[chain]?.colors?.[theme ?? "dark"]?.[0];
                        return (
                            <GTPButton
                                key={chain}
                                label={AllChainsByKeys[chain]?.name_short}
                                leftIcon={`gtp:${AllChainsByKeys[chain]?.urlKey}-logo-monochrome` as GTPIconName}
                                leftIconStyle={{ color: chainColor }}
                                visualState="active"
                                size="md"
                            />
                        )
                    })}
                    </div>
                </div>
                <div className=" w-[261px] p-[5px] bg-color-bg-medium rounded-full flex items-center justify-between">
                    <GTPIcon icon="gtp-chevronleft-monochrome" containerClassName="!size-[34px] flex p-[5px] items-center justify-center" className="!size-[16px]" size="sm" />
                    <div className="flex flex-col items-center">
                        <div className="text-xxs">Compare</div>
                        <div className="flex items-center gap-x-[5px]">
                            <GTPIcon icon="gtp-compare" size="sm" />
                            <div className="heading-small-xs">App Name</div>
                        </div>

                    </div>
                    <GTPIcon icon="gtp-chevronright-monochrome" containerClassName="!size-[34px] flex p-[5px] items-center justify-center" className="!size-[16px]" size="sm" />
                </div>
            </div>
            <div className="pt-[10px] w-full">
                <GTPButtonContainer className="w-full flex flex-nowrap">         
                        <GTPButtonRow wrap={false} 
                            className="flex-nowrap"
                            style={{ width: "auto" }}
                        >
                            {Object.keys(INTERVALS).map((interval) => (
                                <GTPButton key={interval} label={INTERVALS[interval as keyof typeof INTERVALS].label} size="sm" variant="primary" isSelected={timeInterval === interval} clickHandler={() => setTimeInterval(interval)} />
                            ))}
                        </GTPButtonRow>
                    <div className="flex gap-x-[5px]" >
                        <GTPButtonRow wrap={false}
                            className="flex-nowrap"
                            style={{ width: "auto" }}
                        >
                            {Object.keys(timespans).filter((timespan) => !(timespan === "1d" || timespan === "7d" || timespan === "30d")).map((timespan) => (
                                <GTPButton key={timespan} label={timespans[timespan].label} size="sm" variant="primary" isSelected={selectedTimespan === timespan} clickHandler={() => setSelectedTimespan(timespan)} />
                            ))}
                        </GTPButtonRow>
                        <GTPButtonRow wrap={false}
                            className="flex-nowrap"
                            style={{ width: "auto" }}
                        >
                            <GTPButton label="Total" size="sm" variant="primary" isSelected={selectedTotal} clickHandler={() => setSelectedTotal(true)} />
                            <GTPButton label="By Chain" size="sm" variant="primary" isSelected={!selectedTotal} clickHandler={() => setSelectedTotal(false)} />
                        </GTPButtonRow>
                    </div>
                </GTPButtonContainer>

            </div>
        </div>
    )
}


const ChartArea = ({ data, owner_project, projectMetadata }: { data: ApplicationDetailsData, owner_project: string, projectMetadata: ProjectMetadata }) => {
    return (
        <div>
        </div>  
    );
}
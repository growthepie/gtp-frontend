"use client";
import Image from "next/image";
import { useApplicationsData } from "./ApplicationsDataContext";
import { useRouter } from "next/navigation";
import Icon from "@/components/layout/Icon";
import { useUIContext } from "@/contexts/UIContext";
import { useState } from "react";
import { delay } from "lodash";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";


type ApplicationIconProps = {
  owner_project: string;
  size: "sm" | "md" | "lg";
};

export const ApplicationIcon = ({ owner_project, size }: ApplicationIconProps) => {
  const {ownerProjectToProjectData} = useApplicationsData();
  const sizeClassMap = {
    sm: "w-[15px] h-[15px]",
    md: "w-[24px] h-[24px]",
    lg: "w-[36px] h-[36px]",
  };

  const sizePixelMap = {
    sm: 15,
    md: 24,
    lg: 36,
  };

  return (
    <div className={`select-none ${sizeClassMap[size]}`}>
      {ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].logo_path ? (
        <Image
          src={`https://api.growthepie.xyz/v1/apps/logos/${ownerProjectToProjectData[owner_project].logo_path}`}
          width={sizePixelMap[size]} height={sizePixelMap[size]}
          className="rounded-full select-none"
          alt={owner_project}
          onDragStart={(e) => e.preventDefault()}
          loading="eager"
          priority={true}
        />
      ) : (
        <div className={`${sizeClassMap[size]} bg-forest-950 rounded-full`}></div>
      )}
    </div>
  );
}

export const ApplicationDisplayName = ({ owner_project }: { owner_project: string }) => {
  const {ownerProjectToProjectData} = useApplicationsData();
  return ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].display_name : owner_project;
}

export const ApplicationDescription = ({ owner_project }: { owner_project: string }) => {
  const {ownerProjectToProjectData} = useApplicationsData();
  return ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].description : "";
}

export const BackButton = () => {
  const router = useRouter();
  return (
    <button className="size-[36px] bg-[#344240] rounded-full flex justify-center items-center" onClick={() => router.back()}>
      <Icon icon="feather:arrow-left" className="size-[26px]  text-[#CDD8D3]" />
    </button>
  );
}


export const MetricSelect = () => {
  const { selectedMetrics, setSelectedMetrics, metricsDef, sort, setSort} = useApplicationsData();
  const {isMobile, isSidebarOpen, toggleSidebar} = useUIContext();
  const [isOpen, setIsOpen] = useState(false);

  const metrics = Object.keys(metricsDef);

  const handleNextMetric = () => {
    const index = metrics.indexOf(selectedMetrics[0]);
    const newIndex = (index + 1) % metrics.length;

    if(sort.metric === selectedMetrics[0]){
      setSort({...sort, metric: metrics[newIndex]});
    }

    setSelectedMetrics([metrics[newIndex]]);
  }

  const handlePrevMetric = () => {
    const index = metrics.indexOf(selectedMetrics[0]);
    const newIndex = index === 0 ? metrics.length - 1 : index - 1;

    if(sort.metric === selectedMetrics[0]){
      setSort({...sort, metric: metrics[newIndex]});
    }

    setSelectedMetrics([metrics[newIndex]]);
  }



  return (
    <>
    <div className="flex flex-col relative h-full lg:h-[54px] w-full lg:w-[271px] -my-[1px]">
      <div
        className={`relative flex rounded-full h-full w-full lg:z-30 p-[5px] cursor-pointer ${
          isMobile ? "w-full" : "w-[271px]"
        }`}
        style={{
          backgroundColor: "#151A19",
        }}
      >
        <div
          className="rounded-[40px] w-[54px] h-[44px] bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[15] hover:cursor-pointer"
          onClick={handlePrevMetric}
        >
          <Icon icon="feather:arrow-left" className="w-6 h-6" />
        </div>
        <div
          className="flex flex-1 flex-col items-center justify-center  gap-y-[1px]"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          {/* <div
            className={`font-[500] leading-[150%] text-[12px]`}
          >
            {metricsDef[selectedMetrics[0]].name}
          </div> */}
          <div
            className={`flex font-[550] gap-x-[5px] justify-center items-center w-32`}
          >
            {/* {compChain && (
              <Icon
                icon={`gtp:${AllChainsByKeys[compChain].urlKey}-logo-monochrome`}
                className="w-[22px] h-[22px]"
              />
            )} */}
            <div className="text-sm overflow-ellipsis truncate whitespace-nowrap">
              {selectedMetrics.length > 1 ? "Multiple" : metricsDef[selectedMetrics[0]].name}
            </div>
          </div>
        </div>
        <div
          className="rounded-[40px] w-[54px] h-[44px] bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[15] hover:cursor-pointer"
          onClick={handleNextMetric}
          
        >
          <Icon icon="feather:arrow-right" className="w-6 h-6" />
        </div>
      </div>
      <div
        className={`flex flex-col relative lg:absolute lg:top-[27px] bottom-auto lg:left-0 lg:right-0 bg-forest-50 dark:bg-[#1F2726] rounded-t-none border-0 lg:border-b lg:border-l lg:border-r transition-all ease-in-out duration-300 ${
          isOpen
            ? `lg:z-[25] overflow-hidden border-transparent rounded-b-[30px] lg:border-forest-200 lg:dark:border-forest-500 lg:rounded-b-2xl lg:shadow-[0px_4px_46.2px_#00000066] lg:dark:shadow-[0px_4px_46.2px_#000000]`
            : "max-h-0 z-20 overflow-hidden border-transparent rounded-b-[22px]"
        } `}
        style={{
          maxHeight: isOpen ? `${metrics.length * 34 + 70}px` : "0px",
        }}
      >
        <div className="pb-[20px] lg:pb-[10px]">
          <div className="h-[10px] lg:h-[28px]"></div>
          {metrics.map((metric, index) => (
            <div
              className="flex px-[25px] py-[5px] gap-x-[15px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
              onClick={() => {
                setIsOpen(false);
                // delay(400).then(() =>
                //   setChainKey([chainKey[0], chain.key]),
                // );
                setSelectedMetrics((prev) => {
                  if (prev.includes(metric)) {
                    if(prev.length === 1) return prev;
                    return prev.filter((m) => m !== metric);
                  } else {
                    return [...prev, metric];
                  }
                });
              }}
              key={index}
            >
                <Icon
                  icon={selectedMetrics.includes(metric) ? "feather:check-circle" : "feather:circle"}
                  className="size-[15px]"
                />
                <GTPIcon
                  icon={(selectedMetrics.includes(metric) ? `${metricsDef[metric].icon}` : `${metricsDef[metric].icon}-monochrome`) as GTPIconName}
                  className="size-[24px] text-[#5A6462]"
                />
              <div>{metricsDef[metric].name}</div>
            </div>
          ))}
        </div>
      </div>
      {isOpen && (
        <div
          className={`hidden lg:block lg:fixed inset-0 z-20`}
          onClick={() => {
            setIsOpen(false);
          }}
        />
      )}
    </div>
    </>
  )
}
"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Icon from "@/components/layout/Icon";
import { useUIContext } from "@/contexts/UIContext";
import { memo, useEffect, useState } from "react";
import { delay } from "lodash";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import Link from "next/link";
import { useProjectsMetadata } from "../_contexts/ProjectsMetadataContext";
import Heading from "@/components/layout/Heading";
import { usePathname } from "next/navigation";
import Search from "./Search";
import Controls from "./Controls";
import { useMaster } from "@/contexts/MasterContext";
import { useApplicationsData } from "../_contexts/ApplicationsDataContext";


type ApplicationIconProps = {
  owner_project: string;
  size: "sm" | "md" | "lg";
};

export const PageTitle = ({ owner_project }: { owner_project: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  
  useEffect(() => {
    document.title = `${ownerProjectToProjectData[owner_project]?.display_name || owner_project} - growthepie`;
  }, [ownerProjectToProjectData, owner_project]);

  return null;
}

export const ApplicationIcon = ({ owner_project, size }: ApplicationIconProps) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const sizeClassMap = {
    sm: "size-[26px]",
    md: "size-[36px]",
    lg: "size-[46px]",
  };

  const sizePixelMap = {
    sm: 15,
    md: 24,
    lg: 36,
  };

  return (
    <div className={`flex items-center justify-center select-none bg-[#151A19] rounded-full ${sizeClassMap[size]}`}>
      {ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].logo_path ? (
        <Image
          src={`https://api.growthepie.xyz/v1/apps/logos/${ownerProjectToProjectData[owner_project].logo_path}`}
          width={sizePixelMap[size]} height={sizePixelMap[size]}
          className="select-none"
          alt={owner_project}
          onDragStart={(e) => e.preventDefault()}
          loading="eager"
          priority={true}
        />
      ) : (
        <div className={`${sizeClassMap[size]} bg-[#151A19] rounded-full`}></div>
      )}
    </div>
  );
}

export const PageTitleAndDescriptionAndControls = () => {
  const pathname = usePathname();
  const [urlOwnerProject, setUrlOwnerProject] = useState<string | null>(null);
  useEffect(() => {
    // console.log(window.location.pathname.split("/")[2]);
    // setUrlOwnerProject(window.location.pathname.split("/")[2]);
    setUrlOwnerProject(pathname.split("/")[2]);
  }, [pathname]);

  if(!urlOwnerProject) return (
    <>
      <div className="flex items-center h-[43px] gap-x-[8px] ">
        <GTPIcon icon="gtp-project" size="lg" />
        <Heading className="heading-large-xl" as="h1">
          Applications
        </Heading>
      </div>
      <div className="text-sm">
        An overview of the most used applications across the Ethereum ecosystem.
      </div>
      <Search />
      <Controls />
    </>
  );

  return (
    <>
      <div className="flex items-end gap-x-[10px]">
        <div className="flex flex-col flex-1 gap-y-[15px]">
          <div className="flex items-center h-[43px] gap-x-[8px]">
            <BackButton />
            <ApplicationIcon owner_project={urlOwnerProject} size="md" />
            <Heading className="heading-large-xl" as="h1">
              <ApplicationDisplayName owner_project={urlOwnerProject} />
            </Heading>
          </div>
        
          <div className="flex-1 text-sm font-medium">
            <ApplicationDescription owner_project={urlOwnerProject} />
            {/* Relay is a cross-chain payment system that enables instant, low-cost bridging and transaction execution by connecting users with relayers who act on their behalf for a small fee. It aims to minimize gas costs and execution latency, making it suitable for applications like payments, bridging, NFT minting, and gas abstraction. I can add one more sentence to that and its still legible. And one more maybe so that we reach 450 characters. Let’s see.  */}
          </div>
        </div>
        <ProjectDetailsLinks owner_project={urlOwnerProject} />
      </div>
      {/* <Search /> */}
      <Controls />
    </>
  );
}

export const ApplicationDisplayName = ({ owner_project }: { owner_project: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  return ownerProjectToProjectData[owner_project] ? ownerProjectToProjectData[owner_project].display_name : owner_project;
}

export const ApplicationDescription = ({ owner_project }: { owner_project: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  return ownerProjectToProjectData[owner_project] && ownerProjectToProjectData[owner_project].description ? ownerProjectToProjectData[owner_project].description : "Description not available";
}

export const BackButton = () => {
  const router = useRouter();
  return (
    <button className="size-[36px] bg-[#344240] rounded-full flex justify-center items-center" onClick={() => router.back()}>
      <Icon icon="feather:arrow-left" className="size-[26px]  text-[#CDD8D3]" />
    </button>
  );
}

export type MultipleSelectTopRowChildProps = {
  handleNext: () => void;
  handlePrev: () => void;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  options: {
    key: string;
    icon?: string;
    name: string;
  }[];
};
export const MultipleSelectTopRowChild = ({ handleNext, handlePrev, selected, setSelected, options }: MultipleSelectTopRowChildProps) => {
  const { isMobile } = useUIContext();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col relative lg:h-[44px] w-full lg:w-[300px]">
        <div
          className={`relative flex rounded-full h-[41px] md:h-full w-full lg:z-[5] p-[5px] cursor-pointer ${isMobile ? "w-full" : "w-[271px]"}`}
          style={{
            backgroundColor: "#344240",
          }}
        >
          <div
            className="rounded-[40px] w-[54px] h-full bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[2] hover:cursor-pointer"
            onClick={handlePrev}
          >
            <Icon icon="feather:arrow-left" className="w-6 h-6" />
          </div>
          <div
            className="flex flex-1 flex-col items-center justify-center  gap-y-[1px]"
            onClick={() => {
              setIsOpen(!isOpen);
            }}
          >
            <div className={`flex font-[550] gap-x-[5px] justify-center items-center w-32`}>
              <div className="text-sm overflow-ellipsis truncate whitespace-nowrap">
                {selected.length > 1 ? "Multiple" : options.find((option) => option.key === selected[0])?.name}
              </div>
            </div>
          </div>
          <div
            className="rounded-[40px] w-[54px] h-full bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[2] hover:cursor-pointer"
            onClick={handleNext}

          >
            <Icon icon="feather:arrow-right" className="w-6 h-6" />
          </div>
        </div>
        <div
          className={`flex flex-col relative lg:absolute lg:top-1/2 bottom-auto lg:left-0 lg:right-0 bg-forest-50 dark:bg-[#1F2726] rounded-t-none border-0 lg:border-b lg:border-l lg:border-r transition-all ease-in-out duration-300 ${isOpen
              ? `lg:z-[4] overflow-hidden border-transparent rounded-b-[30px] lg:border-forest-200 lg:dark:border-forest-500 lg:rounded-b-[22px] lg:shadow-[0px_4px_46.2px_#00000066] lg:dark:shadow-[0px_4px_46.2px_#000000]`
              : "max-h-0 z-[3] overflow-hidden border-transparent rounded-b-[22px]"
            } `}
          style={{
            maxHeight: isOpen ? `${options.length * 24 + (options.length - 1) * 10 + 37 + 16}px` : "0px",
          }}
        >
          <div className="pb-[20px] lg:pb-[16px]">
            <div className="h-[10px] lg:h-[37px]"></div>
            {options.map((opt, index) => (
              <div
                className="flex px-[25px] py-[5px] gap-x-[15px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
                onClick={() => {
                  setIsOpen(false);

                  setSelected((prev) => {
                    if (prev.includes(opt.key)) {
                      if (prev.length === 1) return prev;
                      return prev.filter((m) => m !== opt.key);
                    } else {
                      return [...prev, opt.key];
                    }
                  });
                }}
                key={index}
              >
                <Icon
                  icon={selected.includes(opt.key) ? "feather:check-circle" : "feather:circle"}
                  className="size-[15px]"
                />
                {opt.icon && (
                  <GTPIcon
                    icon={(selected.includes(opt.key) ? `${opt.icon}` : `${opt.icon}-monochrome`) as GTPIconName}
                    className="size-[24px] text-[#5A6462]"
                  />
                )}
                <div>{opt.name}</div>
              </div>
            ))}
          </div>
        </div>
        {isOpen && (
          <div
            className={`hidden lg:block lg:fixed inset-0 z-[3]`}
            onClick={() => {
              setIsOpen(false);
            }}
          />
        )}
      </div>
    </>
  )
}

export const ProjectDetailsLinks = memo(({ owner_project }: { owner_project: string }) => {
  "use client";
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const linkPrefixes = ["https://x.com/", "https://github.com/", "", ""];
  const icons = ["ri:twitter-x-fill", "ri:github-fill", "feather:monitor", "ri:discord-fill"];
  const keys = ["twitter", "main_github", "website", "discord"];

  return (
    <div className="flex items-center gap-x-[10px]">
      {ownerProjectToProjectData[owner_project] && keys.filter(
        (key) => ownerProjectToProjectData[owner_project][key]
      ).map((key, index) => (
        <Link
          key={key}
            href={`${linkPrefixes[index]}${ownerProjectToProjectData[owner_project][key]}`}
            target="_blank"
            className={`size-[54px] bg-[#1F2726] rounded-full flex justify-center items-center ${key=== "website" && "gap-x-[6px] px-[5px] w-fit"}`}
          >
            {key === "website" ? (
              <>
                {ownerProjectToProjectData[owner_project] && (
                  <ApplicationIcon owner_project={owner_project} size="md" />
                )}
                <div className="text-xxxs">{ownerProjectToProjectData[owner_project].display_name}</div>
                <div className="size-[24px] rounded-full bg-[#344240] flex justify-center items-center">
                  <Icon icon="feather:arrow-right" className="size-[17px] text-[#CDD8D3]" />
                </div>
              </>
            ) : (
            <Icon
              icon={icons[index]}
              className="size-[24px] select-none"
            />
            
        )}
        </Link>
      ))}
    </div>
  );
});

ProjectDetailsLinks.displayName = 'Links';

export const MetricTooltip = ({ metric }: { metric: string }) => {
  const content = {
    gas_fees: {
      title: "Gas Fees",
      content: "The total gas fees paid by all contracts in the selected timeframe across the selected chains.",
    },
    txcount: {
      title: "Transactions",
      content: "The total number of transactions in the selected timeframe across the selected chains.",
    },
    daa: {
      title: "Daily Active Addresses",
      content: "The total number of unique addresses that interacted with the contracts in the selected timeframe across the selected chains.",
    },
  }


  return (
    <div
      className="w-[238px] bg-[#1F2726] rounded-[15px] flex flex-col gap-y-[5px] px-[20px] py-[15px] transition-opacity duration-300"
      style={{
        boxShadow: "0px 0px 30px #000000",
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="heading-small-xs">{content[metric].title}</div>
      <div className="text-xs">
        {content[metric].content}
      </div>
    </div>
  );
}

export const Links = memo(({ owner_project }: { owner_project: string }) => {
  const { ownerProjectToProjectData } = useProjectsMetadata();
  const linkPrefixes = ["", "https://x.com/", "https://github.com/"];
  const icons = ["feather:monitor", "ri:twitter-x-fill", "ri:github-fill"];
  const keys = ["website", "twitter", "main_github"];

  return (
    <div className="flex items-center gap-x-[5px]">
      {ownerProjectToProjectData[owner_project] && keys.map((key, index) => (
        <div key={index} className="h-[15px] w-[15px]">
          {ownerProjectToProjectData[owner_project][key] && <Link
            href={`${linkPrefixes[index]}${ownerProjectToProjectData[owner_project][key]}`}
            target="_blank"
          >
            <Icon
              icon={icons[index]}
              className="w-[15px] h-[15px] select-none"
            />
          </Link>}
        </div>
      ))}
    </div>
  );
});

Links.displayName = 'Links';

export const Chains = ({ origin_keys }: { origin_keys: string[] }) => {
  const { AllChainsByKeys } = useMaster();
  const { selectedChains, setSelectedChains } = useApplicationsData();

  return (
    <div className="flex items-center gap-x-[5px]">
      {origin_keys.map((chain, index) => (
        <div
          key={index}
          className={`cursor-pointer ${selectedChains.includes(chain) ? '' : '!text-[#5A6462]'} hover:!text-inherit`} style={{ color: AllChainsByKeys[chain] ? AllChainsByKeys[chain].colors["dark"][0] : '' }}
          onClick={() => {
            if (selectedChains.includes(chain)) {
              setSelectedChains(selectedChains.filter((c) => c !== chain));
            } else {
              setSelectedChains([...selectedChains, chain]);
            }
          }}
        >
          {AllChainsByKeys[chain] && (
            // <GridTableChainIcon origin_key={AllChainsByKeys[chain].key} color={AllChainsByKeys[chain].colors["dark"][0]} />
            <Icon
              icon={`gtp:${AllChainsByKeys[
                chain
              ].urlKey
                }-logo-monochrome`}
              className="w-[15px] h-[15px]"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export const Category = ({ category }: { category: string }) => {
  const getGTPCategoryIcon = (category: string): GTPIconName | "" => {

    switch (category) {
      case "Cross-Chain":
        return "gtp-crosschain";
      case "Utility":
        return "gtp-utilities";
      case "Token Transfers":
        return "gtp-tokentransfers";
      case "DeFi":
        return "gtp-defi";
      case "Social":
        return "gtp-socials";
      case "NFT":
        return "gtp-nft";
      case "CeFi":
        return "gtp-cefi";
      default:
        return "";
    }
  }

  return (
    <div className="flex items-center gap-x-[5px] whitespace-nowrap">
      {/* <GTPIcon icon={getGTPCategoryIcon()} size="sm" /> */}
      {category && (
        <>
          <GTPIcon icon={getGTPCategoryIcon(category) as GTPIconName} size="sm" />
          {category}
        </>
      )}
    </div>
  );
}
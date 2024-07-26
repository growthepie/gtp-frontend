import Image from "next/image";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import Icon from "@/components/layout/Icon";
import EthUsdSwitch from "@/components/layout/EthUsdSwitch";

import Banner from "@/components/Banner";
import Notification from "@/components/Notification";
import HeaderLinks from "@/components/layout/HeaderLinks";
import { track } from "@vercel/analytics";
import LabelsContainer from "@/components/layout/LabelsContainer";
import Search from "./Search";
import { useUIContext } from "@/contexts/UIContext";
import { HomeIcon, SettingsIcon, DownloadIcon } from "./Icons";
import { useSessionStorage } from "usehooks-ts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/layout/Tooltip";

export default function FloatingBar({
  downloadCSV,
  downloadJSON,
}: {
  downloadCSV: () => void;
  downloadJSON: () => void;
}) {
  const { isMobile } = useUIContext();

  const [showDeploymentTx, setShowDeploymentTx] = useSessionStorage(
    "labels::showDeploymentTx",
    false
  );

  const [showDeployerAddress, setShowDeployerAddress] = useSessionStorage(
    "labels::showDeployerAddress",
    false
  );

  const [labelsNumberFiltered, setLabelsNumberFiltered] =
    useSessionStorage<number>("labelsNumberFiltered", 0);

  return (

    <div className="flex p-[5px] items-center w-full rounded-full mt-[16px] bg-[#344240]  shadow-[0px_0px_50px_0px_#000000] gap-x-[5px] md:gap-x-[15px] z-0 pointer-events-auto">
      <Link
        className="flex items-center bg-[#1F2726] gap-x-[10px] rounded-full p-[10px] gap"
        href="https://www.growthepie.xyz/"
        target="_blank"
      >
        <div className="w-6 h-6">
          <HomeIcon />
        </div>
      </Link>
      <Search />
      <div className="group relative w-fit z-50">
        <div className="cursor-pointer flex items-center bg-[#1F2726] gap-x-[10px] rounded-full py-[10px] pl-[10px] pr-[0px] lg:pl-[15px] lg:pr-[15px] gap font-medium transition-all duration-300">
          <div className="w-6 h-6">
            <SettingsIcon />
          </div>
          <div className="max-w-0 lg:max-w-[100px] group-hover:max-w-[100px] overflow-hidden transition-all duration-300">
            Settings
          </div>
        </div>
        <div className="relative max-h-0 w-0 lg:w-[125px] group-hover:w-[300px] group-hover:max-h-[200px] overflow-hidden transition-all duration-300" />
        <div className={`absolute bottom-4 md:bottom-auto md:top-4 right-0 bg-[#151A19] rounded-t-2xl md:rounded-b-2xl transition-all duration-300 overflow-hidden shadow-[0px_4px_46.2px_0px_#000000] w-[125px] max-h-0 group-hover:w-[300px] group-hover:max-h-[180px] -z-10`}>
          <div className={`pb-[50px] pt-[0px] md:pt-[30px] md:pb-[20px] flex flex-col`}>
            <div className="flex flex-col w-full">
              <div className="flex items-center w-full">
                <div className="flex flex-col gap-y-2 text-[12px] pt-[10px] w-full pl-[8px] pr-[15px]">
                  <div className="font-normal text-forest-500/50 text-right">
                    Columns
                  </div>
                  <div className="grid grid-cols-[125px,6px,auto] gap-x-[10px] items-center w-full  place-items-center whitespace-nowrap">
                    <div className="flex flex-1 items-center place-self-end">
                      <div className="font-semibold text-right pl-[8px]">
                        Deployer Address
                      </div>
                    </div>
                    <div className="rounded-full w-[6px] h-[6px] bg-[#344240]" />
                    <div
                      className="relative w-full h-[19px] rounded-full bg-[#CDD8D3] p-0.5 cursor-pointer text-[12px]"
                      onClick={() => {
                        track("toggled Deployer Address", {
                          location: isMobile ? "mobile labels menu bar" : "desktop labels menu bar",
                          page: window.location.pathname,
                        });
                        setShowDeployerAddress(!showDeployerAddress);
                      }}
                    >
                      <div className="w-full flex justify-between text-[#2D3748] relative bottom-[1px]">
                        <div className="w-full flex items-start justify-center">
                          Enabled
                        </div>
                        <div
                          className={`w-full text-center ${showDeployerAddress && "opacity-50"
                            }`}
                        >
                          Disabled
                        </div>
                      </div>
                      <div className="absolute inset-0 w-full p-[1.36px] rounded-full text-center">
                        <div
                          className="w-1/2 h-full bg-forest-50 dark:bg-forest-900 rounded-full flex items-center justify-center transition-transform duration-300"
                          style={{
                            transform: showDeployerAddress
                              ? "translateX(0%)"
                              : "translateX(100%)",
                          }}
                        >
                          {showDeployerAddress ? "Enabled" : "Disabled"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-[125px,6px,auto] gap-x-[10px] items-center w-full  place-items-center whitespace-nowrap">
                    <div className="flex flex-1 items-center place-self-end">
                      <div className="font-semibold text-right pl-[8px]">
                        Deployment Tx
                      </div>
                    </div>
                    <div className="rounded-full w-[6px] h-[6px] bg-[#344240]" />
                    <div
                      className="relative w-full h-[19px] rounded-full bg-[#CDD8D3] p-0.5 cursor-pointer text-[12px]"
                      onClick={() => {
                        track("toggled Deployment Tx", {
                          location: isMobile ? "mobile labels menu bar" : "desktop labels menu bar",
                          page: window.location.pathname,
                        });
                        setShowDeploymentTx(!showDeploymentTx);
                      }}
                    >
                      <div className="w-full flex justify-between text-[#2D3748] relative bottom-[1px]">
                        <div className="w-full flex items-start justify-center">
                          Enabled
                        </div>
                        <div
                          className={`w-full text-center ${showDeploymentTx && "opacity-50"
                            }`}
                        >
                          Disabled
                        </div>
                      </div>
                      <div className="absolute inset-0 w-full p-[1.36px] rounded-full text-center">
                        <div
                          className="w-1/2 h-full bg-forest-50 dark:bg-forest-900 rounded-full flex items-center justify-center transition-transform duration-300"
                          style={{
                            transform: showDeploymentTx
                              ? "translateX(0%)"
                              : "translateX(100%)",
                          }}
                        >
                          {showDeploymentTx ? "Enabled" : "Disabled"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* </div> */}
          </div>
        </div>
      </div>
      <div className={`group relative w-fit z-50 ${labelsNumberFiltered > 0 && labelsNumberFiltered <= 200 ? "hidden md:block" : "hidden md:block"}`}>
        <Tooltip allowInteract={true}>
          <TooltipTrigger className="w-full flex items-center justify-center">
            <div className={`cursor-pointer w-full ${labelsNumberFiltered > 0 && labelsNumberFiltered <= 200 ? "hidden md:flex" : "hidden md:flex"} items-center justify-center bg-[#1F2726] gap-x-[10px] rounded-full p-[10px] transition-all duration-300`}>
              <div className={`w-6 h-6 grayscale opacity-50 ${labelsNumberFiltered > 0 && labelsNumberFiltered <= 200 ? "!opacity-100 !grayscale-0" : ""}`}>
                <DownloadIcon />
              </div>
              {/* <div className={`w-0 ${labelsNumberFiltered > 0 && labelsNumberFiltered <= 200 && "group-hover:w-[96px]"} overflow-hidden transition-all duration-300`}>
                Download
              </div> */}
            </div>
          </TooltipTrigger>
          {(labelsNumberFiltered === 0 || labelsNumberFiltered >= 200) && (
            <TooltipContent className="p-[11px] text-xs bg-forest-1000 text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex flex-col z-[51]">
              <div>To use the export functionality, please filter down to 200 records or less.</div>
              <div className="">If you need access to more labels, reach out via our <Link
                rel="noopener"
                target="_blank"
                href="https://discord.com/channels/1070991734139531294/1095735245678067753"
                onClick={() => {
                  track("clicked Discord link (tooltip)", {
                    location: isMobile ? "mobile labels menu bar" : "desktop labels menu bar",
                    page: window.location.pathname,
                  });
                }}
                className="md:underline"
              >Discord
              </Link> for direct API access.</div>
            </TooltipContent>
          )}
        </Tooltip>
        <div className={`relative max-h-0 w-0 ${labelsNumberFiltered > 0 && labelsNumberFiltered <= 200 && "group-hover:flex group-hover:w-[90px] group-hover:max-h-[200px]"} overflow-hidden transition-all duration-300`} />
        <div className={`absolute bottom-0 md:bottom-auto md:top-4 right-0 bg-[#151A19] rounded-t-2xl md:rounded-b-2xl transition-all duration-300 overflow-hidden shadow-[0px_4px_46.2px_0px_#000000] !w-[0px] max-h-0 ${labelsNumberFiltered > 0 && labelsNumberFiltered <= 200 && "group-hover:!w-[90px] group-hover:max-h-[180px]"} -z-10`}>
          <div className={`pb-[50px] pt-[0px] md:pt-[30px] md:pb-[20px] flex flex-col`}>
            <div className="flex flex-col w-full">
              <div className="flex items-center w-full">
                <div className="flex flex-col gap-y-2 text-[12px] pt-[10px] w-full  text-right">
                  <div className="font-normal text-forest-500/50 text-right px-3.5">
                    Format
                  </div>
                  <div className="cursor-pointer whitespace-nowrap flex items-center gap-x-[10px] h-[32px] font-medium text-sm px-4 py-2 group-hover:w-full w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900" onClick={() => {
                    track("clicked Download JSON", {
                      location: isMobile ? "mobile labels menu bar" : "desktop labels menu bar",
                      page: window.location.pathname,
                    });
                    downloadJSON();
                  }}>
                    <div className="w-[15px] h-[15px]">
                      <Icon icon="feather:download" className="w-[15px] h-[15px]" />
                    </div>
                    <div className="flex flex-1 items-center justify-end text-sm font-semibold">
                      JSON
                    </div>
                  </div>
                  <div className="cursor-pointer whitespace-nowrap flex items-center gap-x-[10px] h-[32px] font-medium text-sm px-4 py-2 group-hover:w-full w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900" onClick={() => {
                    track("clicked Download CSV", {
                      location: isMobile ? "mobile labels menu bar" : "desktop labels menu bar",
                      page: window.location.pathname,
                    });
                    downloadCSV();
                  }}>
                    <div className="w-[15px] h-[15px]">
                      <Icon icon="feather:download" className="w-[15px] h-[15px]" />
                    </div>
                    <div className="flex flex-1 items-center justify-end text-sm font-semibold">
                      CSV
                    </div>

                  </div>
                </div>
              </div>
            </div>
            {/* </div> */}
          </div>
        </div>
      </div>
    </div>

  );
}

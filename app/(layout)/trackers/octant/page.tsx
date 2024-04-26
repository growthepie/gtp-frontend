"use client";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
// import { OctantTable } from "./OctantTable";
import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { EpochData } from "@/app/api/trackers/octant/route";
import ShowLoading from "@/components/layout/ShowLoading";

export default function Page() {
  // const {
  //   data: epochs,
  //   isLoading: epochsLoading,
  //   isValidating: epochsValidating,
  // } = useSWR<EpochData[]>("/api/trackers/octant");

  // use fetch to get data
  const [epochs, setEpochs] = useState<EpochData[] | null>(null);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/trackers/octant");
      const data = await response.json();
      setEpochs(data);
    }

    fetchData();
  }, []);

  const data = useMemo(() => {
    if (!epochs) return null;

    const now = Date.now();

    // console.log(epochs.map((epoch) => epoch.epoch));

    const currentEpochs = epochs.filter((epoch) => {
      // console.log(epoch.epoch, epoch.decisionWindow);
      if (!epoch.decisionWindow) return false;
      const decisionWindowNumber = new Date(epoch.decisionWindow).getTime();

      return now < decisionWindowNumber;
    });

    return currentEpochs[0];
  }, [epochs]);

  const [sortKey, setSortKey] = useState<string | null>("totalAllocated");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const onRowSort = useCallback(
    (a: any, b: any) => {
      if (sortKey) {
        const aValue = a[sortKey];
        const bValue = b[sortKey];
        if (aValue < bValue) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === "asc" ? 1 : -1;
        }
      }
      return 0;
    },
    [sortKey, sortDirection],
  );

  const sortedProjects = useMemo(() => {
    if (!data) return [];
    return data.projects.sort(onRowSort);
  }, [data, onRowSort]);

  const headers: {
    key: string;
    containerClassName?: string;
    cell: () => React.ReactNode;
    sortKey?: string;
  }[] = useMemo(() => {
    if (!data) return [];

    const handleSort = (key: string) => {
      if (sortKey === key) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortKey(key);
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      }
    };

    return [
      {
        key: "icon",

        cell: () => <div></div>,
      },
      {
        key: "rank",
        cell: () => <div></div>,
        sortKey: "rank",
      },
      {
        key: "name",
        cell: () => (
          <div
            className="flex relative cursor-pointer"
            onClick={() => handleSort("name")}
          >
            Project
            <div className="w-[10px] pt-0.5">
              <Icon
                icon="formkit:arrowdown"
                className={`w-[10px] h-[10px] transition duration-100 transform ${
                  sortKey !== "name" && "opacity-20"
                } ${
                  sortKey === "name" && sortDirection === "desc"
                    ? "rotate-180"
                    : ""
                }`}
              />
            </div>
          </div>
        ),
        sortKey: "name",
      },
      {
        key: "address",
        cell: () => (
          <div
            className="flex relative cursor-pointer"
            onClick={() => handleSort("address")}
          >
            Address
            <div className="w-[10px] pt-0.5">
              <Icon
                icon="formkit:arrowdown"
                className={`w-[10px] h-[10px] transition duration-100 transform ${
                  sortKey !== "address" && "opacity-20"
                } ${
                  sortKey === "address" && sortDirection === "desc"
                    ? "rotate-180"
                    : ""
                }`}
              />
            </div>
          </div>
        ),
        sortKey: "address",
      },

      {
        key: "donors",
        containerClassName: "flex justify-end text-right pr-6",
        cell: () => (
          <div
            className="relative flex justify-end text-right cursor-pointer"
            onClick={() => handleSort("donors")}
          >
            <div>Donors</div>
            <div className="w-[10px] pt-0.5">
              <Icon
                icon="formkit:arrowdown"
                className={`w-[10px] h-[10px] transition duration-100 transform ${
                  sortKey !== "donors" && "opacity-20"
                } ${
                  sortKey === "donors" && sortDirection === "desc"
                    ? "rotate-180"
                    : ""
                }`}
              />
            </div>
          </div>
        ),
        sortKey: "donors",
      },
      {
        key: "totalAllocated",
        containerClassName: "flex justify-end text-right pr-4",
        cell: () => (
          <div
            className="relative flex justify-end text-right cursor-pointer"
            onClick={() => handleSort("totalAllocated")}
          >
            <div>Donated</div>
            <div className="w-[10px] pt-0.5 leading-tight">
              <Icon
                icon="formkit:arrowdown"
                className={`w-[10px] h-[10px] transition duration-100 transform ${
                  sortKey !== "totalAllocated" && "opacity-20"
                } ${
                  sortKey === "totalAllocated" && sortDirection === "desc"
                    ? "rotate-180"
                    : ""
                }`}
              />
            </div>
          </div>
        ),
        sortKey: "totalAllocated",
      },
      {
        key: "rewardsThreshold",
        cell: () => (
          <div className="relative">
            <div className="relative -left-[8px] -bottom-[6px] text-forest-900/50 dark:text-forest-500/50 font-normal text-[0.7rem] whitespace-nowrap overflow-visible">
              {Math.abs(data.rewardsThreshold / 10 ** 18).toFixed(4)}{" "}
              <span className="text-[0.6rem] text-forest-900/20 dark:text-forest-500/30">
                ETH
              </span>
            </div>
            <div className="absolute h-2 w-1 border-t border-l border-forest-900/20 dark:border-forest-500/20 -left-[15px] -bottom-[6px]"></div>
          </div>
        ),
      },
      {
        key: "rewardsMatched",
        containerClassName: "flex justify-end text-right",
        cell: () => (
          <div
            className="relative pr-[15px] flex justify-end text-right cursor-pointer"
            onClick={() => handleSort("rewardsMatched")}
          >
            <div>Octant Match</div>
            <div className="w-[10px] pt-0.5">
              <Icon
                icon="formkit:arrowdown"
                className={`w-[10px] h-[10px] transition duration-100 transform ${
                  sortKey !== "rewardsMatched" && "opacity-20"
                } ${
                  sortKey === "rewardsMatched" && sortDirection === "desc"
                    ? "rotate-180"
                    : ""
                }`}
              />
            </div>
          </div>
        ),
        sortKey: "rewardsMatched",
      },
      {
        key: "rewardsTotal",
        containerClassName: "flex justify-end text-right",
        cell: () => (
          <div
            className="relative pr-[15px] flex justify-end text-right cursor-pointer"
            onClick={() => handleSort("rewardsTotal")}
          >
            <div>Total Rewards</div>
            <div className="w-[10px] pt-0.5">
              <Icon
                icon="formkit:arrowup"
                className={`w-[10px] h-[10px] transition duration-100 transform ${
                  sortKey !== "rewardsTotal" && "opacity-20"
                } ${
                  sortKey === "rewardsTotal" && sortDirection === "asc"
                    ? "rotate-180"
                    : ""
                }`}
              />
            </div>
          </div>
        ),
        sortKey: "rewardsTotal",
      },
    ];
  }, [data, sortDirection, sortKey]);

  return (
    <HorizontalScrollContainer>
      <div
        className="min-w-[900px] flex flex-col gap-y-[5px] transition-all duration-300"
        style={{ maxHeight: !data ? "calc(100vh - 550px)" : "2000px" }}
      >
        <div className="select-none grid grid-cols-[32px,16px,minmax(230px,800px),130px,80px,120px,40px,110px,105px] gap-x-[15px] px-[6px] pt-[30px] text-[11px] items-center font-bold">
          {headers.map((header) => (
            <div key={header.key} className={`${header.containerClassName}`}>
              {header.cell()}
            </div>
          ))}
        </div>
        {data ? (
          sortedProjects.map((project, index) => (
            <OctantTableRow data={data} projectIndex={index} key={index} />
          ))
        ) : (
          <div className="rounded-[30px] border border-forest-900/20 dark:border-forest-500/20  w-full max-w-[calc(100vw-100px)] h-[calc(100vh-450px)] flex items-center justify-center">
            <ShowLoading
              dataLoading={[true]}
              dataValidating={[false]}
              fullScreen={false}
              section={true}
            />
          </div>
        )}
      </div>
    </HorizontalScrollContainer>
  );
}
type TableRowProps = {
  data: EpochData;
  projectIndex: number;
};
const OctantTableRow = ({ data, projectIndex }: TableRowProps) => {
  const project = data.projects[projectIndex];
  return (
    <div className="grid grid-cols-[32px,16px,minmax(230px,800px),130px,80px,120px,40px,110px,105px] gap-x-[15px] rounded-full border border-forest-900/20 dark:border-forest-500/20 px-[6px] py-[5px] text-xs items-center">
      <div className="w-8 h-8 border border-forest-900/20 dark:border-forest-500/20 rounded-full overflow-hidden">
        <Image
          src={`https://ipfs.io/ipfs/${project.profileImageMedium}`}
          alt={project.name}
          width={32}
          height={32}
          className="rounded-full"
        />
      </div>
      <div className="text-[0.6rem] text-forest-900/80 dark:text-forest-500/80 font-light text-center">
        {project.rank + 1}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-forest-900 dark:text-forest-500 font-bold flex items-center gap-x-2">
          <Link
            className="w-4 h-4"
            href={project.website.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon
              icon="feather:external-link"
              className="w-4 h-4 text-forest-900/80 dark:text-forest-500/80"
            />
          </Link>
          <div>{project.name}</div>
        </div>

        <div className="border-2 rounded-md border-forest-900/20 dark:border-forest-500/20 p-0.5 hover:bg-forest-900/10 dark:hover:bg-forest-500/10  text-forest-900/80 dark:text-forest-500/80">
          <Link
            href={`https://octant.app/project/3/${project.address}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg className="w-3.5 h-3.5" data-test="Svg" viewBox="7 10 26 19">
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M 40 20 Z Z m -27.067 6.058 a 6.06 6.06 0 0 0 5.588 -3.715 a 9.095 9.095 0 0 0 7.854 6.697 c 0.78 0.08 0.929 -0.056 0.929 -0.9 v -3.62 c 0 -0.707 0.239 -1.491 1.371 -1.491 h 2.172 c 0.468 0 0.487 -0.01 0.752 -0.385 c 0 0 1.139 -1.59 1.365 -1.928 c 0.226 -0.338 0.203 -0.426 0 -0.716 S 31.6 18.106 31.6 18.106 c -0.266 -0.37 -0.288 -0.378 -0.752 -0.378 h -2.893 c -0.473 0 -0.65 0.252 -0.65 0.757 v 2.627 c 0 0.64 0 1.16 -0.93 1.16 c -1.35 0 -2.082 -1.017 -2.082 -2.272 c 0 -1.1 0.816 -2.227 2.083 -2.227 c 0.852 0 0.929 -0.204 0.929 -0.613 v -5.49 c 0 -0.72 -0.314 -0.773 -0.93 -0.71 a 9.095 9.095 0 0 0 -7.852 6.696 A 6.06 6.06 0 0 0 6.874 20 a 6.058 6.058 0 0 0 6.058 6.058 Z m 0 -4.039 a 2.02 2.02 0 1 0 0 -4.039 a 2.02 2.02 0 0 0 0 4.04 Z"
              ></path>
            </svg>
          </Link>
        </div>
      </div>
      <div>
        <Link
          rel="noopener noreferrer"
          target="_blank"
          href={`https://etherscan.io/address/${project.address}`}
          className={`rounded-full px-1 py-0 border border-forest-900/20 dark:border-forest-500/20 font-mono text-[10px text-forest-900/50 dark:text-forest-500/50 hover:bg-forest-900/10 dark:hover:bg-forest-500/10`}
        >
          <>{project.address.slice(0, 5) + "..." + project.address.slice(-8)}</>
        </Link>
      </div>

      <div className="flex justify-end item-center gap-x-2">
        <div className="flex items-center text-[0.9rem] font-medium leading-[1.2] font-inter">
          {project.donors}
        </div>
        <div className="w-[26px] h-[26px] flex items-center justify-center">
          {project.donors < 50 && (
            <Icon
              icon={"fluent:person-20-filled"}
              className="w-[18px] h-[18px] text-forest-900/30 dark:text-forest-500/30 fill-current"
            />
          )}
          {project.donors >= 50 && project.donors < 100 && (
            <Icon
              icon={"fluent:people-20-filled"}
              className="w-[23px] h-[23px] text-forest-900/30 dark:text-forest-500/30 fill-current"
            />
          )}
          {project.donors >= 100 && (
            <Icon
              icon={"fluent:people-community-20-filled"}
              className="w-[26px] h-[26px] text-forest-900/30 dark:text-forest-500/30 fill-current"
            />
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <div className="relative flex items-center gap-x-2 pr-0.5">
          <div className="text-[0.9rem] font-medium leading-[1.2] font-inter">
            {(project.totalAllocated / 10 ** 18).toFixed(4)}{" "}
            <span className="opacity-60 text-[0.55rem]">ETH</span>
          </div>
          {/* <div className="text-center absolute -bottom-[16px] left-0 right-0 text-forest-900/80 dark:text-forest-500/80 font-light text-[0.6rem] opacity-60">
              from{" "}
              <span className="font-semibold">
                {project.allocations &&
                  new Set(project.allocations.map((a) => a.donor)).size}
              </span>{" "}
              donors
            </div> */}
          <div className="w-4 h-4">
            <Icon
              icon="feather:check-square"
              className={`w-4 h-4  fill-current ${
                project.thresholdReached
                  ? "text-green-500 dark:text-green-500"
                  : "text-forest-900/80 dark:text-forest-600/80"
              }`}
            />
          </div>
          <div className="z-10 absolute -bottom-[6px] left-0 right-0 text-xs font-normal text-right h-[2px]">
            <div
              className="z-10 absolute"
              style={{
                height: "2px",
                width: `${
                  project.totalAllocated / data.rewardsThreshold < 1
                    ? 100
                    : (project.totalAllocated / data.rewardsThreshold) * 100
                }%`,
              }}
            >
              {project.totalAllocated / data.rewardsThreshold > 1 ? (
                <div className="flex w-full">
                  <div
                    className="bg-forest-900/80 dark:bg-[#b0bbb6]"
                    style={{
                      height: "2px",
                      width: `${
                        project.percentageThresholdOfTotalAllocated * 100.0
                      }%`,
                      // right with bases on bottom and right
                    }}
                  ></div>
                  <div className="h-[2px] flex-1">
                    <div
                      className="w-full"
                      style={{
                        height: "2px",
                        background:
                          "linear-gradient(to right, #b0bbb6ff, #b0bbb611, transparent)",
                        // right with bases on bottom and right
                      }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div
                  className=" bg-red-500 dark:bg-red-500"
                  style={{
                    height: "2px",
                    width: `${
                      (1 / project.percentageThresholdOfTotalAllocated) * 100
                    }%`,
                  }}
                ></div>
              )}
            </div>
            <div
              className="z-0 absolute bg-forest-900/30 dark:bg-forest-100/30"
              style={{
                height: "2px",
                width: `100%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="relative flex justify-start item-center gap-x-2">
        <div className="relative -left-[12px] -bottom-[2px] flex items-center text-forest-900/80 dark:text-forest-500/80 font-medium text-[0.6rem]">
          {(project.rewards.allocated / data.rewardsThreshold) * 100 > 100 ? (
            <div className="text-forest-500/60 dark:text-forest-500/60">
              +
              {(
                ((project.rewards.allocated - data.rewardsThreshold) /
                  data.rewardsThreshold) *
                100
              ).toFixed(0)}
              %
            </div>
          ) : (
            <div className="text-red-500/80">
              -
              {Math.abs(
                ((project.rewards.allocated - data.rewardsThreshold) /
                  data.rewardsThreshold) *
                  100,
              ).toFixed(0)}
              %
            </div>
          )}
        </div>
        <div className="absolute h-[10px] w-1 border-l border-forest-900/20 dark:border-forest-500/20 -left-[15px] -bottom-[13px]"></div>
      </div>

      <div className="flex justify-end pr-[25px]">
        <div
          className={`text-[0.9rem] font-medium leading-[1.2] font-inter ${
            project.rewards.matched <= 0 && "opacity-30"
          }`}
        >
          {(project.rewards.matched / 10 ** 18).toFixed(4)}{" "}
          <span className="opacity-60 text-[0.55rem]">ETH</span>
        </div>
      </div>
      <div className="flex justify-end pr-[25px]">
        <div
          className={`text-[0.9rem] font-medium leading-[1.2] font-inter ${
            project.rewards.total <= 0 && "opacity-30"
          }`}
        >
          {(project.rewards.total / 10 ** 18).toFixed(4)}{" "}
          <span className="opacity-60 text-[0.55rem]">ETH</span>
        </div>
      </div>
    </div>
  );
};

"use client";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
// import { OctantTable } from "./OctantTable";
import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import {
  EpochData,
  EpochProject,
  EpochState,
} from "@/app/api/trackers/octant/route";
import ShowLoading from "@/components/layout/ShowLoading";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/layout/Tooltip";
import Address from "@/components/layout/Address";
import moment from "moment";

type EpochsByProject = {
  [project: string]: EpochData[];
};

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

      // const byProject: EpochsByProject = {};

      // data.forEach((epoch) => {
      //   epoch.projects.forEach((project) => {
      //     if (!byProject[project.address]) {
      //       byProject[project.address] = [];
      //     }
      //     byProject[project.address].push(epoch);
      //   });
      // });

      // setEpochsByProject(byProject);
    }

    fetchData();
  }, []);

  const [latestAllocationEpoch, setLatestAllocationEpoch] =
    useState<EpochData | null>(null);
  const [currentEpoch, setCurrentEpoch] = useState<EpochData | null>(null);

  const data = useMemo<EpochData | null>(() => {
    if (!epochs) return null;

    const now = Date.now();
    //const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000;

    // console.log(epochs.map((epoch) => epoch.epoch));

    const currentEpochs = epochs.filter((epoch) => {
      // console.log(epoch.epoch, epoch.decisionWindow);
      if (!epoch.decisionWindow || !epoch.toTimestamp) return false;
      const toTime = new Date(epoch.toTimestamp).getTime();
      const decisionWindowNumber = new Date(epoch.decisionWindow).getTime();

      return now < decisionWindowNumber && now > toTime;
    });

    if (currentEpochs.length === 0) {
      // get the epoch with the decision window that passed most recently
      let latestEpoch;
      epochs
        .sort((a, b) =>
          a.decisionWindow && b.decisionWindow
            ? new Date(a.decisionWindow).getTime() -
            new Date(b.decisionWindow).getTime()
            : 0,
        )
        .forEach((epoch) => {
          if (!epoch.decisionWindow) return false;
          const decisionWindowNumber = new Date(epoch.decisionWindow).getTime();

          if (now > decisionWindowNumber) {
            latestEpoch = epoch;
          }
        });

      setCurrentEpoch(latestEpoch);
      setLatestAllocationEpoch(latestEpoch);

      return latestEpoch;
    }

    setCurrentEpoch(currentEpochs[0]);
    setLatestAllocationEpoch(currentEpochs[0]);

    return currentEpochs[0];
  }, [epochs]);

  // const currentEpoch = useMemo<EpochData | null>(() => {
  //   if (!epochs) return null;

  //   const now = Date.now();

  //   // console.log(epochs.map((epoch) => epoch.epoch));

  //   const currentEpochs = epochs.filter((epoch) => {
  //     // console.log(epoch.epoch, epoch.decisionWindow);
  //     if (!epoch.decisionWindow) return false;
  //     const decisionWindowNumber = new Date(epoch.decisionWindow).getTime();

  //     return now < decisionWindowNumber;
  //   });

  //   return currentEpochs[0];
  // }, [epochs]);

  const epochsByProject = useMemo<EpochsByProject | null>(() => {
    if (!epochs) return null;

    const byProject: EpochsByProject = {};

    epochs.forEach((epoch) => {
      epoch.projects.forEach((project) => {
        if (!byProject[project.address]) {
          byProject[project.address] = [];
        }
        byProject[project.address].push(epoch);
      });
    });

    return byProject;
  }, [epochs]);

  const allTimeTotalsByProject = useMemo(() => {
    if (!epochsByProject || !latestAllocationEpoch) return null;

    const totals: { [project: string]: number } = {};

    Object.keys(epochsByProject).forEach((projectAddress) => {
      const projectEpochs = epochsByProject[projectAddress];

      totals[projectAddress] = projectEpochs.reduce((acc, epoch) => {
        if (!epoch.projects || epoch.epoch > latestAllocationEpoch.epoch)
          return acc;

        const project = epoch.projects.find(
          (p) => p.address === projectAddress,
        );

        if (!project) return acc;

        return acc + project.rewardsTotal;
      }, 0);
    });

    return totals;
  }, [epochsByProject, latestAllocationEpoch]);

  const [sortKey, setSortKey] = useState<string | null>("totalAllocated");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const onRowSort = useCallback(
    (a: string, b: string) => {
      if (
        !sortKey ||
        !currentEpoch ||
        !epochsByProject ||
        !allTimeTotalsByProject
      )
        return 0;

      if (sortKey === "epochs") {
        const aEpochs = epochsByProject[a].map((e) => e.epoch).join();
        const bEpochs = epochsByProject[b].map((e) => e.epoch).join();

        if (aEpochs < bEpochs) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (aEpochs > bEpochs) {
          return sortDirection === "asc" ? 1 : -1;
        }

        return 0;
      }

      if (sortKey === "allTimeTotal") {
        if (allTimeTotalsByProject[a] < allTimeTotalsByProject[b]) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (allTimeTotalsByProject[a] > allTimeTotalsByProject[b]) {
          return sortDirection === "asc" ? 1 : -1;
        }

        return 0;
      }

      if (!data) return 0;

      const aCurrentEpochProject = currentEpoch.projects.find(
        (p) => p.address === a,
      );
      const aLastPresentEpochProject = epochsByProject[a][
        epochsByProject[a].length - 1
      ].projects.find((p) => p.address === a);

      const bCurrentEpochProject = currentEpoch.projects.find(
        (p) => p.address === b,
      );
      const bLastPresentEpochProject = epochsByProject[b][
        epochsByProject[b].length - 1
      ].projects.find((p) => p.address === b);

      if (["name", "address"].includes(sortKey)) {
        const aProject = aCurrentEpochProject
          ? aCurrentEpochProject
          : aLastPresentEpochProject;

        const bProject = bCurrentEpochProject
          ? bCurrentEpochProject
          : bLastPresentEpochProject;

        if (!aProject && !bProject) return 0;
        if (!aProject) return 1;
        if (!bProject) return -1;

        const aValue = aProject[sortKey];
        const bValue = bProject[sortKey];

        if (!aProject && !bProject) return 0;
        if (!aProject) return 1;
        if (!bProject) return -1;

        if (aValue.toLowerCase().localeCompare(bValue.toLowerCase()) < 0) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (aValue.toLowerCase().localeCompare(bValue.toLowerCase()) > 0) {
          return sortDirection === "asc" ? 1 : -1;
        }
        return 0;
      }

      const aProject = aCurrentEpochProject;
      const bProject = bCurrentEpochProject;

      if (!aProject && !bProject) return 0;
      if (!aProject) return 1;
      if (!bProject) return -1;

      const aValue = aProject[sortKey];
      const bValue = bProject[sortKey];

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    },
    [
      sortKey,
      currentEpoch,
      epochsByProject,
      data,
      sortDirection,
      allTimeTotalsByProject,
    ],
  );

  const TwentyPercentOfTotalMatched = useMemo(() => {
    if (!data) return 0;

    return (0.2 * Object.values(data.projects).map(p => p.rewardsMatched).reduce((acc, curr) => {
      return acc + curr;
    })) / 10 ** 18;
  }, [data]);

  const sortedProjects = useMemo(() => {
    if (!epochsByProject) return [];
    return Object.keys(epochsByProject).sort(onRowSort);
  }, [epochsByProject, onRowSort]);

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
                className={`w-[10px] h-[10px] transition duration-100 transform ${sortKey !== "name" && "opacity-20"
                  } ${sortKey === "name" && sortDirection === "asc"
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
            className="hidden lg:flex relative cursor-pointer"
            onClick={() => handleSort("address")}
          >
            Address
            <div className="w-[10px] pt-0.5">
              <Icon
                icon="formkit:arrowdown"
                className={`w-[10px] h-[10px] transition duration-100 transform ${sortKey !== "address" && "opacity-20"
                  } ${sortKey === "address" && sortDirection === "asc"
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
        key: "epochs",
        cell: () => (
          <div
            className="flex relative cursor-pointer"
            onClick={() => handleSort("epochs")}
          >
            Epoch History
            <div className="w-[10px] pt-0.5">
              <Icon
                icon="formkit:arrowdown"
                className={`w-[10px] h-[10px] transition duration-100 transform ${sortKey !== "epochs" && "opacity-20"
                  } ${sortKey === "epochs" && sortDirection === "asc"
                    ? "rotate-180"
                    : ""
                  }`}
              />
            </div>
          </div>
        ),
        sortKey: "epochs",
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
                className={`w-[10px] h-[10px] transition duration-100 transform ${sortKey !== "donors" && "opacity-20"
                  } ${sortKey === "donors" && sortDirection === "asc"
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
                className={`w-[10px] h-[10px] transition duration-100 transform ${sortKey !== "totalAllocated" && "opacity-20"
                  } ${sortKey === "totalAllocated" && sortDirection === "desc"
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
          <div className={`relative ${currentEpoch && currentEpoch.epoch >= 4 && "hidden"}`}>
            {currentEpoch && currentEpoch.epoch < 4 && (
              <>
                <div className="relative -left-[8px] -bottom-[6px] text-forest-900/50 dark:text-forest-500/50 font-normal text-[0.7rem] whitespace-nowrap overflow-visible">
                  {currentEpoch &&
                    (currentEpoch.epoch >= 4 ? TwentyPercentOfTotalMatched.toFixed(4) : Math.abs(currentEpoch.rewardsThreshold / 10 ** 18).toFixed(
                      4,
                    ))}{" "}
                  <span className="text-[0.6rem] text-forest-900/20 dark:text-forest-500/30">
                    ETH
                  </span>
                </div>
                <div className="absolute h-2 w-1 border-t border-l border-forest-900/20 dark:border-forest-500/20 -left-[15px] -bottom-[6px]"></div>
              </>
            )}
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
                className={`w-[10px] h-[10px] transition duration-100 transform ${sortKey !== "rewardsMatched" && "opacity-20"
                  } ${sortKey === "rewardsMatched" && sortDirection === "asc"
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
            <div>Epoch {currentEpoch?.epoch} Total</div>
            <div className="w-[10px] pt-0.5">
              <Icon
                icon="formkit:arrowdown"
                className={`w-[10px] h-[10px] transition duration-100 transform ${sortKey !== "rewardsTotal" && "opacity-20"
                  } ${sortKey === "rewardsTotal" && sortDirection === "asc"
                    ? "rotate-180"
                    : ""
                  }`}
              />
            </div>
          </div>
        ),
        sortKey: "rewardsTotal",
      },
      {
        key: "allTimeTotal",
        containerClassName: "flex justify-end text-right",
        cell: () => (
          <div
            className="relative pr-[15px] flex justify-end text-right cursor-pointer"
            onClick={() => handleSort("allTimeTotal")}
          >
            <div>All Time Total</div>
            <div className="w-[10px] pt-0.5">
              <Icon
                icon="formkit:arrowdown"
                className={`w-[10px] h-[10px] transition duration-100 transform ${sortKey !== "allTimeTotal" && "opacity-20"
                  } ${sortKey === "allTimeTotal" && sortDirection === "asc"
                    ? "rotate-180"
                    : ""
                  }`}
              />
            </div>
          </div>
        ),
        sortKey: "allTimeTotal",
      },
    ].filter((header) => header !== undefined) as {
      key: string;
      containerClassName?: string;
      cell: () => React.ReactNode;
      sortKey?: string;
    }[];
  }, [data, currentEpoch, sortKey, sortDirection, TwentyPercentOfTotalMatched]);

  // Countdown Timer for Decision Window
  const createTmer = useMemo(() => {
    if (!currentEpoch || !currentEpoch.decisionWindow) return Infinity;

    const decisionWindowNumber = new Date(
      currentEpoch.decisionWindow,
    ).getTime();
    const now = Date.now();

    return decisionWindowNumber - now;
  }, [currentEpoch]);

  // CountdownTimer that updates every 100ms
  const CountdownTimer = () => {
    const [timer, setTimer] = useState(createTmer);

    useEffect(() => {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 100);
      }, 100);

      return () => clearInterval(interval);
    }, []);

    // X days, X hours, X minutes, X seconds
    const timerReadable = useMemo(() => {
      return moment(timer).format("d [days], h [hours], m [minutes], s [seconds]");
    }, [timer]);

    if (!currentEpoch || !currentEpoch.decisionWindow) return null;

    if (timer === Infinity) return null;



    return (
      <div className="flex flex-row gap-x-2 items-center justify-start text-xs">
        <div className="font-medium">Epoch {currentEpoch?.epoch}</div>
        <div>—</div>
        <div className="flex items-center gap-x-2">

          {timer > 0 ? (
            <div className="flex items-center gap-x-2">
              <div className="w-4 h-4">
                <Icon
                  icon="fluent:hourglass-one-quarter-24-regular"
                  className="w-4 h-4"
                />
              </div>
              <div>
                {timerReadable}
                {/* {Math.floor(timer / (1000 * 60 * 60))
                  .toString()
                  .padStart(2, "0")}
                :
                {Math.floor((timer / (1000 * 60)) % 60)
                  .toString()
                  .padStart(2, "0")}
                :
                {Math.floor((timer / 1000) % 60)
                  .toString()
                  .padStart(2, "0")} */}
              </div>
            </div>
          ) : (
            <div className="flex gap-x-2">
              <div className="w-4 h-4">
                <Icon icon="feather:check" className="w-4 h-4" />
              </div>
              <div>Decision Window Closed</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <HorizontalScrollContainer>
      <CountdownTimer />

      {/* <div>sortedProjects: {sortedProjects.length}</div>
      <div>
        epochsByProject:{" "}
        {epochsByProject && Object.keys(epochsByProject).length}
      </div>
      {epochs && currentEpoch && (
        <div className="flex">
          <button
            className="rounded-md bg-forest-900/10 dark:bg-forest-500/10 text-forest-900/80 dark:text-forest-500/80"
            onClick={() => {
              const index = epochs.findIndex(
                (e) => e.epoch === currentEpoch.epoch,
              );
              setCurrentEpoch(epochs[index - 1]);
            }}
            disabled={currentEpoch && currentEpoch.epoch === 1}
          >
            Prev
          </button>
          <div className="flex gap-x-2">
            <div className="text-forest-900/80 dark:text-forest-500/80">
              {currentEpoch && currentEpoch.epoch}
            </div>
            <div className="text-forest-900/80 dark:text-forest-500/80">
              {epochs && epochs.length}
            </div>
          </div>
          <button
            className="rounded-md bg-forest-900/10 dark:bg-forest-500/10 text-forest-900/80 dark:text-forest-500/80"
            onClick={() => {
              const index = epochs.findIndex(
                (e) => e.epoch === currentEpoch.epoch,
              );
              setCurrentEpoch(epochs[index + 1]);
            }}
            disabled={currentEpoch && currentEpoch.epoch === epochs.length}
          >
            Next
          </button>
        </div>
      )} */}

      <div
        className="min-w-[900px] flex flex-col gap-y-[5px] transition-all duration-300"
        style={{ maxHeight: !data ? "calc(100vh - 550px)" : "5000px" }}
      >
        <div className={`select-none grid ${currentEpoch && (currentEpoch.epoch < 4 ? "grid-cols-[32px,16px,minmax(240px,800px),0px,130px,80px,120px,40px,110px,105px,120px] lg:grid-cols-[32px,16px,minmax(240px,800px),150px,130px,80px,120px,40px,110px,105px,120px]" : "grid-cols-[32px,16px,minmax(240px,800px),0px,130px,80px,120px,40px,110px,105px,120px] lg:grid-cols-[32px,16px,minmax(240px,800px),150px,130px,80px,120px,40px,110px,105px,120px]")} gap-x-[15px] px-[6px] pt-[30px] text-[11px] items-center font-bold`}>
          {headers.map((header) => (
            <div key={header.key} className={`${header.containerClassName}`}>
              {header.cell()}
            </div>
          ))}
        </div>
        {currentEpoch && epochsByProject && epochs && allTimeTotalsByProject ? (
          sortedProjects.map((address, index) => (
            <OctantTableRow
              key={index}
              currentEpoch={currentEpoch}
              projectAddress={address}
              projectIndex={index}
              epochsByProject={epochsByProject}
              allTimeTotalsByProject={allTimeTotalsByProject}
              epochs={epochs}
              setCurrentEpoch={setCurrentEpoch}
            />
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

const EpochTile = ({
  address,
  epochNumber,
  epochState,
  epoch,
  currentEpoch,
  setCurrentEpoch,
}: {
  address: string;
  epochNumber: number;
  epochState: EpochState;
  epoch: EpochData;
  currentEpoch: EpochData;
  setCurrentEpoch?: (epoch: EpochData) => void;
}) => {
  const project = epoch.projects.find((p) => p.address === address);

  if (!project) return <div className="w-2 h-2 bg-orange-500"></div>;

  return (
    <>
      {epochState === "PENDING" && (
        <div className="flex items-center justify-center w-6 h-6 border border-dashed border-gray-500 rounded-sm text-gray-500">
          <div>{epochNumber}</div>
          {/* <Icon icon="fluent:hourglass-top" className="w-4 h-4" /> */}
        </div>
      )}
      {epochState === "ACTIVE" && (
        <div className="flex items-center justify-center w-6 h-6 bg-gray-500/40 rounded-sm text-gray-100">
          <div>{epochNumber}</div>
          {/* <Icon icon="fluent:checkmark" className="w-4 h-4" /> */}
        </div>
      )}

      {["FINALIZED", "REWARD_ALLOCATION"].includes(epochState) && (
        <div
          className={`flex items-center justify-center w-6 h-6 opacity-80 ${currentEpoch.epoch === epoch.epoch
            ? project && project.thresholdReached
              ? "bg-green-500 text-green-50"
              : "bg-red-500 text-red-50"
            : project && project.thresholdReached
              ? "bg-green-500/10 text-green-500/50"
              : "bg-red-500/10 text-red-500/50"
            } rounded-sm cursor-pointer`}
          onClick={() => setCurrentEpoch && setCurrentEpoch(epoch)}
        >
          <div>{epochNumber}</div>
          {/* <Icon icon="fluent:checkmark" className="w-4 h-4" /> */}
        </div>
      )}
      {/* {epochState === "FINALIZED" && (
        <div
          className={`flex items-center justify-center w-6 h-6 ${
            project && project.thresholdReached
              ? "bg-green-500/10 text-green-500/50"
              : "bg-red-500/10 text-red-500/50"
          } rounded-sm cursor-pointer`}
          onClick={() => setCurrentEpoch && setCurrentEpoch(epoch)}
        >
          <div>{epochNumber}</div>
        </div>
      )} */}
    </>
  );
};

type TableRowProps = {
  currentEpoch: EpochData;
  projectAddress: string;
  projectIndex: number;
  epochsByProject: EpochsByProject;
  allTimeTotalsByProject: { [project: string]: number };
  epochs: EpochData[];
  setCurrentEpoch?: (epoch: EpochData) => void;
};

const OctantTableRow = ({
  currentEpoch,
  projectAddress,
  projectIndex,
  epochsByProject,
  allTimeTotalsByProject,
  epochs,
  setCurrentEpoch,
}: TableRowProps) => {
  // const project = data.projects[projectIndex];
  const currentEpochProject = currentEpoch.projects.find(
    (p) => p.address === projectAddress,
  );
  const lastPresentEpochProject = epochsByProject[projectAddress][
    epochsByProject[projectAddress].length - 1
  ].projects.find((p) => p.address === projectAddress);

  const project = currentEpochProject
    ? currentEpochProject
    : lastPresentEpochProject;

  //console.log("project", project);

  if (!project) return null;

  return (
    <div className={`grid ${currentEpoch && (currentEpoch.epoch < 4 ? "grid-cols-[32px,16px,minmax(240px,800px),0px,130px,80px,120px,40px,110px,105px,120px] lg:grid-cols-[32px,16px,minmax(240px,800px),150px,130px,80px,120px,40px,110px,105px,120px]" : "grid-cols-[32px,16px,minmax(240px,800px),0px,130px,80px,120px,40px,110px,105px,120px] lg:grid-cols-[32px,16px,minmax(240px,800px),150px,130px,80px,120px,40px,110px,105px,120px]")} gap-x-[15px] rounded-full border border-forest-900/20 dark:border-forest-500/20 px-[6px] py-[5px] text-xs items-center`}>
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
        {projectIndex + 1}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-forest-900 dark:text-forest-500 flex justify-between w-full pr-[20px]">
          <div className=" font-bold flex items-center gap-x-2">
            <Link
              className="w-4 h-4"
              href={project && project.website.url && project.website.url}
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
        </div>

        <div className="border-[1.5px] rounded-[3px] border-forest-900/60 dark:border-forest-500/60 p-0.5 hover:bg-forest-900/10 dark:hover:bg-forest-500/10  text-forest-900/60 dark:text-forest-500/60">
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

      <div className="flex justify-start items-center overflow-hidden">
        {/* <Link
          rel="noopener noreferrer"
          target="_blank"
          href={`https://etherscan.io/address/${project.address}`}
          className={`rounded-full px-1 py-0 border border-forest-900/20 dark:border-forest-500/20 font-mono text-[10px] text-forest-900/50 dark:text-forest-500/50 hover:bg-forest-900/10 dark:hover:bg-forest-500/10`}
        >
          <>{project.address.slice(0, 5) + "..." + project.address.slice(-8)}</>
        </Link> */}
        <Address address={project.address} shortenAddress={true} />
      </div>
      <div>
        <div className="flex gap-x-1.5 font-inter font-bold text-white/60 text-xs select-none">
          {epochsByProject[project.address] &&
            epochs.map((epoch, index) => {
              const isInEpoch = epochsByProject[project.address].find(
                (e) => e.epoch === epoch.epoch,
              );

              if (!isInEpoch)
                return <div key={index} className="w-6 h-6"></div>;
              return (
                <EpochTile
                  key={index}
                  address={project.address}
                  epochNumber={epoch.epoch}
                  epochState={epoch.state}
                  epoch={epoch}
                  currentEpoch={currentEpoch}
                  setCurrentEpoch={setCurrentEpoch}
                />
              );
            })}
        </div>
      </div>
      <div className="flex justify-end item-center gap-x-2">
        {currentEpochProject && (
          <Tooltip placement="left" allowInteract>
            <TooltipTrigger className="flex justify-end item-center gap-x-2">
              <div className="flex h-[26px] items-center text-[0.9rem] font-medium leading-[1] font-inter">
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
            </TooltipTrigger>
            <TooltipContent className="pr-2 z-50 flex items-center justify-center">
              <div className="flex flex-col gap-y-[5px] pl-3 pr-1 py-3 bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 items-between">
                <div className="font-semibold">Donors</div>
                <div className="flex flex-col gap-y-[2px] pr-[5px] max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-forest-900/30 dark:scrollbar-thumb-forest-500/30 scrollbar-track-forest-900/10 dark:scrollbar-track-forest-500/10 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                  {project.allocations
                    .sort((a, b) => parseInt(b.amount) - parseInt(a.amount))
                    .map((a, index) => (
                      <div
                        key={index}
                        className="rounded-full border border-forest-900/20 dark:border-forest-500/20 flex items-center gap-x-4 pr-[5px]"
                      >
                        <Address
                          address={`0x${a.donor.slice(2)}`}
                          shortenAddress={true}
                        />

                        <div className="font-normal font-inter text-[0.6rem]">
                          {(parseInt(a.amount) / 10 ** 18).toFixed(6)}{" "}
                          <span className="text-[0.5rem] opacity-60">ETH</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex justify-end">
        {currentEpochProject && (
          <div className="relative flex items-center gap-x-2 pr-0.5">
            <div className="text-[0.8rem] font-medium leading-[1.2] font-inter">
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
                className={`w-4 h-4  fill-current ${project.thresholdReached
                  ? "text-green-500 dark:text-green-500"
                  : "text-forest-900/80 dark:text-forest-600/80"
                  }`}
              />
            </div>
            <div className={`z-10 absolute -bottom-[6px] left-0 right-0 text-xs font-normal text-right h-[2px] ${currentEpoch && currentEpoch.epoch >= 4 && "hidden"}`}>
              <div
                className={`z-10 absolute`}
                style={{
                  height: "2px",
                  width: `${project.totalAllocated / currentEpoch.rewardsThreshold < 1
                    ? 100
                    : (project.totalAllocated /
                      currentEpoch.rewardsThreshold) *
                    100
                    }%`,
                }}
              >
                {project.totalAllocated / currentEpoch.rewardsThreshold > 1 ? (
                  <div className="flex w-full">
                    <div
                      className="bg-forest-900/80 dark:bg-[#b0bbb6]"
                      style={{
                        height: "2px",
                        width: `${project.percentageThresholdOfTotalAllocated * 100.0
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
                      width: `${(1 / project.percentageThresholdOfTotalAllocated) * 100
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
        )}
      </div>

      <div className={`relative flex justify-start item-center gap-x-2`}>
        {currentEpochProject && (
          <>
            <div className={`relative -left-[12px] -bottom-[2px] flex items-center text-forest-900/80 dark:text-forest-500/80 font-medium text-[0.6rem] ${currentEpoch && currentEpoch.epoch >= 4 && "hidden"}`}>
              {(project.rewards.allocated / currentEpoch.rewardsThreshold) *
                100 >
                100 ? (
                <div className="text-forest-500/60 dark:text-forest-500/60">
                  +
                  {(
                    ((project.rewards.allocated -
                      currentEpoch.rewardsThreshold) /
                      currentEpoch.rewardsThreshold) *
                    100
                  ).toFixed(0)}
                  %
                </div>
              ) : (
                <div className="text-red-500/80">
                  -
                  {Math.abs(
                    ((project.rewards.allocated -
                      currentEpoch.rewardsThreshold) /
                      currentEpoch.rewardsThreshold) *
                    100,
                  ).toFixed(0)}
                  %
                </div>
              )}
            </div>
            <div className={`absolute h-[10px] w-1 border-l border-forest-900/20 dark:border-forest-500/20 -left-[15px] -bottom-[13px] ${currentEpoch && currentEpoch.epoch >= 4 && "hidden"}`}></div>
          </>
        )}
      </div>

      <div className="flex justify-end pr-[25px]">
        {currentEpochProject && (
          <div
            className={`text-[0.8rem] font-medium leading-[1.2] font-inter ${currentEpochProject.rewards.matched <= 0 && "opacity-30"
              }`}
          >
            {(currentEpochProject.rewards.matched / 10 ** 18).toFixed(4)}{" "}
            <span className="opacity-60 text-[0.55rem]">ETH</span>
          </div>
        )}
      </div>
      <div className="flex justify-end pr-[25px]">
        {currentEpochProject && (
          <div
            className={`text-[0.8rem] font-medium leading-[1.2] font-inter ${currentEpochProject.rewards.total <= 0 && "opacity-30"
              }`}
          >
            {(currentEpochProject.rewards.total / 10 ** 18).toFixed(4)}{" "}
            <span className="opacity-60 text-[0.55rem]">ETH</span>
          </div>
        )}
      </div>
      <div className="flex justify-end pr-[25px]">
        <div
          className={`text-[0.9rem] font-bold leading-[1.2] font-inter ${allTimeTotalsByProject[projectAddress] <= 0 && "opacity-30"
            }`}
        >
          {(allTimeTotalsByProject[projectAddress] / 10 ** 18).toFixed(4)}{" "}
          <span className="opacity-60 text-[0.55rem] font-semibold">ETH</span>
        </div>
      </div>
    </div>
  );
};

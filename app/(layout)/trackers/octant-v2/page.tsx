"use client";
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer";
// import { OctantTable } from "./OctantTable";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
import Container from "@/components/layout/Container";
import { TopRowChild, TopRowContainer, TopRowParent } from "@/components/layout/TopRow";
import Heading from "@/components/layout/Heading";
import ChainSectionHead from "@/components/layout/SingleChains/ChainSectionHead";
import { track } from "@vercel/analytics/react";
import { useMediaQuery } from "usehooks-ts";
import ChainSectionHeadAlt from "@/components/layout/SingleChains/ChainSectionHeadAlt";
import { GridTableHeader, GridTableHeaderCell, GridTableRow } from "@/components/layout/GridTable";
import { set } from "lodash";
import UsersEpoch1 from "./octantv2_epoch_1.json";
import UsersEpoch2 from "./octantv2_epoch_2.json";
import UsersEpoch3 from "./octantv2_epoch_3.json";
import UsersEpoch4 from "./octantv2_epoch_4.json";
import UsersEpoch5 from "./octantv2_epoch_5.json";

import ProjectsMetadata1 from "./octantv2_projects_metadata_1.json";
import ProjectsMetadata2 from "./octantv2_projects_metadata_2.json";
import ProjectsMetadata3 from "./octantv2_projects_metadata_3.json";
import ProjectsMetadata4 from "./octantv2_projects_metadata_4.json";
import ProjectsMetadata5 from "./octantv2_projects_metadata_5.json";
import { p } from "million/dist/shared/million.485bbee4";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";

type EpochsByProject = {
  [project: string]: EpochData[];
};

export default function Page() {

  const LockStatus = { 'now': { 'total_locked_glm': 155763604.70812038, 'num_users_locked_glm': 1048 }, 'week_ago': { 'total_locked_glm': 155710758.2732818, 'num_users_locked_glm': 991 }, 'changes': { 'total_locked_glm_diff': 52846.434838563204, 'num_users_locked_glm_diff': 57, 'total_locked_glm_change': 0.0003393884624581592, 'num_users_locked_glm_change': 0.05751765893037336 } };

  const Epochs = [
    {
      epoch: 0,
      label: "All Epochs",
    },
    {
      epoch: 1,
      label: "Epoch 1",
    },
    {
      epoch: 2,
      label: "Epoch 2",
    },
    {
      epoch: 3,
      label: "Epoch 3",
    },
    {
      epoch: 4,
      label: "Epoch 4",
    },
    {
      epoch: 5,
      label: "Epoch 5",
    },
  ];

  const [communityEpoch, setCommunityEpoch] = useState(0);
  const [fundingEpoch, setFundingEpoch] = useState(0);

  const handlePrevCommunityEpoch = () => {
    if (communityEpoch === 0)
      setCommunityEpoch(Epochs.length - 1);
    else
      setCommunityEpoch(communityEpoch - 1);
  };

  const handleNextCommunityEpoch = () => {
    if (communityEpoch === 5)
      setCommunityEpoch(0);
    else
      setCommunityEpoch(communityEpoch + 1);
  };

  const handlePrevFundingEpoch = () => {
    if (fundingEpoch === 0)
      setFundingEpoch(Epochs.length - 1);
    else
      setFundingEpoch(fundingEpoch - 1);
  };

  const handleNextFundingEpoch = () => {
    if (fundingEpoch === 5)
      setFundingEpoch(0);
    else
      setFundingEpoch(fundingEpoch + 1);
  };


  const UserTypes = {
    All: {
      label: "All Users",
    },
    Donating: {
      label: "Donating Users",
    }
  }

  const [communityUserSelection, setCommunityUserSelection] = useState("All");

  const handleCommunityUserSelection = (userType: string) => {
    setCommunityUserSelection(userType);
  }

  const [communitySearch, setCommunitySearch] = useState("");

  const [communityTableSort, setCommunityTableSort] = useState({
    metric: "budget_amount",
    sortOrder: "desc",
  });

  const [communityRowsOpen, setCommunityRowsOpen] = useState<string[]>([]);

  const handleCommunityRowToggle = (user: string) => {
    if (communityRowsOpen.includes(user)) {
      setCommunityRowsOpen(communityRowsOpen.filter((u) => u !== user));
    } else {
      setCommunityRowsOpen([...communityRowsOpen, user]);
    }
  };

  type CommunityUsers = {
    user: string
    locked: number
    min: number
    max: number
    budget_amount: number
    allocation_amount: number
    project_count: number
    project_list: string[]
    // lastLocked?: number
  }[];

  const UserActiveSinceEpochData = useMemo(() => {
    const epochData = {
      "1": UsersEpoch1,
      "2": UsersEpoch2,
      "3": UsersEpoch3,
      "4": UsersEpoch4,
      "5": UsersEpoch5,
    };

    const data: { [user: string]: number } = {};

    // find out the first epoch that the user was active
    UsersEpoch1.forEach((user) => {
      data[user.user] = 1;
    });

    UsersEpoch2.forEach((user) => {
      if (!data[user.user]) data[user.user] = 2;

    });

    UsersEpoch3.forEach((user) => {
      if (!data[user.user]) data[user.user] = 3;
    });

    UsersEpoch4.forEach((user) => {
      if (!data[user.user]) data[user.user] = 4;

    });

    UsersEpoch5.forEach((user) => {
      if (!data[user.user]) data[user.user] = 5;
    });

    return data;

  }, []);





  const CommunityUsersData = useMemo<CommunityUsers>(() => {
    let data: CommunityUsers = [];
    if (communityEpoch === 0) {
      // sum locked, budget_amount, allocation_amount across all epochs for each user


      // copy the first epoch
      data = JSON.parse(JSON.stringify(UsersEpoch1)) as CommunityUsers;

      // for each user in the second epoch, add the values to the first epoch if the user already exists, otherwise add the user
      [...UsersEpoch2, ...UsersEpoch3, ...UsersEpoch4, ...UsersEpoch5].forEach((user) => {

        let existingUser = data.find((u) => u.user === user.user);
        if (existingUser) {

          existingUser.min = Math.min(existingUser.min, user.min);
          existingUser.max = Math.max(existingUser.max, user.max);
          // existingUser.lastLocked = user.locked;
          existingUser.locked = user.locked;
          existingUser.budget_amount += user.budget_amount;
          existingUser.allocation_amount += user.allocation_amount;
          existingUser.project_list = [...new Set([...existingUser.project_list, ...user.project_list])];
          existingUser.project_count = existingUser.project_list.length;
        }
        else {
          data.push(user);
        }
      });

      // if not array, set to empty array
      // if (!data) data = [];
    }
    if (communityEpoch === 1) {
      data = UsersEpoch1;
    }
    if (communityEpoch === 2) {
      data = UsersEpoch2;
    }
    if (communityEpoch === 3) {
      data = UsersEpoch3;
    }
    if (communityEpoch === 4) {
      data = UsersEpoch4;
    }
    if (communityEpoch === 5) {
      data = UsersEpoch5;
    }

    return data;

    // return data.filter((user) => {
    //   // return true if they have a budget amount to spend on rewards etc
    //   if (user.budget_amount > 0) return true;
    //   return false;
    // });



  }, [communityEpoch]);


  const CommunityUsersFiltered = useMemo<CommunityUsers>(() => {
    let data = [...CommunityUsersData.filter((user) => {
      if (communityUserSelection === "All") return true;
      if (communityUserSelection === "Donating") return user.allocation_amount > 0;
      return true;
    })];
    // sort the data
    data.sort((a, b) => {
      if (a[communityTableSort.metric] < b[communityTableSort.metric]) {
        return communityTableSort.sortOrder === "asc" ? -1 : 1;
      }
      if (a[communityTableSort.metric] > b[communityTableSort.metric]) {
        return communityTableSort.sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });

    // filter the data
    data = data.filter((user) => {
      if (communitySearch === "") return true;
      return user.user.toLowerCase().includes(communitySearch.toLowerCase());
    });

    return data;
  }, [CommunityUsersData, , communityTableSort, communitySearch, communityUserSelection]);


  type ProjectMetadataType = {
    [project_key: string]: {
      name: string
      introDescription: string
      profileImageSmall: string
      profileImageMedium: string
      profileImageLarge: string
      websiteLabel: string
      websiteUrl: string
      address: string
      cid: string
      id: string
      epoch: number
      project_key: string
    }
  };

  const ProjectsMetadata = useMemo<ProjectMetadataType>(() => {
    // combine all the projects metadata, use the latest epoch if there are duplicates
    let data: ProjectMetadataType = {};

    Object.values(ProjectsMetadata1).forEach((project) => {
      data[project.project_key] = project;
    });

    Object.values(ProjectsMetadata2).forEach((project) => {
      data[project.project_key] = project;
    });

    Object.values(ProjectsMetadata3).forEach((project) => {
      data[project.project_key] = project;
    });

    Object.values(ProjectsMetadata4).forEach((project) => {
      data[project.project_key] = project;
    });

    Object.values(ProjectsMetadata5).forEach((project) => {
      data[project.project_key] = project;
    });

    return data;
  }, []);

  // const {
  //   data: epochs,
  //   isLoading: epochsLoading,
  //   isValidating: epochsValidating,
  // } = useSWR<EpochData[]>("/api/trackers/octant");
  const isMobile = useMediaQuery("(max-width: 1024px)");
  // use fetch to get data
  const [epochs, setEpochs] = useState<EpochData[] | null>(null);

  useEffect(() => {
    async function fetchData() {
      // const response = await fetch("/api/trackers/octant/rounds");
      // const data: EpochData[] = await response.json();
      // setEpochs(data);

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

  const epochsByProjectName = useMemo<EpochsByProject | null>(() => {
    if (!epochs) return null;

    const byProjectName: EpochsByProject = {};

    epochs.forEach((epoch) => {
      epoch.projects.forEach((project) => {
        const lowerProjectName = project.name.toLowerCase();
        if (!byProjectName[lowerProjectName]) {
          byProjectName[lowerProjectName] = [];
        }
        byProjectName[lowerProjectName].push(epoch);
      });
    });

    return byProjectName;
  }, [epochs]);

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

  const allTimeTotalsByProjectName = useMemo(() => {
    if (!epochsByProjectName || !latestAllocationEpoch) return null;

    const totals: { [project: string]: number } = {};

    Object.keys(epochsByProjectName).forEach((projectName) => {
      console.log("projectName", projectName);

      const projectEpochs = epochsByProjectName[projectName];
      console.log("projectEpochs", projectEpochs);

      totals[projectName] = projectEpochs.reduce((acc, epoch) => {
        if (!epoch.projects || epoch.epoch > latestAllocationEpoch.epoch)
          return acc;

        const project = epoch.projects.find(
          (p) => p.name.toLowerCase() === projectName,
        );

        if (!project) return acc;

        return acc + project.rewardsTotal;
      }, 0);
    });

    return totals;
  }, [epochsByProjectName, latestAllocationEpoch]);

  const [sortKey, setSortKey] = useState<string | null>("rewardsMatched");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const onRowSort = useCallback(
    (a: string, b: string) => {
      if (
        !sortKey ||
        !currentEpoch ||
        !epochsByProjectName ||
        !allTimeTotalsByProjectName
      )
        return 0;

      if (sortKey === "epochs") {
        const aEpochs = epochsByProjectName[a].map((e) => e.epoch).join();
        const bEpochs = epochsByProjectName[b].map((e) => e.epoch).join();

        if (aEpochs < bEpochs) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (aEpochs > bEpochs) {
          return sortDirection === "asc" ? 1 : -1;
        }

        return 0;
      }

      if (sortKey === "allTimeTotal") {
        if (allTimeTotalsByProjectName[a] < allTimeTotalsByProjectName[b]) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (allTimeTotalsByProjectName[a] > allTimeTotalsByProjectName[b]) {
          return sortDirection === "asc" ? 1 : -1;
        }

        return 0;
      }

      if (!data) return 0;

      const aCurrentEpochProject = currentEpoch.projects.find(
        (p) => p.name.toLowerCase() === a,
      );
      const aLastPresentEpochProject = epochsByProjectName[a][
        epochsByProjectName[a].length - 1
      ].projects.find((p) => p.name.toLowerCase() === a);

      const bCurrentEpochProject = currentEpoch.projects.find(
        (p) => p.name.toLowerCase() === b,
      );
      const bLastPresentEpochProject = epochsByProjectName[b][
        epochsByProjectName[b].length - 1
      ].projects.find((p) => p.name.toLowerCase() === b);

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
      epochsByProjectName,
      data,
      sortDirection,
      allTimeTotalsByProjectName,
    ],
  );

  const TwentyPercentOfTotalMatched = useMemo(() => {
    if (!data) return 0;

    return (0.2 * Object.values(data.projects).map((p: any) => p.rewardsMatched).reduce((acc, curr) => {
      return acc + curr;
    })) / 10 ** 18;
  }, [data]);

  const sortedProjects = useMemo(() => {
    if (!epochsByProjectName) return [];
    return Object.keys(epochsByProjectName).sort(onRowSort);
  }, [epochsByProjectName, onRowSort]);

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
      if (timer === Infinity) return "";
      const days = Math.floor(timer / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timer / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((timer / (1000 * 60)) % 60);
      const seconds = Math.floor((timer / 1000) % 60);

      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, [timer]);


    const [currentEpochDecisionWindow, setCurrentEpochDecisionWindow] =
      useState<Date | null>(null);

    const [currentEpochDecisionWindowText, setCurrentEpochDecisionWindowText] = useState<string | null>(null);

    useEffect(() => {
      const toTs = new Date(currentEpoch?.toTimestamp || 0);
      // subtract 14 days from the end of the epoch
      const decisionWindowStart = toTs;
      const decisionWindowEnd = new Date(toTs.getTime() + 14 * 24 * 60 * 60 * 1000);
      const now = new Date();

      // if we're within 14 days of the end of the epoch, set the decision window text to the countdown timer
      if (now > decisionWindowStart && now < decisionWindowEnd) {
        setCurrentEpochDecisionWindowText(`Ends in ${timerReadable}`);
      }
      else if (now < decisionWindowStart) {
        setCurrentEpochDecisionWindowText(`Starts ${decisionWindowStart.toLocaleString("en-GB", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
        })}`);
      }
      else if (now > decisionWindowEnd) {
        setCurrentEpochDecisionWindowText(`Ended ${decisionWindowEnd.toLocaleString("en-GB", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
        })}`);
      }


      setCurrentEpochDecisionWindow(decisionWindowStart);

    }, [timer, timerReadable]);

    if (!currentEpoch || !currentEpoch.decisionWindow) return null;

    if (timer === Infinity) return null;



    return (
      <>

        <TopRowContainer className="!p-0">
          {/* <TopRowParent className="!justify-stretch"> */}
          <div className="flex flex-col relative h-full lg:h-[54px] w-full">
            <div
              className={`relative flex rounded-[15px] lg:rounded-full h-full w-full lg:z-30 p-[3px] lg:p-[5px]  dark:bg-forest-50`}
            >
              <div
                className="rounded-[15px] lg:rounded-[40px] w-[32px] h-[28px] lg:w-[54px] lg:h-[44px] bg-forest-50  dark:bg-[#1F2726]  flex items-center justify-center z-[15] hover:cursor-pointer"
                onClick={() => {
                  if (!epochs) return;
                  const currentEpochIndex = epochs.findIndex(
                    (epoch) => epoch.epoch === currentEpoch.epoch,
                  );

                  if (currentEpochIndex === 0)
                    setCurrentEpoch(epochs[epochs.length - 1]);
                  else {
                    setCurrentEpoch(epochs[currentEpochIndex - 1]);
                  }
                }}
              >
                <Icon icon="feather:arrow-left" className="w-6 h-6" />
              </div>
              <div className="flex lg:flex-col items-end justify-center lg:items-center gap-x-[5px] w-full py-1 leading-[1]">
                <div className="text-forest-1000 text-[20px] lg:text-[16px]">
                  Epoch
                </div>
                <div className="text-forest-1000 text-[20px] lg:text-[24px] font-semibold">
                  {currentEpoch.epoch}
                </div>
              </div>
              <div
                className="rounded-[15px] lg:rounded-[40px] w-[32px] h-[28px] lg:w-[54px] lg:h-[44px] bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[15] hover:cursor-pointer"
                onClick={() => {
                  if (!epochs) return;
                  const currentEpochIndex = epochs.findIndex(
                    (epoch) => epoch.epoch === currentEpoch.epoch,
                  );

                  if (currentEpochIndex === epochs.length - 1)
                    setCurrentEpoch(epochs[0]);
                  else {
                    setCurrentEpoch(epochs[currentEpochIndex + 1]);
                  }
                }}
              >
                <Icon icon="feather:arrow-right" className="w-6 h-6" />
              </div>
            </div >
          </div >
          <div className="flex items-center justify-center lg:justify-end gap-x-2 text-forest-300 w-full py-[5px] px-[20px] lg:py-0">
            {timer > 0 ? (
              <div className="flex flex-col items-center lg:items-end gap-y-1">
                <div className="text-forest-300 text-xs">
                  {"Decision Window"}
                </div>
                <div className="flex items-center gap-x-2 text-forest-500 text-xs font-semibold">
                  <div className="w-4 h-4">
                    <Icon
                      icon="fluent:hourglass-one-quarter-24-regular"
                      className="w-4 h-4"
                    />
                  </div>
                  <div>
                    {currentEpochDecisionWindowText}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center lg:items-end gap-y-1">
                <div className="text-forest-300 text-xs">
                  {timer > 60 * 60 * 24 * 14 ? "Next Epoch" : "Decision Window"}
                </div>
                <div className="flex items-center justify-center lg:justify-end gap-x-2 text-forest-500 text-xs font-semibold">
                  <div className="w-4 h-4">
                    <Icon icon="feather:check" className="w-4 h-4" />
                  </div>
                  <div>{currentEpochDecisionWindowText}</div>
                </div>
              </div>
            )}
          </div>
          {/* </TopRowParent> */}
        </TopRowContainer >

        < div className="flex flex-row gap-x-2 items-center justify-start text-xs" >

        </div >
      </>
    );
  };

  const JumpToSections = {
    Community: {
      label: "Community",
      icon: "gtp:gtp-users",
      id: "community",
      ref: useRef<HTMLDivElement>(null),
    },
    ProjectFunding: {
      label: "Project Funding",
      icon: "gtp:gtp-project-funding",
      id: "project-funding",
      ref: useRef<HTMLDivElement>(null),
    },
    Fundamentals: {
      label: "Fundamentals",
      icon: "gtp:gtp-fundamentals",
      id: "fundamentals",
      ref: useRef<HTMLDivElement>(null),
    },
    Blockspace: {
      label: "Blockspace",
      icon: "gtp:gtp-package",
      id: "blockspace",
      ref: useRef<HTMLDivElement>(null),
    },
  };


  type ExpandingButtonMenuProps = {
    button: {
      label: string;
      icon: string;
      showIconBackground?: boolean;
      animateIcon?: boolean;
    };
    items: {
      label: string;
      icon: string;
      href: string;
    }[];
    className?: string;
  };


  const ExpandingButtonMenu = ({
    button,
    items,
    className,
  }: ExpandingButtonMenuProps) => {
    return (
      <div
        className={`absolute delay-0 hover:delay-300 group/jump flex flex-col cursor-pointer hover:top-[10px] hover:left-[5px] hover:right-[5px] transition-all duration-300 ${className}`}
      >
        <div
          className="!z-[15] group-hover/jump:!z-[25] transition-[z-index] delay-100 group-hover/jump:delay-0 w-full flex items-center h-[36px] gap-x-[8px] pl-[6px] pr-[10px] rounded-full dark:bg-[#263130] bg-forest-50"
          onMouseEnter={() => {
            track(`hovered ${button.label} button`, {
              location: isMobile ? `mobile Chain page` : `desktop Chain page`,
              page: window.location.pathname,
            });
          }}
        >
          <div
            className={`${button.showIconBackground &&
              "bg-white dark:bg-forest-1000 relative "
              } rounded-full w-[25px] h-[25px] p-[5px]`}
          >
            <Icon
              icon={button.icon}
              className={`w-[15px] h-[15px] ${button.animateIcon &&
                "transition-transform duration-300 transform delay-0 group-hover/jump:delay-300 group-hover/jump:rotate-90"
                }`}
            />
            <Icon
              icon={"gtp:circle-arrow"}
              className={`w-[4px] h-[9px] absolute top-2 right-0 transition-transform delay-0 group-hover/jump:delay-300 duration-500 group-hover/jump:rotate-90 ${button.showIconBackground ? "block" : "hidden"
                }`}
              style={{
                transformOrigin: "-8px 4px",
              }}
            />
          </div>
          <div className="whitespace-nowrap text-[14px] font-semibold lg:leading-normal leading-tight">
            {button.label}
          </div>
        </div>
        <div className="absolute !z-[11] group-hover/jump:!z-[21] delay-0 group-hover/jump:delay-300 overflow-hidden whitespace-nowrap  max-h-0 transition-all duration-300 left-0 right-0 top-[16px] bg-white dark:bg-[#151A19] pb-[0px] rounded-b-[22px] group-hover/jump:max-h-[300px] group-hover/jump:pt-[24px] group-hover/jump:pb-[10px] group-hover/jump:shadow-lg group-hover/jump:dark:shadow-[0px_4px_46.2px_0px_#000000]">
          {items.map((item: { label: string; icon: string; href: string }) => (
            <Link
              href={item.href}
              key={item.label}
              rel="noreferrer"
              target="_blank"
              onClick={(e) => {
                track(`clicked ${item.label} link`, {
                  location: isMobile
                    ? `mobile Chain page`
                    : `desktop Chain page`,
                  page: window.location.pathname,
                });
                if (item.href.startsWith("#")) {
                  e.preventDefault();
                  document.querySelector(item.href)?.scrollIntoView({
                    behavior: "smooth",
                  });
                }
              }}
              className="whitespace-nowrap flex items-center gap-x-[10px] h-[32px] font-medium text-sm px-4 py-2 group-hover:w-full w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
            >
              <div className="w-4 h-4">
                <Icon icon={item.icon} className="w-4 h-4" />
              </div>
              <div>{item.label}</div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Container className="flex w-full" isPageRoot>
        <div className="flex flex-col w-full">
          <div className="w-full flex flex-col lg:flex-row gap-x-[5px] gap-y-[5px] bg-clip-content pb-[30px] md:pb-[60px]">
            <div className="relative flex lg:col-auto lg:w-[253px] lg:basis-[253px]">
              <ChainSectionHead
                title={"Menu"}
                enableDropdown={false}
                defaultDropdown={true}
                childrenHeight={isMobile ? 97 : 111}
                className="transition-all duration-300 w-full lg:!w-[253px]"
              >
                <div className="relative h-[97px] lg:h-[111px] flex gap-x-[10px] px-[5px] py-[10px] rounded-[15px] bg-forest-50 dark:bg-[#1F2726] overflow-visible select-none">
                  <div className="flex flex-col justify-between gap-y-[10px] min-w-[120px] ">
                    <ExpandingButtonMenu
                      className={`left-[5px] top-[10px] lg:top-[10px] right-[calc((100%/2)+5px)] lg:right-[120px]`}
                      button={{
                        label: "Jump to …",
                        icon: "gtp:gtp-jump-to-section",
                        showIconBackground: true,
                      }}
                      items={
                        [
                          {
                            label: "Community",
                            icon: "gtp:gtp-fundamentals",
                            href: "#Community",
                          },
                          {
                            label: "Project Funding",
                            icon: "gtp:gtp-fundamentals",
                            href: "#ProjectFunding",
                          }
                        ]
                      }
                    />
                  </div>
                  <div className="flex flex-col justify-between gap-y-[10px] flex-1 min-w-[90px] ">

                    <Link
                      href={
                        `https://app.rhino.fi/bridge?refId=PG_GrowThePie&token=ETH&chainOut`

                      }
                      className="absolute right-[5px] top-[10px] lg:top-[10px] left-[calc((100%/2)+5px)] lg:left-[140px]"
                    >
                      <div className="flex items-center w-full h-[36px] gap-x-[8px] pl-[6px] pr-[10px] rounded-full dark:bg-[#263130] bg-forest-50">
                        <div className="bg-white dark:bg-forest-1000 rounded-full flex items-center justify-center">
                          <svg width="27" height="26" viewBox="0 0 27 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M13.2939 5.5C18.8365 5.5 20.7939 7.46667 20.7939 13C20.7939 18.5124 18.8039 20.5 13.2939 20.5C7.80026 20.5 5.79395 18.4869 5.79395 13C5.79395 7.49207 7.76754 5.5 13.2939 5.5Z" fill="black" />
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M12.7395 13.8787C12.3959 14.6971 11.587 15.2717 10.6439 15.2717C9.3892 15.2717 8.37207 14.2546 8.37207 12.9999C8.37207 11.7452 9.3892 10.7281 10.6439 10.7281C11.587 10.7281 12.3959 11.3028 12.7395 12.1211C13.0982 10.7735 14.262 9.75419 15.6845 9.60975C15.9153 9.58634 16.0328 9.60656 16.0328 9.87615V11.935C16.0328 12.0883 16.004 12.1647 15.6845 12.1647C15.2094 12.1647 14.9036 12.5872 14.9036 12.9999C14.9036 13.4704 15.1783 13.8518 15.6845 13.8518C16.0328 13.8518 16.0328 13.6571 16.0328 13.417V12.432C16.0328 12.2427 16.0994 12.148 16.2769 12.148H17.3618C17.5357 12.148 17.5438 12.1512 17.6437 12.2898C17.6437 12.2898 18.0795 12.8912 18.1555 12.9999C18.2314 13.1086 18.2403 13.1419 18.1555 13.2685C18.0706 13.3952 17.6437 13.9914 17.6437 13.9914C17.5441 14.1321 17.5371 14.1358 17.3618 14.1358H16.5471C16.1224 14.1358 16.0328 14.4297 16.0328 14.6949V16.0527C16.0328 16.3691 15.9768 16.4197 15.6845 16.3901C14.262 16.2457 13.0982 15.2264 12.7395 13.8787ZM11.4012 12.9995C11.4012 13.4177 11.0622 13.7568 10.644 13.7568C10.2257 13.7568 9.88672 13.4177 9.88672 12.9995C9.88672 12.5813 10.2257 12.2422 10.644 12.2422C11.0622 12.2422 11.4012 12.5813 11.4012 12.9995Z" fill="white" />
                          </svg>
                        </div>
                        <div className="text-[14px] font-semibold truncate">
                          Octant App
                        </div>
                      </div>
                    </Link>
                    <ExpandingButtonMenu
                      className="right-[5px] top-[50px] lg:top-[65px] mt-auto left-[calc((100%/2)+5px)] lg:left-[140px]"
                      button={{
                        label: "More",
                        icon: "feather:chevron-right",
                        showIconBackground: false,
                        animateIcon: true,
                      }}
                      items={[
                        {
                          label: "Octant.Build",
                          icon: "feather:external-link",
                          href: "https://octant.build",
                        },
                        {
                          label: "Golem Foundation Blog",
                          icon: "feather:external-link",
                          href: "https://golem.foundation/blog/",
                        },

                        {
                          label: "Octant Docs",
                          icon: "feather:external-link",
                          href: "https://docs.octant.app/",
                        },
                        {
                          label: "@GolemFoundation",
                          icon: "ri:twitter-x-fill",
                          href: "https://twitter.com/GolemFoundation",
                        },
                        {
                          label: "@OctantApp",
                          icon: "ri:twitter-x-fill",
                          href: "https://twitter.com/OctantApp",
                        },
                      ]}
                    />
                  </div>
                </div>
              </ChainSectionHead>
            </div>

            <div className="@container min-w-[67px] lg:max-w-[398px] lg:col-auto lg:basis-[398px] lg:flex-grow lg:flex-shrink lg:hover:min-w-[398px] transition-all duration-300">
              <ChainSectionHeadAlt
                title={"Background"}
                enableDropdown={isMobile}
                childrenHeight={isMobile ? 200 : 111}
                className={`transition-all duration-300 min-w-[67px] w-full flex flex-1`}
                shadowElement={
                  <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[398px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                }
              >
                <div
                  className={`group bg-clip-border min-h-[111px] lg:max-h-[111px] relative flex flex-col justify-between transition-opacity duration-300 px-[10px] py-[10px] rounded-[15px] bg-forest-50 dark:bg-[#1F2726] overflow-hidden`}
                >
                  <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[398px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                  <div className="w-full lg:w-[378px] h-auto lg:h-[calc(111px-20px)] flex flex-col justify-between gap-y-[5px]">
                    <div className="w-full">
                      <div className="text-[10px] font-semibold text-[#5A6462]">
                        Background Information
                      </div>
                      <div
                        className={`text-[10px] leading-[150%] md:min-w-[378px] md:max-w-[378px]`}
                      >
                        Octant is a novel platform for experiments in participatory public goods funding, centered on Golem&apos;s native ERC-20 token, GLM.
                        Developed by the Golem Foundation to explore motivations and behaviors that drive engagement in funding public goods, Octant uses recurring funding rounds and rewards active user participation with ETH.
                      </div>
                    </div>
                  </div>
                </div>
              </ChainSectionHeadAlt>
            </div>
            <div className="flex flex-col gap-y-[5px] lg:flex-row gap-x-[5px] flex-grow flex-shrink basis-0">
              <div className="@container min-w-full lg:min-w-[67px] lg:col-auto lg:basis-[294px] lg:flex-shrink lg:hover:min-w-[294px] transition-all duration-300">
                <ChainSectionHeadAlt
                  title={"Community"}
                  enableDropdown={isMobile}
                  childrenHeight={isMobile ? 116 : 111}
                  className="transition-all duration-300 min-w-[67px] w-full"
                  shadowElement={
                    <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[294px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                  }
                >
                  <div className="group flex flex-col gap-y-[5px] overflow-hidden relative">
                    <div className="bg-clip-border  min-h-[111px] lg:max-h-[111px] flex relative gap-x-[5px] px-[5px] py-[10px] items-center rounded-[15px] overflow-hidden bg-forest-50 dark:bg-[#1F2726] justify-between ">
                      <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[228px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                      <div className="flex-col flex pl-[5px]">
                        <div className="text-[10px] font-semibold text-[#5A6462]">
                          User Wallets with GLM locked
                        </div>
                        <div
                          className={`text-[10px] leading-[150%] md:min-w-[273px] md:max-w-[273px]`}
                        >
                          <div>
                            Amount of wallets owning GLM and locking their tokens in the Octant app to allocate rewards in the next Epoch.
                          </div>
                          <div className="flex gap-x-[5px] w-[calc(298px-10px)] pt-[5px]">
                            <div className="flex bg-[#5A6462] rounded-[11px] w-[135px] px-[13px] py-[5px] gap-x-[6px] h-[43px] items-center justify-center">
                              <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_11946_38465)">
                                  <path fill-rule="evenodd" clip-rule="evenodd" d="M16.4421 5.69018C16.4421 4.06696 15.0258 2.86958 13.5505 3.24555L3.37656 5.8383C2.31894 6.10783 1.57254 7.11927 1.57254 8.28293V11.5H0.00732422V8.28293C0.00732422 6.3435 1.25133 4.65776 3.01403 4.20855L13.1879 1.6158C15.6468 0.989179 18.0073 2.98481 18.0073 5.69018V8.14938H16.4421V5.69018Z" fill="url(#paint0_linear_11946_38465)" />
                                  <path fill-rule="evenodd" clip-rule="evenodd" d="M18.8645 8.43182H3.15018C2.49927 8.43182 1.97161 8.95076 1.97161 9.59091V20.4091C1.97161 21.0492 2.49927 21.5682 3.15018 21.5682H18.8645C19.5154 21.5682 20.043 21.0492 20.043 20.4091V9.59091C20.043 8.95076 19.5154 8.43182 18.8645 8.43182ZM3.15018 6.5C1.41443 6.5 0.00732422 7.88385 0.00732422 9.59091V20.4091C0.00732422 22.1162 1.41443 23.5 3.15018 23.5H18.8645C20.6002 23.5 22.0073 22.1162 22.0073 20.4091V9.59091C22.0073 7.88385 20.6002 6.5 18.8645 6.5H3.15018Z" fill="url(#paint1_linear_11946_38465)" />
                                  <path fill-rule="evenodd" clip-rule="evenodd" d="M22.0073 14.1667H17.6073L17.6073 15.8333H22.0073V14.1667ZM17.6073 12.5C16.7237 12.5 16.0073 13.2462 16.0073 14.1667V15.8333C16.0073 16.7538 16.7237 17.5 17.6073 17.5H22.4073C23.291 17.5 24.0073 16.7538 24.0073 15.8333V14.1667C24.0073 13.2462 23.291 12.5 22.4073 12.5H17.6073Z" fill="url(#paint2_linear_11946_38465)" />
                                </g>
                                <defs>
                                  <linearGradient id="paint0_linear_11946_38465" x1="9.00732" y1="1.5" x2="9.00732" y2="11.5" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#10808C" />
                                    <stop offset="1" stop-color="#1DF7EF" />
                                  </linearGradient>
                                  <linearGradient id="paint1_linear_11946_38465" x1="11.0073" y1="6.5" x2="21.249" y2="25.1337" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#FE5468" />
                                    <stop offset="1" stop-color="#FFDF27" />
                                  </linearGradient>
                                  <linearGradient id="paint2_linear_11946_38465" x1="20.0073" y1="12.5" x2="20.0073" y2="17.5" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#10808C" />
                                    <stop offset="1" stop-color="#1DF7EF" />
                                  </linearGradient>
                                  <clipPath id="clip0_11946_38465">
                                    <rect width="24" height="24" fill="white" transform="translate(0.00732422 0.5)" />
                                  </clipPath>
                                </defs>
                              </svg>
                              <div className="flex flex-col items-center pt-[5px]">
                                <div className="font-semibold text-[20px]">
                                  {LockStatus.now.num_users_locked_glm}
                                </div>
                                <div className="text-[9px]">Total Wallets</div>
                              </div>
                            </div>
                            <div className="flex bg-[#5A6462] rounded-[11px] w-[135px] px-[13px] py-[5px] gap-x-[6px] h-[43px] items-center justify-center">
                              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_11946_38485)">
                                  <path d="M15.067 15.1489L20.9266 15.1489C23.3019 15.1489 24.5995 12.4851 23.0789 10.7305L15.0525 1.46928C13.9324 0.176906 11.8681 0.176908 10.748 1.46928L2.72159 10.7305C1.20098 12.4851 2.49855 15.1489 4.87383 15.1489L10.7337 15.1489L10.7337 24.5L15.0525 24.5L15.067 15.1489Z" fill="url(#paint0_linear_11946_38485)" />
                                </g>
                                <defs>
                                  <linearGradient id="paint0_linear_11946_38485" x1="12.9002" y1="0.5" x2="12.9002" y2="24.5" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#10808C" />
                                    <stop offset="1" stop-color="#1DF7EF" />
                                  </linearGradient>
                                  <clipPath id="clip0_11946_38485">
                                    <rect width="24" height="24" fill="white" transform="translate(0.933594 0.5)" />
                                  </clipPath>
                                </defs>
                              </svg>
                              <div className="flex flex-col items-center pt-[5px]">
                                <div className="font-semibold text-[20px]">
                                  {LockStatus.changes.num_users_locked_glm_change > 0 && "+"}
                                  {LockStatus.changes.num_users_locked_glm_change < 0 && "-"}
                                  {(LockStatus.changes.num_users_locked_glm_change * 100).toFixed(1)}%
                                </div>
                                <div className="text-[9px]">in last week</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ChainSectionHeadAlt>
              </div>
              <div className="flex gap-x-[5px] flex-grow flex-shrink basis-0">
                <div className="@container min-w-[294px] lg:min-w-[67px] lg:basis-[294px] lg:flex-grow lg:flex-shrink lg:hover:min-w-[294px] min-[1700px]:min-w-[294px] transition-all duration-300">
                  <ChainSectionHeadAlt
                    title={"Project Funding"}
                    enableDropdown={isMobile}
                    childrenHeight={isMobile ? 116 : 111}
                    className={`transition-all duration-300 min-w-[67px]`}
                    shadowElement={
                      <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[232px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                    }
                  >
                    <div className="group relative h-[111px] flex px-[10px] py-[10px] rounded-[15px] bg-forest-50 dark:bg-[#1F2726] gap-x-[5px] overflow-hidden">
                      <div className="transition-all duration-300 opacity-100 group-hover:opacity-0 @[232px]:opacity-0 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none"></div>
                      <div className="flex-col flex">
                        <div className="text-[10px] font-semibold text-[#5A6462]">
                          Total Funding Paid Out to Projects
                        </div>
                        <div
                          className={`text-[10px] leading-[150%] md:min-w-[273px] md:max-w-[273px]`}
                        >
                          <div>
                            Funding that has been paid out over all Epochs to date, from donations and matching from the Golem Foundation.
                          </div>
                          <div className="flex gap-x-[5px] w-[calc(298px-10px)] pt-[5px]">
                            <div className="flex bg-[#5A6462] rounded-[11px] w-[135px] px-[13px] py-[5px] gap-x-[6px] h-[43px] items-center justify-center">
                              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M12.3604 24.5C18.9878 24.5 24.3604 19.1274 24.3604 12.5C24.3604 5.87258 18.9878 0.5 12.3604 0.5C5.73293 0.5 0.360352 5.87258 0.360352 12.5C0.360352 19.1274 5.73293 24.5 12.3604 24.5ZM7.9577 6.1C7.46334 6.1 7.06259 6.50934 7.06259 7.01429C7.06259 7.51923 7.46334 7.92857 7.9577 7.92857H16.9087C17.4031 7.92857 17.8039 7.51923 17.8039 7.01429C17.8039 6.50934 17.4031 6.1 16.9087 6.1H7.9577ZM8.8528 11.5857C8.35845 11.5857 7.9577 11.9951 7.9577 12.5C7.9577 13.0049 8.35845 13.4143 8.8528 13.4143H16.0136C16.508 13.4143 16.9087 13.0049 16.9087 12.5C16.9087 11.9951 16.508 11.5857 16.0136 11.5857H8.8528ZM7.51014 17.0714C7.01579 17.0714 6.61504 17.4808 6.61504 17.9857C6.61504 18.4907 7.01579 18.9 7.51014 18.9H17.3563C17.8507 18.9 18.2514 18.4907 18.2514 17.9857C18.2514 17.4808 17.8507 17.0714 17.3563 17.0714H7.51014Z" fill="url(#paint0_linear_11954_38557)" />
                                <defs>
                                  <linearGradient id="paint0_linear_11954_38557" x1="12.3604" y1="0.5" x2="28.5391" y2="23.2457" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#FE5468" />
                                    <stop offset="1" stop-color="#FFDF27" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <div className="flex flex-col items-center pt-[5px]">
                                <div className="font-semibold text-[20px]">
                                  1145 <span className="text-[14px] font-normal">ETH</span>
                                </div>
                                <div className="text-[9px]">Total Funded</div>
                              </div>

                            </div>
                            <div className="flex bg-[#5A6462] rounded-[11px] w-[135px] px-[13px] py-[5px] gap-x-[6px] h-[43px] items-center justify-center">
                              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_11954_38563)">
                                  <path fill-rule="evenodd" clip-rule="evenodd" d="M10.3715 1.29505C11.5908 0.234984 13.3901 0.234984 14.6095 1.29505L15.6116 2.16618L16.6136 1.29505C17.833 0.234984 19.6323 0.234984 20.8517 1.29505C22.2918 2.54699 22.3762 4.77739 21.0351 6.13766L15.6432 11.6063L15.6116 11.5743L15.58 11.6063L10.1881 6.13766C8.8469 4.77739 8.93136 2.54699 10.3715 1.29505ZM15.6116 9.40007L19.9316 5.0185C20.63 4.31015 20.586 3.14869 19.8361 2.49675C19.2011 1.94474 18.2642 1.94474 17.6292 2.49675L15.6922 4.18069L15.6239 4.26149L15.6116 4.25077L15.5992 4.26149L15.531 4.18069L13.594 2.49675C12.959 1.94474 12.022 1.94474 11.387 2.49675C10.6371 3.14869 10.5931 4.31015 11.2915 5.0185L15.6116 9.40007Z" fill="url(#paint0_linear_11954_38563)" />
                                  <path fill-rule="evenodd" clip-rule="evenodd" d="M20.8153 12.9173C21.8285 12.2604 23.1775 12.3903 24.0385 13.2277C24.9686 14.1323 25.0403 15.5761 24.204 16.5636L20.6139 20.8035C18.632 23.1441 15.6778 24.5 12.5602 24.5H7.89871C5.70834 24.5 3.5873 23.7531 1.90461 22.3894L1.84544 22.3414C1.17453 21.7977 0.786621 20.9922 0.786621 20.1428V17.8129C0.786621 17.5053 0.837612 17.1997 0.93763 16.9079L1.06198 16.5451C1.32534 15.7767 1.91116 15.1528 2.67417 14.8281L6.16486 13.3428C8.94355 12.1605 12.1937 13.1239 13.822 15.6125L13.9334 15.7827C14.3359 16.398 15.1799 16.5712 15.8038 16.1667L20.8153 12.9173ZM22.9035 14.3315C22.5835 14.0203 22.0822 13.9721 21.7057 14.2162L16.6941 17.4656C16.6221 17.5123 16.5487 17.5555 16.4742 17.5952L16.4802 17.604L13.8092 19.3359C13.3258 19.6493 12.7578 19.8165 12.1769 19.8165H6.9395V18.2555H12.1769C12.441 18.2555 12.6991 18.1794 12.9188 18.037L13.6221 17.581C13.2114 17.3575 12.8499 17.0346 12.5792 16.6208L12.4678 16.4506C11.2643 14.6112 8.86203 13.8991 6.80821 14.773L3.31752 16.2583C2.9707 16.4059 2.70442 16.6895 2.58471 17.0388L2.46036 17.4016C2.4149 17.5342 2.39172 17.6731 2.39172 17.8129V20.1428C2.39172 20.5289 2.56804 20.895 2.873 21.1422L2.93217 21.1901C4.3264 22.3201 6.08383 22.9389 7.89871 22.9389H12.5602C15.1982 22.9389 17.6979 21.7916 19.3749 19.8111L22.965 15.5712C23.2758 15.2042 23.2491 14.6677 22.9035 14.3315Z" fill="url(#paint1_linear_11954_38563)" />
                                </g>
                                <defs>
                                  <linearGradient id="paint0_linear_11954_38563" x1="15.6116" y1="0.5" x2="22.7074" y2="11.9563" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#FE5468" />
                                    <stop offset="1" stop-color="#FFDF27" />
                                  </linearGradient>
                                  <linearGradient id="paint1_linear_11954_38563" x1="12.7866" y1="12.5" x2="12.7866" y2="24.5" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#10808C" />
                                    <stop offset="1" stop-color="#1DF7EF" />
                                  </linearGradient>
                                  <clipPath id="clip0_11954_38563">
                                    <rect width="24" height="24" fill="white" transform="translate(0.786621 0.5)" />
                                  </clipPath>
                                </defs>
                              </svg>
                              <div className="flex flex-col items-center pt-[5px]">
                                <div className="font-semibold text-[20px]">
                                  6.34 <span className="text-[14px] font-normal">ETH</span>
                                </div>
                                <div className="text-[9px] whitespace-nowrap">Mdn. Project Funding</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ChainSectionHeadAlt>
                </div>
              </div>
            </div>
          </div>
          <div
            className="flex gap-x-[8px] items-center pb-[15px] scroll-mt-8"
            ref={JumpToSections.Community.ref}
            id="Community"
          >
            <div className="w-9 h-9  ">
              <Icon icon={`gtp:gtp-users`} className="w-9 h-9" />
            </div>
            <Heading
              className="leading-[120%] text-[20px] md:text-[30px] break-inside-avoid "
              as="h2"
            >
              Community
            </Heading>
          </div>
          <div className="text-[14px] pb-[15px]">This is all about the owners of GLM and who have locked their funds in Octant. Either donating/allocating or not.</div>
          <TopRowContainer
            className={`mb-[15px] flex w-full justify-between gap-y-3 lg:gap-y-0 items-center text-xs bg-forest-50 dark:bg-[#1F2726] lg:z-30 flex-col-reverse rounded-b-[15px] md:rounded-b-[20px] rounded-t-[24px] p-[3px] lg:p-[5px] lg:flex-row lg:rounded-full lg:h-[54px] transition-shadow duration-300`}
          >


            <TopRowParent>

              <TopRowChild
                // key={timespan}
                isSelected={communityUserSelection === "All"}
                onClick={() => {
                  handleCommunityUserSelection("All");
                }}
                style={{
                }}
                className={`lg:!py-[10px] lg:!px-[15px] text-[16px] leading-[150%]`}
              >
                <span className="hidden sm:block">
                  {UserTypes.All.label} ({CommunityUsersData?.length})
                </span>
                <span className="block text-xs sm:hidden">
                  {UserTypes.All.label}
                </span>
              </TopRowChild>
              <TopRowChild
                // key={timespan}
                isSelected={communityUserSelection === "Donating"}
                onClick={() => {
                  handleCommunityUserSelection("Donating");
                }}
                style={{
                }}
                className={`lg:!py-[10px] lg:!px-[15px] text-[16px] leading-[150%]`}
              >
                <span className="hidden sm:block">
                  {UserTypes.Donating.label} ({CommunityUsersData?.filter((user) => user.allocation_amount > 0).length})
                </span>
                <span className="block text-xs sm:hidden">
                  {UserTypes.Donating.label}
                </span>
              </TopRowChild>
            </TopRowParent>
            <div className="flex flex-col relative h-full lg:h-[44px] w-full lg:w-[271px] -my-[1px]">
              <div
                className={`relative flex rounded-full h-full w-full lg:z-30 p-[5px] ${isMobile ? "w-full" : "w-[271px]"
                  }`}
                style={{
                  backgroundColor: "#344240",
                }}
              >
                <div
                  className="rounded-[40px] w-[54px] h-[34px] bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[15] hover:cursor-pointer"
                  onClick={handlePrevCommunityEpoch}
                // onMouseOver={() => {
                //   preload(`${ChainsBaseURL}${prevChainKey}.json`, fetcher);
                // }}
                >
                  <Icon icon="feather:arrow-left" className="w-6 h-6" />
                </div>
                <div
                  className="flex flex-1 flex-col items-center justify-self-center  gap-y-[1px]"
                // onClick={() => {
                //   setCompareTo(!compareTo);
                // }}
                >

                  <div
                    className={`flex ${""

                      } gap-x-[5px] justify-center items-center w-[123px] h-full`}
                  >

                    <div className="text-sm overflow-ellipsis truncate whitespace-nowrap">
                      {Epochs[communityEpoch].label}
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-[40px] w-[54px] h-[34px] bg-forest-50 dark:bg-[#1F2726] flex items-center justify-center z-[15] hover:cursor-pointer"
                  onClick={handleNextCommunityEpoch}
                // onMouseOver={() => {
                //   preload(`${ChainsBaseURL}${nextChainKey}.json`, fetcher);
                // }}
                >
                  <Icon icon="feather:arrow-right" className="w-6 h-6" />
                </div>
              </div>
              {/* <div
                className={`flex flex-col relative lg:absolute lg:top-[27px] bottom-auto lg:left-0 lg:right-0 bg-forest-50 dark:bg-[#1F2726] rounded-t-none border-0 lg:border-b lg:border-l lg:border-r transition-all ease-in-out duration-300`}
              >
                <div className="pb-[20px] lg:pb-[10px]">
                  <div className="h-[10px] lg:h-[28px]"></div>
                  <div
                    className="flex pl-[21px] pr-[19px] lg:pr-[15px] py-[5px] gap-x-[10px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
                  // onClick={() => {
                  //   setCompareTo(false);
                  //   delay(300).then(() => setChainKey([chainKey[0]]));
                  // }}
                  >
                    <Icon
                      icon="feather:arrow-right-circle"
                      className="w-6 h-6"
                    // visibility={compChain === null ? "visible" : "hidden"}
                    />
                    <div className="flex w-[22px] h-[22px] items-center justify-center">
                      <Icon
                        icon="feather:x"
                        className={`transition-all duration-300 ${""
                          // compChain === null
                          // ? "w-[22px] h-[22px]"
                          // : "w-[15px] h-[15px]"
                          }`}
                        style={{
                          // color: compChain === null ? "" : "#5A6462",
                        }}
                      />
                    </div>
                    <div className="">None</div>
                  </div>
                  {CompChains.sort((chain1, chain2) => {
                    const nameA = master.chains[chain1.key].name.toLowerCase();
                    const nameB = master.chains[chain2.key].name.toLowerCase();

                    if (nameA < nameB) {
                      return -1;
                    }
                    if (nameA > nameB) {
                      return 1;
                    }
                    return 0;
                  }).map((chain, index) => (
                    <div
                      className="flex pl-[21px] pr-[15px] py-[5px] gap-x-[10px] items-center text-base leading-[150%] cursor-pointer hover:bg-forest-200/30 dark:hover:bg-forest-500/10"
                      onClick={() => {
                        setCompareTo(false);
                        delay(400).then(() =>
                          setChainKey([chainKey[0], chain.key]),
                        );
                      }}
                      key={index}
                      onMouseOver={() => {
                        preload(`${ChainsBaseURL}${chain.key}.json`, fetcher);
                      }}
                    >
                      <Icon
                        icon="feather:arrow-right-circle"
                        className="w-6 h-6"
                        visibility={compChain === chain.key ? "visible" : "hidden"}
                      />
                      <div className="flex w-[22px] h-[22px] items-center justify-center">
                        <Icon
                          icon={`gtp:${chain.urlKey}-logo-monochrome`}
                          className={`transition-all duration-300 ${compChain === chain.key
                            ? "w-[22px] h-[22px]"
                            : "w-[15px] h-[15px]"
                            }`}
                          style={{
                            color:
                              compChain === chain.key
                                ? AllChainsByKeys[chain.key].colors[
                                theme ?? "dark"
                                ][0]
                                : "#5A6462",
                          }}
                        />
                      </div>
                      <div>{master.chains[chain.key].name}</div>
                    </div>
                  ))}
                </div>
              </div> */}
              {/* {compareTo && (
                <div
                  className={`hidden lg:block lg:fixed inset-0 z-20`}
                  onClick={() => {
                    setCompareTo(false);
                  }}
                />
              )} */}
            </div>
          </TopRowContainer>
          <div className="flex items-center w-full bg-[#1F2726] gap-x-[10px] rounded-[22px] pr-[10px] min-h-[44px] z-[1]">
            <div className={`relative flex justify-center items-center pl-[10px]`}>
              <SearchIcon />
            </div>
            <input
              // ref={inputRef}
              className={`flex-1 pl-[11px] h-full bg-transparent placeholder-[#CDD8D3] border-none outline-none overflow-x-clip`}
              placeholder="Search Wallets"
              value={communitySearch}
              onChange={(e) => {

                setCommunitySearch(e.target.value);
              }}
              onKeyUp={(e) => {
                // if enter is pressed, add the search term to the address filters
                if (e.key === "Enter" && communitySearch.length > 0) {
                  // handleFilter("address", search);
                  // setSearch("");
                  // e.preventDefault();
                }
              }}
            />
            {communitySearch.length > 0 && (
              <div className="cursor-pointer" onClick={() => setCommunitySearch("")}>
                <svg width="27" height="26" viewBox="0 0 27 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="25" height="24" rx="12" stroke="url(#paint0_linear_8794_34411)" />
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M17.7435 17.2426C18.8688 16.1174 19.5009 14.5913 19.5009 13C19.5009 11.4087 18.8688 9.88258 17.7435 8.75736C16.6183 7.63214 15.0922 7 13.5009 7C11.9096 7 10.3835 7.63214 9.25827 8.75736C8.13305 9.88258 7.50091 11.4087 7.50091 13C7.50091 14.5913 8.13305 16.1174 9.25827 17.2426C10.3835 18.3679 11.9096 19 13.5009 19C15.0922 19 16.6183 18.3679 17.7435 17.2426V17.2426ZM12.4402 10.8787C12.2996 10.738 12.1088 10.659 11.9099 10.659C11.711 10.659 11.5202 10.738 11.3796 10.8787C11.2389 11.0193 11.1599 11.2101 11.1599 11.409C11.1599 11.6079 11.2389 11.7987 11.3796 11.9393L12.4402 13L11.3796 14.0607C11.2389 14.2013 11.1599 14.3921 11.1599 14.591C11.1599 14.7899 11.2389 14.9807 11.3796 15.1213C11.5202 15.262 11.711 15.341 11.9099 15.341C12.1088 15.341 12.2996 15.262 12.4402 15.1213L13.5009 14.0607L14.5616 15.1213C14.7022 15.262 14.893 15.341 15.0919 15.341C15.2908 15.341 15.4816 15.262 15.6222 15.1213C15.7629 14.9807 15.8419 14.7899 15.8419 14.591C15.8419 14.3921 15.7629 14.2013 15.6222 14.0607L14.5616 13L15.6222 11.9393C15.7629 11.7987 15.8419 11.6079 15.8419 11.409C15.8419 11.2101 15.7629 11.0193 15.6222 10.8787C15.4816 10.738 15.2908 10.659 15.0919 10.659C14.893 10.659 14.7022 10.738 14.5616 10.8787L13.5009 11.9393L12.4402 10.8787Z" fill="#CDD8D3" />
                  <defs>
                    <linearGradient id="paint0_linear_8794_34411" x1="13.5" y1="1" x2="29.4518" y2="24.361" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#FE5468" />
                      <stop offset="1" stop-color="#FFDF27" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}
          </div>

          <GridTableHeader gridDefinitionColumns="grid-cols-[20px,minmax(225px,1600px),218px,118px,118px]"
            className="text-[12px] gap-x-[15px] z-[2] !pl-[5px] !pr-[36px] !pt-[15px] !pb-[10px]">
            <div></div>
            <GridTableHeaderCell
              metric="user"
              sort={communityTableSort}
              setSort={setCommunityTableSort}
            >
              Address
            </GridTableHeaderCell>
            <GridTableHeaderCell
              justify="end"
              metric="min"
              sort={communityTableSort}
              setSort={setCommunityTableSort}
            >
              Amount Locked
            </GridTableHeaderCell>
            <GridTableHeaderCell
              justify="end"
              metric="budget_amount"
              sort={communityTableSort}
              setSort={setCommunityTableSort}
            >
              Rewards Earned
            </GridTableHeaderCell>
            <GridTableHeaderCell
              justify="end"
              metric="allocation_amount"
              sort={communityTableSort}
              setSort={setCommunityTableSort}
            >
              Amount Donated
            </GridTableHeaderCell>
            {/* <GridTableHeaderCell
              justify="end"
              metric="project_count"
              sort={communityTableSort}
              setSort={setCommunityTableSort}
            >
              # Donations
            </GridTableHeaderCell> */}
          </GridTableHeader>
          <VerticalScrollContainer height={250} className="">
            {CommunityUsersFiltered && CommunityUsersFiltered.length > 0 && (
              CommunityUsersFiltered.map((user, index) => (
                <div key={index} className="pb-[3px]">
                  <GridTableRow

                    gridDefinitionColumns="grid-cols-[20px,minmax(225px,1600px),218px,118px,118px]"
                    className="group text-[12px] h-[34px] inline-grid transition-all duration-300 gap-x-[15px] !pl-[5px] !pr-[15px]"
                  >
                    <div className="flex items-center justify-center">
                      <div
                        className="relative flex items-center justify-center rounded-full w-[16px] h-[16px] bg-[#151A19] cursor-pointer"
                        onClick={(e) => {
                          handleCommunityRowToggle(user.user);
                          e.stopPropagation();
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clip-path="url(#clip0_12402_20562)">
                            <circle cx="8.29395" cy="8" r="7" stroke="#5A6462" />
                            <path d="M3.67414 6.32422L4.77814 7.86022L4.84214 7.98822L4.91414 7.86022L6.01014 6.32422H6.79414L5.25014 8.42022L6.80214 10.5002H6.01814L4.91414 8.97222L4.84214 8.85222L4.77814 8.97222L3.67414 10.5002H2.89014L4.44214 8.42022L2.89814 6.32422H3.67414Z" fill="#5A6462" />
                            <path d="M7.6557 11.6362C7.72503 11.6416 7.79437 11.6469 7.8637 11.6522C7.93303 11.6629 7.98637 11.6682 8.0237 11.6682C8.10903 11.6682 8.1837 11.6389 8.2477 11.5802C8.3117 11.5216 8.38103 11.4069 8.4557 11.2362C8.5357 11.0709 8.63703 10.8256 8.7597 10.5002L6.9917 6.32422H7.7357L9.1437 9.78822L10.4157 6.32422H11.1117L9.0797 11.5962C9.0317 11.7189 8.9597 11.8336 8.8637 11.9402C8.77303 12.0522 8.6557 12.1402 8.5117 12.2042C8.3677 12.2682 8.19437 12.3002 7.9917 12.3002C7.9437 12.3002 7.89303 12.2976 7.8397 12.2922C7.7917 12.2869 7.73037 12.2762 7.6557 12.2602V11.6362Z" fill="#5A6462" />
                            <path d="M11.4951 10.0442L14.1271 6.83622H11.5671V6.32422H14.9191V6.78022L12.3031 9.98822H14.9271V10.5002H11.4951V10.0442Z" fill="#5A6462" />
                          </g>
                          <defs>
                            <clipPath id="clip0_12402_20562">
                              <rect width="15" height="15" fill="white" transform="translate(0.793945 0.5)" />
                            </clipPath>
                          </defs>
                        </svg>

                        <Icon
                          icon={"gtp:circle-arrow"}
                          className={`w-[4px] h-[9px] absolute top-[4px] -right-[4px] `}
                          style={{
                            transform: `rotate(${communityRowsOpen.includes(user.user) ? "90deg" : "0deg"
                              })`,
                            transformOrigin: "-7px 4px",
                            transition: "transform 0.5s",
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-[#CDD8D3]">{user.user}</div>
                    </div>
                    <div className="flex items-center justify-end">
                      {communityEpoch != 0 && user.min > 0 ? (
                        <div className="text-[#CDD8D3]">{user.min.toLocaleString("en-GB", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} GLM</div>
                      ) : (
                        <div className="text-[#CDD8D3]">-</div>
                      )}

                    </div>
                    <div className="flex items-center justify-end">
                      {user.budget_amount > 0 ? (
                        <div className="text-[#CDD8D3]">{user.budget_amount.toLocaleString("en-GB", {
                          minimumFractionDigits: user.budget_amount < 0.01 ? 6 : 2,
                          maximumFractionDigits: user.budget_amount < 0.01 ? 6 : 2,
                        })} ETH</div>
                      ) : (
                        <div className="text-[#CDD8D3]">-</div>
                      )}

                    </div>
                    <div className="flex items-center justify-end">
                      {user.allocation_amount > 0 ? (
                        <div className="text-[#CDD8D3]">{user.allocation_amount.toLocaleString("en-GB", {
                          minimumFractionDigits: user.allocation_amount < 0.01 ? 6 : 2,
                          maximumFractionDigits: user.allocation_amount < 0.01 ? 6 : 2,
                        })} ETH</div>
                      ) : (
                        <div className="text-[#CDD8D3]">-</div>
                      )}
                    </div>
                    {/* <div className="flex items-center justify-end">
                    {user.project_count > 0 ? (
                      <div className="text-[#CDD8D3]">{user.project_count}</div>
                    ) : (
                      <div className="text-[#CDD8D3]">-</div>
                    )}
                  </div> */}

                  </GridTableRow>

                  <div className="pl-[13px] pr-[15px]">
                    <div className={`flex flex-col bg-[#1F2726] rounded-b-[15px] border-[#CDD8D3]/30 border-dotted border-x border-b transition-all duration-300 ${communityRowsOpen.includes(user.user) ? "min-h-[80px] max-h-[300px] opacity-100" : "max-h-0 min-h-0 opacity-0"} overflow-hidden`}>
                      <div className="flex flex-col p-[15px] gap-y-[6px] text-[12px]">
                        <div className="flex items-center justify-between">
                          <div>Active Since: <span className="font-semibold">Epoch {UserActiveSinceEpochData[user.user]}</span></div>
                          <div className="flex gap-x-[5px] items-center">
                            <div>
                              Donated <span className="font-semibold">{user.allocation_amount.toLocaleString("en-GB", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} ETH</span>
                            </div>
                            <div className="flex flex-col w-[133px]">
                              <div className="flex justify-between text-[10px]">
                                <div>{(user.allocation_amount / user.budget_amount * 100).toFixed(2)}%</div>
                                <div>{((user.budget_amount - user.allocation_amount) / user.budget_amount * 100).toFixed(2)}%</div>
                              </div>
                              <div className="flex w-full h-[4px]">
                                <div className="h-full rounded-l-full" style={{ background: "linear-gradient(0deg,#1DF7EF 0%,#10808C 100%)", width: `${(user.allocation_amount / user.budget_amount) * 100}%` }}></div>
                                <div className="h-full rounded-r-full" style={{ background: "linear-gradient(-3deg,#FFDF27 0%,#FE5468 100%)", width: `${((user.budget_amount - user.allocation_amount) / user.budget_amount) * 100}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <span className="font-semibold">{(user.budget_amount - user.allocation_amount).toLocaleString("en-GB", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} ETH</span>{" "}
                              Kept
                            </div>
                          </div>
                        </div>
                        {user.project_list.length > 0 ? (

                          <div className="flex flex-col gap-y-[5px]">
                            <div>Wallet donated to <span className="font-semibold">{user.project_list.length}</span> projects:</div>
                            <div className="flex flex-wrap gap-x-[5px] gap-y-[5px]">
                              {user.project_list.map((project_key, index) => (
                                <div key={index} className="flex items-center gap-x-[5px] bg-[#344240] rounded-[15px] pl-[0px] pr-[6px] py-[0px] text-[10px]">
                                  <div className="w-6 h-6 border border-forest-900/20 dark:border-forest-500/20 rounded-full overflow-hidden">
                                    <Image
                                      src={`https://ipfs.io/ipfs/${ProjectsMetadata[project_key].profileImageMedium}`}
                                      alt={ProjectsMetadata[project_key].name}
                                      width={24}
                                      height={24}
                                      className="rounded-full"
                                    />
                                  </div>
                                  {project_key}</div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>No donations made to any projects.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </VerticalScrollContainer>
          <div
            className="flex gap-x-[8px] items-center pb-[15px] scroll-mt-8 pt-[60px]"
            ref={JumpToSections.ProjectFunding.ref}
            id="ProjectFunding"
          >
            <div className="w-9 h-9  ">
              <svg width="37" height="36" viewBox="0 0 37 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_9453_40033)">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M8.69395 0C4.1033 0.000608782 0.373027 3.68373 0.296289 8.25623L0.293945 8.25938V30C0.293945 32.4 2.69395 36 6.29395 36H36.2939V7.2H9.89395V0H8.69395C8.69433 0 8.69357 0 8.69395 0ZM7.49395 2.52025C7.07699 2.60497 6.67574 2.73294 6.29508 2.89925C4.176 3.82512 2.69508 5.93962 2.69508 8.4L2.69395 24.1224C3.95416 22.8358 5.62477 21.9529 7.49395 21.6852V2.52025ZM8.69508 24C7.84176 24 7.03004 24.1781 6.29508 24.4993C4.176 25.4251 2.69508 27.5396 2.69508 30C2.69508 30.5035 2.99958 31.4618 3.75013 32.3196C4.46096 33.132 5.34529 33.6 6.29395 33.6H33.8939V9.6H9.89395V24H8.69508Z" fill="url(#paint0_linear_9453_40033)" />
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M14.7939 14C13.4132 14 12.2939 15.1193 12.2939 16.5V26.5C12.2939 27.8807 13.4132 29 14.7939 29H24.7939C26.1747 29 27.2939 27.8807 27.2939 26.5V16.5C27.2939 15.1193 26.1747 14 24.7939 14H14.7939ZM20.8152 17.1784C20.4124 16.2739 19.1755 16.2739 18.7727 17.1784L18.1488 18.5795C17.9849 18.9477 17.6491 19.2013 17.2615 19.2495L15.7867 19.4333C14.8346 19.552 14.4524 20.7747 15.1555 21.4523L16.2448 22.5021C16.531 22.7779 16.6593 23.1882 16.5837 23.5862L16.2961 25.1009C16.1104 26.0787 17.1111 26.8344 17.9485 26.3488L19.2456 25.5964C19.5864 25.3987 20.0015 25.3987 20.3423 25.5964L21.6394 26.3488C22.4768 26.8344 23.4775 26.0787 23.2918 25.1009L23.0042 23.5862C22.9286 23.1882 23.0569 22.7779 23.3431 22.5021L24.4324 21.4523C25.1355 20.7747 24.7533 19.552 23.8012 19.4333L22.3264 19.2495C21.9388 19.2013 21.603 18.9477 21.4391 18.5795L20.8152 17.1784Z" fill="url(#paint1_linear_9453_40033)" />
                </g>
                <defs>
                  <linearGradient id="paint0_linear_9453_40033" x1="18.2939" y1="0" x2="18.2939" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#10808C" />
                    <stop offset="1" stop-color="#1DF7EF" />
                  </linearGradient>
                  <linearGradient id="paint1_linear_9453_40033" x1="19.7939" y1="14" x2="29.9057" y2="28.2161" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#FE5468" />
                    <stop offset="1" stop-color="#FFDF27" />
                  </linearGradient>
                  <clipPath id="clip0_9453_40033">
                    <rect width="36" height="36" fill="white" transform="translate(0.293945)" />
                  </clipPath>
                </defs>
              </svg>

            </div>
            <Heading
              className="leading-[120%] text-[20px] md:text-[30px] break-inside-avoid "
              as="h2"
            >
              Project Funding
            </Heading>
          </div>
          <div className="text-[14px] pb-[15px]">These are all the projects that can participate in the current round of Octant. There are a maximum of 30 projects voted in for this Epoch.</div>



        </div>
      </Container>
      <Container>
        <CountdownTimer />
      </Container>
      <HorizontalScrollContainer className="min-h-[300px]">


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
          className="min-w-[900px] flex flex-col gap-y-[5px] transition-all duration-300 min-h-[570px]"
          style={{ maxHeight: !data ? "calc(100vh - 550px)" : "5000px" }}
        >
          <div className={`select-none grid ${currentEpoch && (currentEpoch.epoch < 4 ? "grid-cols-[32px,16px,minmax(240px,800px),0px,150px,80px,120px,40px,110px,105px,120px] lg:grid-cols-[32px,16px,minmax(240px,800px),150px,150px,80px,120px,40px,110px,105px,120px]" : "grid-cols-[32px,16px,minmax(240px,800px),0px,130px,80px,120px,40px,110px,105px,120px] lg:grid-cols-[32px,16px,minmax(240px,800px),150px,130px,80px,120px,40px,110px,105px,120px]")} gap-x-[15px] px-[6px] pt-[30px] text-[11px] items-center font-bold`}>
            {headers.map((header) => (
              <div key={header.key} className={`${header.containerClassName}`}>
                {header.cell()}
              </div>
            ))}
          </div>
          {currentEpoch && epochsByProjectName && epochs && allTimeTotalsByProjectName ? (
            sortedProjects.map((projectName, index) => (
              <OctantTableRow
                key={index}
                currentEpoch={currentEpoch}
                projectName={projectName}
                projectIndex={index}
                epochsByProjectName={epochsByProjectName}
                allTimeTotalsByProjectName={allTimeTotalsByProjectName}
                epochs={epochs}
                setCurrentEpoch={setCurrentEpoch}
              />
            ))
          ) : (
            <div className="rounded-[30px] border border-forest-900/20 dark:border-forest-500/20 w-full max-w-[calc(100vw-100px)] h-[calc(100vh-450px)] flex items-center justify-center min-h-[500px]">
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
    </>
  );
}

const EpochTile = ({
  name,
  epochNumber,
  epochState,
  epoch,
  currentEpoch,
  setCurrentEpoch,
}: {
  name: string;
  epochNumber: number;
  epochState: EpochState;
  epoch: EpochData;
  currentEpoch: EpochData;
  setCurrentEpoch?: (epoch: EpochData) => void;
}) => {
  const project = epoch.projects.find((p) => p.name.toLowerCase() === name.toLowerCase());

  if (!project) return <div className="w-2 h-2 bg-orange-500"></div>;

  // if (epochState === "PENDING" || epochState === "ACTIVE")
  //   return null;

  return (
    <>
      {/* {epochState === "PENDING" && (
        <div className="flex items-center justify-center w-6 h-6 border border-dashed border-gray-500 rounded-sm text-gray-500">
          <div>{epochNumber}</div>
        </div>
      )}
      {epochState === "ACTIVE" && (
        <div className="flex items-center justify-center w-6 h-6 bg-gray-500/40 rounded-sm text-gray-100">
          <div>{epochNumber}</div>
        </div>
      )} */}

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
  projectName: string;
  projectIndex: number;
  epochsByProjectName: EpochsByProject;
  allTimeTotalsByProjectName: { [project: string]: number };
  epochs: EpochData[];
  setCurrentEpoch?: (epoch: EpochData) => void;
};

const OctantTableRow = ({
  currentEpoch,
  projectName,
  projectIndex,
  epochsByProjectName,
  allTimeTotalsByProjectName,
  epochs,
  setCurrentEpoch,
}: TableRowProps) => {
  // const project = data.projects[projectIndex];
  const currentEpochProject = currentEpoch.projects.find(
    (p) => p.name.toLowerCase() === projectName,
  );
  const lastPresentEpochProject = epochsByProjectName[projectName][
    epochsByProjectName[projectName].length - 1
  ].projects.find((p) => p.name.toLowerCase() === projectName);

  console.log("projectName:", projectName, "projectIndex:", projectIndex, "currentEpochProject:", currentEpochProject, " lastPresentEpochProject:", lastPresentEpochProject);

  const project = currentEpochProject
    ? currentEpochProject
    : lastPresentEpochProject;

  console.log("project", project);

  //console.log("project", project);

  if (!project) return null;

  return (
    <div className={`grid ${currentEpoch && (currentEpoch.epoch < 4 ? "grid-cols-[32px,16px,minmax(240px,800px),0px,150px,80px,120px,40px,110px,105px,120px] lg:grid-cols-[32px,16px,minmax(240px,800px),150px,150px,80px,120px,40px,110px,105px,120px]" : "grid-cols-[32px,16px,minmax(240px,800px),0px,130px,80px,120px,40px,110px,105px,120px] lg:grid-cols-[32px,16px,minmax(240px,800px),150px,130px,80px,120px,40px,110px,105px,120px]")} gap-x-[15px] rounded-full border border-forest-900/20 dark:border-forest-500/20 px-[6px] py-[5px] text-xs items-center`}>
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
            href={`https://octant.app/project/${currentEpoch.epoch}/${project.address}`}
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
          {epochsByProjectName[project.name.toLowerCase()] &&
            epochs.map((epoch, index) => {
              const isInEpoch = epochsByProjectName[project.name.toLowerCase()].find(
                (e) => e.epoch === epoch.epoch,
              );

              if (!isInEpoch)
                return <div key={index} className="w-6 h-6"></div>;
              return (
                <EpochTile
                  key={index}
                  name={project.name}
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
        {["REWARD_ALLOCATION", "FINALIZED"].includes(currentEpoch.state) && currentEpochProject && (
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
        {["REWARD_ALLOCATION", "FINALIZED"].includes(currentEpoch.state) && currentEpochProject && (
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
        {["REWARD_ALLOCATION", "FINALIZED"].includes(currentEpoch.state) && currentEpochProject && (
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
        {["REWARD_ALLOCATION", "FINALIZED"].includes(currentEpoch.state) && currentEpochProject && (
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
          className={`text-[0.9rem] font-bold leading-[1.2] font-inter ${allTimeTotalsByProjectName[projectName] <= 0 && "opacity-30"
            }`}
        >
          {(allTimeTotalsByProjectName[projectName] / 10 ** 18).toFixed(4)}{" "}
          <span className="opacity-60 text-[0.55rem] font-semibold">ETH</span>
        </div>
      </div>
    </div>
  );

};


const SearchIcon = () => (
  <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_11948_38516)">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M17.8939 8.8C17.8939 13.6601 13.9541 17.6 9.09395 17.6C4.23384 17.6 0.293945 13.6601 0.293945 8.8C0.293945 3.93989 4.23384 0 9.09395 0C13.9541 0 17.8939 3.93989 17.8939 8.8ZM9.09395 15.2C12.6286 15.2 15.4939 12.3346 15.4939 8.8C15.4939 5.26538 12.6286 2.4 9.09395 2.4C5.55932 2.4 2.69395 5.26538 2.69395 8.8C2.69395 12.3346 5.55932 15.2 9.09395 15.2Z" fill="url(#paint0_linear_11948_38516)" />
      <circle cx="9.04395" cy="8.75" r="5.75" fill="url(#paint1_linear_11948_38516)" />
      <path fill-rule="evenodd" clip-rule="evenodd" d="M23.4577 23.2927C23.0672 23.6833 22.4341 23.6833 22.0435 23.2927L14.0009 15.2501C13.6104 14.8596 13.6104 14.2264 14.0009 13.8359L14.1298 13.707C14.5204 13.3164 15.1535 13.3164 15.5441 13.707L23.5867 21.7496C23.9772 22.1401 23.9772 22.7733 23.5867 23.1638L23.4577 23.2927Z" fill="url(#paint2_linear_11948_38516)" />
    </g>
    <defs>
      <linearGradient id="paint0_linear_11948_38516" x1="9.09395" y1="0" x2="20.9584" y2="16.6802" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FE5468" />
        <stop offset="1" stop-color="#FFDF27" />
      </linearGradient>
      <linearGradient id="paint1_linear_11948_38516" x1="9.04395" y1="14.5" x2="9.04395" y2="3" gradientUnits="userSpaceOnUse">
        <stop stop-color="#10808C" />
        <stop offset="1" stop-color="#1DF7EF" />
      </linearGradient>
      <linearGradient id="paint2_linear_11948_38516" x1="18.7938" y1="13.4141" x2="25.6506" y2="23.054" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FE5468" />
        <stop offset="1" stop-color="#FFDF27" />
      </linearGradient>
      <clipPath id="clip0_11948_38516">
        <rect width="24" height="24" fill="white" transform="translate(0.293945)" />
      </clipPath>
    </defs>
  </svg>

);
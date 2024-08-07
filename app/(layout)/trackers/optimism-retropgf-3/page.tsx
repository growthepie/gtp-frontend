"use client";
import useSWR from "swr";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Project,
  ProjectFundingSource,
  ProjectsResponse,
  List,
  ListAmountsByProjectIdResponse,
} from "@/types/api/RetroPGF3";
import Icon from "@/components/layout/Icon";
import { useTheme } from "next-themes";
import ShowLoading from "@/components/layout/ShowLoading";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { last, uniq, debounce } from "lodash";
import moment from "moment";
import Image from "next/image";
import Link from "next/link";
// import { OsoTaggedProjects } from "./osoTaggedProjects";
// import { OsoStats } from "./osoProjectStats";
import { formatNumber } from "@/lib/chartUtils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/layout/Tooltip";
import Container from "@/components/layout/Container";
import { useUIContext } from "@/contexts/UIContext";
// import { TreeMapChart } from "@/components/charts/treemapChart";
import { useResizeObserver } from "usehooks-ts";
import { BASE_URL } from "@/lib/helpers.mjs";
import { a } from "react-spring";
import { RecoveredListData } from "./recoveredListData";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { RPGF3Results, RPGF3ResultsById } from "./rpgf3_results";

const timestamp = new Date().getTime();

// Collective Governance
// Developer Ecosystem
// End User Experience And Adoption
// Op Stack
const ImpactCategoriesMap = {
  COLLECTIVE_GOVERNANCE: {
    label: "COLL-GOV",
    bg: "bg-blue-500/40",
    border: "border-blue-600",
    textColor: "text-blue-100",
  },

  DEVELOPER_ECOSYSTEM: {
    label: "DEV-ECO",
    bg: "bg-green-600/40",
    border: "border-green-600",
    textColor: "text-green-100",
  },
  END_USER_EXPERIENCE_AND_ADOPTION: {
    label: "END-UX",
    bg: "bg-yellow-600/40",
    border: "border-yellow-600",
    textColor: "text-yellow-100",
  },
  OP_STACK: {
    label: "OP-STACK",
    bg: "bg-[#FF0420]/40",
    border: "border-[#FF0420]-600",
    textColor: "text-white",
  },
};

const multiplierOPToken = 1.35;

export default function Page() {
  // const ProjectIdToOsoStatsMaps = OsoTaggedProjects.reduce((acc, taggedProject) => {
  //   const id = `Project|${taggedProject["Project ID"]}`;
  //   const slug = taggedProject["OSO Slug"];
  //   const project = OsoStats.find(project => project["slug"] === slug);

  //   if (!project) return acc;

  //   acc[id] = project;

  //   return acc;
  // }, {});

  const {
    data: projectsResponse,
    isLoading: projectsLoading,
    isValidating: projectsValidating,
  } = useSWR<ProjectsResponse>(BASE_URL + "/api/optimism-retropgf-3/projects", {
    refreshInterval: 1 * 1000 * 60, // 1 minutes,
  });

  const {
    data: listAmountsByProjectId,
    isLoading: listAmountsByProjectIdLoading,
    isValidating: listAmountsByProjectIdValidating,
  } = useSWR<ListAmountsByProjectIdResponse>(
    BASE_URL + "/api/optimism-retropgf-3/listAmountsByProjectId",
    {
      refreshInterval: 1 * 1000 * 60, // 2 minutes,
    },
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [data, setData] = useState<Project[]>([]);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "awarded",
      desc: true,
    },
  ]);

  const [displayNameFilter, setDisplayNameFilter] = useState<string>("");

  useEffect(() => {
    if (projectsResponse) {
      if (data.length === 0 && projects.length === 0)
        setData(projectsResponse.projects);
      setProjects(projectsResponse.projects);
    }
  }, [data, projects.length, projectsResponse]);

  const debouncedFilter = debounce((filter, projects) => {
    if (filter === "") {
      setData(projects);
    } else {
      const filteredProjects = projects.filter((project) =>
        project.display_name.toLowerCase().includes(filter.toLowerCase()),
      );
      setData(filteredProjects);
    }
  }, 250);

  useEffect(() => {
    debouncedFilter(displayNameFilter, projects);

    return () => {
      debouncedFilter.cancel();
    };
  }, [debouncedFilter, displayNameFilter, projects]);

  const { theme } = useTheme();

  const lastUpdatedString = useMemo(() => {
    if (!projectsResponse) return null;

    const oldest = projectsResponse.projects.reduce((prev, curr) => {
      return prev.last_updated < curr.last_updated ? prev : curr;
    });

    const lastUpdated = oldest.last_updated;

    return moment(lastUpdated).fromNow();
  }, [projectsResponse]);

  const ballotRankingByProjectId = useMemo<{
    [projectId: string]: number;
  } | null>(() => {
    if (!projectsResponse) return null;

    const projectsRanked = projectsResponse.projects
      .sort((a, b) => {
        // If both are equal, return 0.
        if (a.included_in_ballots === b.included_in_ballots) return 0;

        // Otherwise, sort by whether a is greater than or less than b.
        return a.included_in_ballots > b.included_in_ballots ? -1 : 1;
      })
      .map((project, i) => ({
        id: project.id,
        rank: i + 1,
      }))
      .reduce((acc, curr) => {
        acc[curr.id] = curr.rank;
        return acc;
      }, {});

    return projectsRanked;
  }, [projectsResponse]);

  const awardedRankingByProjectId = useMemo<{
    [projectId: string]: number;
  } | null>(() => {
    if (!projectsResponse) return null;

    const projectsRanked = projectsResponse.projects
      .sort((a, b) => {
        // If both are equal, return 0.
        if (a.awarded === b.awarded) return 0;

        // Otherwise, sort by whether a is greater than or less than b.
        return a.awarded > b.awarded ? -1 : 1;
      })
      .map((project, i) => ({
        id: project.id,
        rank: i + 1,
      }))
      .reduce((acc, curr) => {
        acc[curr.id] = curr.rank;
        return acc;
      }, {});

    return projectsRanked;
  }, [projectsResponse]);

  const getProjectsCombinedFundingSourcesByCurrency = useCallback(
    (fundingSources: ProjectFundingSource[]) => {
      const combinedFundingSources: {
        [currency: string]: number;
      } = {};

      combinedFundingSources["TOTAL"] = 0;
      combinedFundingSources["OP"] = 0;
      combinedFundingSources["OPUSD"] = 0;
      combinedFundingSources["USD"] = 0;

      fundingSources.forEach((fundingSource) => {
        combinedFundingSources[fundingSource.currency] += fundingSource.amount;

        if (fundingSource.currency === "OP") {
          combinedFundingSources["OPUSD"] +=
            multiplierOPToken * fundingSource.amount;
          combinedFundingSources["TOTAL"] +=
            multiplierOPToken * fundingSource.amount;
        } else {
          combinedFundingSources["TOTAL"] += fundingSource.amount;
        }
      });

      return combinedFundingSources;
    },
    [],
  );

  const getAllProjectsCombinedFundingSourcesByCurrency = useCallback(
    (projects: Project[]) => {
      const allCombinedFundingSources: {
        [currency: string]: number;
      }[] = [];

      projects.forEach((project) => {
        allCombinedFundingSources.push(
          getProjectsCombinedFundingSourcesByCurrency(project.funding_sources),
        );
      });

      return allCombinedFundingSources;
    },
    [getProjectsCombinedFundingSourcesByCurrency],
  );

  const getProjectsTotalFundingRank = useCallback(
    (fundingSources: ProjectFundingSource[]) => {
      const total =
        getProjectsCombinedFundingSourcesByCurrency(fundingSources)["TOTAL"];

      const allCombinedFundingSources =
        getAllProjectsCombinedFundingSourcesByCurrency(projects);

      const sorted = allCombinedFundingSources
        .map((d) => d["TOTAL"])
        .sort((a, b) => b - a);

      const rank = sorted.indexOf(total) + 1;

      return rank;
    },
    [
      getAllProjectsCombinedFundingSourcesByCurrency,
      getProjectsCombinedFundingSourcesByCurrency,
      projects,
    ],
  );

  const getMaxTotalFundingAmount = useCallback(() => {
    const allCombinedFundingSources =
      getAllProjectsCombinedFundingSourcesByCurrency(projects);

    const maxTotalFundingAmount = Math.max(
      ...allCombinedFundingSources.map((d) => d["TOTAL"]),
    );

    return maxTotalFundingAmount;
  }, [getAllProjectsCombinedFundingSourcesByCurrency, projects]);

  const getAwardedRank = useCallback((awarded: number) => {
    // const awarded = project.awarded;

    // const awardedRank = projects
    //   .map((d) => d.awarded)
    //   .filter((d) => d !== -1)
    //   .sort((a, b) => b - a)
    //   .indexOf(awarded) + 1;

    const awardedRank =
      RPGF3Results.sort((a, b) => b.awarded - a.awarded).findIndex(
        (d) => d.awarded === awarded,
      ) + 1;

    return awardedRank;
  }, []);

  const getMaxAwardedAmount = useCallback(() => {
    const maxAwardedAmount = Math.max(
      ...RPGF3Results.map((d) => d.awarded).filter((d) => d !== -1),
    );

    return maxAwardedAmount;
  }, []);

  const [minListOPAmount, maxListOPAmount] = useMemo<[number, number]>(() => {
    if (!listAmountsByProjectId || !listAmountsByProjectId?.listAmounts)
      return [0, 0];

    const listOPAmounts = Object.values(
      listAmountsByProjectId.listAmounts,
    ).flatMap((listAmounts) =>
      listAmounts.map((listAmount) =>
        listAmount.listContent.length > 0
          ? listAmount.listContent[0].OPAmount
          : 0,
      ),
    );

    return [Math.min(...listOPAmounts), Math.max(...listOPAmounts)];
  }, [listAmountsByProjectId]);

  // const totalsForProjectsInQuorum = useMemo(() => {
  //   if (!listAmountsByProjectId) return 0;
  //   if (!projectsResponse) return 0;

  //   // get projects over 17 ballots
  //   const projectsOverQuorum = projectsResponse.projects.filter((project) => project.included_in_ballots >= 17);

  //   const listOPAmounts = projectsOverQuorum.map((project) => listAmountsByProjectId.listQuartiles[project.id]);

  //   const totals = listOPAmounts.reduce((acc, curr) => {
  //     acc.median += curr.median;
  //     acc.q1 += curr.q1;
  //     acc.q3 += curr.q3;
  //     acc.min += curr.min;
  //     acc.max += curr.max;
  //     return acc;
  //   }, {
  //     median: 0,
  //     q1: 0,
  //     q3: 0,
  //     min: 0,
  //     max: 0,
  //   });

  //   return totals;

  // }, [projectsResponse, listAmountsByProjectId]);

  const getListAmountsCell = useCallback(
    (info) => {
      if (!listAmountsByProjectId || !listAmountsByProjectId.listQuartiles)
        return null;

      return (
        <div className="w-full whitespace-nowrap text-ellipsis relative overflow-visible">
          {listAmountsByProjectId.listQuartiles[info.row.original.id].min +
            listAmountsByProjectId.listQuartiles[info.row.original.id].max >
            0 &&
            !Number.isNaN(
              listAmountsByProjectId.listQuartiles[info.row.original.id].min,
            ) &&
            !Number.isNaN(
              listAmountsByProjectId.listQuartiles[info.row.original.id].max,
            ) && (
              <div className="flex text-[0.55rem] text-forest-900/60 dark:text-forest-500/60 font-inter font-light leading-[1]">
                <div className="absolute left-0 -top-1.5">
                  {formatNumber(
                    listAmountsByProjectId.listQuartiles[info.row.original.id]
                      .min,
                    true,
                  )}
                </div>
                <div className="absolute right-0 left-0 -top-1.5 text-center">
                  —
                </div>
                <div className="absolute right-0 -top-1.5">
                  {formatNumber(
                    listAmountsByProjectId.listQuartiles[info.row.original.id]
                      .max,
                    true,
                  )}
                </div>
              </div>
            )}
          {/* {listAmountsByProjectId && listAmountsByProjectId.listAmounts[info.row.original.id].length > 0 &&
        (<Tooltip placement="left">
          <TooltipTrigger className="w-full"> */}
          <div className="text-[0.7rem] font-normal w-full flex space-x-0.5 items-center font-inter mt-1">
            {listAmountsByProjectId.listQuartiles[info.row.original.id].q3 >
              1 ? (
              <>
                <div className=" text-forest-900 dark:text-forest-500 font-light leading-[1] text-right">
                  {formatNumber(
                    listAmountsByProjectId.listQuartiles[info.row.original.id]
                      .q1,
                    true,
                  )}
                </div>
                <div className="flex-1 text-forest-900/50 dark:text-forest-500/50">
                  -
                </div>
                <div className="text-forest-900 dark:text-forest-500 font-light leading-[1] text-right">
                  {formatNumber(
                    listAmountsByProjectId.listQuartiles[info.row.original.id]
                      .q3,
                    true,
                  )}{" "}
                  <span className="text-[0.6rem]">OP</span>
                </div>
              </>
            ) : (
              <div className="flex-1 text-forest-900/80 dark:text-forest-500 font-light leading-[1] text-right">
                {formatNumber(
                  listAmountsByProjectId.listQuartiles[info.row.original.id]
                    .median,
                  true,
                )}{" "}
                <span className="text-[0.6rem]">OP</span>
              </div>
            )}
          </div>
          <div className="relative bottom-[8px] left-0 right-0 text-xs font-normal text-right h-[2px]">
            <BoxPlot
              {...{
                ...listAmountsByProjectId.listQuartiles[info.row.original.id],
                globalMin: 0,
                globalMax: 5000000,
              }}
            />
          </div>

          {/* </TooltipTrigger>
          <TooltipContent className="z-50 flex items-center justify-center">
            <div className="flex flex-col space-y-0.5 px-0.5 py-0.5 pt-1 text-[0.65rem] font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-2xl shadow-lg z-50">
              <div className="px-3 text-sm">{info.row.original.display_name}</div>
              <div className="px-3 flex justify-between">{["min", "q1", "median", "q3", "max"].map((key, i) => (
                listAmountsByProjectId.listQuartiles[info.row.original.id][key] !== undefined && listAmountsByProjectId.listQuartiles[info.row.original.id][key] !== null &&
                (<div key={i} className="flex items-center space-x-1">
                  <div className="text-[0.6rem] font-semibold capitalize">{key.slice(0, 3)}</div>
                  <div className="text-[0.6rem] font-light font-inter">{formatNumber(listAmountsByProjectId.listQuartiles[info.row.original.id][key], true)}</div>
                </div>)
              ))}</div>
              {listAmountsByProjectId.listAmounts[info.row.original.id].filter(l => l.listContent.length > 0).sort(
                (a, b) => a.listContent[0].OPAmount - b.listContent[0].OPAmount
              ).map((list, i) => (
                list.listContent.map((listContentItem, j) => (
                  <div key={`${i}${j}`} className="flex px-3 py-0.5 justify-between items-center border border-forest-900/20 dark:border-forest-500/20 rounded-full">
                    <div className="flex flex-col text-[0.6rem] leading-snug">
                      <div className="w-48 font-medium whitespace-nowrap overflow-hidden overflow-ellipsis">{list.listName}</div>
                      <div className="font-light text-forest-900/80 dark:text-forest-500/80">
                        {list.listAuthor.resolvedName.name ? (
                          <>{list.listAuthor.resolvedName.name}</>
                        ) : (
                          <>
                            {list.listAuthor.address.slice(
                              0,
                              5,
                            ) +
                              "..." +
                              list.listAuthor.address.slice(
                                -8,
                              )}
                          </>
                        )}
                      </div>

                    </div>
                    <div className="w-16 font-inter font-[600] text-xs text-right">
                      {formatNumber(listContentItem.OPAmount, true)}{" "}<span className="text-[10px] font-light text-forest-900/80 dark:text-forest-500/80">OP</span>
                    </div>
                  </div>
                ))

              ))}
            </div>
          </TooltipContent>
        </Tooltip>)} */}
        </div>
      );
    },
    [listAmountsByProjectId, minListOPAmount, maxListOPAmount],
  );

  const getFundingSourcesCell = useCallback(
    (info) => {
      return (
        <div className="w-full whitespace-nowrap text-ellipsis relative">
          <div className="absolute -left-0 -top-2.5 text-[0.6rem] text-forest-900/30 dark:text-forest-500/30 font-light leading-[1]">
            #{getProjectsTotalFundingRank(info.row.original.funding_sources)}
          </div>
          <div className="text-[11px] font-normal w-full flex justify-between font-inter mt-1">
            <div className="flex space-x-1">
              {["TOTAL"]
                .map((currency) => [
                  currency,
                  getProjectsCombinedFundingSourcesByCurrency(
                    info.row.original.funding_sources,
                  )[currency],
                ])
                .map(([currency, value]) => (
                  <div key={currency}>
                    <span className="opacity-60 text-[0.55rem]">$</span>
                    {`${formatNumber(
                      parseInt(value as string),
                      false,
                    ).toLocaleString("en-GB")}`}
                  </div>
                ))
                .reduce((prev, curr) => {
                  return prev.length === 0
                    ? [curr]
                    : [prev, <div key={curr[0]}>&</div>, curr];
                }, [])}
              <div className="w-4"></div>
            </div>
          </div>
          <div className="relative -bottom-[2px] left-0 right-0 text-xs font-normal text-right h-[2px]">
            <div
              className="absolute"
              style={{
                height: "2px",
                width: `100%`,
              }}
            >
              <div
                className=" bg-forest-900 dark:bg-forest-500"
                style={{
                  height: "2px",

                  width: `${(getProjectsCombinedFundingSourcesByCurrency(
                    info.row.original.funding_sources,
                  )["TOTAL"] /
                    getMaxTotalFundingAmount()) *
                    100.0
                    }%`,
                  // right with bases on bottom and right
                }}
              ></div>
            </div>
            <div
              className="absolute bg-forest-900/30 dark:bg-forest-500/30"
              style={{
                height: "2px",
                width: `100%`,
              }}
            />
          </div>
        </div>
      );
    },
    [
      getMaxTotalFundingAmount,
      getProjectsCombinedFundingSourcesByCurrency,
      getProjectsTotalFundingRank,
    ],
  );

  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        header: "",
        id: "profile",
        size: 60,
        cell: (info) => (
          <>
            <div className="flex justify-between items-center relative space-x-2 -ml-1">
              {/* <div className="w-4 h-4 flex items-center justify-center text-xs">
                {info.table
                  .getSortedRowModel()
                  .rows.findIndex((d) => d.id === info.row.id) + 1}
              </div> */}
              <div className="w-8 h-8 border border-forest-900/20 dark:border-forest-500/20 rounded-full overflow-hidden">
                {info.row.original.profile.profileImageUrl && (
                  <Image
                    src={info.row.original.profile.profileImageUrl}
                    alt={info.row.original.display_name}
                    width={32}
                    height={32}
                    className="rounded-full"
                    loading="lazy"
                  />
                )}
              </div>

              <div className="text-[0.6rem] text-forest-900/80 dark:text-forest-500/80 font-light w-0 overflow-visible">
                {/* {info.table
                  .getSortedRowModel()
                  .rows.findIndex((d) => d.id === info.row.id) + 1} */}

                {getAwardedRank(RPGF3ResultsById[info.row.original.id].awarded)}
              </div>
            </div>
          </>
        ),
        meta: {
          headerStyle: { textAlign: "left" },
        },
      },
      {
        header: "Project",
        accessorKey: "display_name",
        // size: 160,
        cell: (info) => (
          <div className="w-full flex items-center  space-x-2">
            <div className="w-4 h-4">
              {info.row.original.profile.websiteUrl && (
                <Link
                  href={info.row.original.profile.websiteUrl}
                  target="_blank"
                >
                  <Icon
                    icon="feather:external-link"
                    className="w-4 h-4 text-forest-900/80 dark:text-forest-500/80"
                  />
                </Link>
              )}
            </div>

            <div
              className="flex-1 overflow-hidden text-ellipsis font-bold whitespace-nowrap"
            // style={{ whiteSpace: "pre-wrap" }}
            >
              {info.row.original.display_name}
            </div>
          </div>
        ),
        meta: {
          headerStyle: { textAlign: "left" },
        },
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.display_name;
          const b = rowB.original.display_name;

          // If both are equal, return 0.
          if (a === b) return 0;

          // Otherwise, sort by whether a is greater than or less than b.
          return a.localeCompare(b) === 1 ? 1 : -1;
        },
      },
      {
        header: "",
        id: "links",
        size: 30,
        cell: (info) => (
          <div className="w-full flex justify-between items-center">
            <div className="border-2 rounded-md border-forest-900/20 dark:border-forest-500/20 p-1 hover:bg-forest-900/10 dark:hover:bg-forest-500/10">
              <Link
                href={`https://vote.optimism.io/retropgf/3/application/${info.row.original.id.split("|")[1]
                  }`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Icon
                  icon="gtp:agora"
                  className="w-3 h-3 text-forest-900/80 dark:text-forest-500/80"
                />
              </Link>
            </div>
          </div>
        ),
      },
      {
        header: "Applicant",
        accessorKey: "applicant",
        size: 120,
        cell: (info) => (
          <div className="w-full flex space-x-2 items-center overflow-hidden whitespace-nowrap text-ellipsis">
            <div className="w-6 h-6 flex items-center justify-center">
              {info.row.original.applicant_type === "PROJECT" ? (
                <Icon
                  icon={"clarity:users-solid"}
                  className="w-6 h-6 text-forest-900/80 dark:text-forest-500/80 fill-current"
                />
              ) : (
                <Icon
                  icon={"clarity:user-solid"}
                  className="w-6 h-4 text-forest-900/80 dark:text-forest-500/80 fill-current"
                />
              )}
            </div>
            <Link
              rel="noopener noreferrer"
              target="_blank"
              href={`https://optimistic.etherscan.io/address/${info.row.original.applicant.address.address}`}
              className={`rounded-full px-1 py-0 border border-forest-900/20 dark:border-forest-500/20 font-mono text-[10px] ${info.row.original.applicant.address.resolvedName.name
                ? "text-forest-900 dark:text-forest-500"
                : "text-forest-900/50 dark:text-forest-500/50"
                } hover:bg-forest-900/10 dark:hover:bg-forest-500/10`}
            >
              {info.row.original.applicant.address.resolvedName.name ? (
                <>{info.row.original.applicant.address.resolvedName.name}</>
              ) : (
                <>
                  {info.row.original.applicant.address.resolvedName.address.slice(
                    0,
                    5,
                  ) +
                    "..." +
                    info.row.original.applicant.address.resolvedName.address.slice(
                      -8,
                    )}
                </>
              )}
            </Link>
          </div>
        ),
        meta: {
          headerStyle: { textAlign: "left" },
        },
        sortingFn: (rowA, rowB) => {
          const nameA = rowA.original.applicant.address.resolvedName.name;
          const nameB = rowB.original.applicant.address.resolvedName.name;

          // if both are undefined, check if addressA is greater than addressB
          if (!nameA && !nameB) {
            const addressA = rowA.original.applicant.address.address;
            const addressB = rowB.original.applicant.address.address;

            if (addressA === addressB) return 0;

            // addresses are strings
            return addressA > addressB ? 1 : -1;
          }

          if (!nameA) return 1;

          if (!nameB) return -1;

          // If both are equal, return 0.
          if (nameA === nameB) return 0;

          // Otherwise, sort by whether a is greater than or less than b.
          return nameA > nameB ? 1 : -1;
        },
      },
      {
        header: "Result",
        size: 80,
        accessorKey: "awarded",
        cell: (info) => (
          <div className="w-full whitespace-nowrap text-ellipsis relative text-right">
            {RPGF3ResultsById[info.row.original.id].awarded > 0 ? (
              // <div className="rounded-md bg-[#FF0420]/60 px-1.5 py-0.5 font-medium">{formatNumber(info.row.original.awarded * - 20000, true)} OP</div>
              <>
                <div className="absolute inset-0 bg-gradient-to-tr border from-[#FF0420]/30 via-[#FF0420]/50 to-[#FF0420]/30 border-forest-900/20 dark:border-forest-500/20 -m-1.5 -mt-2 rounded-sm"></div>

                <div className="absolute -left-1 -top-1.5 text-[0.6rem] text-forest-900 dark:text-forest-500 leading-[1]">
                  #
                  {getAwardedRank(
                    RPGF3ResultsById[info.row.original.id].awarded,
                  )}
                </div>
                <Tooltip placement="right">
                  <TooltipTrigger>
                    <div className="text-[12px]  text-forest-900 dark:text-forest-100 font-bold  w-full flex justify-end font-inter mt-1">
                      <div className="rounded-sm px-0.5 w-full text-right z-20">
                        {formatNumber(
                          RPGF3ResultsById[info.row.original.id].awarded,
                          true,
                        )}{" "}
                        OP
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="z-50 flex items-center justify-center">
                    <div className="ml-2 px-3 py-1.5 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 flex flex-col space-y-1">
                      <div className="text-xs text-center">Award Amount</div>
                      <div className="flex justify-between space-x-1 font-bold items-end leading-snug">
                        <div className="flex-1 text-right">
                          {RPGF3ResultsById[
                            info.row.original.id
                          ].awarded.toLocaleString("en-GB")}
                        </div>
                        <div className="text-left opacity-60 text-xs font-normal">
                          OP
                        </div>
                      </div>
                      {projectsResponse?.prices.optimism.usd && (
                        <>
                          <div className="flex justify-between space-x-1 items-end">
                            <div className="flex-1 text-right">
                              <span className="opacity-60 text-[0.65rem]">
                                $
                              </span>
                              {Math.round(
                                projectsResponse.prices.optimism.usd *
                                RPGF3ResultsById[info.row.original.id]
                                  .awarded,
                              ).toLocaleString("en-GB")}
                            </div>
                            <div className="text-left opacity-60 text-[0.65rem]">
                              USD
                            </div>
                          </div>
                          {/* <div className="text-[0.6rem] text-center opacity-60">@ ${projectsResponse.prices.optimism.usd} / OP</div> */}
                        </>
                      )}
                      <div className="text-xs text-center opacity-60">
                        Median Amount:{" "}
                        {RPGF3ResultsById[
                          info.row.original.id
                        ].result_median_amount.toLocaleString("en-GB")}{" "}
                        OP
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
                <div className="relative -bottom-[2px] left-0 right-0 text-xs font-normal text-right h-[2px]">
                  <div
                    className="absolute"
                    style={{
                      height: "2px",
                      width: `100%`,
                    }}
                  >
                    <div
                      className=" sbg-[#FF0420] sdark:bg-[#FF0420] bg-forest-900 dark:bg-forest-100"
                      style={{
                        height: "2px",

                        width: `${(RPGF3ResultsById[info.row.original.id].awarded /
                          getMaxAwardedAmount()) *
                          100.0
                          }%`,
                        // right with bases on bottom and right
                      }}
                    ></div>
                  </div>
                  <div
                    className="absolute sbg-forest-900/30 bg-forest-900/30 dark:bg-forest-100/30"
                    style={{
                      height: "2px",
                      width: `100%`,
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="font-normal w-full flex justify-end font-inter">
                <div className="flex space-x-1">
                  <div className="text-forest-900/50 dark:text-forest-500/50">
                    —
                  </div>
                </div>
              </div>
            )}
          </div>
        ),
        meta: {
          headerAlign: { marginLeft: "auto", flexDirection: "row-reverse" },
        },
        sortingFn: (rowA, rowB) => {
          const a = RPGF3ResultsById[rowA.original.id].awarded;
          const b = RPGF3ResultsById[rowB.original.id].awarded;

          // If both are equal, return 0.
          if (a === b) return 0;

          // Otherwise, sort by whether a is greater than or less than b.
          return a > b ? 1 : -1;
        },
      },
      {
        header: "In Ballots",
        accessorKey: "included_in_ballots",
        size: 70,
        cell: (info) => (
          <div className="w-full overflow-hidden whitespace-nowrap text-ellipsis flex justify-end items-center">
            <div className="flex items-center space-x-2">
              <div className="text-[0.9rem] font-medium leading-[1.2] font-inter">
                {RPGF3ResultsById[info.row.original.id].result_ballots}
              </div>
              <div className="w-4 h-4">
                <Icon
                  icon={"feather:check-square"}
                  className={`w-4 h-4  fill-current ${RPGF3ResultsById[info.row.original.id].result_quorum
                    ? "text-green-500 dark:text-green-500"
                    : "text-forest-900/80 dark:text-forest-500/80"
                    }`}
                />
              </div>
            </div>
          </div>
        ),
        meta: {
          headerAlign: { marginLeft: "auto", flexDirection: "row-reverse" },
        },
        sortingFn: (rowA, rowB) => {
          const a = RPGF3ResultsById[rowA.original.id].result_ballots;
          const b = RPGF3ResultsById[rowB.original.id].result_ballots;

          // If both are equal, return 0.
          if (a === b) return 0;

          // Otherwise, sort by whether a is greater than or less than b.
          return a > b ? 1 : -1;
        },
      },
      {
        header: "In Lists",
        accessorKey: "lists",
        size: 70,
        cell: (info) => (
          <>
            <div className="w-full whitespace-nowrap text-ellipsis relative">
              {/* {listAmountsByProjectId?.numUniqueAuthors[info.row.original.id] && <div className="absolute right-0 -bottom-[11px] flex space-x-1 text-[0.55rem] text-forest-900/30 dark:text-forest-500/30 font-light leading-[1]">
                <div className="flex justify-center items-center rounded-sm text-forest-900/30 dark:text-forest-500/30" >{listAmountsByProjectId.numUniqueAuthors[info.row.original.id]}</div>
                <div>
                  {listAmountsByProjectId.numUniqueAuthors[info.row.original.id] > 1 ? "authors" : "author"}
                </div>
              </div>} */}
              <div className="font-normal w-full flex justify-end font-inter">
                <div className="flex space-x-1">
                  <div>
                    {listAmountsByProjectId &&
                      listAmountsByProjectId["listCounts"][
                      info.row.original.id
                      ]}
                  </div>
                  <div className="w-4 h-4 text-forest-900/80 dark:text-forest-500/80">
                    <Icon icon={"feather:list"} className={`w-4 h-4`} />
                  </div>
                </div>
              </div>
            </div>
          </>
        ),
        meta: {
          headerAlign: { marginLeft: "auto", flexDirection: "row-reverse" },
        },
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.lists.length;
          const b = rowB.original.lists.length;

          // If both are equal, return 0.
          if (a === b) return 0;

          // Otherwise, sort by whether a is greater than or less than b.
          return a > b ? 1 : -1;
        },
      },
      {
        header: "List Amounts",
        accessorKey: "list_amounts",
        size: 100,
        cell: (info) => getListAmountsCell(info),
        sortingFn: (rowA, rowB) => {
          if (!listAmountsByProjectId) return 0;
          const a =
            listAmountsByProjectId.listQuartiles[rowA.original.id].median;
          const b =
            listAmountsByProjectId.listQuartiles[rowB.original.id].median;

          if (Number.isNaN(a) && Number.isNaN(b)) return 0;

          if (Number.isNaN(a)) return -1;

          if (Number.isNaN(b)) return 1;

          // If both are equal, return 0.
          if (a === b) return 0;

          // Otherwise, sort by whether a is greater than or less than b.
          return a > b ? 1 : -1;
        },
      },
      {
        header: () => (
          <div>
            <div className="flex">
              Funding Reported
              <div className="relative">
                <Tooltip placement="left" allowInteract>
                  <TooltipTrigger>
                    <Icon
                      icon="feather:info"
                      className="w-4 h-4 absolute left-3 top-0"
                    />
                  </TooltipTrigger>
                  <TooltipContent className="z-50 flex items-center justify-center">
                    <div className="-mr-3.5 px-3 py-1.5 w-64 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 flex items-center">
                      <div className="flex flex-col text-xs space-y-1">
                        <div className="font-light">
                          Total{" "}
                          <span className="font-semibold">
                            Funding Reported
                          </span>{" "}
                          is calculated based on the project&apos;s reported USD
                          and OP amounts.
                        </div>
                        <div className="flex flex-col">
                          <div className="font-light">
                            For OP tokens we calculated with $1.35
                          </div>
                          <div className="text-[0.65rem] leading-snug text-forest-900/80 dark:text-forest-500/80">
                            (OP price when RPGF applications were closed).
                          </div>
                        </div>
                        <div className="font-light text-[0.7rem] leading-tight pt-2">
                          <span className="font-medium">Note:</span> The
                          application requirements for RPGF3 specified
                          disclosure of funding sources from the OP Collective
                          only; VC and other sources were often not included.
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        ),
        accessorKey: "funding_sources",
        size: 140,
        cell: (info) => getFundingSourcesCell(info),
        meta: {
          headerAlign: { textAlign: "left" },
        },
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = getProjectsCombinedFundingSourcesByCurrency(
            rowA.original.funding_sources,
          )["TOTAL"];

          const b = getProjectsCombinedFundingSourcesByCurrency(
            rowB.original.funding_sources,
          )["TOTAL"];

          // If both are equal, return 0.
          if (a === b) return 0;

          // Otherwise, sort by whether a is greater than or less than b.
          return a > b ? 1 : -1;
        },
      },
      {
        header: "Funding Split",
        id: "funding_split",
        accessorKey: "funding_sources",
        size: 140,
        cell: (info) => {
          return (
            <div className="w-full overflow-x whitespace-nowrap text-ellipsis relative">
              <Tooltip placement="left">
                <TooltipTrigger className="w-full">
                  {listAmountsByProjectId &&
                    Object.values(
                      listAmountsByProjectId.retropgfStatus[
                      info.row.original.id
                      ],
                    ).filter((value) => value).length > 0 && (
                      <div className="absolute right-0 -top-2.5 text-[0.6rem] text-forest-900/40 dark:text-forest-500/40 font-light leading-[1] flex space-x-1 items-center">
                        <div className="leading-snug">RetroPGF</div>
                        {Object.entries(
                          listAmountsByProjectId.retropgfStatus[
                          info.row.original.id
                          ],
                        ).map(([key, value]) => (
                          <div key={key}>
                            {value !== null && value > 0 ? (
                              <div className="flex w-2.5 h-2.5 justify-center font-medium bg-[#FE5468]/40 text-[#FE5468] rounded-full text-[0.55rem] font-mono leading-snug">
                                {key.replace(/[^0-9]/g, "")}
                              </div>
                            ) : (
                              <div className="flex w-2.5 h-2.5 justify-center font-medium invisible">
                                {key.replace(/[^0-9]/g, "")}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  <div className="text-[11px] font-normal w-full flex justify-between font-inter mt-1">
                    <div className="w-full flex justify-between">
                      {["USD", "OP"]
                        .map((currency) => [
                          currency,
                          getProjectsCombinedFundingSourcesByCurrency(
                            info.row.original.funding_sources,
                          )[currency],
                        ])
                        // .filter(([currency, value]) => value !== 0)
                        .map(([currency, value]) => (
                          <div
                            key={currency}
                            className="flex space-x-1 text-[0.6rem]"
                          >
                            {(value as number) > 0 ? (
                              <>
                                <div
                                  className={
                                    currency === "OP"
                                      ? "text-[#FE5468] leading-[1.6] font-[500]"
                                      : "text-[#7fdcd6] leading-[1.6] font-[400]"
                                  }
                                >
                                  {currency === "USD" && (
                                    <span className="opacity-60 text-[0.55rem]">
                                      $
                                    </span>
                                  )}
                                  {parseInt(value as string).toLocaleString("en-GB")}
                                  {currency === "OP" && (
                                    <>
                                      {" "}
                                      <span className="opacity-60 text-[0.55rem]">
                                        OP
                                      </span>
                                    </>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="text-forest-900/30 dark:text-forest-500/30">
                                0
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-0 right-0 text-xs font-normal text-right">
                    <div
                      className="relative z-10"
                      style={{
                        height: "2px",
                        width: `${(getProjectsCombinedFundingSourcesByCurrency(
                          info.row.original.funding_sources,
                        )["TOTAL"] /
                          getProjectsCombinedFundingSourcesByCurrency(
                            info.row.original.funding_sources,
                          )["TOTAL"]) *
                          100.0
                          }%`,
                      }}
                    >
                      <div
                        className="absolute bg-[#7fdcd6]"
                        style={{
                          height: "2px",
                          width: `${(getProjectsCombinedFundingSourcesByCurrency(
                            info.row.original.funding_sources,
                          )["USD"] /
                            getProjectsCombinedFundingSourcesByCurrency(
                              info.row.original.funding_sources,
                            )["TOTAL"]) *
                            100.0
                            }%`,
                        }}
                      ></div>
                      <div
                        className="absolute bg-[#FE5468]"
                        style={{
                          height: "2px",
                          left:
                            getProjectsCombinedFundingSourcesByCurrency(
                              info.row.original.funding_sources,
                            )["USD"] !== 0
                              ? `${(getProjectsCombinedFundingSourcesByCurrency(
                                info.row.original.funding_sources,
                              )["USD"] /
                                getProjectsCombinedFundingSourcesByCurrency(
                                  info.row.original.funding_sources,
                                )["TOTAL"]) *
                              100.0
                              }%`
                              : 0,
                          width: `${(getProjectsCombinedFundingSourcesByCurrency(
                            info.row.original.funding_sources,
                          )["OPUSD"] /
                            getProjectsCombinedFundingSourcesByCurrency(
                              info.row.original.funding_sources,
                            )["TOTAL"]) *
                            100.0
                            }%`,
                        }}
                      ></div>
                    </div>
                    <div
                      className="absolute inset-0 z-0 bg-forest-900/30 dark:bg-forest-500/30"
                      style={{
                        height: "2px",
                        width: `100%`,
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="z-50 flex items-center justify-center">
                  <div className="flex flex-col space-y-0.5 px-0.5 py-0.5 pt-1 text-[0.65rem] font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50">
                    <div className="px-3 text-sm">
                      {info.row.original.display_name}
                    </div>
                    {info.row.original.funding_sources
                      .sort((a, b) => {
                        const aType = a.type;
                        const bType = b.type;

                        const aAmount = a.amount;
                        const bAmount = b.amount;

                        if (aType === bType) {
                          if (aAmount === bAmount) return 0;
                          return aAmount - bAmount;
                        }

                        if (aType.localeCompare(bType) === 1) return 1;

                        if (aType.localeCompare(bType) === -1) return -1;

                        return 0;
                      })
                      .map((fundingSource, i) => (
                        <div
                          key={i}
                          className="flex px-3 py-0.5 justify-between items-center border border-forest-900/20 dark:border-forest-500/20 rounded-full"
                        >
                          <div className="flex flex-col text-[0.6rem] leading-snug">
                            <div className="w-48 font-medium whitespace-nowrap overflow-hidden overflow-ellipsis">
                              {fundingSource.type}
                            </div>
                            <div className="font-light text-forest-900/80 dark:text-forest-500/80">
                              {fundingSource.description}
                            </div>
                          </div>
                          <div className="w-16 flex justify-between font-inter font-[600] text-xs space-x-1">
                            <div className="flex-1 text-right">
                              {formatNumber(fundingSource.amount, true)}
                            </div>{" "}
                            <div className="w-4 text-left text-[10px] font-light text-forest-900/80 dark:text-forest-500/80">
                              {fundingSource.currency}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        },
        meta: {
          headerAlign: { textAlign: "left" },
        },
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = getProjectsCombinedFundingSourcesByCurrency(
            rowA.original.funding_sources,
          )["TOTAL"];

          const b = getProjectsCombinedFundingSourcesByCurrency(
            rowB.original.funding_sources,
          )["TOTAL"];

          // If both are equal, return 0.
          if (a === b) return 0;

          // Otherwise, sort by whether a is greater than or less than b.
          return a > b ? 1 : -1;
        },
      },
      // {
      //   header: "Headcount",
      //   id: "headcount",
      //   cell: (info) => (
      //     <div className="w-full overflow-x whitespace-nowrap text-ellipsis relative flex space-x-1">
      //       <div>{ProjectIdToOsoStatsMaps && ProjectIdToOsoStatsMaps[info.row.original.id] && parseInt(ProjectIdToOsoStatsMaps[info.row.original.id]["Avg Monthly Active Devs Last 6 Months"])}</div>
      //       <div>{ProjectIdToOsoStatsMaps && ProjectIdToOsoStatsMaps[info.row.original.id] && parseInt(ProjectIdToOsoStatsMaps[info.row.original.id]["Contributors Last 6 Months"])}</div>
      //     </div>
      //   )
      // },
      {
        header: () => (
          <div className="flex w-full justify-end">
            <div className="relative">
              <Tooltip placement="left" allowInteract>
                <TooltipTrigger className="absolute right-3 top-0">
                  <Icon icon="feather:info" className="w-4 h-4 " />
                </TooltipTrigger>
                <TooltipContent className="pr-0 z-50 flex items-center justify-center">
                  <div className="px-3 py-1.5 w-64 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 flex items-center">
                    <div className="flex flex-col text-xs space-y-1">
                      <div className="font-light">
                        <span className="font-semibold">VC Funding</span>{" "}
                        amounts are sourced from publicly available data and the
                        community.
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">Sources:</span>
                        <Link
                          rel="noopener noreferrer"
                          target="_blank"
                          href="https://twitter.com/zachxbt/status/1729290605711245573?t=QuUaMlTM1HHBDs_T4YAiNg&s=19"
                          className="underline font-light"
                        >
                          @ZachXBT
                        </Link>
                        <Link
                          rel="noopener noreferrer"
                          target="_blank"
                          href="https://defillama.com/raises"
                          className="underline font-light"
                        >
                          DefiLlama
                        </Link>
                      </div>
                      <div className="text-[0.7rem] font-light leading-snug pt-2">
                        If you have any feedback or suggestions, please
                        don&apos;t hesistate to contact us on{" "}
                        <Link
                          href="https://twitter.com/growthepie_eth"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          X/Twitter
                        </Link>
                        {" or "}
                        <Link
                          href="https://discord.gg/fxjJFe7QyN"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Discord
                        </Link>
                        .
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            VC Funding
          </div>
        ),
        accessorKey: "value_raised",
        size: 100,
        // id: "reported",
        cell: (info) => (
          <div className="w-full overflow-x whitespace-nowrap text-ellipsis relative flex justify-end font-inter text-sm">
            {info.row.original.value_raised !== null ? (
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  {info.row.original.value_raised > 0 ? (
                    <>
                      <div className="text-[0.9rem] font-medium leading-[1.2] font-inter flex items-end">
                        <div className="opacity-60 text-[0.65rem]">$</div>
                        {formatNumber(
                          info.row.original.value_raised,
                          true,
                        ).replace(".0", "")}
                      </div>
                      <div className="w-5 h-5">
                        <Icon
                          icon={"fluent:money-16-regular"}
                          className={`w-5 h-5 fill-current text-forest-900/80 dark:text-forest-500/80`}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-[0.7rem] font-medium leading-[1.2] font-inter flex items-end">
                      No VC Funding
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-forest-900/30 dark:text-forest-500/30 text-[0.6rem]">
                Unknown / DYOR
              </div>
            )}
          </div>
        ),
        meta: {
          headerAlign: { marginLeft: "auto", flexDirection: "row-reverse" },
        },
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.value_raised;
          const b = rowB.original.value_raised;

          if (a === null && b === null) return 0;

          if (a === null) return -1;

          if (b === null) return 1;

          // If both are equal, return 0.
          if (a === b) return 0;

          // Otherwise, sort by whether a is greater than or less than b.
          return a > b ? 1 : -1;
        },
      },
      {
        header: () => (
          <Tooltip placement="left" allowInteract>
            <TooltipTrigger>
              <Icon icon={"bx:coin"} className="w-6 h-6" />
            </TooltipTrigger>
            <TooltipContent className="pr-0 z-50 flex items-center justify-center">
              <div className="px-3 py-1.5 w-64 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 flex items-center">
                <div className="flex flex-col text-xs space-y-1">
                  <div className="">
                    <span className="font-bold">Has Token</span>{" "}
                    <span className="font-light">
                      indicates whether the project has a token and is sourced
                      from publicly available data and the community.
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="font-semibold">Sources:</span>
                    <Link
                      rel="noopener noreferrer"
                      target="_blank"
                      href="https://twitter.com/zachxbt/status/1729290605711245573?t=QuUaMlTM1HHBDs_T4YAiNg&s=19"
                      className="underline font-light"
                    >
                      @ZachXBT
                    </Link>
                    <Link
                      rel="noopener noreferrer"
                      target="_blank"
                      href="https://defillama.com/raises"
                      className="underline font-light"
                    >
                      DefiLlama
                    </Link>
                  </div>
                  <div className="text-[0.7rem] font-light leading-snug pt-2">
                    If you have any feedback or suggestions, please don &apos;t
                    hesistate to contact us on{" "}
                    <Link
                      href="https://twitter.com/growthepie_eth"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      X/Twitter
                    </Link>
                    {" or "}
                    <Link
                      href="https://discord.gg/fxjJFe7QyN"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Discord
                    </Link>
                    .
                  </div>
                  {/* <span className="font-light">is calculated based on the reported USD and OP amount.<br /><br />For OP tokens we calculated with $1.35 (OP price when RPGF applications were closed).<br /><br /><span className="font-bold">Note:</span> Projects only had to report funding they received from the collective, many didn&apos;t include VC funding and other funding sources.</span> */}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ),
        accessorKey: "has_token",
        size: 40,
        cell: (info) => (
          <div className="w-full flex justify-between items-center">
            <div className="w-6 h-6">
              {info.row.original.has_token && (
                <Tooltip placement="left">
                  <TooltipTrigger>
                    <Icon
                      icon={"game-icons:two-coins"}
                      className={`w-6 h-6 dark:text-yellow-400/80 text-yellow-500/80 fill-current`}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="pr-0 z-50 flex items-center justify-center">
                    <div className="px-3 py-1.5 text-sm font-medium bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg z-50 flex items-center">
                      <div className="text-xs space-x-1">
                        <span className="font-light">
                          This project has a{" "}
                          <span className="font-bold">token</span>.
                        </span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        ),
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.has_token;
          const b = rowB.original.has_token;

          // If both are equal, return 0.
          if (a === b) return 0;

          // Otherwise, sort by whether a is greater than or less than b.
          return a ? 1 : -1;
        },
      },

      {
        header: "Categories",
        accessorKey: "impact_category",
        // size: 500,
        cell: (info) => (
          <div className="w-full overflow-hidden whitespace-nowrap text-ellipsis pr-8">
            <div className="flex gap-x-0.5">
              {Object.keys(ImpactCategoriesMap).map((d) => (
                <div key={d} className="w-[35px]">
                  {info.row.original.impact_category.includes(d) ? (
                    <div
                      key={d}
                      className={`border-0 ${ImpactCategoriesMap[d].bg} ${ImpactCategoriesMap[d].textColor} px-1.5 py-0.5 rounded-sm flex items-center justify-center flex-col`}
                    >
                      {ImpactCategoriesMap[d].label.split("-").map((d) => (
                        <div
                          key={d}
                          className="leading-normal text-[0.5rem] font-semibold"
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      key={d}
                      className={`bg-gray-600/5 px-1.5 py-0.5 rounded-sm flex items-center justify-center flex-col`}
                    >
                      {ImpactCategoriesMap[d].label.split("-").map((d) => (
                        <div
                          key={d}
                          className="leading-normal text-[0.5rem] font-semibold opacity-0"
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ),
        meta: {
          headerStyle: { textAlign: "left" },
        },
        sortingFn: (rowA, rowB) => {
          const categoriesA: string = rowA.original.impact_category
            .sort((a: string, b: string) => {
              return a.localeCompare(b) === 1 ? 1 : -1;
            })
            .join("");
          const categoriesB: string = rowB.original.impact_category
            .sort((a: string, b: string) => {
              return a.localeCompare(b) === 1 ? 1 : -1;
            })
            .join("");

          // Otherwise, sort by whether a is greater than or less than b.
          return categoriesA > categoriesB ? 1 : -1;
        },
      },
    ],

    [
      ballotRankingByProjectId,
      getFundingSourcesCell,
      getListAmountsCell,
      getProjectsCombinedFundingSourcesByCurrency,
      listAmountsByProjectId,
    ],
  );

  const table = useReactTable<Project>({
    data,
    columns,
    state: {
      sorting,
    },
    enableMultiSort: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: useMemo(() => getSortedRowModel(), []),
  });

  const { rows } = table.getRowModel();

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
  });

  const Style = useMemo(
    () => (
      <style>
        {`
        table {
            border-collapse:separate;
            border-spacing:0 5px;
            margin-top:-5px;
        }
        
        td {
            border-color: ${theme === "light" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.16)"
          };
            border-width:1px;
            border-style:solid none;
            padding:5px 10px;
        }
        
        td:first-child {
            border-left-style:solid;
            border-top-left-radius:999px;
            border-bottom-left-radius:999px;
        }
        
        td:last-child {
            border-right-style:solid;
            border-bottom-right-radius:999px;
            border-top-right-radius:999px;
        }
      `}
      </style>
    ),
    [theme ?? "dark"],
  );

  const maxIncludedInBallots = useMemo(() => {
    if (!projects) return 0;
    return Math.max(...projects.map((d) => d.included_in_ballots));
  }, [projects]);

  const stringToHexColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++)
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return `#${"00000".substring(0, 6 - c.length)}${c}`;
  };

  const tableMinWidthClass = "min-w-[1280px]";

  const contentRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const { width: contentWidth } = useResizeObserver({
    ref: contentRef,
  });
  const { width: tableWidth } = useResizeObserver({
    ref: tableRef,

  });

  const [isTableWidthWider, setIsTableWidthWider] = useState(false);

  useLayoutEffect(() => {
    if (!contentWidth || !tableWidth) return;
    setIsTableWidthWider(tableWidth > contentWidth);
  }, [contentWidth, tableWidth]);

  const compileCSV = () => {
    if (!projects || !listAmountsByProjectId) return "";

    const data = projects.map((d) => {
      return {
        project_id: d.id.replace("Project|", ""),
        project_name: d.display_name,
        applicant_type: d.applicant_type,
        applicant_address: d.applicant.address.address,
        applicant_ens: d.applicant.address.resolvedName.name,
        award_result: RPGF3ResultsById[d.id].awarded,
        median_amount_result: RPGF3ResultsById[d.id].result_median_amount,
        ballot_result: RPGF3ResultsById[d.id].result_ballots,
        quorum_result: RPGF3ResultsById[d.id].result_quorum,
        included_in_ballots: d.included_in_ballots,
        // included_in_lists: d.lists.length,
        included_in_lists: listAmountsByProjectId["listCounts"][d.id],
        lists_min_amount: listAmountsByProjectId.listQuartiles[d.id].min ?? "",
        lists_quartile_1_amount:
          listAmountsByProjectId.listQuartiles[d.id].q1 ?? "",
        lists_median_amount:
          listAmountsByProjectId.listQuartiles[d.id].median ?? "",
        lists_quartile_3_amount:
          listAmountsByProjectId.listQuartiles[d.id].q3 ?? "",
        lists_max_amount: listAmountsByProjectId.listQuartiles[d.id].max ?? "",
        funding_reported_total: getProjectsCombinedFundingSourcesByCurrency(
          d.funding_sources,
        )["TOTAL"],
        funding_reported_usd: getProjectsCombinedFundingSourcesByCurrency(
          d.funding_sources,
        )["USD"],
        funding_reported_op: getProjectsCombinedFundingSourcesByCurrency(
          d.funding_sources,
        )["OP"],
        vc_funding: d.value_raised,
        has_token: d.has_token,
        impact_category: d.impact_category.join("|"),
      };
    });

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((d) => Object.values(d).join(",")),
    ].join("\n");

    return csv;
  };

  const handleExportCSV = () => {
    const csv = compileCSV();
    if (csv === "") return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "retropgf3_projects.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canDownloadCSV = useMemo(() => {
    if (!projects || !listAmountsByProjectId) return false;
    return (
      projects &&
      projects.length > 0 &&
      listAmountsByProjectId &&
      Object.keys(listAmountsByProjectId).length > 0
    );
  }, [listAmountsByProjectId, projects]);

  return (
    <>
      <ShowLoading
        dataLoading={[projectsLoading]}
        dataValidating={[projectsValidating]}

      />
      {/* <Container className={`mt-[0px] !pr-0 ${isSidebarOpen ? "min-[1550px]:!pr-[50px]" : "min-[1350px]:!pr-[50px]"}`} ref={containerRef}> */}
      <Container>
        <div
          className={`w-full flex justify-between items-center mt-[10px] mb-[10px]`}
          ref={contentRef}
        >
          <div className="flex w-full space-x-2">
            {/* {totalsForProjectsInQuorum && Object.keys(totalsForProjectsInQuorum).map((key) => (
              <div key={key} className="flex items-center space-x-1">
                <div className="text-xs font-light">total {key}: {formatNumber(totalsForProjectsInQuorum[key], true)}</div>
              </div>
            ))} */}

            <div className="relative flex flex-1">
              <input
                className="block rounded-full pl-10 pr-3 py-1.5 w-full font-medium text-xs text-forest-900  bg-forest-100 dark:bg-forest-1000 dark:text-forest-500 border border-forest-500 dark:border-forest-700 focus:outline-none hover:border-forest-900 dark:hover:border-forest-400 transition-colors duration-300"
                placeholder="Project Filter"
                value={displayNameFilter}
                onChange={(e) => {
                  setDisplayNameFilter(e.target.value);
                  // setDisplayNameFilter(e.target.value);
                  // router.push("/contracts/" + e.target.value);
                  // debouncedSearch();
                }}
              />
              <Icon
                icon="feather:search"
                className="w-6 h-6 absolute left-[10px] top-[8px] z-10 text-forest-900 dark:text-forest-500"
              />
              {displayNameFilter.length > 0 && (
                <div
                  className="absolute right-3 top-2 underline cursor-pointer text-forest-900 dark:text-forest-500 text-xs font-light leading-[1.2]"
                  onClick={() => {
                    setDisplayNameFilter("");
                  }}
                >
                  <Icon
                    icon="feather:x"
                    className="w-6 h-6 z-10 text-forest-900 dark:text-forest-500"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-end items-center text-xs font-normal space-y-1">
              {canDownloadCSV && (
                <div
                  onClick={handleExportCSV}
                  className="flex items-center space-x-1.5 cursor-pointer rounded-full px-4 py-2 bg-forest-50 dark:bg-forest-900 dark:text-forest-500 text-forest-900 font-medium"
                >
                  <Icon icon="feather:download" className="w-4 h-4" />
                  <div className="text-base font-semibold">Export CSV</div>
                </div>
              )}
              {/* <div className="text-forest-200 dark:text-forest-400">Last updated {lastUpdatedString}</div> */}
              {/* <div className="text-forest-200 dark:text-forest-400">Voting ended {moment.unix(1701982800).fromNow()}</div> */}
            </div>
          </div>
        </div>
      </Container>

      <Container
        className={`w-full mt-[0px] h-100 -mb-12 ${isTableWidthWider
          ? "!pr-0 !pl-[20px] md:!pl-[50px]"
          : "!px-[20px] md:!px-[50px]"
          }`}
      >
        <div
          className={`w-full ${isTableWidthWider
            ? "!pr-[20px] md:!pr-[50px] overflow-x-scroll"
            : "overflow-x-hidden"
            } z-100 scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller`}
        >
          <div className={tableMinWidthClass}>
            <div className="flex flex-col items-center justify-center w-full h-full relative">


              {Style}

              <div className={`${tableMinWidthClass} pr-4`}>
                <table className="table-fixed w-full" ref={tableRef}>
                  {/* <thead className="sticky top-0 z-50"> */}
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header, i) => {
                          return (
                            <th
                              key={header.id}
                              colSpan={header.colSpan}
                              style={{
                                width: header.getSize(),
                                paddingLeft: i === 0 ? "15px" : "15px",
                                paddingRight:
                                  i === headerGroup.headers.length
                                    ? "15px"
                                    : "10px",
                              }}
                              className="whitespace-nowrap relative"
                            >
                              {header.isPlaceholder ? null : (
                                <div className="w-full relative">
                                  <div
                                    className={
                                      header.column.getCanSort()
                                        ? `-mb-1 cursor-pointer select-none flex items-start text-forest-900 dark:text-forest-500 text-[11px] font-bold w-fit ${i === 0 ? "pl-[10px]" : ""
                                        }`
                                        : ""
                                    }
                                    style={{
                                      ...(header.column.columnDef.meta as any)
                                        ?.headerAlign,
                                    }}
                                    onClick={(e) => {
                                      const handler =
                                        header.column.getToggleSortingHandler();
                                      handler && handler(e);
                                    }}
                                  >
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                                    {{
                                      asc: (
                                        <Icon
                                          icon="feather:arrow-up"
                                          className="w-3 h-3"
                                        />
                                      ),
                                      desc: (
                                        <Icon
                                          icon="feather:arrow-down"
                                          className="w-3 h-3"
                                        />
                                      ),
                                    }[header.column.getIsSorted() as string] ??
                                      null}
                                    {/*projectsUniqueValues?.hasOwnProperty(header.id) &&
                                    dataUniqueValues?.hasOwnProperty(header.id) && (
                                      <div className="text-[11px] font-normal w-full text-right pr-3 font-inter">
                                        {dataUniqueValues[header.id] ===
                                          projectsUniqueValues[header.id] ? (
                                          projectsUniqueValues[
                                            header.id
                                          ].toLocaleString("en-GB")
                                        ) : (
                                          <>
                                            {dataUniqueValues[
                                              header.id
                                            ].toLocaleString("en-GB")}
                                            <span className="text-forest-900/30 dark:text-forest-500/30">
                                              {"/"}
                                              {projectsUniqueValues[
                                                header.id
                                              ].toLocaleString("en-GB")}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    )*/}
                                  </div>
                                  {/*projectsUniqueValues?.hasOwnProperty(header.id) &&
                                  dataUniqueValues?.hasOwnProperty(header.id) && (
                                    <div
                                      className={`absolute -bottom-1.5 ${i === 0
                                        ? "left-[30px] right-3"
                                        : "left-0 right-3"
                                        } text-xs font-normal text-right`}
                                    >
                                      <div
                                        className="bg-forest-900 dark:bg-forest-500"
                                        style={{
                                          height: "1px",
                                          width: `${(dataUniqueValues[header.id] /
                                            projectsUniqueValues[header.id]) *
                                            100.0
                                            }%`,
                                        }}
                                      />
                                      <div
                                        className="bg-forest-900/30 dark:bg-forest-500/30"
                                        style={{
                                          height: "1px",
                                          width: `100%`,
                                        }}
                                      />
                                    </div>
                                      )*/}
                                </div>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                </table>
              </div>
              <div
                className={`transition-[mask-size] duration-300 ease-in-out
                ${
                  // if scroll is at top or bottom, don't show the fade
                  parentRef.current &&
                    (parentRef.current.scrollTop < 30 ||
                      parentRef.current.scrollTop >
                      parentRef.current.scrollHeight -
                      parentRef.current.clientHeight -
                      30)
                    ? "fade-edge-div-vertical-hidden"
                    : "fade-edge-div-vertical"
                  }}`}
              >
                <div
                  ref={parentRef}
                  className="min-h-[300px] h-[calc(100vh-330px)] md:h-[calc(100vh-380px)] overflow-auto pr-2 scrollbar-thin scrollbar-thumb-forest-900 scrollbar-track-forest-500/5 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scroller"
                >
                  <div
                    style={{ height: `${virtualizer.getTotalSize()}px` }}
                    className="w-full"
                  >
                    {/* <div className="absolute top-10 left-0 right-0 h-5 z-10 bg-white dark:bg-forest-1000" /> */}
                    <table className="table-fixed w-full">
                      {/* <thead className="sticky top-0 z-50"> */}
                      <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header, i) => {
                              return (
                                <th
                                  key={header.id}
                                  colSpan={header.colSpan}
                                  style={{
                                    height: "0px",
                                    overflow: "hidden",
                                    width: header.getSize(),
                                    paddingLeft: i === 0 ? "15px" : "15px",
                                    paddingRight:
                                      i === headerGroup.headers.length
                                        ? "15px"
                                        : "10px",
                                    ...(header.column.columnDef.meta as any)
                                      ?.headerStyle,
                                  }}
                                  className={`${
                                    // i === 0
                                    //   ? "sticky top-0 z-20"
                                    //   : "sticky top-0 left-0 z-30"
                                    ""
                                    } bg-white dark:bg-forest-1000 whitespace-nowrap`}
                                >
                                  {header.isPlaceholder ? null : (
                                    <div
                                      {...{
                                        className: header.column.getCanSort()
                                          ? `-mb-2 cursor-pointer select-none flex items-start text-forest-900 dark:text-forest-500 text-[11px] font-bold h-0 ${i === 0 ? "pl-[10px]" : ""
                                          }`
                                          : "",
                                        onClick:
                                          header.column.getToggleSortingHandler(),
                                      }}
                                    >
                                      {/* {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {{
                                asc: (
                                  <Icon
                                    icon="feather:arrow-up"
                                    className="w-3 h-3"
                                  />
                                ),
                                desc: (
                                  <Icon
                                    icon="feather:arrow-down"
                                    className="w-3 h-3"
                                  />
                                ),
                              }[header.column.getIsSorted() as string] ?? null} */}
                                    </div>
                                  )}
                                </th>
                              );
                            })}
                          </tr>
                        ))}
                      </thead>
                      <tbody className="text-xs pb-4">
                        {virtualizer
                          .getVirtualItems()
                          .map((virtualRow, index) => {
                            const row = rows[virtualRow.index] as Row<Project>;
                            return (
                              <tr
                                key={row.id}
                                style={{
                                  height: `${virtualRow.size}px`,
                                  transform: `translateY(${virtualRow.start - index * virtualRow.size
                                    }px)`,
                                }}
                              >
                                {row.getVisibleCells().map((cell, i) => {
                                  return (
                                    <td
                                      key={cell.id}
                                      style={{
                                        paddingLeft: i === 0 ? "10px" : "15px",
                                      }}
                                      className={
                                        i === 0 ? "sticky left-0 z-10" : ""
                                      }
                                    >
                                      {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext(),
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <QuestionAnswer
          startOpen={false}
          className="z-50 rounded-3xl bg-forest-50 dark:bg-forest-900 px-[30px] py-[23px] flex flex-col absolute bottom-[240px] left-[20px] right-[20px] md:left-[50px] md:right-[50px]"
          question={"What can you see in this list?"}
          answer={
            <div className="text-xs lg:text-sm">
              <div>
                This is a list of all 643 projects that are part of RPGF3.
                Voting by badgeholders was in progress until December 7th. See
                here the voting results including the amount each project
                receives from RetroPGF3.
              </div>

              <div className="font-bold mt-3">Result</div>
              <div>
                Result is the amount each project got allocated during the
                voting period. This is the final result from all
                badgeholder&apos;s ballots.
              </div>

              <div className="font-bold mt-3">In Ballots</div>
              <div>
                A project needed at least 17 votes in order to receive funding
                through RPGF. When the checkmark is green, the project appeared
                in at least 17 ballots. Otherwise, the project will not receive
                any funding from RPGF3.
              </div>

              <div className="font-bold mt-3">Funding Reported</div>
              <div>
                Total Funding Reported is calculated based on the project&apos;s
                reported USD and OP amounts. For OP tokens we calculated with
                $1.35 (OP price when RPGF applications were closed). Note: The
                application requirements for RPGF3 specified disclosure of
                funding sources from the OP Collective only; VC and other
                sources were often not included.
              </div>

              <div className="font-bold mt-3">VC Funding</div>
              <div>
                VC Funding amounts are sourced from publicly available data and
                the community. Sources are mainly @ZachXBT, DefiLlama, and
                projects that approched us during the voting period. If you have
                any feedback or suggestions, please don&apos;t hesitate to
                contact us on X Twitter or Discord
              </div>
            </div>
          }
        />
      </Container>
    </>
  );
}

// The props type
type BoxPlotProps = {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  scale?: number; // To scale the plot within the table cell
  globalMin: number; // To scale the plot within the table cell
  globalMax: number; // To scale the plot within the table cell
};

const BoxPlot: React.FC<BoxPlotProps> = ({
  min,
  q1,
  median,
  q3,
  max,
  scale = 100,
  globalMin,
  globalMax,
}) => {
  // Function to calculate log-scaled position
  const getScalePos = (
    value: number,
    globalMin: number,
    globalMax: number,
    scale: number,
    mode: "log" | "linear" | "sqrt" = "sqrt",
  ) => {
    if (mode === "linear") {
      const position = (value / globalMax) * scale;
      return position;
    }

    if (mode === "sqrt") {
      const position = (Math.sqrt(value) / Math.sqrt(globalMax)) * scale;
      return position;
    }

    const logMin = Math.log(globalMin <= 0 ? 1 : globalMin);
    const logMax = Math.log(globalMax);
    const logValue = Math.log(value <= 0 ? 1 : value);
    const logRange = logMax - logMin;
    const logPosition = logValue - logMin;
    const position = (logPosition / logRange) * scale;
    return position;
  };

  // Calculate positions using log scale
  const minPos = getScalePos(min, globalMin, globalMax, scale);
  const q1Pos = getScalePos(q1, globalMin, globalMax, scale);
  const medianPos = getScalePos(median, globalMin, globalMax, scale);
  const q3Pos = getScalePos(q3, globalMin, globalMax, scale);
  const maxPos = getScalePos(max, globalMin, globalMax, scale);

  if (!q1 && !q3)
    return (
      <div
        className="relative flex items-center h-6"
        style={{ width: `${scale}%` }}
      >
        {/* spacer */}
        <div style={{ width: `${medianPos}px` }}></div>
        {/* Line for median */}
        <div
          className="h-[4px] -mb-[1px] bg-forest-900 dark:bg-forest-500"
          style={{ left: `0%`, width: "1px" }}
        ></div>
        {/* background */}
        <div className="absolute -mt-[2px] w-full h-[2px] bg-forest-900/20 dark:bg-forest-500/20 rounded-xs -z-10" />
      </div>
    );

  return (
    <div
      className="relative flex items-center h-6"
      style={{ width: `${scale}%` }}
    >
      {/* spacer */}
      <div style={{ width: `${minPos}px` }}></div>
      {/* Line for min to Q1 */}
      <div
        className="h-[2px] -mt-[2px]  bg-forest-900/50 dark:bg-forest-500/50"
        style={{ width: `${q1Pos - minPos}%` }}
      ></div>
      {/* Box for Q1 to Q3 */}
      <div
        className="relative h-[3px] rounded-xs bg-forest-900/80 dark:bg-forest-500/80"
        style={{ width: `${medianPos - q1Pos}%` }}
      />
      {/* Line for median */}
      <div
        className="h-[4px] -mb-[1px] bg-forest-900 dark:bg-forest-500"
        style={{ left: `0%`, width: "1px" }}
      ></div>
      {/* </div> */}
      <div
        className="relative h-[3px] rounded-xs bg-forest-900/80 dark:bg-forest-500/80"
        style={{ width: `${q3Pos - medianPos}%` }}
      />
      {/* Line for Q3 to max */}
      <div
        className="h-[2px] -mt-[2px]  bg-forest-900/50 dark:bg-forest-500/50"
        style={{ width: `${maxPos - q3Pos}%` }}
      ></div>
      {/* background */}
      <div className="absolute -mt-[2px] w-full h-[2px] bg-forest-900/20 dark:bg-forest-500/20 rounded-xs -z-10" />
    </div>
  );
};

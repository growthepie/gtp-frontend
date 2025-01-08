"use client";
// data context for the Octant dashboard
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { OctantURLs } from '@/lib/urls'
import useSWR from 'swr'
import { has } from 'lodash';

export const OctantProviders = ({ children }) => {

  return (
    <OctantDataProvider>
      {children}
    </OctantDataProvider>
  )
}

export const OctantDataContext = createContext<{
  summaryData?: SummaryResponse;
  communityData?: CommunityResponse;
  projectFundingData?: ProjectFundingResponse;
  projectMetadataData?: ProjectMetadataResponse;
  Epochs: { epoch: string; label: string }[];
  communityEpoch: number;
  setCommunityEpoch: (epoch: number) => void;
  handlePrevCommunityEpoch: () => void;
  handleNextCommunityEpoch: () => void;
  fundingEpoch: number;
  setFundingEpoch: (epoch: number) => void;
  handlePrevFundingEpoch: () => void;
  handleNextFundingEpoch: () => void;

  communityDataSortedAndFiltered: CommunityResponse;

  communityTablePage: number;
  setCommunityTablePage: (page: number) => void;
  communityTablePageSize: number;
  setCommunityTablePageSize: (pageSize: number) => void;
  communityTablePageMax: number;


  communityUserSelection: string;
  handleCommunityUserSelection: (userType: string) => void;
  communitySearch: string;
  setCommunitySearch: (search: string) => void;
  communityTableSort: {
    metric: string;
    sortOrder: string;
  };
  setCommunityTableSort: (sort: { metric: string, sortOrder: string }) => void;
  UserTypes: {
    [key: string]: {
      label: string;
    }
  },

  fundingSearch: string;
  setFundingSearch: (search: string) => void;
  fundingTableSort: {
    metric: string;
    sortOrder: string;
  };
  setFundingTableSort: (sort: { metric: string, sortOrder: string }) => void;

  fundingDataSortedAndFiltered: ProjectFundingResponse;
  latestProjectMetadatas: { [project_key: string]: OctantProjectMetadata } | null;
}>({
  Epochs: [],
  communityEpoch: 0,
  setCommunityEpoch: () => { },
  handlePrevCommunityEpoch: () => { },
  handleNextCommunityEpoch: () => { },
  fundingEpoch: 0,
  setFundingEpoch: () => { },
  handlePrevFundingEpoch: () => { },
  handleNextFundingEpoch: () => { },

  communityDataSortedAndFiltered: [],

  communityTablePage: 0,
  setCommunityTablePage: () => { },
  communityTablePageSize: 10,
  setCommunityTablePageSize: () => { },
  communityTablePageMax: 0,

  communityUserSelection: "All",
  handleCommunityUserSelection: () => { },
  communitySearch: "",
  setCommunitySearch: () => { },
  communityTableSort: {
    metric: "allocation_amounts",
    sortOrder: "desc",
  },
  setCommunityTableSort: () => { },
  UserTypes: {},

  fundingSearch: "",
  setFundingSearch: () => { },
  fundingTableSort: {
    metric: "total",
    sortOrder: "desc",
  },
  setFundingTableSort: () => { },
  fundingDataSortedAndFiltered: [],
  latestProjectMetadatas: null,
})

export const useOctantData = () => {
  return useContext(OctantDataContext)
}

export const OctantDataProvider = ({ children }) => {
  const { data: summaryData } = useSWR<SummaryResponse>(OctantURLs.summary);
  const { data: communityData } = useSWR<CommunityResponse>(OctantURLs.community);
  const { data: projectFundingData } = useSWR<ProjectFundingResponse>(OctantURLs.project_funding);
  const { data: projectMetadataData } = useSWR<ProjectMetadataResponse>(OctantURLs.project_metadata);

  const UserTypes = {
    All: {
      label: "All Users",
    },
    Donating: {
      label: "Donating Users",
    }
  }

  const Epochs = useMemo<{ epoch: string; label: string; hasAllocationStarted: boolean }[]>(() => {
    let base = [{
      epoch: "all",
      label: "All Epochs",
      hasAllocationStarted: true
    }]
    if (!summaryData) return base;

    return [...base, ...Object.keys(summaryData.epochs).map((epoch) => ({
      epoch,
      label: `Epoch ${epoch}`,
      hasAllocationStarted: summaryData.epochs[epoch].has_allocation_started
    }))]
  }, [summaryData]);





  const [communityEpoch, setCommunityEpoch] = useState(0);
  const [fundingEpoch, setFundingEpoch] = useState(0);




  const handlePrevCommunityEpoch = useCallback(() => {
    if (communityEpoch === 0)
      setCommunityEpoch(Epochs.filter(e => e.hasAllocationStarted).length - 1);
    else
      setCommunityEpoch(communityEpoch - 1);
  }, [communityEpoch, Epochs]);

  const handleNextCommunityEpoch = useCallback(() => {
    if (communityEpoch === Epochs.filter(e => e.hasAllocationStarted).length - 1)
      setCommunityEpoch(0);
    else
      setCommunityEpoch(communityEpoch + 1);
  }, [communityEpoch, Epochs]);

  const handlePrevFundingEpoch = useCallback(() => {
    if (fundingEpoch === 0)
      setFundingEpoch(Epochs.filter(e => e.hasAllocationStarted).length - 1);
    else
      setFundingEpoch(fundingEpoch - 1);
  }, [fundingEpoch, Epochs]);

  const handleNextFundingEpoch = useCallback(() => {
    if (fundingEpoch === Epochs.filter(e => e.hasAllocationStarted).length - 1)
      setFundingEpoch(0);
    else
      setFundingEpoch(fundingEpoch + 1);
  }, [fundingEpoch, Epochs]);


  const [communityUserSelection, setCommunityUserSelection] = useState("All");

  const handleCommunityUserSelection = (userType: string) => {
    setCommunityUserSelection(userType);
  }

  const [communitySearch, setCommunitySearch] = useState("");

  const [communityTableSort, setCommunityTableSort] = useState({
    metric: "allocation_amounts",
    sortOrder: "desc",
  });



  const communityEpochString = useMemo(() => {
    if (!summaryData) return "all";
    return Epochs[communityEpoch].epoch;
  }, [communityEpoch, Epochs, summaryData]);

  const communityDataSortedAndFiltered = useMemo(() => {
    if (!communityData) return [];

    // filter out users that don't have a lock for the current epoch
    let filteredData = [...communityData].filter(userRow => userRow.maxs[communityEpochString] !== undefined);

    // filter out users that didn't donate in the current epoch if the user selection is Donating
    if (communityUserSelection === "Donating") {
      filteredData = filteredData.filter(userRow => userRow.allocation_amounts[communityEpochString] !== undefined && userRow.allocation_amounts[communityEpochString] > 0);
    }

    // filter out users that don't match the search string
    if (communitySearch) {
      filteredData = filteredData.filter(row => row.user.toLowerCase().includes(communitySearch.toLowerCase()));
    }


    filteredData.sort((a, b) => {
      if (communityTableSort.metric == "user") {
        let aVal = a.user;
        let bVal = b.user;

        if (communityTableSort.sortOrder === "asc") {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }

      } else {
        let aVal = a[communityTableSort.metric] && a[communityTableSort.metric][communityEpochString] || 0;
        let bVal = b[communityTableSort.metric] && b[communityTableSort.metric][communityEpochString] || 0;

        if (communityTableSort.sortOrder === "asc") {
          return aVal - bVal;
        } else {
          return bVal - aVal;
        }
      }


    });



    return filteredData;
  }, [communityData, communityUserSelection, communitySearch, communityEpochString, communityTableSort.metric, communityTableSort.sortOrder]);

  const [communityTablePage, setCommunityTablePage] = useState(0);
  const [communityTablePageSize, setCommunityTablePageSize] = useState(8);

  const communityTablePageMax = useMemo(() => {
    return Math.ceil(communityDataSortedAndFiltered.length / communityTablePageSize);
  }, [communityDataSortedAndFiltered, communityTablePageSize]);

  useEffect(() => {
    if (communityTablePage >= communityTablePageMax) {
      setCommunityTablePage(0);
    }
  }, [communityDataSortedAndFiltered.length, communityTablePage, communityTablePageMax, communityTablePageSize]);



  const [fundingSearch, setFundingSearch] = useState("");

  const [fundingTableSort, setFundingTableSort] = useState({
    metric: "total",
    sortOrder: "desc",
  });


  const fundingEpochString = useMemo(() => {
    if (!summaryData) return "all";
    return Epochs[fundingEpoch].epoch;
  }, [fundingEpoch, Epochs, summaryData]);

  const projectKeyToName = useMemo(() => {
    if (!projectMetadataData) return {};

    let projectKeyToName = {};
    for (let projectKey in projectMetadataData) {
      projectKeyToName[projectKey] = projectMetadataData[projectKey][fundingEpochString]?.name || projectKey;
    }

    return projectKeyToName;
  }, [projectMetadataData, fundingEpochString]);

  const projectKeyToAddress = useMemo(() => {
    if (!projectMetadataData) return {};

    let projectKeyToAddress = {};
    for (let projectKey in projectMetadataData) {
      projectKeyToAddress[projectKey] = projectMetadataData[projectKey][fundingEpochString]?.address || projectKey;
    }

    return projectKeyToAddress;
  }, [projectMetadataData, fundingEpochString]);

  const fundingDataSortedAndFiltered = useMemo(() => {
    if (!projectFundingData) return [];

    // filter out projects that don't have an allocation for the current epoch
    let filteredData = [...projectFundingData].filter(projectRow => projectRow.allocations[fundingEpochString] !== undefined);

    // filter out projects that don't match the search string
    if (fundingSearch) {
      filteredData = filteredData.filter(row => projectKeyToName[row.project_key].toLowerCase().includes(fundingSearch.toLowerCase()));
    }

    filteredData.sort((a, b) => {
      let isTotal = fundingTableSort.metric === "total";
      let metric = fundingTableSort.metric === "total" ? "allocations" : fundingTableSort.metric;

      if (metric == "project") {
        let aVal = projectKeyToName[a.project_key];
        let bVal = projectKeyToName[b.project_key];

        if (fundingTableSort.sortOrder === "asc") {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }

      }
      else if (metric == "address") {
        let aVal = projectKeyToAddress[a.project_key];
        let bVal = projectKeyToAddress[b.project_key];

        if (fundingTableSort.sortOrder === "asc") {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      } else {
        let aVal = a[metric] && a[metric][fundingEpochString] !== undefined ? a[metric][fundingEpochString] : 0;
        let bVal = b[metric] && b[metric][fundingEpochString] !== undefined ? b[metric][fundingEpochString] : 0;

        if (isTotal) {
          // add matched rewards to the total
          aVal = aVal + (a.matched_rewards[fundingEpochString] || 0);
          bVal = bVal + (b.matched_rewards[fundingEpochString] || 0);
        }

        if (fundingTableSort.sortOrder === "asc") {
          return aVal - bVal;
        } else {
          return bVal - aVal;
        }
      }

    });

    return filteredData;

  }, [projectFundingData, fundingSearch, fundingEpochString, projectKeyToName, fundingTableSort.metric, fundingTableSort.sortOrder, projectKeyToAddress]);


  const latestProjectMetadatas = useMemo(() => {
    if (!projectMetadataData) return null;

    let latestProjectMetadatas = {};
    for (let projectKey in projectMetadataData) {
      const epochs = Object.keys(projectMetadataData[projectKey]).filter(epoch => epoch !== "all").map(epoch => parseInt(epoch));

      let latestEpoch = Math.max(...epochs);

      latestProjectMetadatas[projectKey] = projectMetadataData[projectKey][latestEpoch];
    }

    return latestProjectMetadatas;
  }, [projectMetadataData]);


  return (
    <OctantDataContext.Provider value={{
      summaryData,
      communityData,
      projectFundingData,
      projectMetadataData,
      Epochs,
      communityEpoch,
      setCommunityEpoch,
      handlePrevCommunityEpoch,
      handleNextCommunityEpoch,
      fundingEpoch,
      setFundingEpoch,
      handlePrevFundingEpoch,
      handleNextFundingEpoch,

      communityDataSortedAndFiltered,

      communityTablePage,
      setCommunityTablePage,
      communityTablePageSize,
      setCommunityTablePageSize,
      communityTablePageMax,


      communityUserSelection,
      handleCommunityUserSelection,
      communitySearch,
      setCommunitySearch,
      communityTableSort,
      setCommunityTableSort,
      UserTypes,

      fundingSearch,
      setFundingSearch,
      fundingTableSort,
      setFundingTableSort,

      fundingDataSortedAndFiltered,
      latestProjectMetadatas
    }}>
      {children}
    </OctantDataContext.Provider>
  )
}

export default OctantDataProvider

type SummaryResponse = {
  epochs: {
    [epoch: string]: EpochSummary
  }
  locked_changes: {
    now: {
      total_locked_glm: number
      num_users_locked_glm: number
    }
    week_ago: {
      total_locked_glm: number
      num_users_locked_glm: number
    }
    changes: {
      total_locked_glm_diff: number
      num_users_locked_glm_diff: number
      total_locked_glm_change: number
      num_users_locked_glm_change: number
    }
  }
  median_reward_amounts: { [epoch: string]: number | null }
}

export type EpochSummary = {
  epoch: number
  fromTs: string
  toTs: string
  fromDatetime: string
  toDatetime: string
  allocationStart: string
  allocationEnd: string
  has_allocation_started: boolean
  has_allocation_ended: boolean
};

type CommunityResponse = CommunityRow[];

type CommunityRow = {
  user: string
  lockeds: { [epoch: string]: number }
  mins: { [epoch: string]: number }
  maxs: { [epoch: string]: number }
  budget_amounts: { [epoch: string]: number }
  allocation_amounts: { [epoch: string]: number }
  allocated_to_project_counts: { [epoch: string]: number }
  allocated_to_project_keys: { [epoch: string]: string[] }
};

type ProjectFundingResponse = {
  project_key: string
  allocations: { [epoch: string]: number }
  matched_rewards: { [epoch: string]: number }
  total: { [epoch: string]: number }
  donor_counts: { [epoch: string]: number }
  donor_lists: { [epoch: string]: string[] }
}[]

type ProjectMetadataResponse = {
  [project_key: string]: {
    [epoch: string]: OctantProjectMetadata
  }
}

export type OctantProjectMetadata = {
  address: string;
  cid: string;
  name: string;
  introDescription: string;
  description: string;
  profile_image_small: string;
  profile_image_medium: string;
  profile_image_large: string;
  website_label: string;
  website_url: string;
  main_github: string;
  twitter: string;
}

export type OctantProjectMetadataOrNone = OctantProjectMetadata | null;


// export type ProjectsByWebsiteResponse = {
//   [website: string]: {
//     owner_project: string
//     display_name: string
//     description: string
//     main_github: string
//     twitter: string
//   }
// }

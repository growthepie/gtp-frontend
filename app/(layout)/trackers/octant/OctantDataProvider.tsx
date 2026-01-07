"use client";
// data context for the Octant dashboard
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { OctantURLs } from '@/lib/urls'
import useSWR from 'swr'
import moment from 'moment';

// Utility function for safe numeric sorting with better null handling
const getSortValue = (item: any, metric: string, epochString: string): number => {
  if (metric === "user") return 0; // Handle string sorting separately
  
  const value = item[metric]?.[epochString];
  return typeof value === 'number' ? value : 0;
};

// Optimized string comparison function
const compareStrings = (a: string, b: string, sortOrder: string): number => {
  return sortOrder === "asc" ? a.localeCompare(b) : b.localeCompare(a);
};

// Optimized numeric comparison function
const compareNumbers = (a: number, b: number, sortOrder: string): number => {
  return sortOrder === "asc" ? a - b : b - a;
};


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
  latestProjectMetadatas: { [project_key: string]: OctantProjectMetadata | null } | null;
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

  // Memoize epochs calculation with better dependency management
  const Epochs = useMemo<{ epoch: string; label: string; hasAllocationStarted: boolean }[]>(() => {
    const base = [{
      epoch: "all",
      label: "All Epochs",
      hasAllocationStarted: true
    }];
    
    if (!summaryData?.epochs) return base;

    const epochEntries = Object.entries(summaryData.epochs)
      .map(([epoch, data]) => ({
        epoch,
        label: `Epoch ${epoch}`,
        hasAllocationStarted: moment.utc(data.allocationStart).isBefore(moment.utc()) === true
      }))
      .sort((a, b) => parseInt(a.epoch) - parseInt(b.epoch));

    return [...base, ...epochEntries];
  }, [summaryData?.epochs]);

  const [communityEpoch, setCommunityEpoch] = useState(0);
  const [fundingEpoch, setFundingEpoch] = useState(0);

  // Memoize available epochs to avoid recalculating
  const availableEpochs = useMemo(() => 
    Epochs.filter(e => e.hasAllocationStarted), 
    [Epochs]
  );

  const handlePrevCommunityEpoch = useCallback(() => {
    const maxIndex = availableEpochs.length - 1;
    setCommunityEpoch(prev => prev === 0 ? maxIndex : prev - 1);
  }, [availableEpochs.length]);

  const handleNextCommunityEpoch = useCallback(() => {
    const maxIndex = availableEpochs.length - 1;
    setCommunityEpoch(prev => prev === maxIndex ? 0 : prev + 1);
  }, [availableEpochs.length]);

  const handlePrevFundingEpoch = useCallback(() => {
    const maxIndex = availableEpochs.length - 1;
    setFundingEpoch(prev => prev === 0 ? maxIndex : prev - 1);
  }, [availableEpochs.length]);

  const handleNextFundingEpoch = useCallback(() => {
    const maxIndex = availableEpochs.length - 1;
    setFundingEpoch(prev => prev === maxIndex ? 0 : prev + 1);
  }, [availableEpochs.length]);

  const [communityUserSelection, setCommunityUserSelection] = useState("All");
  const [communitySearch, setCommunitySearch] = useState("");
  const [communityTableSort, setCommunityTableSort] = useState({
    metric: "allocation_amounts",
    sortOrder: "desc",
  });

  const handleCommunityUserSelection = useCallback((userType: string) => {
    setCommunityUserSelection(userType);
  }, []);

  // Memoize epoch strings
  const communityEpochString = useMemo(() => {
    return summaryData ? Epochs[communityEpoch]?.epoch || "all" : "all";
  }, [communityEpoch, Epochs, summaryData]);

  const fundingEpochString = useMemo(() => {
    return summaryData ? Epochs[fundingEpoch]?.epoch || "all" : "all";
  }, [fundingEpoch, Epochs, summaryData]);

  // Optimized community data filtering and sorting
  const communityDataSortedAndFiltered = useMemo(() => {
    if (!communityData) return [];

    // Use a more efficient filtering approach
    let filteredData = communityData.filter(userRow => {
      // Filter by epoch availability
      if (!userRow.maxs[communityEpochString]) return false;
      
      // Filter by donation status
      if (communityUserSelection === "Donating") {
        const allocation = userRow.allocation_amounts[communityEpochString];
        if (!allocation || allocation <= 0) return false;
      }
      
      // Filter by search
      if (communitySearch) {
        return userRow.user.toLowerCase().includes(communitySearch.toLowerCase());
      }
      
      return true;
    });

    // Optimized sorting with better handling of edge cases
    filteredData.sort((a, b) => {
      if (communityTableSort.metric === "user") {
        return compareStrings(a.user, b.user, communityTableSort.sortOrder);
      }
      
      const aVal = getSortValue(a, communityTableSort.metric, communityEpochString);
      const bVal = getSortValue(b, communityTableSort.metric, communityEpochString);
      
      return compareNumbers(aVal, bVal, communityTableSort.sortOrder);
    });

    return filteredData;
  }, [
    communityData, 
    communityUserSelection, 
    communitySearch, 
    communityEpochString, 
    communityTableSort.metric, 
    communityTableSort.sortOrder
  ]);

  const [communityTablePage, setCommunityTablePage] = useState(0);
  const [communityTablePageSize, setCommunityTablePageSize] = useState(8);

  const communityTablePageMax = useMemo(() => {
    return Math.ceil(communityDataSortedAndFiltered.length / communityTablePageSize);
  }, [communityDataSortedAndFiltered.length, communityTablePageSize]);

  // Reset page when data changes
  useEffect(() => {
    if (communityTablePage >= communityTablePageMax && communityTablePageMax > 0) {
      setCommunityTablePage(0);
    }
  }, [communityTablePageMax, communityTablePage]);

  const [fundingSearch, setFundingSearch] = useState("");
  const [fundingTableSort, setFundingTableSort] = useState({
    metric: "total",
    sortOrder: "desc",
  });

  // Memoize project mappings for better performance
  const projectKeyToName = useMemo(() => {
    if (!projectMetadataData) return {};

    return Object.fromEntries(
      Object.entries(projectMetadataData).map(([projectKey, metadata]) => [
        projectKey,
        metadata[fundingEpochString]?.name || projectKey
      ])
    );
  }, [projectMetadataData, fundingEpochString]);

  const projectKeyToAddress = useMemo(() => {
    if (!projectMetadataData) return {};

    return Object.fromEntries(
      Object.entries(projectMetadataData).map(([projectKey, metadata]) => [
        projectKey,
        metadata[fundingEpochString]?.address || projectKey
      ])
    );
  }, [projectMetadataData, fundingEpochString]);

  // Optimized funding data filtering and sorting
  const fundingDataSortedAndFiltered = useMemo(() => {
    if (!projectFundingData) return [];

    let filteredData = projectFundingData.filter(projectRow => {
      // Filter by epoch availability
      if (projectRow.allocations[fundingEpochString] === undefined) return false;
      
      // Filter by search
      if (fundingSearch) {
        const projectName = projectKeyToName[projectRow.project_key];
        return projectName.toLowerCase().includes(fundingSearch.toLowerCase());
      }
      
      return true;
    });

    // Optimized sorting with proper total calculation
    filteredData.sort((a, b) => {
      const { metric, sortOrder } = fundingTableSort;
      
      if (metric === "project") {
        const aVal = projectKeyToName[a.project_key] || "";
        const bVal = projectKeyToName[b.project_key] || "";
        return compareStrings(aVal, bVal, sortOrder);
      }
      
      if (metric === "address") {
        const aVal = projectKeyToAddress[a.project_key] || "";
        const bVal = projectKeyToAddress[b.project_key] || "";
        return compareStrings(aVal, bVal, sortOrder);
      }
      
      // Handle numeric sorting
      const isTotal = metric === "total";
      const sortMetric = isTotal ? "allocations" : metric;
      
      let aVal = a[sortMetric]?.[fundingEpochString] || 0;
      let bVal = b[sortMetric]?.[fundingEpochString] || 0;
      
      // Add matched rewards for total calculation
      if (isTotal) {
        aVal += a.matched_rewards[fundingEpochString] || 0;
        bVal += b.matched_rewards[fundingEpochString] || 0;
      }
      
      return compareNumbers(aVal, bVal, sortOrder);
    });

    return filteredData;
  }, [
    projectFundingData, 
    fundingSearch, 
    fundingEpochString, 
    projectKeyToName, 
    projectKeyToAddress,
    fundingTableSort.metric, 
    fundingTableSort.sortOrder
  ]);

  // Optimized latest project metadata calculation
  const latestProjectMetadatas = useMemo(() => {
    if (!projectMetadataData) return null;

    return Object.fromEntries(
      Object.entries(projectMetadataData).map(([projectKey, metadata]) => {
        const epochs = Object.keys(metadata)
          .filter(epoch => epoch !== "all")
          .map(epoch => parseInt(epoch))
          .filter(epoch => !isNaN(epoch));
        
        if (epochs.length === 0) return [projectKey, null];
        
        const latestEpoch = Math.max(...epochs);
        return [projectKey, metadata[latestEpoch]];
      })
    );
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
      setCommunitySearch: useCallback((search: string) => {
        setCommunitySearch(search);
        setCommunityTablePage(0); // Reset page when searching
      }, []),
      communityTableSort,
      setCommunityTableSort,
      UserTypes,

      fundingSearch,
      setFundingSearch: useCallback((search: string) => {
        setFundingSearch(search);
      }, []),
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
  total_funding_amount: number
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
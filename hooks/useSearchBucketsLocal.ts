// hooks/useSearchBucketsLocal.ts
"use client";
import { useMemo } from "react";
import { useMaster } from "@/contexts/MasterContext";
import { navigationItems } from "@/lib/navigation";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useProjectsMetadata } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";

function normalizeString(str: string) {
  return str.toLowerCase().replace(/[\s-]+/g, '');
}

// Search bucket type definition
type SearchBucket = {
  label: string;
  icon: GTPIconName;
  options: { 
    label: string; 
    url: string; 
    icon: string; 
    color?: string;
  }[];
  groupOptions?: { 
    label: string; 
    options: { label: string; url: string; icon: string, color?: string }[]
  }[];
};

export const useSearchBucketsLocal = (query: string = "") => {
  const { AllChainsByKeys, AllChainsByStacks } = useMaster();
  const { ownerProjectToProjectData } = useProjectsMetadata();

  // Create search buckets structure
  const searchBuckets: SearchBucket[] = useMemo(() => [
    {
      label: "Chains",
      icon: "gtp-chain",
      options: Object.entries(AllChainsByKeys || {})
        .filter(([key]) => key !== "all_l2s" && key !== "multiple")
        .map(([_, chain]) => ({
          label: chain.label,
          url: `/chains/${chain.urlKey}`,
          icon: `gtp:${chain.urlKey}-logo-monochrome`,
          color: chain.colors.dark[0]
        })),
      groupOptions: Object.entries(AllChainsByStacks || {})
        .map(([bucket, chains]) => ({
          label: bucket,
          options: chains.map(chain => ({
            label: chain.name,
            url: `/chains/${chain.url_key}`,
            icon: `gtp:${chain.url_key}-logo-monochrome`,
            color: chain.colors.dark[0]
          }))
        }))
    },
    ...navigationItems.filter(navItem => navItem.name !== "Applications").map(navItem => ({
      label: navItem.name,
      icon: navItem.icon,
      options: navItem.options.map(option => ({
        label: option.label,
        url: option.url || "",
        icon: `gtp:${option.icon}`,
        color: undefined
      }))
    })),
    {
      label: "Applications",
      icon: "gtp-project",
      options: [
        ...navigationItems.filter(navItem => navItem.name === "Applications")[0]?.options.map(option => ({
          label: option.label,
          url: option.url || "",
          icon: `gtp:${option.icon}`,
          color: undefined
        })) || [],
        ...(ownerProjectToProjectData ? Object.entries(ownerProjectToProjectData)
          .filter(([owner, project]) => project.logo_path && project.on_apps_page)
          .map(([owner, project]) => ({
            label: project.display_name,
            url: `/applications/${project.owner_project}`,
            icon: `https://api.growthepie.xyz/v1/apps/logos/${project.logo_path}`,
            color: undefined
          })) : [])
      ]
    }
  ], [AllChainsByKeys, AllChainsByStacks, ownerProjectToProjectData]);

  const allFilteredData = useMemo(() => {
    if (!query?.trim()) {
      return [];
    }

    // Check if the query matches at least 40% of a bucket name from the beginning
    const bucketMatch = searchBuckets.find(bucket => {
      const bucketName = normalizeString(bucket.label);
      const searchQuery = normalizeString(query);

      // Calculate the minimum length needed (40% of bucket name)
      const minQueryLength = Math.ceil(bucketName.length * 0.4);

      // Check if query is long enough and matches from the start
      return searchQuery.length >= minQueryLength &&
        bucketName.startsWith(searchQuery);
    });

    // Get regular search results
    const regularSearchResults = searchBuckets.map(bucket => {
      const bucketOptions = bucket.options;
      const lowerQuery = normalizeString(query);

      // Split into three categories for better ranking
      const exactMatches = bucketOptions.filter(option =>
        normalizeString(option.label) === lowerQuery
      );

      const startsWithMatches = bucketOptions.filter(option => {
        const lowerLabel = normalizeString(option.label);
        return lowerLabel !== lowerQuery && // not an exact match
          lowerLabel.startsWith(lowerQuery);
      });

      const containsMatches = bucketOptions.filter(option => {
        const lowerLabel = normalizeString(option.label);
        return lowerLabel !== lowerQuery && // not an exact match
          !lowerLabel.startsWith(lowerQuery) && // not a starts with match
          lowerLabel.includes(lowerQuery);
      });

      const groupOptions = bucket.groupOptions;

      const groupOptionsMatches = groupOptions?.filter(group => {
        const lowerLabel = normalizeString(group.label);
        return lowerLabel !== lowerQuery && // not an exact match
          lowerLabel.includes(lowerQuery);
      });

      return {
        type: bucket.label,
        icon: bucket.icon,
        filteredData: [...exactMatches, ...startsWithMatches, ...containsMatches],
        filteredGroupData: groupOptionsMatches,
        isBucketMatch: false
      };
    });

    // Filter out empty buckets from regular results first
    const filteredRegularResults = regularSearchResults.filter(bucket =>
      bucket.filteredData.length > 0
    );

    // Sort regular results
    const sortedRegularResults = filteredRegularResults.sort((a, b) => {
      // First, prioritize Chains bucket
      if (a.type === "Chains" && b.type !== "Chains") return -1;
      if (b.type === "Chains" && a.type !== "Chains") return 1;

      // For remaining items, maintain the order from navigationItems
      const aIndex = navigationItems.findIndex(item => item.name === a.type);
      const bIndex = navigationItems.findIndex(item => item.name === b.type);

      // If both items are found in navigationItems, sort by their order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If one item is not in navigationItems, put it last
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return 0;
    });

    // Add bucket match at the end if it exists
    return bucketMatch && bucketMatch.options.length > 0
      ? [...sortedRegularResults, {
        type: `${bucketMatch.label}`,
        icon: bucketMatch.icon,
        filteredData: bucketMatch.options,
        filteredGroupData: null,
        isBucketMatch: true
      }]
      : sortedRegularResults;
  }, [query, searchBuckets]);

  // Calculate total matches for the counter
  const totalMatches = allFilteredData.reduce((total, { filteredData }) => total + filteredData.length, 0);

  return {
    allFilteredData,
    totalMatches
  };
};
"use client";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import * as d3 from 'd3-hierarchy';
import useSWR from 'swr';
import { ChainOverview } from '@/lib/chains';
import { MasterResponse } from '@/types/api/MasterResponse';
import { useMaster } from '@/contexts/MasterContext';
import { useProjectsMetadata } from '@/app/(layout)/applications/_contexts/ProjectsMetadataContext';
import { ApplicationTooltipAlt } from '@/app/(layout)/applications/_components/Components';
import Link from 'next/link';
import { GTPTooltipNew, TooltipBody } from '@/components/tooltip/GTPTooltip';
import { GTPIcon } from '../../GTPIcon';
import { motion, AnimatePresence, LayoutGroup, MotionConfig } from 'framer-motion';
import { GTPIconName } from '@/icons/gtp-icon-names';
import ChartWatermark, { ChartWatermarkWithMetricName } from '../../ChartWatermark';
import { isMobile } from 'react-device-detect';
import { useTheme } from 'next-themes';
import HorizontalScrollContainer from '@/components/HorizontalScrollContainer';

const LOGO_CONFIG = {
  width: 213,
  height: 78,
  padding: 10, // Minimum space around logo
};

const LOGO_REGION_GAP = 10;

const TreemapLogo = ({ chainName }: { chainName: string }) => {
  return <ChartWatermarkWithMetricName metricName={`${chainName} Applications`} className="w-[193px] h-[58px] opacity-20 text-forest-300 dark:text-[#EAECEB] mix-blend-darken dark:mix-blend-lighten z-30" />;
};

// ============================================================================
// Types & Interfaces
// ============================================================================

interface AppDataRaw {
  owner_project: string;
  origin_key: string;
  txcount: number;
  main_category?: string;
  sub_category?: string;
}

interface ProjectMetadata {
  owner_project: string;
  display_name: string;
  logo_path?: string;
  main_category: string;
  sub_category: string;
}

interface EnrichedApp {
  ownerProject: string;
  displayName: string;
  logoPath?: string;
  txcount: number;
  mainCategory: string;
  subCategory: string;
}

interface CategoryNode {
  id: string;
  label: string;
  txcount: number;
  pctShare: number;
  apps: EnrichedApp[];
}

interface LayoutNode extends CategoryNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LogoSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutComputationResult {
  layout: LayoutNode[];
  logoSlot: LogoSlot | null;
}

type ViewMode = 'main' | 'sub';

// ============================================================================
// Animation Variants (NEW)
// ============================================================================

const categoryVariants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    borderColor: "rgb(var(--bg-medium))"
  },
  animate: {
    opacity: 1,
    scale: 1,
    borderColor: "rgb(var(--bg-medium))",
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
      mass: 1,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};

const appTileVariants = {
  initial: { opacity: 0, scale: 0 },
  animate: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.02,
      duration: 0.3,
      stiffness: 300,
      damping: 20,
    }
  }),
  exit: { opacity: 0, scale: 0 },
  hover: {
    scale: 1.1,
    transition: { type: "spring", stiffness: 400, damping: 17 }
  },
  hoverMain: {
    borderColor: "rgb(var(--ui-hover))",
    transition: { duration: 0.2 }
  }
};

// ============================================================================
// Data Transformation Utilities (unchanged)
// ============================================================================

function arrayToObject<T>(data: any[], types: string[]): T {
  return types.reduce((obj, type, index) => {
    obj[type] = data[index];
    return obj;
  }, {} as any) as T;
}

function enrichAppData(
  rawApps: any[],
  appTypes: string[],
  projectsData: any,
  ownerProjectMap: Record<string, ProjectMetadata>
): EnrichedApp[] {
  return rawApps
    .map((rawApp): EnrichedApp | null => {
      const appObj = arrayToObject<AppDataRaw>(rawApp, appTypes);
      const projectMeta = ownerProjectMap[appObj.owner_project];

      if(appObj.owner_project === 'npc-com') {
        console.log("npc-com", appObj, projectMeta);
      }

      if (!projectMeta) return null;

      return {
        ownerProject: appObj.owner_project,
        displayName: projectMeta.display_name || appObj.owner_project,
        logoPath: projectMeta.logo_path,
        txcount: appObj.txcount,
        mainCategory: projectMeta.main_category,
        subCategory: projectMeta.sub_category,
      };
    })
    .filter((app): app is EnrichedApp => app !== null)
    .sort((a, b) => b.txcount - a.txcount);
}

function groupAppsByCategory(
  apps: EnrichedApp[],
  groupBy: 'main' | 'sub',
  selectedMainCategory?: string
): Map<string, EnrichedApp[]> {
  const grouped = new Map<string, EnrichedApp[]>();

  apps.forEach(app => {
    if (groupBy === 'sub' && selectedMainCategory && app.mainCategory !== selectedMainCategory) {
      return;
    }

    const categoryKey = groupBy === 'main' ? app.mainCategory : app.subCategory;
    if (!categoryKey) return;

    if (!grouped.has(categoryKey)) {
      grouped.set(categoryKey, []);
    }
    grouped.get(categoryKey)!.push(app);
  });

  return grouped;
}

function buildCategoryNodes(
  blockspaceData: any[] | undefined,
  blockspaceTypes: string[] | undefined,
  apps: EnrichedApp[],
  masterData: any,
  viewMode: ViewMode,
  selectedMainCategory?: string
): CategoryNode[] {
  if (!masterData) return [];

  const mainCategoryLabel = selectedMainCategory ? masterData.blockspace_categories.main_categories[selectedMainCategory] : null;
  const groupBy = viewMode === 'main' ? 'main' : 'sub';
  const groupedApps = groupAppsByCategory(apps, groupBy, mainCategoryLabel);

  if (viewMode === 'sub') {
    const nodes: CategoryNode[] = [];
    const totalTxcount = apps
      .filter(app => app.mainCategory === mainCategoryLabel)
      .reduce((sum, app) => sum + app.txcount, 0);

    groupedApps.forEach((categoryApps, subCategoryLabel) => {
      const txcount = categoryApps.reduce((sum, app) => sum + app.txcount, 0);
      const pctShare = totalTxcount > 0 ? (txcount / totalTxcount) * 100 : 0;

      const subCategoryId = Object.entries(masterData.blockspace_categories.sub_categories)
        .find(([_, label]) => label === subCategoryLabel)?.[0] || subCategoryLabel;

      nodes.push({
        id: subCategoryId,
        label: subCategoryLabel,
        txcount,
        pctShare,
        apps: categoryApps,
      });
    });

    return nodes.sort((a, b) => b.txcount - a.txcount);
  }

  if (!blockspaceData || !blockspaceTypes) return [];

  const categoryMap = masterData.blockspace_categories.main_categories;

  return blockspaceData
    .filter(item => {
      const mainCategoryId = item[blockspaceTypes.indexOf('main_category_id')];
      return mainCategoryId !== 'unlabeled';
    })
    .map(item => {
      const categoryId = item[blockspaceTypes.indexOf('main_category_id')];
      const categoryLabel = categoryMap[categoryId];
      const categoryApps = groupedApps.get(categoryLabel) || [];

      return {
        id: categoryId,
        label: categoryLabel,
        txcount: item[blockspaceTypes.indexOf('txcount')],
        pctShare: item[blockspaceTypes.indexOf('pct_share')],
        apps: categoryApps,
      };
    });
}

// ============================================================================
// Main Component
// ============================================================================

interface DensePackedTreeMapProps {
  chainKey: string;
  chainData: any;
  master: MasterResponse;
}

const DensePackedTreeMap = ({ chainKey, chainData, master }: DensePackedTreeMapProps) => {
  // ============================================================================
  // State
  // ============================================================================
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [containerWidth, setContainerWidth] = useState(743);
  const [showHint, setShowHint] = useState(false);
  const { AllChainsByKeys } = useMaster();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // Data Fetching
  // ============================================================================
  const { data: chainDataOverview } = useSWR<ChainOverview>(
    `https://api.growthepie.xyz/v1/chains/${chainKey}/overview.json`
  );

  const { data: masterData } = useMaster();

  const { data: applicationsData } = useSWR<{ data: { data: any[], types: string[] } }>(
    `https://api.growthepie.xyz/v1/apps/app_overview_7d.json`
  );

  const { filteredProjectsData, ownerProjectToProjectData } = useProjectsMetadata();

  // ============================================================================
  // Data Transformation
  // ============================================================================

  const ownerProjectMap = useMemo(() => {
    if (!filteredProjectsData) return {};

    return filteredProjectsData.data.reduce((map, project) => {
      const projectObj = arrayToObject<ProjectMetadata>(
        project,
        filteredProjectsData.types
      );
      map[projectObj.owner_project] = projectObj;
      return map;
    }, {} as Record<string, ProjectMetadata>);
  }, [filteredProjectsData]);

  const enrichedApps = useMemo(() => {
    if (!applicationsData?.data.data || !applicationsData?.data.types || !ownerProjectMap) {
      return [];
    }

    const appsForChain = applicationsData.data.data.filter(
      app => app[applicationsData.data.types.indexOf('origin_key')] === chainKey
    );

    return enrichAppData(
      appsForChain,
      applicationsData.data.types,
      filteredProjectsData,
      ownerProjectMap
    );
  }, [applicationsData, chainKey, filteredProjectsData, ownerProjectMap]);

  const categoryNodes = useMemo(() => {
    const blockspaceData = chainDataOverview?.data.blockspace.blockspace.data;
    const blockspaceTypes = chainDataOverview?.data.blockspace.blockspace.types;

    const allNodes = buildCategoryNodes(
      blockspaceData,
      blockspaceTypes,
      enrichedApps,
      masterData,
      selectedMainCategory === null ? 'main' : 'sub',
      selectedMainCategory || undefined
    );

    return allNodes.filter(node => node.apps.length > 0);
  }, [chainDataOverview, enrichedApps, masterData, selectedMainCategory]);

  const dimensions = useMemo(() => {
    const MIN_HEIGHT = 245;
    const MAX_HEIGHT = windowHeight - 300;
    const MAX_APPS = 20;

    if (categoryNodes.length === 0) {
      return { width: containerWidth, height: MIN_HEIGHT };
    }

    const totalApps = categoryNodes.reduce((sum, node) => sum + Math.min(MAX_APPS, node.apps.length), 0);

    const TILE_SIZE = 62;
    const GAP = 10;
    const CATEGORY_GAP = 10;

    const estimatedCols = Math.max(3, Math.floor(containerWidth / (TILE_SIZE + GAP)));
    const estimatedRows = Math.max(1, Math.ceil(totalApps / estimatedCols));
    const logoHeight = LOGO_CONFIG.height + LOGO_CONFIG.padding * 2;

    const numCategories = categoryNodes.length;
    const totalHeight = estimatedRows * (TILE_SIZE + GAP);
    const neededHeight = totalHeight + CATEGORY_GAP * (numCategories - 1) + 60 + logoHeight;

    const comfortableHeight = Math.floor(neededHeight * 1.5);
    const height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, comfortableHeight));

    return { width: containerWidth, height };
  }, [containerWidth, categoryNodes, windowHeight]);

  // ============================================================================
  // Layout Calculation (mostly unchanged, just type improvements)
  // ============================================================================

  const redistributeTxCountByPercentage = (
    layout: LayoutNode[],
    offendingNodes: LayoutNode[],
    nonOffendingNodes: LayoutNode[],
    percentage: number
  ): LayoutNode[] => {
    const totalTxCount = layout.reduce((sum, node) => sum + node.txcount, 0);
    if (totalTxCount === 0) return layout;
    
    const valueToRedistribute = totalTxCount * percentage;
    const totalNonOffendingTxCount = nonOffendingNodes.reduce((sum, node) => sum + node.txcount, 0);

    if (totalNonOffendingTxCount > 0) {
      nonOffendingNodes.forEach(node => {
        const proportion = node.txcount / totalNonOffendingTxCount;
        const valueToRemove = valueToRedistribute * proportion;
        node.txcount = Math.max(0, node.txcount - valueToRemove);
      });
    }

    const totalOffendingTxCount = offendingNodes.reduce((sum, node) => sum + node.txcount, 0);
    let totalNeedFactor = offendingNodes.reduce(
      (sum, node) => sum + (totalOffendingTxCount - node.txcount),
      0
    );

    if (totalNeedFactor > 0) {
      offendingNodes.forEach(node => {
        const needFactor = totalOffendingTxCount - node.txcount;
        const proportionOfNeed = needFactor / totalNeedFactor;
        const valueToAdd = valueToRedistribute * proportionOfNeed;
        node.txcount += valueToAdd;
      });
    } else if (offendingNodes.length > 0) {
      const valuePerNode = valueToRedistribute / offendingNodes.length;
      offendingNodes.forEach(node => {
        node.txcount += valuePerNode;
      });
    }

    return layout;
  };

const computeNodeValue = (node: CategoryNode): number => {
  return Math.sqrt(node.txcount) + node.apps.length * 1000;
};

type LogoRegionName = 'top' | 'bottom' | 'left' | 'right';

interface LogoRegionSpec {
  name: LogoRegionName;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

const buildLogoRegions = (
  dimensions: { width: number; height: number },
  logoSlot: LogoSlot
): LogoRegionSpec[] => {
  const gap = LOGO_REGION_GAP;

  const topHeight = Math.max(0, logoSlot.y - gap);
  const bottomStart = logoSlot.y + logoSlot.height + gap;
  const bottomHeight = Math.max(0, dimensions.height - bottomStart);
  const leftWidth = Math.max(0, logoSlot.x - gap);
  const rightStart = logoSlot.x + logoSlot.width + gap;
  const rightWidth = Math.max(0, dimensions.width - rightStart);

  const regions: LogoRegionSpec[] = [
    {
      name: 'top',
      x: 0,
      y: 0,
      width: dimensions.width,
      height: topHeight,
      area: dimensions.width * topHeight,
    },
    {
      name: 'bottom',
      x: 0,
      y: bottomStart,
      width: dimensions.width,
      height: bottomHeight,
      area: dimensions.width * bottomHeight,
    },
    {
      name: 'left',
      x: 0,
      y: logoSlot.y + gap,
      width: leftWidth,
      height: Math.max(0, logoSlot.height - gap * 2),
      area: leftWidth * Math.max(0, logoSlot.height - gap * 2),
    },
    {
      name: 'right',
      x: rightStart,
      y: logoSlot.y + gap,
      width: rightWidth,
      height: Math.max(0, logoSlot.height - gap * 2),
      area: rightWidth * Math.max(0, logoSlot.height - gap * 2),
    },
  ];

  return regions.filter(region => region.area > 0 && region.width > 0 && region.height > 0);
};

const createTreemapLayout = (
  nodes: CategoryNode[],
  size: { width: number; height: number },
  origin: { x: number; y: number } = { x: 0, y: 0 }
): LayoutNode[] => {
  if (!nodes.length) {
    return [];
  }

  if (size.width <= 0 || size.height <= 0) {
    return nodes.map(node => ({
      ...node,
      x: origin.x,
      y: origin.y,
      width: 0,
      height: 0,
    }));
  }

  const hierarchyData = {
    name: 'root',
    children: nodes.map(node => ({
      ...node,
      name: node.id,
      value: computeNodeValue(node),
    })),
  };

  const root = d3.hierarchy(hierarchyData as any)
    .sum(d => (d as any).value)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const shortestSide = Math.min(size.width, size.height);
  const effectivePadding = shortestSide > 0
    ? Math.min(10, Math.max(2, Math.floor(shortestSide / 12)))
    : 0;

  const treemap = d3.treemap()
    .size([size.width, size.height])
    .paddingInner(effectivePadding)
    .paddingOuter(0)
    .tile(d3.treemapSquarify.ratio(2/3));

  treemap(root);

  return root.leaves().map(leaf => {
    const layoutLeaf = leaf as d3.HierarchyRectangularNode<typeof leaf.data>;
    const original = nodes.find(n => n.id === (layoutLeaf.data as any).name) ?? nodes[0];

    return {
      ...original,
      x: Math.floor(origin.x + layoutLeaf.x0),
      y: Math.floor(origin.y + layoutLeaf.y0),
      width: Math.floor(layoutLeaf.x1 - layoutLeaf.x0),
      height: Math.floor(layoutLeaf.y1 - layoutLeaf.y0),
    };
  });
};

const createTreemapLayoutWithLogo = (
  nodes: CategoryNode[],
  dimensions: { width: number; height: number },
  logoSlot: LogoSlot
): LayoutNode[] => {
  const regions = buildLogoRegions(dimensions, logoSlot);

  if (!regions.length) {
    return nodes.map(node => ({
      ...node,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }));
  }

  const nodeEntries = nodes.map(node => ({ node, value: computeNodeValue(node) }));
  const totalValue = nodeEntries.reduce((sum, entry) => sum + entry.value, 0);

  if (totalValue <= 0) {
    return createTreemapLayout(nodes, dimensions);
  }

  const totalRegionArea = regions.reduce((sum, region) => sum + region.area, 0);

  if (totalRegionArea <= 0) {
    return createTreemapLayout(nodes, dimensions);
  }

  const areaPerValueUnit = totalRegionArea / totalValue;

  const regionStates = regions.map(region => ({
    ...region,
    remainingCapacity: region.area / areaPerValueUnit,
    assigned: [] as CategoryNode[],
  }));

  nodeEntries
    .sort((a, b) => b.value - a.value)
    .forEach(({ node, value }) => {
      const targetRegion = regionStates.reduce((best, candidate) => {
        if (!best) return candidate;
        if (candidate.remainingCapacity === best.remainingCapacity) {
          return candidate.area > best.area ? candidate : best;
        }
        return candidate.remainingCapacity > best.remainingCapacity ? candidate : best;
      }, regionStates[0]);

      targetRegion.assigned.push(node);
      targetRegion.remainingCapacity = Math.max(0, targetRegion.remainingCapacity - value);
    });

  const layouts = regionStates.flatMap(region => {
    if (!region.assigned.length) {
      return [] as LayoutNode[];
    }

    return createTreemapLayout(
      region.assigned,
      { width: region.width, height: region.height },
      { x: region.x, y: region.y }
    );
  });

  return layouts;
};

const enforceMinWidth = (
  nodes: CategoryNode[], 
  dimensions: { width: number, height: number }, 
  minWidth: number, 
  minHeight: number
): LayoutComputationResult => {
  let layout: LayoutNode[] = [];
  let currentNodes = JSON.parse(JSON.stringify(nodes));
  let allNodesAreBigEnough = false;
  let iterations = 0;
  const maxIterations = 20;

  const logoWidth = LOGO_CONFIG.width + LOGO_CONFIG.padding * 2;
  const logoHeight = LOGO_CONFIG.height + LOGO_CONFIG.padding * 2;
  const hasLogoSlot = dimensions.width >= logoWidth && dimensions.height >= logoHeight;
  const logoSlot: LogoSlot | null = hasLogoSlot
    ? {
        x: Math.floor(dimensions.width / 2 - logoWidth / 2),
        y: Math.floor(dimensions.height / 2 - logoHeight / 2),
        width: Math.floor(logoWidth),
        height: Math.floor(logoHeight),
      }
    : null;

  while (!allNodesAreBigEnough && iterations < maxIterations) {
    const { width, height } = dimensions;

    layout = logoSlot
      ? createTreemapLayoutWithLogo(currentNodes, dimensions, logoSlot)
      : createTreemapLayout(currentNodes, dimensions);

    const offendingNodes = layout.filter(leaf => leaf.width < minWidth || leaf.height < minHeight);

    if (offendingNodes.length === 0) {
      allNodesAreBigEnough = true;
    } else {
      const nonOffendingNodes = layout.filter(leaf => leaf.width >= minWidth && leaf.height >= minHeight);

      if (nonOffendingNodes.length === 0) {
        console.warn('LAYOUT: No non-offending nodes to redistribute value from. Halting iterations.');
        break;
      }

      const percentageToRedistribute = 0.01 + (0.05 * Math.pow(iterations, 2));

      const updatedLayout = redistributeTxCountByPercentage(
        layout,
        offendingNodes,
        nonOffendingNodes,
        percentageToRedistribute
      );

      currentNodes = currentNodes.map(node => {
        const updatedNode = updatedLayout.find(layoutNode => layoutNode.id === node.id);
        return {
          ...node,
          txcount: updatedNode ? updatedNode.txcount : node.txcount,
        };
      });
    }
    iterations++;
  }

    if (iterations === maxIterations) {
      console.warn('LAYOUT: Reached max iterations while trying to enforce minimum area.');
    }

  const filteredLayout = layout.filter(node => node.width > 0 && node.height > 0);

  return { layout: filteredLayout, logoSlot };
};

const layoutResult = useMemo<LayoutComputationResult>(() => {
  if (categoryNodes.length === 0) {
    return { layout: [], logoSlot: null };
  }
  return enforceMinWidth(categoryNodes, dimensions, 85, 110);
}, [categoryNodes, dimensions]);

const layout = layoutResult.layout;
const logoSlot = layoutResult.logoSlot;

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleCategoryClick = (categoryId: string) => {
    console.log('handleCategoryClick', categoryId);
    if (selectedMainCategory === null) {
      setSelectedMainCategory(categoryId);
      setShowHint(true);
      setTimeout(() => setShowHint(false), 3000);
    }
  };

  const handleBackToOverview = () => {
    setSelectedMainCategory(null);
    setShowHint(false);
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMainCategory !== null) {
        handleBackToOverview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMainCategory]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectedMainCategory !== null && containerRef.current) {
        const target = e.target as HTMLElement;
        if (target === containerRef.current) {
          handleBackToOverview();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleClickOutside);
    }

    return () => {
      if (container) {
        container.removeEventListener('click', handleClickOutside);
      }
    };
  }, [selectedMainCategory]);

  // Handle container resize (IMPROVED: Using ref for timeout)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setIsResizing(true);

        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }

        setContainerWidth(width);

        resizeTimeoutRef.current = setTimeout(() => {
          setIsResizing(false);
        }, 300);
      }
    });

    resizeObserver.observe(container);

    

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {


    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
      const container = containerRef.current;
      if (container) {  
        setContainerWidth(container.clientWidth);
      } else {
        setContainerWidth(743);
      }
    };

    window.addEventListener('resize', handleResize);

    setTimeout(handleResize, 300);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const layoutKey = selectedMainCategory === null ? 'main' : `sub-${selectedMainCategory}`;
  const selectedCategoryLabel = selectedMainCategory
    ? masterData?.blockspace_categories.main_categories[selectedMainCategory]
    : null;

  // ============================================================================
  // Render
  // ============================================================================


  const allMainCategories = useMemo(() => {
    return Object.entries(masterData?.blockspace_categories.main_categories || {}).map(([id, label]) => ({ id, label }));
  }, [masterData?.blockspace_categories.main_categories]);

  // Get main categories for buttons
  const mainCategories = useMemo(() => {
    if (!masterData?.blockspace_categories?.main_categories) return [];

    const blockspaceData = chainDataOverview?.data.blockspace.blockspace.data;
    if (!blockspaceData) return [];

    return Object.entries(masterData.blockspace_categories.main_categories)
      .filter(([id]) => {
        const hasData = blockspaceData.some(
          item => item[chainDataOverview.data.blockspace.blockspace.types.indexOf('main_category_id')] === id
        );
        const hasApps = enrichedApps.some(app =>
          masterData.blockspace_categories.main_categories[id] === app.mainCategory
        );
        return hasData && hasApps && id !== 'unlabeled';
      })
      .map(([id, label]) => ({ id, label }));
  }, [masterData, chainDataOverview, enrichedApps]);
  
  const { theme } = useTheme(); 

  const hideApplications = layout.length === 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className={`group flex flex-col w-full gap-y-[30px] h-full`}>
        {/* Header with category filters */}
        <HorizontalScrollContainer includeMargin={false} enableDragScroll={true} scrollToId={selectedMainCategory === null ? 'main-category-button-all' : `main-category-button-${selectedMainCategory}`}>
          <div  className={`@container flex px-[30px] gap-x-[15px] items-center ${hideApplications ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex items-center gap-x-[5px]">
              <GTPIcon 
                icon={`gtp:${AllChainsByKeys[chainKey].urlKey}-logo-monochrome` as GTPIconName} 
                size="sm" 
                style={{ color: AllChainsByKeys[chainKey].colors[theme ?? "dark"][0] }}
              />
              <div className="heading-large-md">
                Applications
              </div>
            </div>

            {/* Category buttons */}
            <div className='flex flex-1 pr-[30px]' style={{ minWidth: ((hideApplications ? allMainCategories.length : mainCategories.length) + 1) * 120 + 30}}>
              <button
                id="main-category-button-all"
                className={`flex !w-[120px] h-[24px] text-xs justify-center items-center
                  border-color-text-primary/30 border-dotted border-r-[0.5px]
                  rounded-l-[15px]
                  ${selectedMainCategory === null ? 'bg-color-ui-active' : 'bg-color-bg-medium hover:bg-color-ui-hover'}
                  ${hideApplications && 'pointer-events-none'}
                  `}
                onClick={() => setSelectedMainCategory(null)}
              >
                All
              </button>
              {(hideApplications ? allMainCategories : mainCategories).map((category, index) => (
                <button
                  id={`main-category-button-${category.id}`}
                  key={category.id}
                  className={`flex !w-[120px] h-[24px] text-xs justify-center items-center
                    border-color-text-primary/30 border-dotted
                    ${index < (hideApplications ? allMainCategories : mainCategories).length - 1 ? 'border-r-[0.5px] border-dotted' : 'rounded-r-[15px]'}
                    ${selectedMainCategory === category.id ? 'bg-color-ui-active' : 'bg-color-bg-medium hover:bg-color-ui-hover'}
                    ${hideApplications && 'pointer-events-none'}
                    `}
                    
                  onClick={() => setSelectedMainCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </HorizontalScrollContainer>
        {/* Animated Treemap visualization */}
        <div className="relative flex-1 w-full h-full px-[30px]" onClick={selectedMainCategory !== null ? handleBackToOverview : undefined}>
          {/* <div className="absolute inset-0 z-[0] flex flex-col items-center justify-center pointer-events-none">
            <GTPIcon 
              icon={`${chainKey}-logo-monochrome` as GTPIconName} 
              size="md" 
              className='!size-[200px] opacity-5' 
              containerClassName='!size-[200px]' 
              style={{ color: AllChainsByKeys[chainKey].colors.dark[0] }} 
            />
          </div> */}
          {hideApplications ? (
            <div className={`w-full flex flex-col gap-y-[10px] items-center justify-start h-full inset-0 z-[2] min-h-[192px]`}>
              <GTPIcon icon="gtp-lock" size="md" className="" />
              <div className="heading-large-md">
                Applications Not Available
              </div>
              <div className="text-xs text-center px-[30px]">
                  Application metrics are a paid add-on for each specific chain.<br />
                  Unfortunately, this chain has not yet added application metrics to growthepie.
                  <br /><br />
                  Interested? Let us know <Link href="https://discord.gg/fxjJFe7QyN" target="_blank" className="underline">here</Link>. 
              </div>
            </div>
            
            ) : (
            <>
              {/* <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none ${hideApplications ? 'opacity-0' : 'opacity-100'}`}>
                <ChartWatermarkWithMetricName className='w-[128.67px] md:w-[192.87px] text-color-text-primary/10 z-[2] pointer-events-none' metricName={`${masterData?.chains[chainKey].name} Applications`} />
              </div> */}
              <motion.div
                ref={containerRef}
                // @ts-ignore
                className='relative h-full'
                animate={{ height: dimensions.height }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                {logoSlot && (
                  <div
                    className="absolute z-[150] overflow-hidden -mt-[2px] flex items-center justify-center border border-color-bg-medium rounded-[15px]"
                    style={{
                      left: logoSlot.x,
                      top: logoSlot.y + 10,
                      width: logoSlot.width,
                      height: logoSlot.height - 20,
                      transition: 'all 0.5s',
                    }}
                  >
                    <TreemapLogo chainName={masterData?.chains[chainKey].name || ''} />
                  </div>
                )}
                <LayoutGroup id={layoutKey}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {layout.map((node) => (
                      <CategorySection
                        key={`${layoutKey}-${node.id}`}
                        node={node}
                        isResizing={isResizing}
                        ownerProjectToProjectData={ownerProjectToProjectData}
                        onCategoryClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleCategoryClick(node.id);
                        }}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setHoveredId(node.id);
                        }}
                        onMouseLeave={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setHoveredId(null);
                        }}
                        hoveredId={hoveredId}
                        viewMode={selectedMainCategory === null ? 'main' : 'sub'}
                        layoutId={node.id}
                        selectedMainCategory={selectedMainCategory}
                
                      />
                    ))}
                  </AnimatePresence>
                </LayoutGroup>
              </motion.div>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end pt-[10px] px-[30px] w-full h-[24px]">
        {!hideApplications && (
          <div className='w-[15px] h-fit z-30'>
            <GTPTooltipNew
                placement="top-end"
                size="md"
                allowInteract={true}
                trigger={
                <div
                  className={`flex items-center justify-center ${isMobile ? 'w-[24px] h-[24px] -m-[4.5px]' : 'w-[15px] h-fit'} cursor-pointer`}
                  data-tooltip-trigger
                >
                    <GTPIcon icon="gtp-info-monochrome" size="sm" className="text-color-ui-hover" />
                </div>
                }
                containerClass="flex flex-col gap-y-[10px]"
                positionOffset={{ mainAxis: 10, crossAxis: 0 }}

            >
                <div>
                <TooltipBody className='flex flex-col gap-y-[10px] pl-[20px]'>
                    {"This ecosystem map visualizes applications built on this chain. Applications are ordered by transactions in the last week, and are categorized by their primary function. Click on a category to explore its subcategories and the applications within them."}
                </TooltipBody>
                </div>
            </GTPTooltipNew>
          </div>
        )}
      </div>
    </MotionConfig>
  );
};

const ShortMainCategoryNames = {}

const ShortSubCategoryNames = {
  'Cross-Chain Communication': 'Cross Chain Comms',
  'Non-Fungible Tokens': 'NFTs',
  'Centralized Exchange': 'CEX',
  'Decentralized Exchange': 'DEX',
  'Real World Assets': 'RWA',
  'Account Abstraction (ERC4337)': 'Account Abstraction',
  'Decentralized Physical Infrastructure': 'DePIN',
  'Contract Deployments By EOAs': 'EOA Contracts'
}

// ============================================================================
// Category Section Component (IMPROVED)
// ============================================================================

interface CategorySectionProps {
  node: LayoutNode;
  isResizing: boolean;
  ownerProjectToProjectData: Record<string, any>;
  onCategoryClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => void;
  hoveredId: string | null;
  viewMode: ViewMode;
  layoutId: string;
  selectedMainCategory: string | null;

}

const CategorySection = ({
  node,
  isResizing,
  ownerProjectToProjectData,
  onCategoryClick,
  onMouseEnter,
  onMouseLeave,
  hoveredId,
  viewMode,
  layoutId,
  selectedMainCategory,

}: CategorySectionProps) => {
  const tiles = generateConstrainedTiles(node.width, node.height, node.apps.length);
  const categoryIcon = {
    'social': 'gtp-socials',
    'nft': 'gtp-nft',
    'cross_chain': 'gtp-crosschain',
    'defi': 'gtp-defi',
    'cefi': 'gtp-cefi',
    'utility': 'gtp-utilities',
    'token_transfers': 'gtp-tokentransfers',
  }
  
  return (
    <motion.div
      layoutId={layoutId}
      className={`group/category-section absolute rounded-[15px] border overflow-visible cursor-pointer z-[5]`}
      variants={categoryVariants}
      initial="initial"
      animate={{
        ...categoryVariants.animate,
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
      }}
      exit="exit"
      whileHover={viewMode === 'main' ? "hoverMain" : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={viewMode === 'main' ? (e) => {
        console.log('clicked');
        onCategoryClick(e);
      } : undefined}
    >
      {/* Animated category label */}
      <motion.div
        className={`absolute -top-[9px] left-[10px] heading-large-xs bg-color-bg-default px-[10px] ${viewMode === 'main' ? 'group-hover/category-section:underline' : ''}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {viewMode === 'main'
        
          ? <div className='flex items-center gap-x-[5px]'>
              <GTPIcon icon={`${categoryIcon[node.id]}` as GTPIconName} size="sm"
                className="w-[15px] h-[15px]"
                containerClassName="flex items-center justify-center w-[24px] h-[24px]"
              />
              <div className=''>{ShortMainCategoryNames[node.label] || node.label}</div>

            </div>
          : (ShortSubCategoryNames[node.label] || node.label)}
          
      </motion.div>

      {/* Animated app tiles */}
      <AnimatePresence mode="popLayout" initial={false}>
        {tiles.map((tile, i) => {
          const app = node.apps[i];
          if (!app) return null;

          return (
            <AppTile
              key={`${app.ownerProject}-${i}`}
              app={app}
              tile={tile}
              index={i}
            />
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// App Tile Component (NEW: Extracted for better organization)
// ============================================================================

interface AppTileProps {
  app: EnrichedApp;
  tile: { x: number; y: number; highlighted: boolean };
  index: number;
}

const AppTile = ({ app, tile, index }: AppTileProps) => {

  console.log(app);

  return (
    <motion.div
      variants={appTileVariants}
      initial="initial"
      animate={{
        opacity: tile.highlighted ? 1 : 0.3,
        scale: 1,
        left: tile.x,
        top: tile.y,
        transition: {
          delay: index * 0.02,
          duration: 0.3,
          stiffness: 300,
          damping: 20,
        }
      }}
      exit="exit"
      custom={index}
      className='absolute w-[62px] h-[62px]'
    >
      <GTPTooltipNew
        size="md"
        allowInteract={false}
        placement="bottom-start"
        trigger={
          <Link
            href={`/applications/${app.ownerProject}`}
            className='flex flex-col items-center justify-center w-full h-full'
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <motion.div
              className="w-[44px] h-[44px] bg-color-bg-medium rounded-[10px] flex items-center justify-center"
              whileHover="hover"
              variants={appTileVariants}
            >
              <div className="w-[34px] h-[34px] bg-color-ui-active rounded-[8px] flex items-center justify-center">
                {app.logoPath ? (
                  <Image
                    alt={app.displayName}
                    src={`https://api.growthepie.com/v1/apps/logos/${app.logoPath}`}
                    width={28}
                    height={28}
                    className="rounded-[6px] !w-[28px] !h-[28px] !object-cover"
                    unoptimized={true}
                  />
                ) : (
                  <GTPIcon
                    icon="gtp-project-monochrome"
                    size="sm"
                    className="!size-[21px] text-[#5A6462]"
                    containerClassName="flex items-center justify-center"
                  />
                )}
              </div>
            </motion.div>
            <motion.div
              className="text-[10px] w-full h-[19.12px] truncate text-center pt-[4px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {app.displayName}
            </motion.div>
          </Link>
        }
        containerClass="flex flex-col gap-y-[10px]"
        positionOffset={{ mainAxis: -25, crossAxis: 50 }}
      >
        <ApplicationTooltipAlt owner_project={app.ownerProject} key={index} />
      </GTPTooltipNew>
    </motion.div>
  );
};

// ============================================================================
// Tile Generation Utility (unchanged)
// ============================================================================

function generateConstrainedTiles(
  width: number,
  height: number,
  appCount: number
): { x: number; y: number; highlighted: boolean }[] {
  const TILE = 62;
  const GAP = 10;
  const PADDING_TOP = 15;
  const PADDING_BOTTOM = 5;
  const PADDING_LEFT = 3;
  const PADDING_RIGHT = 3;

  const availableW = width - (PADDING_LEFT + PADDING_RIGHT);
  const availableH = height - (PADDING_TOP + PADDING_BOTTOM);

  if (availableW <= 0 || availableH <= 0) return [];

  const maxCols = Math.floor(availableW / (TILE + GAP));
  const maxRows = Math.floor(availableH / (TILE + GAP));

  const tilesToShow = Math.max(Math.min(appCount, 3), appCount);

  let actualCols: number;
  let actualRows: number;

  if (tilesToShow <= 3) {
    actualCols = tilesToShow;
    actualRows = 1;
  } else {
    actualCols = Math.min(maxCols, Math.ceil(Math.sqrt(tilesToShow)));
    actualRows = Math.ceil(tilesToShow / actualCols);

    if (tilesToShow <= 12 && maxCols >= 6) {
      actualCols = Math.min(maxCols, Math.max(3, Math.ceil(tilesToShow / 2)));
      actualRows = Math.ceil(tilesToShow / actualCols);
    }
  }

  actualCols = Math.min(actualCols, maxCols);
  actualRows = Math.min(actualRows, maxRows);

  const totalTileWidth = actualCols * TILE + (actualCols - 1) * GAP;
  const totalTileHeight = actualRows * TILE + (actualRows - 1) * GAP;
  const offsetX = PADDING_LEFT + Math.max(0, (availableW - totalTileWidth) / 2);
  const offsetY = PADDING_TOP + Math.max(0, (availableH - totalTileHeight) / 2);

  const actualTileCount = Math.min(appCount, actualCols * actualRows);
  const tiles: { x: number; y: number; highlighted: boolean }[] = [];

  for (let i = 0; i < actualTileCount; i++) {
    const col = i % actualCols;
    const row = Math.floor(i / actualCols);
    tiles.push({
      x: offsetX + col * (TILE + GAP),
      y: offsetY + row * (TILE + GAP),
      highlighted: true
    });
  }

  return tiles;
}


export default DensePackedTreeMap;
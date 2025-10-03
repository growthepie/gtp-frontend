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
import { GTPTooltipNew } from '@/components/tooltip/GTPTooltip';
import { GTPIcon } from '../../GTPIcon';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

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

type ViewMode = 'main' | 'sub';

// ============================================================================
// Data Transformation Utilities
// ============================================================================

/**
 * Converts array-based API response to a properly typed object
 */
function arrayToObject<T>(data: any[], types: string[]): T {
  return types.reduce((obj, type, index) => {
    obj[type] = data[index];
    return obj;
  }, {} as any) as T;
}

/**
 * Transforms raw app data into enriched app objects
 */
function enrichAppData(
  rawApps: any[],
  appTypes: string[],
  projectsData: any,
  ownerProjectMap: Record<string, ProjectMetadata>
): EnrichedApp[] {
  return rawApps
    .map(rawApp => {
      const appObj = arrayToObject<AppDataRaw>(rawApp, appTypes);
      const projectMeta = ownerProjectMap[appObj.owner_project];
      
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

/**
 * Groups apps by category (main or sub)
 */
function groupAppsByCategory(
  apps: EnrichedApp[],
  groupBy: 'main' | 'sub',
  selectedMainCategory?: string
): Map<string, EnrichedApp[]> {
  const grouped = new Map<string, EnrichedApp[]>();
  
  apps.forEach(app => {
    // If viewing subcategories, filter by selected main category first
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

/**
 * Builds category nodes for treemap visualization
 */
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
  
  // For subcategory view, build nodes from app data since blockspace data doesn't have subcategory breakdown
  if (viewMode === 'sub') {
    const nodes: CategoryNode[] = [];
    const totalTxcount = apps
      .filter(app => app.mainCategory === mainCategoryLabel)
      .reduce((sum, app) => sum + app.txcount, 0);
    
    groupedApps.forEach((categoryApps, subCategoryLabel) => {
      const txcount = categoryApps.reduce((sum, app) => sum + app.txcount, 0);
      const pctShare = totalTxcount > 0 ? (txcount / totalTxcount) * 100 : 0;
      
      // Find the subcategory ID from the master data
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
  
  // For main category view, use blockspace data
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
}

const DensePackedTreeMap = ({ chainKey, chainData }: DensePackedTreeMapProps) => {
  // ============================================================================
  // State
  // ============================================================================
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [containerWidth, setContainerWidth] = useState(743);
  const [showHint, setShowHint] = useState(false);
  
  const containerRef = useRef<HTMLDivElement | null>(null);

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
  
  // Build owner project map for quick lookups
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

  // Get enriched app data filtered by chain
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

  // Build category nodes for visualization
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

    // Filter out categories with no apps
    return allNodes.filter(node => node.apps.length > 0);
  }, [chainDataOverview, enrichedApps, masterData, selectedMainCategory]);

  // Calculate height based on content density
  const dimensions = useMemo(() => {
    const MIN_HEIGHT = 100;
    const MAX_HEIGHT = 900;
    
    if (categoryNodes.length === 0) {
      return { width: containerWidth, height: MIN_HEIGHT };
    }
    
    const totalApps = categoryNodes.reduce((sum, node) => sum + node.apps.length, 0);
    
    // Estimate how much space the content actually needs
    const TILE_SIZE = 62;
    const GAP = 10;
    const CATEGORY_HEADER = 25;
    const CATEGORY_GAP = 10;
    
    // Estimate average apps per category
    const avgAppsPerCategory = totalApps / categoryNodes.length;
    
    // Estimate grid dimensions
    const estimatedCols = Math.max(3, Math.floor(containerWidth / (TILE_SIZE + GAP + 20)));
    const avgRowsPerCategory = Math.max(1, Math.ceil(avgAppsPerCategory / estimatedCols));
    
    // Estimate how categories will be laid out in the treemap
    // With few categories, they tend to stack vertically
    // With many categories, they pack more efficiently
    let estimatedCategoryRows: number;
    if (categoryNodes.length <= 2) {
      estimatedCategoryRows = categoryNodes.length;
    } else if (categoryNodes.length <= 4) {
      estimatedCategoryRows = Math.ceil(categoryNodes.length / 2);
    } else {
      estimatedCategoryRows = Math.ceil(Math.sqrt(categoryNodes.length) * 1.2);
    }
    
    // Calculate needed height
    const neededHeight = 
      (estimatedCategoryRows * avgRowsPerCategory * (TILE_SIZE + GAP)) +
      (estimatedCategoryRows * CATEGORY_HEADER) +
      ((estimatedCategoryRows - 1) * CATEGORY_GAP) +
      60; // padding buffer
    
    // Add some breathing room but cap it
    const comfortableHeight = Math.floor(neededHeight * 1.2);
    const height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, comfortableHeight));
    
    return { width: containerWidth, height };
  }, [containerWidth, categoryNodes]);

  // ============================================================================
  // Layout Calculation
  // ============================================================================
  
  const layout = useMemo(() => {
    if (categoryNodes.length === 0) return [];
    
    const { width, height } = dimensions;

    // Create hierarchy data with proportional values
    const hierarchyData = {
      name: 'root',
      children: categoryNodes.map(node => ({
        ...node,
        name: node.id,
        // Value based on app count + transaction volume
        value: node.apps.length * 1000 + Math.sqrt(node.txcount)
      }))
    };

    // Create treemap layout
    const root = d3.hierarchy(hierarchyData)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    const treemap = d3.treemap()
      .size([width, height])
      .paddingInner(10)
      .paddingOuter(0)
      .tile(d3.treemapSquarify.ratio(1/2));

    treemap(root);

    // Extract leaf nodes with positions
    return root.leaves().map(leaf => {
      const originalData = categoryNodes.find(n => n.id === leaf.data.name)!;
      
      return {
        ...originalData,
        x: Math.floor(leaf.x0),
        y: Math.floor(leaf.y0),
        width: Math.floor(leaf.x1 - leaf.x0),
        height: Math.floor(leaf.y1 - leaf.y0),
      } as LayoutNode;
    });
  }, [categoryNodes, dimensions]);

  // ============================================================================
  // Event Handlers
  // ============================================================================
  
  const handleCategoryClick = (categoryId: string, categoryLabel: string) => {
    if (selectedMainCategory === null) {
      setSelectedMainCategory(categoryId);
      setShowHint(true);
      // Hide hint after a delay
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

  // Handle click outside (optional)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectedMainCategory !== null && containerRef.current) {
        const target = e.target as HTMLElement;
        // Check if click is on background (not on a category section)
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

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeTimeout: NodeJS.Timeout;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        
        // Set resizing state
        setIsResizing(true);
        
        // Clear previous timeout
        clearTimeout(resizeTimeout);
        
        // Update width
        setContainerWidth(width);
        
        // Reset resizing state after animation settles
        resizeTimeout = setTimeout(() => {
          setIsResizing(false);
        }, 300);
      }
    });

    resizeObserver.observe(container);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, []);

  const layoutKey = selectedMainCategory === null ? 'main' : `sub-${selectedMainCategory}`;
  const selectedCategoryLabel = selectedMainCategory 
    ? masterData?.blockspace_categories.main_categories[selectedMainCategory]
    : null;

  // ============================================================================
  // Render
  // ============================================================================
  
  
  return (
    <div className="flex flex-col w-full gap-y-[30px] h-full">
      {/* Header with category filters */}
      <div className="@container flex justify-between items-center gap-x-[15px]">
        <div className="heading-large-md">
          Applications
        </div>
        
        <div className='grid grid-flow-row grid-cols-4 @[650px]:grid-flow-col w-full'>
          <button
            className={`flex h-[24px] px-[10px] text-xs min-w-fit justify-center items-center
              border-r-[0.5px] border-b-[0.5px] @[650px]:border-b-0 border-color-text-primary/30 border-dotted
              rounded-tl-[15px] @[650px]:rounded-l-full
              ${selectedMainCategory === null ? 'bg-color-ui-active' : 'bg-color-bg-medium hover:bg-color-ui-hover'}`}
            onClick={() => setSelectedMainCategory(null)}
          >
            All
          </button>
          {Object.keys(masterData?.blockspace_categories.main_categories || {})
            .filter((categoryId) => categoryId !== 'unlabeled')
            .map((categoryId, index) => (
              <button
                key={categoryId}
                className={`flex whitespace-nowrap h-[24px] px-[10px] text-xxs @[650px]:text-xs min-w-fit justify-center items-center
                  border-dotted
                  ${index < 3 ? 'border-b-[0.5px] @[650px]:border-b-0 border-color-text-primary/30' : ''}
                  ${categoryId === 'social' ? 'rounded-bl-[15px] @[650px]:rounded-none' : ''}
                  ${categoryId === 'nft' ? 'rounded-tr-[15px] @[650px]:rounded-none' : ''}
                  ${categoryId === 'cross_chain' ? 'rounded-br-[15px] @[650px]:rounded-r-full' : ''}
                  ${index < 2 ? 'border-r-[0.5px] border-color-text-primary/30' : ''}
                  ${index > 2 && index < 6 ? 'border-r-[0.5px] border-color-text-primary/30' : ''}
                  ${selectedMainCategory === categoryId ? 'bg-color-ui-active' : 'bg-color-bg-medium hover:bg-color-ui-hover'}`}
                onClick={() => setSelectedMainCategory(categoryId)}
              >
                {masterData?.blockspace_categories.main_categories[categoryId]}
              </button>
            ))}
        </div>
      </div>

      {/* Animated Treemap visualization */}
      <div className="flex-1 w-full h-full">
        <motion.div
          ref={containerRef}
          className='relative h-full bg-color-bg-default'
          style={{
            minHeight: dimensions.height,
            maxHeight: "900px",
          }}
          // Animate height changes
          animate={{ height: dimensions.height }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <LayoutGroup id={layoutKey}>
            <AnimatePresence mode="popLayout">
              {layout.map((node) => (
                <CategorySection
                  key={`${layoutKey}-${node.id}`} // Unique key per view
                  node={node}
                  isResizing={isResizing}
                  ownerProjectToProjectData={ownerProjectToProjectData}
                  onCategoryClick={() => handleCategoryClick(node.id, node.label)}
                  viewMode={selectedMainCategory === null ? 'main' : 'sub'}
                  layoutId={node.id} // For morphing effect
                />
              ))}
            </AnimatePresence>
          </LayoutGroup>
        </motion.div>
      </div>
    </div>
  );
};

// ============================================================================
// Category Section Component
// ============================================================================

interface CategorySectionProps {
  node: LayoutNode;
  isResizing: boolean;
  ownerProjectToProjectData: Record<string, any>;
  onCategoryClick: () => void;
  viewMode: ViewMode;
  layoutId: string;
}

const CategorySection = ({
  node,
  isResizing,
  ownerProjectToProjectData,
  onCategoryClick,
  viewMode,
  layoutId
}: CategorySectionProps) => {
  const tiles = generateConstrainedTiles(node.width, node.height, node.apps.length);

  return (
    <motion.div
      layoutId={layoutId}
      className='absolute rounded-[15px] border border-color-bg-medium overflow-visible cursor-pointer hover:border-forest-400 bg-ui'
      initial={{ opacity: 0, scale: 0.8, borderColor: "rgb(var(--border))" }}
      animate={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        opacity: isResizing ? 0.6 : 1,
        scale: 1,
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.8,
        transition: { duration: 0.2 }
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 1,
      }}
      whileHover={{ 
        borderColor: "rgb(var(--ui-hover))",
        transition: { duration: 0.2 }
      }}
      onClick={viewMode === 'main' ? onCategoryClick : undefined}
    >
      {/* Animated category label */}
      <motion.div 
        className="absolute -top-[9px] left-[10px] h-[17px] heading-large-xs bg-color-bg-default px-[10px]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {node.label}
      </motion.div>

      {/* Animated app tiles */}
      <AnimatePresence>
        {tiles.map((tile, i) => {
          const app = node.apps[i];
          if (!app) return null;

          return (
            <motion.div
              key={`${app.ownerProject}-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: tile.highlighted ? 1 : 0.3,
                scale: 1,
                left: tile.x,
                top: tile.y,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                delay: i * 0.02, // Stagger effect
                duration: 0.3,
                // type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className='absolute w-[62px] h-[62px]'
            >
              <GTPTooltipNew
                size="md"
                allowInteract={true}
                placement="bottom-start"
                trigger={
                  <Link
                    href={`/applications/${app.ownerProject}`}
                    className='flex flex-col items-center justify-center w-full h-full'
                    onClick={(e) => e.stopPropagation()}
                  >
                    <motion.div 
                      className="w-[41.57px] h-[41.57px] bg-color-bg-medium rounded-[10px] flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <div className="w-[32px] h-[32px] bg-color-ui-active rounded-full flex items-center justify-center">
                        {app.logoPath ? (
                          <Image
                            alt={app.displayName}
                            src={`https://api.growthepie.com/v1/apps/logos/${app.logoPath}`}
                            width={21}
                            height={21}
                            className="rounded-full"
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
                <ApplicationTooltipAlt owner_project={app.ownerProject} key={i} />
              </GTPTooltipNew>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// Tile Generation Utility
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
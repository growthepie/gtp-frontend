"use client";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import * as d3 from 'd3-hierarchy';
import useSWR from 'swr';
import { ChainOverview } from '@/lib/chains';
import { BlockspaceURLs } from '@/lib/urls';
import { MasterResponse } from '@/types/api/MasterResponse';
import { useMaster } from '@/contexts/MasterContext';
import { useProjectsMetadata } from '@/app/(layout)/applications/_contexts/ProjectsMetadataContext';
import { ApplicationTooltip, ApplicationTooltipAlt } from '@/app/(layout)/applications/_components/Components';
import Link from 'next/link';
import { GTPTooltipNew } from '@/components/tooltip/GTPTooltip';
import { GTPIcon } from '../../GTPIcon';

const data: { id: string; label: string; txcount: number; pct: number; apps: number; color: string; darkColor: string }[] = [
  {
    id: "token_transfers",
    label: "Token Transfers",
    txcount: 4847103,
    pct: 37.31,
    apps: 36,
    color: '#EF4444',
    darkColor: '#DC2626'
  },
  {
    id: "defi",
    label: "DeFi",
    txcount: 3546666,
    pct: 27.30,
    apps: 48,
    color: '#10B981',
    darkColor: '#059669'
  },
  {
    id: "cefi",
    label: "CeFi",
    txcount: 3213443,
    pct: 24.74,
    apps: 4,
    color: '#8B5CF6',
    darkColor: '#7C3AED'
  },
  {
    id: "utility",
    label: "Utility",
    txcount: 806121,
    pct: 6.21,
    apps: 18,
    color: '#F59E0B',
    darkColor: '#D97706'
  },
  {
    id: "cross_chain",
    label: "Cross Chain",
    txcount: 524603,
    pct: 4.04,
    apps: 28,
    color: '#06B6D4',
    darkColor: '#0891B2'
  },
  {
    id: "nft",
    label: "NFT",
    txcount: 29186,
    pct: 0.22,
    apps: 5,
    color: '#EC4899',
    darkColor: '#DB2777'
  },
  {
    id: "social",
    label: "Social",
    txcount: 23109,
    pct: 0.18,
    apps: 10,
    color: '#3B82F6',
    darkColor: '#2563EB'
  },
];

// chainKey={chainKey} chainData={chainData} master={master}
interface DensePackedTreeMapProps {
  chainKey: string;
  chainData: any;
}

const DensePackedTreeMap = ({
  chainKey,
  chainData,
}: DensePackedTreeMapProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: chainDataOverview } = useSWR<ChainOverview>(`https://api.growthepie.xyz/v1/chains/${chainKey}/overview.json`);
  const { data: masterData } = useMaster();

  const { data: applicationsData } = useSWR<{ data: { data: any[], types: string[] } }>(`https://api.growthepie.xyz/v1/apps/app_overview_7d.json`);
  const appTypes = applicationsData?.data.types;
  const appData = applicationsData?.data.data;

  const appDataFilteredByChain = appData && appTypes && appData.filter((item: any) => item[appTypes.indexOf('origin_key')] === chainKey);
  console.log("appTypes", appTypes);
  console.log("appDataFilteredByChain", appDataFilteredByChain);

  const { filteredProjectsData, ownerProjectToProjectData } = useProjectsMetadata();

  // join filteredProjectsData with appDataFilteredByChain on owner_project
  const appDataFilteredByChainWithProjectData = appDataFilteredByChain && appDataFilteredByChain.map((item: any) => ([
    ...item,
    filteredProjectsData?.data.find((project: any) => project[filteredProjectsData.types.indexOf('owner_project')] === item[appTypes.indexOf('owner_project')])[filteredProjectsData.types.indexOf('main_category')]
  ]));
  console.log("appDataFilteredByChainWithProjectData", appDataFilteredByChainWithProjectData);

  const t = chainDataOverview?.data.blockspace.blockspace.types;
  const data = t && chainDataOverview?.data.blockspace.blockspace.data.filter((item: any) => item[t.indexOf('main_category_id')] !== 'unlabeled').map((item: any) => ({
    id: item[t.indexOf('main_category_id')],
    label: masterData?.blockspace_categories.main_categories[item[t.indexOf('main_category_id')]],
    txcount: item[t.indexOf('txcount')],
    pct_share: item[t.indexOf('pct_share')],
    apps: masterData && filteredProjectsData && appDataFilteredByChainWithProjectData && appDataFilteredByChainWithProjectData.filter((app: any) => app[app.length - 1] === masterData.blockspace_categories.main_categories[item[t.indexOf('main_category_id')]]).sort((a: any, b: any) => b[appTypes.indexOf('txcount')] - a[appTypes.indexOf('txcount')]) || [],
  }));
  console.log("data", data);
  console.log("filteredProjectsData", filteredProjectsData);


  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 743, height: 802 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      // Immediately set resizing state
      setIsResizing(true);

      // Clear any existing timeout
      clearTimeout(resizeTimeout);

      // Set a new timeout to delay the dimension update
      resizeTimeout = setTimeout(() => {
        if (containerRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          setDimensions({
            width: Math.floor(width),
            height: Math.floor(height)
          });
          setIsResizing(false);
        }
      }, 100); // Wait 100ms after resize stops before recalculating
    };

    // Initial measurement
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({
        width: Math.floor(width),
        height: Math.floor(height)
      });
    }

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate squarified treemap layout using D3
  const layout = useMemo(() => {
    if (!data) return [];
    const { width, height } = dimensions;

    const TILE_SIZE = 62;
    const TILE_GAP = 10;
    const PADDING_TOP = 30;
    const PADDING_BOTTOM = 15;
    const PADDING_LEFT = 15;
    const PADDING_RIGHT = 15;
    const MIN_TILES = 3;

    // Calculate minimum space needed for tiles
    const calculateMinimumDimensions = (appCount: number) => {
      const tilesNeeded = Math.max(appCount, MIN_TILES);

      let cols: number;
      let rows: number;

      if (tilesNeeded <= 3) {
        cols = tilesNeeded;
        rows = 1;
      } else if (tilesNeeded === 4) {
        cols = 2;
        rows = 2;
      } else {
        cols = Math.ceil(Math.sqrt(tilesNeeded));
        rows = Math.ceil(tilesNeeded / cols);
      }

      const widthNeeded = (cols * TILE_SIZE) + ((cols - 1) * TILE_GAP) + (PADDING_LEFT + PADDING_RIGHT);
      const heightNeeded = (rows * TILE_SIZE) + ((rows - 1) * TILE_GAP) + (PADDING_TOP + PADDING_BOTTOM);

      return {
        minWidth: widthNeeded,
        minHeight: heightNeeded,
        cols,
        rows,
        tilesNeeded
      };
    };

    if (!data) return [];

    // Create data with proportional values based on app count
    const hierarchyData = {
      name: 'root',
      children: data.map(d => {
        const minDims = calculateMinimumDimensions(d.apps.length);
        return {
          ...d,
          ...minDims,
          name: d.id,
          // Value based primarily on number of apps (tiles needed)
          // with small influence from transaction volume
          value: d.apps.length * 1000 + Math.sqrt(d.txcount)
        };
      })
    };

    // Create the treemap layout
    const root = d3.hierarchy(hierarchyData)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    // Configure treemap
    const treemap = d3.treemap()
      .size([width, height])
      .paddingInner(10) // Space between sections
      .paddingOuter(0) // Space from edges
      .tile(d3.treemapSquarify.ratio(1)); // Prefer more square-like sections

    // Generate the layout
    treemap(root);

    // Extract and process the leaf nodes
    const leaves = root.leaves().map(leaf => {
      const originalData = data.find(d => d.id === leaf.data.name);

      // Use D3's calculated dimensions
      const x = Math.floor(leaf.x0);
      const y = Math.floor(leaf.y0);
      const width = Math.floor(leaf.x1 - leaf.x0);
      const height = Math.floor(leaf.y1 - leaf.y0);

      return {
        ...originalData,
        x,
        y,
        width,
        height
      };
    });

    return leaves;
  }, [dimensions, data]);

  // Generate tiles that fit within the section based on 62px constraint
  const generateConstrainedTiles = (width: number, height: number, appCount: number) => {
    const TILE = 62;
    const GAP = 10;
    const PADDING_TOP = 15;
    const PADDING_BOTTOM = 5;
    const PADDING_LEFT = 3;
    const PADDING_RIGHT = 3;

    const availableW = width - (PADDING_LEFT + PADDING_RIGHT);
    const availableH = height - (PADDING_TOP + PADDING_BOTTOM);

    if (availableW <= 0 || availableH <= 0) return [];

    // Calculate how many tiles we can fit
    const maxCols = Math.floor((availableW) / (TILE + GAP));
    const maxRows = Math.floor((availableH) / (TILE + GAP));

    const tiles: { x: number; y: number; highlighted: boolean }[] = [];

    // Ensure minimum of 3 tiles shown for small sections
    const tilesToShow = Math.max(Math.min(appCount, 3), appCount);

    // Calculate optimal arrangement
    let actualCols: number;
    let actualRows: number;

    if (tilesToShow <= 3) {
      // For very small counts, show in a single row
      actualCols = tilesToShow;
      actualRows = 1;
    } else {
      // For larger counts, try to create a roughly square arrangement
      // But limit to the actual number of apps
      actualCols = Math.min(maxCols, Math.ceil(Math.sqrt(tilesToShow)));
      actualRows = Math.ceil(tilesToShow / actualCols);

      // If we have very few apps compared to space, optimize the layout
      if (tilesToShow <= 12 && maxCols >= 6) {
        // Prefer wider layouts for small numbers
        actualCols = Math.min(maxCols, Math.max(3, Math.ceil(tilesToShow / 2)));
        actualRows = Math.ceil(tilesToShow / actualCols);
      }
    }

    // Make sure we don't exceed the available space
    actualCols = Math.min(actualCols, maxCols);
    actualRows = Math.min(actualRows, maxRows);

    // Center the tile group within the section
    const totalTileWidth = actualCols * TILE + (actualCols - 1) * GAP;
    const totalTileHeight = actualRows * TILE + (actualRows - 1) * GAP;
    const offsetX = PADDING_LEFT + Math.max(0, (availableW - totalTileWidth) / 2);
    const offsetY = PADDING_TOP + Math.max(0, (availableH - totalTileHeight) / 2);
    // const offsetY = PADDING_TOP + 10;

    // Only create the actual number of tiles (max of appCount)
    const actualTileCount = Math.min(appCount, actualCols * actualRows);

    for (let i = 0; i < actualTileCount; i++) {
      const col = i % actualCols;
      const row = Math.floor(i / actualCols);
      tiles.push({
        x: offsetX + col * (TILE + GAP),
        y: offsetY + row * (TILE + GAP),
        highlighted: true
      });
    }



    // If we need to show minimum 3 but have fewer apps, add placeholder tiles
    // if (appCount < 3) {
    //   for (let i = appCount; i < 3; i++) {
    //     const col = i % actualCols;
    //     const row = Math.floor(i / actualCols);

    //     tiles.push({
    //       x: offsetX + col * (TILE + GAP),
    //       y: offsetY + row * (TILE + GAP),
    //       highlighted: false // These are placeholder tiles
    //     });
    //   }
    // }

    return tiles;
  };

  return (
    <div className="flex flex-col w-full gap-y-[30px] h-full">
      <div className="flex justify-between items-center gap-x-[10px]">
        <div className="heading-large-md">Applications</div>
        <div className='flex w-full'>
          <button className={`flex w-full p-[5px] rounded-l-full border-r-[1px] border-forest-50 border-dotted text-xs min-w-[60px] justify-center items-center ${selectedCategory === 'all' ? 'bg-[#344240] ' : 'bg-[#151A19] hover:bg-[#5A6462]'}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {Object.keys(masterData?.blockspace_categories.main_categories || {}).map((category: string, index: number) => (
            <button className={`flex w-full  whitespace-nowrap p-[5px]   border-forest-50 border-dotted text-xs min-w-fit justify-center items-center 
                ${selectedCategory === category ? 'bg-[#344240] ' : 'bg-[#151A19] hover:bg-[#5A6462]'}
                ${index === Object.keys(masterData?.blockspace_categories.main_categories || {}).length - 1 ? 'rounded-r-full' : 'border-r-[1px] border-forest-50'}`}
              onClick={() => setSelectedCategory(category)}
              key={masterData?.blockspace_categories.main_categories[category] + "appsbar"}
            >
              {masterData?.blockspace_categories.main_categories[category]}
            </button>
          ))}
        </div>
      </div>
      {/* stretch to fill the remaining space */}
      <div className="flex-1 w-full h-full ">
        <div
          ref={containerRef}
          className='relative h-full bg-color-bg-default'
          style={{
            minHeight: dimensions.height,
            maxHeight: "1000px",
          }}
        >
          {filteredProjectsData && data && layout.map((item) => {
            const tiles = generateConstrainedTiles(item.width, item.height, item.apps.length);
            console.log("item.apps", item.apps);

            return (
              <div
                key={item.id}
                className='absolute rounded-[15px] border border-color-bg-medium transition-all duration-300 overflow-visible'
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  height: item.height,
                  opacity: isResizing ? 0.6 : 1,
                }}
              >
                <div className="absolute -top-[9px] left-[10px] h-[17px] heading-large-xs bg-color-bg-default px-[10px]">
                  {item.label}
                </div>

                {/* Dense tile pattern */}
                {tiles.map((tile, i) => (
                  <GTPTooltipNew
                    key={i}
                    size="md"
                    allowInteract={true}
                    placement="bottom-start"
                    trigger={
                      <Link href={`/applications/${item.apps[i][filteredProjectsData.types.indexOf('owner_project')] || ''}`} className='absolute w-[62px] h-[62px] flex flex-col items-center justify-center'
                        style={{
                          left: tile.x,
                          top: tile.y,
                          opacity: tile.highlighted ? 1 : 0.3 // Dim placeholder tiles
                        }}>

                        <div className="w-[41.57px] h-[41.57px] bg-color-bg-medium rounded-[10px] flex items-center justify-center">
                          <div className="w-[32px] h-[32px] bg-color-ui-active rounded-full flex items-center justify-center">
                            {(ownerProjectToProjectData[item.apps[i][filteredProjectsData.types.indexOf('owner_project')]] && ownerProjectToProjectData[item.apps[i][filteredProjectsData.types.indexOf('owner_project')]].logo_path) ? (
                              <Image
                                alt="1 inch"
                                src={`https://api.growthepie.com/v1/apps/logos/${ownerProjectToProjectData[item.apps[i][filteredProjectsData.types.indexOf('owner_project')]].logo_path}`}
                                width={21}
                                height={21}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-[32px] h-[32px] bg-color-ui-active rounded-full flex items-center justify-center">
                                <GTPIcon icon="gtp-project-monochrome" size="sm" className="!size-[21px] text-[#5A6462]" containerClassName="flex items-center justify-center" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] w-full h-[19.12px] truncate text-center pt-[4px]">
                          {ownerProjectToProjectData[item.apps[i][filteredProjectsData.types.indexOf('owner_project')]].display_name || item.apps[i][filteredProjectsData.types.indexOf('owner_project')]}
                        </div>
                      </Link>
                    }
                    containerClass="flex flex-col gap-y-[10px]"
                    positionOffset={{ mainAxis: -25, crossAxis: 50 }}
                  >
                    <ApplicationTooltipAlt owner_project={item.apps[i][filteredProjectsData.types.indexOf('owner_project')]} key={i} />
                  </GTPTooltipNew>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DensePackedTreeMap;
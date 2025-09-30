"use client";
import React, { useState } from 'react';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { GTPIconName } from '@/icons/gtp-icon-names';

const DynamicGrid = ({ chainKey, chainData, master }: { chainKey: string; chainData: any; master: any }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');


  const gtpIconNames: GTPIconName[] = [
    'gtp-bridge', 'gtp-blockspace', 'gtp-chain', 'gtp-compass', 'gtp-donate',
    'gtp-wallet', 'gtp-nft', 'gtp-shield', 'gtp-package', 'gtp-house',
    'fundamentals', 'gtp-users', 'gtp-metrics', 'gtp-network', 'gtp-technology',
    'gtp-project', 'gtp-utilities', 'gtp-settings', 'gtp-search', 'gtp-notification',
    'gtp-lock', 'gtp-share'
  ];

  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500',
    'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-rose-500', 'bg-fuchsia-500', 'bg-lime-500', 'bg-amber-500'
  ];

  const [gridItems, setGridItems] = useState([
    { 
      id: 1, 
      color: 'bg-blue-500',
      icons: [0, 1, 2, 3]
    },
    { 
      id: 2, 
      color: 'bg-purple-500',
      icons: [4, 5]
    },
    { 
      id: 3, 
      color: 'bg-pink-500',
      icons: [6]
    },
    { 
      id: 4, 
      color: 'bg-green-500',
      icons: [7, 8, 9, 10, 11, 12]
    },
    { 
      id: 5, 
      color: 'bg-yellow-500',
      icons: [13, 14, 15]
    },
    { 
      id: 6, 
      color: 'bg-red-500',
      icons: [16, 17]
    },
  ]);

  const addIconToRandomBox = () => {
    if (gridItems.length === 0) return;
    
    const randomBoxIndex = Math.floor(Math.random() * gridItems.length);
    const randomIcon = Math.floor(Math.random() * gtpIconNames.length);
    
    const updatedItems = [...gridItems];
    updatedItems[randomBoxIndex] = {
      ...updatedItems[randomBoxIndex],
      icons: [...updatedItems[randomBoxIndex].icons, randomIcon]
    };
    
    setGridItems(updatedItems);
  };

  const addNewBox = () => {
    const randomIcon = Math.floor(Math.random() * gtpIconNames.length);
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    setGridItems([...gridItems, {
      id: Date.now(),
      color,
      icons: [randomIcon]
    }]);
  };

  const shuffleGrid = () => {
    const shuffled = [...gridItems].map(item => ({
      ...item,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setGridItems(shuffled);
  };

  const removeBox = (id) => {
    setGridItems(gridItems.filter(item => item.id !== id));
  };

  const removeIconFromBox = (boxId, iconIndex) => {
    const updatedItems = gridItems.map(item => {
      if (item.id === boxId) {
        const newIcons = item.icons.filter((_, idx) => idx !== iconIndex);
        // If no icons left, remove the box
        if (newIcons.length === 0) {
          return null;
        }
        return { ...item, icons: newIcons };
      }
      return item;
    }).filter(item => item !== null);
    
    setGridItems(updatedItems);
  };

  const getGridSpan = (iconCount) => {
    // Calculate how many grid cells this box needs
    // Base size is 60px, optimized for more compact display
    // Adjust spans to better fit content without excessive whitespace
    
    if (iconCount <= 1) return 'col-span-1 row-span-1';
    if (iconCount <= 2) return 'col-span-2 row-span-1';
    if (iconCount <= 4) return 'col-span-2 row-span-2';
    if (iconCount <= 6) return 'col-span-3 row-span-2';
    if (iconCount <= 9) return 'col-span-3 row-span-3';
    if (iconCount <= 12) return 'col-span-4 row-span-3';
    if (iconCount <= 16) return 'col-span-4 row-span-4';
    return 'col-span-5 row-span-4';
  };




  
  return (
    <div className="w-full h-full flex flex-col gap-y-[15px]">
      <div className="flex justify-between items-center gap-x-[10px]">
        <div className="heading-large-md">Applications</div>
        <div className='flex w-full'>
            <button className={`flex w-full p-[5px] rounded-l-full border-r-[1px] border-forest-50 border-dotted text-xs min-w-[60px] justify-center items-center ${selectedCategory === 'all' ? 'bg-[#344240] ' : 'bg-[#151A19] hover:bg-[#5A6462]'}`}
            onClick={() => setSelectedCategory('all')}
            >
                All
            </button>
            {Object.keys(master.data.blockspace_categories.main_categories).map((category: string, index: number) => (
                <button className={`flex w-full  whitespace-nowrap p-[5px]   border-forest-50 border-dotted text-xs min-w-fit justify-center items-center 
                ${selectedCategory === category ? 'bg-[#344240] ' : 'bg-[#151A19] hover:bg-[#5A6462]'}
                ${index === Object.keys(master.data.blockspace_categories.main_categories).length - 1 ? 'rounded-r-full' : 'border-r-[1px] border-forest-50'}`}
                onClick={() => setSelectedCategory(category)}
                key={master.data.blockspace_categories.main_categories[category] + "appsbar"}
                >
                    {master.data.blockspace_categories.main_categories[category]}
                </button>
            ))}
        </div>
      </div>
      <div className="w-full h-full mx-auto">


        <div 
          className="grid gap-[15px] auto-rows-[60px] "
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
            gridAutoFlow: 'dense'
          }}
        >
          {gridItems.map(item => (
            <fieldset
              key={item.id}
              className={`
                border-[#344240] border-[1px] bg-transparent
                ${getGridSpan(item.icons.length)}
                rounded-2xl transition-all duration-300
                relative group overflow-hidden
                p-2
              `}
            >
              <legend className="px-2 text-xs text-[#8B9A99] font-medium bg-[#1F2927]">
                {item.icons.length === 1 ? 'Single App' : `${item.icons.length} Apps`}
              </legend>

              <div className="relative z-10 h-full flex flex-wrap gap-x-[15px] gap-y-[15px] content-start items-start p-1">
                {item.icons.map((iconIndex, idx) => {
                  const iconName = gtpIconNames[iconIndex];
                  return (
                    <ApplicationCard key={idx} application={item} idx={idx} iconName={iconName} />
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>


      </div>
    </div>
  );
};



const ApplicationCard = ({ application, idx, iconName }: { application: any, idx: number, iconName: string }) => {
  return (
    <div 

      className="flex flex-col relative group/icon w-fit justify-center items-center"
    >
      <div className="w-[41.57px] h-[41.57px] bg-[#344240] rounded-[10px] flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm">
        <GTPIcon 
          icon={iconName as GTPIconName} 
          size="sm" 
          className="text-white rounded-full w-[31px] h-[31px]" 
          containerClassName="w-[31.57px] rounded-full bg-[#1F2927] flex items-center justify-center h-[31.57px]"
          showLoadingPlaceholder
        />
      </div>
      <div className="text-[10px] w-[48px] truncate text-white leading-tight">{iconName}</div>

    </div>
  );
};


export default DynamicGrid;
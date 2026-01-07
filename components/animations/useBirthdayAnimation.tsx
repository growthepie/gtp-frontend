'use client';

import { useMemo } from 'react';

const ETHEREUM_LAUNCH_TIMESTAMP = 1438269973000; // July 30, 2015
const TEN_YEARS_IN_MS = 1753892760000; // ~315,576,000,000 ms

export const useBirthdayAnimation = () => {
  const showBirthdayAnimation = useMemo(() => {
    const currentTime = Date.now();
    const anniversaryTime = ETHEREUM_LAUNCH_TIMESTAMP + TEN_YEARS_IN_MS;
    
    // Show animation when current time is past the 10-year anniversary
    return currentTime >= anniversaryTime && currentTime <= anniversaryTime + 15000;
  }, []); // Empty dependency array means this only calculates once per component mount

  return { showBirthdayAnimation };
}; 
// contexts/IconPageUIContext.tsx
"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

type IconStyleOption = "gradient" | "monochrome";
type IconFormatOption = "SVG" | "PNG";

export interface IconPageUIState {
  searchQuery: string;
  selectedFormat: IconFormatOption;
  selectedSize: number;
  iconsCount: number; // Keep track of the count based on filters
}

export interface IconPageUIActions {
  setSearchQuery: (value: string) => void;
  setSelectedFormat: React.Dispatch<React.SetStateAction<IconFormatOption>>;
  setSelectedSize: React.Dispatch<React.SetStateAction<number>>;
  triggerDownloadAll: () => void; // Renamed for clarity
  setIconsCount: (count: number) => void; // Function to update count from IconsPage
}

// Combine state and actions for the context value
type IconPageUIContextType = IconPageUIState & IconPageUIActions;

// Create the context with a default undefined value
export const IconPageUIContext = createContext<IconPageUIContextType | undefined>(undefined);

// --- Provider Component ---

interface IconPageUIProviderProps {
  children: ReactNode;
  // Callback provided by IconsPage to perform the actual download logic
  onDownloadAllRequest: (format: IconFormatOption) => void;
  initialIconsCount?: number; // Allow passing initial count if known
}

export const IconPageUIProvider: React.FC<IconPageUIProviderProps> = ({
  children,
  onDownloadAllRequest,
  initialIconsCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<IconFormatOption>("SVG");
  const [selectedStyles, setSelectedStyles] = useState<IconStyleOption[]>(["gradient"]);
  const [selectedSize, setSelectedSize] = useState<number>(24);
  const [iconsCount, setIconsCount] = useState<number>(initialIconsCount); // State for the count

  // Callback for FloatingBar to trigger the download
  const triggerDownloadAll = useCallback(() => {
    // The provider knows the currently selected format
    onDownloadAllRequest(selectedFormat);
  }, [onDownloadAllRequest, selectedFormat]);

  const contextValue: IconPageUIContextType = {
    searchQuery,
    selectedFormat,
    selectedSize,
    iconsCount, // Provide the count
    setSearchQuery,
    setSelectedFormat,
    setSelectedSize,
    triggerDownloadAll, // Provide the trigger function
    setIconsCount, // Provide the setter for the count
  };

  return (
    <IconPageUIContext.Provider value={contextValue}>
      {children}
    </IconPageUIContext.Provider>
  );
};

// --- Custom Hook for Consuming Context ---

export const useIconPageUI = (): IconPageUIContextType => {
  const context = useContext(IconPageUIContext);
  if (context === undefined) {
    throw new Error('useIconPageUI must be used within an IconPageUIProvider');
  }
  return context;
};
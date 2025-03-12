"use client";

import { createContext, useContext, useState } from "react";

type SearchContextType = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const SearchContext = createContext<SearchContextType>({
  isOpen: false,
  setIsOpen: () => {},
});

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearchContext must be used within a SearchProvider");
  }
  return context;
};

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <SearchContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SearchContext.Provider>
  );
};



import { Chains } from "@/types/api/ChainOverviewResponse";
import { MasterResponse } from "@/types/api/MasterResponse";

export interface RowContainerInterface {
  master: MasterResponse;
  data: Chains;
  forceSelectedChain?: string;
  isCategoryHovered: (category: string) => boolean; // Function to check if category is hovered
  selectedCategory: string;
  selectedChain: string | null;
  selectedTimespan: string;
  categories: Object;
  allCats: boolean;
  setSelectedChain: (chain: string | null) => void;
  setSelectedCategory: (category: string) => void;
  setAllCats: (cats: boolean) => void;
  hoverCategory: (category: string) => void; // Function to hover category
  unhoverCategory: (category: string) => void; // Function to unhover category
}

export interface RowChildrenInterface {
  data: Chains;
  master: MasterResponse;
  selectedMode: string;
  forceSelectedChain?: string;
  isCategoryHovered: (category: string) => boolean; // Function to check if category is hovered
  selectedCategory: string;
  selectedChain: string | null;
  selectedTimespan: string;
  selectedValue: string;
  categories: Object;
  allCats: boolean;
  setSelectedChain: (chain: string | null) => void;
  setSelectedCategory: (category: string) => void;
  setAllCats: (cats: boolean) => void;
  hoverCategory: (category: string) => void; // Function to hover category
  unhoverCategory: (category: string) => void; // Function to unhover category
}

export interface RowParentInterface {
  data: Chains;
  selectedMode: string;
  forceSelectedChain?: string;
  isCategoryHovered: (category: string) => boolean; // Function to check if category is hovered
  selectedChain: string | null;
  selectedTimespan: string;
  categories: Object;
  allCats: boolean;
  setAllCats: (cats: boolean) => void;
  hoverCategory: (category: string) => void; // Function to hover category
  unhoverCategory: (category: string) => void; // Function to unhover category
}

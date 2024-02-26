import { Chains } from "@/types/api/ChainOverviewResponse";

export interface RowContainerInterface {
  data: Chains;
  forceSelectedChain?: string;
  isCategoryHovered: { [key: string]: boolean };
  selectedCategory: string;
  selectedChain: string | null;
  categories: Object;
  allCats: boolean;
  setSelectedChain: (chain: string | null) => void;
  setSelectedCategory: (category: string) => void;
  setAllCats: (cats: boolean) => void;
  setIsCategoryHovered: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
}

export interface RowChildrenInterface {
  data: Chains;
  selectedMode: string;
  forceSelectedChain?: string;
  isCategoryHovered: { [key: string]: boolean };
  selectedCategory: string;
  selectedChain: string | null;
  selectedTimespan: string;
  selectedValue: string;
  categories: Object;
  allCats: boolean;
  setSelectedChain: (chain: string | null) => void;
  setSelectedCategory: (category: string) => void;
  setAllCats: (cats: boolean) => void;
  setIsCategoryHovered: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
}

export interface RowParentInterface {
  data: Chains;
  selectedMode: string;
  forceSelectedChain?: string;
  isCategoryHovered: { [key: string]: boolean };
  selectedChain: string | null;
  selectedTimespan: string;
  categories: Object;
  allCats: boolean;
  setAllCats: (cats: boolean) => void;
  setIsCategoryHovered: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
}

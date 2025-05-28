import { CategoryComparisonResponseData } from "@/types/api/CategoryComparisonResponse";
import { Chains } from "@/types/api/ChainOverviewResponse";
import { MasterResponse } from "@/types/api/MasterResponse";

export interface ContractContainerInterface {
  data: Chains | CategoryComparisonResponseData;
  master: MasterResponse;
  categories: { [key: string]: string };
  timespans: { [key: string]: { label: string; shortLabel: string; value: number; xMin?: number; xMax?: number } };
  standardChainKey?: string | null;

  selectedMode: string;
  selectedValue?: 'absolute' | 'share';
  selectedTimespan: string;

  selectedCategory: string;
  setSelectedCategory?: (value: string) => void;

  selectedChain?: string | null;
  setSelectedChain?: (value: string | null) => void;

  selectedChains?: string[];
  selectedSubcategories?: string[];

  allCats?: boolean;
  setAllCats?: (value: boolean) => void;

  forceSelectedChain?: string;
  formatSubcategories: (str: string) => string;
}

export type ContractInfo = {
  address: string;
  project_name: string;
  name: string;
  main_category_key: string;
  sub_category_key: string;
  chain: string;
  gas_fees_absolute_eth: number;
  gas_fees_absolute_usd: number;
  gas_fees_share: number;
  txcount_absolute: number;
  txcount_share: number;
};

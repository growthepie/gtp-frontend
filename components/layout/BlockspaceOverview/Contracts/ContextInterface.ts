import { Chains } from "@/types/api/ChainOverviewResponse";
import { MasterResponse } from "@/types/api/MasterResponse";

export interface ContractContainerInterface {
  data: Chains;
  selectedMode: string;
  selectedCategory: string;
  selectedChain: string | null;
  selectedTimespan: string;
  categories: Object;
  allCats: boolean;
  timespans: Object;
  standardChainKey: string;
  setAllCats: (cats: boolean) => void;
}

export interface ContractRowInterface {
  data: Chains;
  master: MasterResponse;
  selectedMode: string;
  selectedCategory: string;
  selectedTimespan: string;
  selectedValue: string;
  setSelectedCategory: (category: string) => void;
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

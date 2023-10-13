// array of contracts without a key
export type ContractsResponse = Contract[];

export interface Contract {
  address: string;
  contract_name: string;
  project_name: string;
  sub_category_key: string;
  origin_key: string;
}

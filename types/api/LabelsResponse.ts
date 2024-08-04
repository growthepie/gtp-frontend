export interface LabelsResponse {
  data: Data;
}

export interface Data {
  sort: Sort;
  types: Columns[];
  data: Datum[];
}

export interface Sort {
  by: string;
  direction: string;
}

export type Columns =
  | "address"
  | "origin_key"
  | "chain_id"
  | "name"
  | "owner_project"
  | "owner_project_clear"
  | "usage_category"
  | "deployment_tx"
  | "deployer_address"
  | "deployment_date"
  | "txcount"
  | "txcount_change"
  | "gas_fees_usd"
  | "gas_fees_usd_change"
  | "daa"
  | "daa_change";

export type Datum = (string | number | null)[];

export interface ParsedDatum {
  address: string;
  origin_key: string;
  chain_id: string;
  name: string | null;
  owner_project: string | null;
  owner_project_clear: string | null;
  usage_category: string | null;
  category?: string | null;
  subcategory?: string | null;
  deployment_tx: string | null;
  deployer_address: string | null;
  deployment_date: string | null;
  txcount: number;
  txcount_change: number;
  gas_fees_usd: number;
  gas_fees_usd_change: number;
  daa: number;
  daa_change: number;
}

export class LabelsResponseHelper {
  public response: LabelsResponse;
  private typesIndexes: Record<Columns, number>;
  public data: ParsedDatum[];
  public types: Columns[];

  constructor(response: LabelsResponse) {
    this.response = response;
    this.typesIndexes = this.getTypesIndexes();
    this.data = this.getData();
    this.types = this.getTypes();
  }

  getTypes(): Columns[] {
    return this.response.data.types;
  }

  getTypesIndexes(): Record<Columns, number> {
    return this.response.data.types.reduce((acc, type, index) => {
      acc[type] = index;
      return acc;
    }, {} as Record<Columns, number>);
  }

  getData(): ParsedDatum[] {
    return this.response.data.data.map((datum) => this.parseDatum(datum));
  }

  getSort(): Sort {
    return this.response.data.sort;
  }

  private parseDatum(datum: Datum): ParsedDatum {
    const [
      address,
      origin_key,
      chain_id,
      name,
      owner_project,
      owner_project_clear,
      usage_category,
      deployment_tx,
      deployer_address,
      deployment_date,
      txcount,
      txcount_change,
      gas_fees_usd,
      gas_fees_usd_change,
      daa,
      daa_change,
    ] = [
      datum[this.typesIndexes.address],
      datum[this.typesIndexes.origin_key],
      datum[this.typesIndexes.chain_id],
      datum[this.typesIndexes.name],
      datum[this.typesIndexes.owner_project],
      datum[this.typesIndexes.owner_project_clear],
      datum[this.typesIndexes.usage_category],
      datum[this.typesIndexes.deployment_tx],
      datum[this.typesIndexes.deployer_address],
      datum[this.typesIndexes.deployment_date],
      datum[this.typesIndexes.txcount],
      datum[this.typesIndexes.txcount_change],
      datum[this.typesIndexes.gas_fees_usd],
      datum[this.typesIndexes.gas_fees_usd_change],
      datum[this.typesIndexes.daa],
      datum[this.typesIndexes.daa_change],
    ];

    return {
      address: address as string,
      origin_key: origin_key as string,
      chain_id: chain_id as string,
      name: name as string | null,
      owner_project: owner_project as string | null,
      owner_project_clear: owner_project_clear as string | null,
      usage_category: usage_category as string | null,
      deployment_tx: deployment_tx as string | null,
      deployer_address: deployer_address as string | null,
      deployment_date: deployment_date as string | null,
      txcount: txcount as number,
      txcount_change: txcount_change as number,
      gas_fees_usd: gas_fees_usd as number,
      gas_fees_usd_change: gas_fees_usd_change as number,
      daa: daa as number,
      daa_change: daa_change as number,
    };
  }

  static fromResponse(response: LabelsResponse): LabelsResponseHelper {
    return new LabelsResponseHelper(response);
  }
}

// optimized data structure for fast access to data
// using typed arrays and columnar data format
export interface LabelsResponseOptimized {
  data: DataOptimized;
}

export interface DataOptimized {
  sort: Sort;
  types: Columns[];
  data: DatumOptimized;
}

export type DatumOptimized = {
  address: string[];
  origin_key: string[];
  chain_id: (string | null)[];
  name: (string | null)[];
  owner_project: (string | null)[];
  owner_project_clear: (string | null)[];
  usage_category: (string | null)[];
  deployment_tx: (string | null)[];
  deployer_address: (string | null)[];
  deployment_date: Int32Array;
  txcount: Uint32Array;
  txcount_change: Float32Array;
  gas_fees_usd: Float32Array;
  gas_fees_usd_change: Float32Array;
  daa: Uint32Array;
  daa_change: Float32Array;
};

export const getOptimizedData = (data: Datum[]): DatumOptimized => {
  const address = data.map((datum) => datum[0] as string);
  const origin_key = data.map((datum) => datum[1] as string);
  const chain_id = data.map((datum) => datum[2] as string | null);
  const name = data.map((datum) => datum[3] as string | null);
  const owner_project = data.map((datum) => datum[4] as string | null);
  const owner_project_clear = data.map((datum) => datum[5] as string | null);
  const usage_category = data.map((datum) => datum[6] as string | null);
  const deployment_tx = data.map((datum) => datum[7] as string | null);
  const deployer_address = data.map((datum) => datum[8] as string | null);
  // convert string date to unix timestamp
  const deployment_date = new Int32Array(
    data.map((datum) =>
      datum[9] ? new Date(datum[9] as string).getTime() / 1000 : -1,
    ),
  );
  const txcount = new Uint32Array(data.map((datum) => datum[10] as number));
  const txcount_change = new Float32Array(
    data.map((datum) => datum[11] as number),
  );
  const gas_fees_usd = new Float32Array(
    data.map((datum) => datum[12] as number),
  );
  const gas_fees_usd_change = new Float32Array(
    data.map((datum) => datum[13] as number),
  );
  const daa = new Uint32Array(data.map((datum) => datum[14] as number));
  const daa_change = new Float32Array(data.map((datum) => datum[15] as number));

  return {
    address,
    origin_key,
    chain_id,
    name,
    owner_project,
    owner_project_clear,
    usage_category,
    deployment_tx,
    deployer_address,
    deployment_date,
    txcount,
    txcount_change,
    gas_fees_usd,
    gas_fees_usd_change,
    daa,
    daa_change,
  };
};

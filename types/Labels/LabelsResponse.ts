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
  name: string | null;
  owner_project: string | null;
  owner_project_clear: string | null;
  usage_category: string | null;
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
  private response: LabelsResponse;
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

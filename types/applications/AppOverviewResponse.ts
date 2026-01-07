export interface AppOverviewResponse {
  data: Data;
}

export interface Data {
  sort: Sort;
  types: Columns[];
  data: AppDatum[];
}

export interface Sort {
  by: string;
  direction: string;
}

export type Columns =
  | "owner_project"
  | "origin_key"
  | "timespan"
  | "num_contracts"
  | "gas_fees_eth"
  | "gas_fees_usd"
  | "txcount";

export type AppDatum = (string | number | null)[];

export interface ParsedDatum {
  owner_project: string;
  origin_key: string;
  timespan: string;
  num_contracts: number;
  gas_fees_eth: number;
  gas_fees_usd: number;
  txcount: number;
}

export class AppOverviewResponseHelper {
  public response: AppOverviewResponse;
  private typesIndexes: Record<Columns, number>;
  public data: ParsedDatum[];
  public types: Columns[];

  constructor(response: AppOverviewResponse) {
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

  private parseDatum(datum: AppDatum): ParsedDatum {
    const [
      owner_project,
      origin_key,
      timespan,
      num_contracts,
      gas_fees_eth,
      gas_fees_usd,
      txcount,
    
    ] = [
      datum[this.typesIndexes.owner_project] as string | null,
      datum[this.typesIndexes.origin_key] as string,
      datum[this.typesIndexes.timespan] as string,
      datum[this.typesIndexes.num_contracts] as number,
      datum[this.typesIndexes.gas_fees_eth] as number,
      datum[this.typesIndexes.gas_fees_usd] as number,
      datum[this.typesIndexes.txcount] as number,
    ];

    return {
      origin_key: origin_key as string,
      owner_project: owner_project as string,
      timespan: timespan as string,
      num_contracts: num_contracts as number,
      gas_fees_eth: gas_fees_eth as number,
      gas_fees_usd: gas_fees_usd as number,
      txcount: txcount as number,
    };
  }

  static fromResponse(response: AppOverviewResponse): AppOverviewResponseHelper {
    return new AppOverviewResponseHelper(response);
  }
}

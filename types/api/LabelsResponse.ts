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
  | "usage_category"
  | "txcount"
  | "gas_fees_usd"
  | "daa";

export type Datum = (string | number | null)[];

export interface ParsedDatum {
  address: string;
  origin_key: string;
  name: string | null;
  owner_project: string | null;
  usage_category: string | null;
  txcount: number;
  gas_fees_usd: number;
  daa: number;
}

export class LabelsResponseHelper {
  private response: LabelsResponse;
  private typesIndexes: Record<Columns, number>;
  public data: ParsedDatum[];

  constructor(response: LabelsResponse) {
    this.response = response;
    this.typesIndexes = this.getTypesIndexes();
    this.data = this.getData();
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
      usage_category,
      txcount,
      gas_fees_usd,
      daa,
    ] = [
      datum[this.typesIndexes.address],
      datum[this.typesIndexes.origin_key],
      datum[this.typesIndexes.name],
      datum[this.typesIndexes.owner_project],
      datum[this.typesIndexes.usage_category],
      datum[this.typesIndexes.txcount],
      datum[this.typesIndexes.gas_fees_usd],
      datum[this.typesIndexes.daa],
    ];

    return {
      address: address as string,
      origin_key: origin_key as string,
      name: name as string | null,
      owner_project: owner_project as string | null,
      usage_category: usage_category as string | null,
      txcount: txcount as number,
      gas_fees_usd: gas_fees_usd as number,
      daa: daa as number,
    };
  }

  static fromResponse(response: LabelsResponse): LabelsResponseHelper {
    return new LabelsResponseHelper(response);
  }
}

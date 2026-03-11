import { NextResponse } from "next/server";
import yaml from "js-yaml";

const OLI_USAGE_CATEGORY_URL =
  "https://raw.githubusercontent.com/openlabelsinitiative/OLI/refs/heads/main/1_label_schema/tags/valuesets/usage_category.yml";

export interface OLIUsageCategory {
  category_id: string;
  name: string;
  description?: string;
}

interface OLIUsageCategoriesYaml {
  categories: OLIUsageCategory[];
}

export async function GET() {
  try {
    const response = await fetch(OLI_USAGE_CATEGORY_URL, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch OLI categories: ${response.status}` },
        { status: 502 },
      );
    }

    const text = await response.text();
    const data = yaml.load(text) as OLIUsageCategoriesYaml;

    return NextResponse.json({ categories: data.categories });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load usage categories." },
      { status: 500 },
    );
  }
}

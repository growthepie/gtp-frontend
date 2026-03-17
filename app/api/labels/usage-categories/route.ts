import { NextResponse } from "next/server";
import { fetchUsageCategories } from "@openlabels/oli-sdk/chains";

export async function GET() {
  try {
    const records = await fetchUsageCategories({ revalidateSeconds: 3600 });
    const categories = records.map((r) => ({
      category_id: r.id,
      name: r.name,
      description: r.description,
    }));
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load usage categories." },
      { status: 500 },
    );
  }
}

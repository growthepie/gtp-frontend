import { IS_DEVELOPMENT, IS_PREVIEW } from "@/lib/helpers";
import moment from "moment";

const notificationTable = "tbl37943VT3Q2UPVI";
const baseId = "appZWDvjvDmVnOici";
const CACHE_TTL_SECONDS = 300; // 5 minutes

const BranchesToInclude =
  IS_PREVIEW || IS_DEVELOPMENT
    ? ["Preview", "Development", "Production", "All"]
    : ["Production", "All"];

const url = `https://api.airtable.com/v0/${baseId}/${notificationTable}`;

async function fetchData() {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY || ""}`,
      },
      next: { revalidate: CACHE_TTL_SECONDS },
    });

    const jsonResponse = await response.json();

    return jsonResponse.records
      .filter((record: any) => Object.keys(record.fields).length > 0)
      .map((record: any) => ({
        name: record.fields["Name"] || "",
        endDate: record.fields["End Date(Time Left)"] || "",
        url: record.fields["URL"] || "",
        twitterURL: record.fields["TwitterURL"] || "",
        farcasterURL: record.fields["FarcasterURL"] || "",
        lensURL: record.fields["LensURL"] || "",
      }));
  } catch (error) {
    console.error("Error fetching donations:", error);
    return [];
  }
}

export async function GET() {
  try {
    const result = await fetchData();
    return new Response(JSON.stringify(result), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET function:", error);
    return new Response(JSON.stringify([]), {
      headers: { "content-type": "application/json" },
    });
  }
}

import { IS_DEVELOPMENT, IS_PREVIEW } from "@/lib/helpers";
import moment from "moment";

const notificationTable = "tblVEHOeuoE5I4aQ7";
const baseId = "appZWDvjvDmVnOici";
const CACHE_TTL_SECONDS = 0; // 5 minutes

const BranchesToInclude =
  IS_PREVIEW || IS_DEVELOPMENT
    ? ["Preview", "Development", "Production", "All"]
    : ["Production", "All"];

const url = `https://api.airtable.com/v0/${baseId}/${notificationTable}?view=Grid%20view`;

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

    if (!jsonResponse.records) {
      const text = await response.text();
      console.error("Error fetching donations:", text, jsonResponse);
      return [];
    }

    return (
      jsonResponse.records
        .filter((record: any) => Object.keys(record.fields).length > 0)
        // .sort((a: any, b: any) =>
        //   // sort by date in descending order
        //   moment(b.fields["Date"]).diff(moment(a.fields["Date"])),
        // )
        .map((record: any) => ({
          name: record.fields["Name"] || "",
          url: record.fields["URL"] || "",
          date: record.fields["Date"] || "",
        }))
    );
  } catch (error) {
    console.error("Error fetching donations:", error);
    return [];
  }
}

export type DonationImpactRow = {
  name: string;
  url: string;
  date: string;
};

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

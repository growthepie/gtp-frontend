import { IS_DEVELOPMENT, IS_PREVIEW } from "@/lib/helpers";
import moment from "moment";

const notificationTable = "tbl37943VT3Q2UPVI";
const baseId = "appZWDvjvDmVnOici";

const date = new Date();

// if date is after 2024-10-20, set to 5 minutes, otherwise set to 0
const CACHE_TTL_SECONDS = date > new Date("2024-10-20") ? 300 : 0;

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

    const now = moment();

    return jsonResponse.records
      .filter((record: any) => Object.keys(record.fields).length > 0)
      .sort((a: any, b: any) => {
        const aIsCurrent =
          moment(a.fields["Start Date"]).isBefore(now) &&
          moment(a.fields["End Date (Time Left)"]).isAfter(now);
        const bIsCurrent =
          moment(b.fields["Start Date"]).isBefore(now) &&
          moment(b.fields["End Date (Time Left)"]).isAfter(now);

        const aIsFuture = moment(a.fields["Start Date"]).isAfter(now);
        const bIsFuture = moment(b.fields["Start Date"]).isAfter(now);

        const aIsPast = moment(a.fields["End Date (Time Left)"]).isBefore(now);
        const bIsPast = moment(b.fields["End Date (Time Left)"]).isBefore(now);

        // current rounds should be at the top, then future rounds, then past rounds and each of these should be sorted by start date
        if (aIsCurrent && bIsCurrent) {
          return moment(a.fields["Start Date"]).diff(
            moment(b.fields["Start Date"]),
          );
        } else if (aIsCurrent) {
          return -1;
        } else if (bIsCurrent) {
          return 1;
        } else if (aIsFuture && bIsFuture) {
          return moment(a.fields["Start Date"]).diff(
            moment(b.fields["Start Date"]),
          );
        } else if (aIsFuture) {
          return -1;
        } else if (bIsFuture) {
          return 1;
        } else if (aIsPast && bIsPast) {
          return moment(a.fields["Start Date"]).diff(
            moment(b.fields["Start Date"]),
          );
        } else if (aIsPast) {
          return -1;
        } else if (bIsPast) {
          return 1;
        } else {
          return 0;
        }
      })
      .map((record: any) => ({
        name: record.fields["Name"] || "",
        startDate: record.fields["Start Date"] || "",
        endDate: record.fields["End Date (Time Left)"] || "",
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

export type DonationPGFRow = {
  name: string;
  startDate: string;
  endDate: string;
  url: string;
  twitterURL: string;
  farcasterURL: string;
  lensURL: string;
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

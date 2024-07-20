import { IS_DEVELOPMENT, IS_PREVIEW } from "@/lib/helpers";
import moment from "moment";

const notificationTable = "tblA4NwUahsIldb6x";
const baseId = "appZWDvjvDmVnOici";

const CACHE_TTL_SECONDS = 300; // 5 minutes

export type Notification = {
  id: string;
  displayPages: string;
  body: string;
  desc: string;
  url?: string;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  startTimestamp: number;
  endTimestamp: number;
  branch: string;
};

const BranchesToInclude =
  IS_PREVIEW || IS_DEVELOPMENT
    ? ["Preview", "Development", "All"]
    : ["Production", "All"];

const url = `https://api.airtable.com/v0/${baseId}/${notificationTable}`;

async function fetchData() {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
      next: { revalidate: CACHE_TTL_SECONDS },
    });

    // as records
    const recordsData = (await response.json()).records
    const data = recordsData?.map((record: any) => {
      return {
        id: record.id,
        get: (field: string) => record.fields[field],
      };
    }) || [];

    // filter out records that are not enabled or not in the branches to include and map them to the Notification type
    const records: any[] = data
      .filter((record) => {
        return (
          BranchesToInclude.includes(record.get("Branch") as string) &&
          record.get("Status") === "Enabled"
        );
      })
      ?.map((record) => {
        return {
          id: record.id,
          displayPages: record.get("Display Page") as string,
          body: record.get("Body") as string,
          desc: record.get("Head") as string,
          url: record.get("URL") as string,
          icon: record.get("Icon") as string,
          backgroundColor: record.get("Color") as string,
          textColor: record.get("Text Color") as string,
          startTimestamp: moment
            .utc(
              `${record.get("Start Date") as string}T${record.get("Start Time") as string
              }Z`,
            )
            .valueOf(),
          endTimestamp: moment
            .utc(
              `${record.get("End Date") as string}T${record.get("End Time") as string
              }Z`,
            )
            .valueOf(),
          branch: record.get("Branch") as string,
        };
      });

    return records;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function GET() {
  const result = await fetchData();
  return new Response(JSON.stringify(result), {
    headers: { "content-type": "application/json" },
  });
}

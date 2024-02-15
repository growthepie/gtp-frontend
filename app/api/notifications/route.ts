import { IS_DEVELOPMENT, IS_PREVIEW } from "@/lib/helpers";
import Airtable from "airtable";
import moment from "moment";

const notificationTable = "tblA4NwUahsIldb6x";
const baseId = "appZWDvjvDmVnOici";

const CACHE_TTL_SECONDS = 300; // 5 minutes

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  baseId,
);

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

async function fetchData() {
  try {
    const data = await base(notificationTable).select().all();

    // filter out records that are not enabled or not in the branches to include and map them to the Notification type
    const records: Notification[] = data
      .filter((record) => {
        return (
          BranchesToInclude.includes(record.get("Branch") as string) &&
          record.get("Status") === "Enabled"
        );
      })
      .map((record) => {
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
              `${record.get("Start Date") as string}T${
                record.get("Start Time") as string
              }Z`,
            )
            .valueOf(),
          endTimestamp: moment
            .utc(
              `${record.get("End Date") as string}T${
                record.get("End Time") as string
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

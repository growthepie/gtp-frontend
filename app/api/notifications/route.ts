import Notification from "@/components/Notification";
import { IS_DEVELOPMENT, IS_PREVIEW } from "@/lib/helpers";
import moment from "moment";

const notificationTable = "tblA4NwUahsIldb6x";
const baseId = "appZWDvjvDmVnOici";
const CACHE_TTL_SECONDS = 300; // 5 minutes

export type NotificationType = {
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
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY || ""}`,
      },
      next: { revalidate: CACHE_TTL_SECONDS },
    });

    const jsonResponse = await response.json();

    const records = Array.isArray(jsonResponse?.records)
      ? jsonResponse.records
      : [];

    return records
      .map((record: any) => ({
        id: record?.id || "",
        displayPages: record?.fields?.["Display Page"] || "",
        body: record?.fields?.["Body"] || "",
        desc: record?.fields?.["Head"] || "",
        url: record?.fields?.["URL"] || "",
        icon: record?.fields?.["Icon"] || "",
        backgroundColor: record?.fields?.["Color"] || "",
        textColor: record?.fields?.["Text Color"] || "",
        startTimestamp:
          moment
            .utc(
              `${record?.fields?.["Start Date"] || ""}T${
                record?.fields?.["Start Time"] || ""
              }Z`,
            )
            .valueOf() || 0,
        endTimestamp:
          moment
            .utc(
              `${record?.fields?.["End Date"] || ""}T${
                record?.fields?.["End Time"] || ""
              }Z`,
            )
            .valueOf() || 0,
        branch: record?.fields?.["Branch"] || "",
      }))
      .filter(
        (notification: NotificationType) =>
          BranchesToInclude.includes(notification.branch) &&
          notification.displayPages &&
          notification.body &&
          notification.startTimestamp &&
          notification.endTimestamp,
      );
  } catch (error) {
    console.error("Error fetching notifications:", error);
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

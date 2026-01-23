import Notification from "@/components/Notification";
import { IS_DEVELOPMENT, IS_PREVIEW } from "@/lib/helpers";
import dayjs from "@/lib/dayjs";

const notificationTable = "tblA4NwUahsIldb6x";
const baseId = "appZWDvjvDmVnOici";
const CACHE_TTL_SECONDS = 300; // 5 minutes

export type NotificationType = {
  id: string;
  displayPages: string[];
  body: string;
  desc: string;
  url?: string;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  startTimestamp: number;
  endTimestamp: number;
  branch: string;
  status: string;
};

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

    const records = Array.isArray(jsonResponse?.records)
      ? jsonResponse.records
      : [];


    const result = records
      .map((record: any) => {
        // Check if we have all necessary date/time fields before trying to create timestamps
        const hasStartDateAndTime = record?.fields?.["Start Date"] && record?.fields?.["Start Time"];
        const hasEndDateAndTime = record?.fields?.["End Date"] && record?.fields?.["End Time"];

        // Safely create timestamps only if we have both date and time
        let startTimestamp = 0;
        if (hasStartDateAndTime) {
          try {
            // The "Z" suffix was likely causing issues - format date properly and check for empty strings
            const startDate = record.fields["Start Date"]?.trim() || "";
            const startTime = record.fields["Start Time"]?.trim() || "";
            
            if (startDate && startTime) {
              startTimestamp = dayjs.utc(`${startDate}T${startTime}`).valueOf();
            }
          } catch (e) {
            console.warn(`Invalid start date/time for record ${record.id}:`, e.message);
          }
        }
        
        let endTimestamp = 0;
        if (hasEndDateAndTime) {
          try {
            // The "Z" suffix was likely causing issues - format date properly and check for empty strings
            const endDate = record.fields["End Date"]?.trim() || "";
            const endTime = record.fields["End Time"]?.trim() || "";
            
            if (endDate && endTime) {
              endTimestamp = dayjs.utc(`${endDate}T${endTime}`).valueOf();
            }
          } catch (e) {
            console.warn(`Invalid end date/time for record ${record.id}:`, e.message);
          }
        }

        return {
          id: record?.id || "",
          displayPages: record?.fields?.["Display Page"] || [],
          body: record?.fields?.["Body"] || "",
          desc: record?.fields?.["Head"] || "",
          url: record?.fields?.["URL"] || "",
          icon: record?.fields?.["Icon"] || "",
          backgroundColor: record?.fields?.["Color"] || "",
          textColor: record?.fields?.["Text Color"] || "",
          startTimestamp: startTimestamp,
          endTimestamp: endTimestamp,
          branch: record?.fields?.["Branch"] || "",
          status: record?.fields?.["Status"] || "Enabled"
        };
      })
      .filter(
        (notification: NotificationType) =>
          BranchesToInclude.includes(notification.branch) &&
          notification.displayPages.length > 0 &&
          notification.body &&
          notification.startTimestamp &&
          notification.endTimestamp &&
          notification.status === "Enabled",
      );

    return result;
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

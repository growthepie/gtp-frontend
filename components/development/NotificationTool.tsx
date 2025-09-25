"use client";
import { useLocalStorage } from "usehooks-ts";
import { useSWRConfig } from "swr";
import { useState } from "react";
import { Icon } from "@iconify/react";
import type { NotificationType } from "@/app/api/notifications/route";

// Test notification data
export const testNotifications: NotificationType[] = [
  {
    id: "test-1",
    desc: "Test Active Notification",
    body: "This is a **test notification** that should be visible right now.",
    startTimestamp: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
    endTimestamp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
    displayPages: ["all"],
    url: "https://example.com",
    icon: "bi:megaphone",
    branch: "Production",
    status: "Enabled"
  },
  {
    id: "test-2", 
    desc: "Test Notification Without URL",
    body: "This notification has no link and tests the display without URL.",
    startTimestamp: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
    endTimestamp: Date.now() + 12 * 60 * 60 * 1000, // 12 hours from now
    displayPages: ["all"],
    branch: "Production",
    status: "Enabled"
  },
  {
    id: "test-3",
    desc: "Test Page-Specific Notification", 
    body: "This notification only shows on the home page.",
    startTimestamp: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
    endTimestamp: Date.now() + 6 * 60 * 60 * 1000, // 6 hours from now
    displayPages: ["home"],
    icon: "gtp-notification-monochrome",
    branch: "Production",
    status: "Enabled"
  },
  {
    id: "test-4",
    desc: "Test Page-Specific Notification", 
    body: "This notification only shows on the fundamentals page.",
    startTimestamp: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
    endTimestamp: Date.now() + 6 * 60 * 60 * 1000, // 6 hours from now
    displayPages: ["fundamentals"],
    icon: "gtp-notification-monochrome",
    branch: "Production",
    status: "Enabled"
  },
  {
    id: "test-5",
    desc: "Test Page-Specific Notification", 
    body: "This notification only shows on the fundamentals page.",
    startTimestamp: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
    endTimestamp: Date.now() + 6 * 60 * 60 * 1000, // 6 hours from now
    displayPages: ["fundamentals"],
    icon: "gtp-notification-monochrome",
    branch: "Production",
    status: "Enabled"
  },
  {
    id: "test-6",
    desc: "Test Page-Specific Notification", 
    body: "This notification only shows on the fundamentals page.",
    startTimestamp: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
    endTimestamp: Date.now() + 6 * 60 * 60 * 1000, // 6 hours from now
    displayPages: ["fundamentals"],
    icon: "gtp-notification-monochrome",
    branch: "Production",
    status: "Enabled"
  }
];

// Convert API data format to NotificationType
export const convertApiDataToNotifications = (apiRecords: any[]): NotificationType[] => {
  return apiRecords.map(record => ({
    id: record.id,
    desc: record.fields.Head,
    body: record.fields.Body,
    startTimestamp: record.fields["Start Date"] && record.fields["Start Time"] 
      ? new Date(`${record.fields["Start Date"]}T${record.fields["Start Time"]}`).getTime()
      : Date.now() - 24 * 60 * 60 * 1000,
    endTimestamp: record.fields["End Date"] && record.fields["End Time"]
      ? new Date(`${record.fields["End Date"]}T${record.fields["End Time"]}`).getTime() 
      : Date.now() + 24 * 60 * 60 * 1000,
    displayPages: record.fields["Display Page"] || ["all"],
    url: record.fields.URL,
    icon: record.fields.Icon,
    branch: record.fields.Branch,
    status: record.fields.Status
  }));
};

// Past notifications made active
export const pastNotifications = convertApiDataToNotifications([
  {
    id: "recCZVZ0S7pB5jlIO",
    fields: {
      Head: "Pie Analyzoor Competition",
      Body: "Join us in our birthday celebration by participating in the first round of Pie Analyzoor Competition. Nice rewards are awaiting!",
      "Start Date": "2024-05-27",
      "End Date": "2024-06-11", 
      "Start Time": "15:00:00",
      "End Time": "23:59:59",
      "Display Page": ["all"],
      URL: "https://mirror.xyz/blog.growthepie.eth/2QFJ4pUucQr8x3otgLpU183Y17y0h64kZh0QlvLOpgY",
      Icon: "bi:megaphone",
      Branch: "Production",
      Status: "Enabled"
    }
  },
  {
    id: "recD4Ua3lif5ypT29", 
    fields: {
      Head: "New Data Availability Page",
      Body: "Understand Data Availability better using our Data Availability Overview.",
      "Display Page": ["all"],
      URL: "https://www.growthepie.xyz/data-availability",
      Icon: "bi:megaphone",
      Branch: "Production",
      Status: "Enabled"
    }
  }
]).map(notification => ({
  ...notification,
  startTimestamp: Date.now() - 24 * 60 * 60 * 1000,
  endTimestamp: Date.now() + 24 * 60 * 60 * 1000,
}));

export default function NotificationTool() {
  const [notificationMode, setNotificationMode] = useLocalStorage<string>("notificationMode", "api");
  const [isExpanded, setIsExpanded] = useState(false);

  const modes = [
    { key: "api", label: "API", description: "Use real API data" },
    { key: "test", label: "Test", description: "Use test notifications" },
    { key: "past", label: "Past", description: "Use past notifications (made active)" },
    { key: "empty", label: "Empty", description: "No notifications" },
    { key: "error", label: "Error", description: "Simulate API error" }
  ];

  if (!isExpanded) {
    return (
      <div className="flex items-center gap-x-1">
        <div>Notifications:</div>
        <div
          className={`cursor-pointer rounded-sm px-1 h-[11.5px] flex items-center justify-center ${
            notificationMode === "api" ? "bg-white/30" : "bg-red-500/80"
          }`}
          onClick={() => setIsExpanded(true)}
        >
          {modes.find(m => m.key === notificationMode)?.label}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-x-1">
        <div>Notifications:</div>
        <div
          className="cursor-pointer rounded-sm px-1 bg-white/30 h-[11.5px] flex items-center justify-center"
          onClick={() => setIsExpanded(false)}
        >
          <Icon icon="feather:x" className="w-3 h-3" />
        </div>
      </div>
      
      <div className="font-mono text-[12px] absolute bottom-full -right-[4px] mb-1 bg-white dark:bg-black rounded py-2 min-w-48 shadow-card-dark">
        <div className="mb-2 px-2">Notification Mode</div>
        {modes.map(mode => (
          <div
            key={mode.key}
            className={`text-[10px] cursor-pointer px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${
              notificationMode === mode.key ? "bg-red-100 dark:bg-red-900" : ""
            }`}
            onClick={() => {
              setNotificationMode(mode.key);
              setIsExpanded(false);
            }}
          >
            <div className="font-semibold">{mode.label}</div>
            <div className="text-gray-600 dark:text-gray-400">{mode.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
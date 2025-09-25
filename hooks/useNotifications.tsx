"use client";
import { useMemo, useState, useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import { usePathname } from "next/navigation";
import { BASE_URL } from "@/lib/helpers";
import useSWR from "swr";
import type { NotificationType } from "@/app/api/notifications/route";
import { pastNotifications, testNotifications } from "@/components/development/NotificationTool";

const currentDateTime = new Date().getTime();

export function useNotifications() {
  const currentPath = usePathname();
  const [seenNotifications, setSeenNotifications] = useLocalStorage<NotificationType[]>(
    "seenNotifications",
    [],
  );

  // Get the notification mode from localStorage for development
  const [notificationMode] = useLocalStorage<string>("notificationMode", "api");

  // Only fetch from API when in API mode
  const { data, isLoading, isValidating, error } = useSWR<NotificationType[]>(
    notificationMode === "api" ? BASE_URL + "/api/notifications" : null, // Only fetch when in API mode
    {
      refreshInterval: 1000 * 60 * 5, // Refresh every 5 minutes
    },
  );

  // Get the raw data based on the mode
  const rawData = useMemo(() => {
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") {
      return data; // Always use API data in production
    }

    switch (notificationMode) {
      case "test":
        return testNotifications;
      case "past":
        return pastNotifications;
      case "empty":
        return [];
      case "error":
        return null;
      default:
        return data;
    }
  }, [data, notificationMode]);

  // Handle loading and error states
  const finalIsLoading = useMemo(() => {
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") {
      return isLoading;
    }
    return notificationMode === "api" ? isLoading : false;
  }, [isLoading, notificationMode]);

  const finalError = useMemo(() => {
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") {
      return error;
    }
    if (notificationMode === "error") {
      return new Error("Simulated API error");
    }
    return notificationMode === "api" ? error : null;
  }, [error, notificationMode]);

  const urlEnabled = useCallback(
    (url: string[] | string) => {
      let retValue = true;
      if (url !== "" && url[0] !== "all") {
        if (!(currentPath === "/") && url[0] === "home") {
          // Special handling for 'home' only if not on the root path
          if (!currentPath.includes(url[0])) {
            retValue = false;
          }
        } else if (!currentPath.includes(url[0]) && url[0] !== "home") {
          // For other specific pages
          retValue = false;
        }
      }
      return retValue;
    },
    [currentPath],
  );

  // Filter notifications based on timestamps and display pages
  const filteredData = useMemo(() => {
    if (!rawData) return null;
    const filtered = rawData.filter(
      (record) =>
        currentDateTime >= record.startTimestamp &&
        currentDateTime < record.endTimestamp &&
        urlEnabled(record.displayPages ? record.displayPages : ""),
    );
    return filtered;
  }, [rawData, urlEnabled]);

  // Determine if there are any unseen notifications
  const hasUnseenNotifications = useMemo(() => {
    if (!filteredData) {
      return false;
    }
    return filteredData.some(
      (notification) =>
        !seenNotifications.map((n) => n.id).includes(notification.id),
    );
  }, [filteredData, seenNotifications]);

  // Function to mark all currently filtered notifications as seen
  const markNotificationsAsSeen = useCallback(() => {
    if (filteredData && filteredData.length > 0) {
      setSeenNotifications(filteredData);
    }
  }, [filteredData, setSeenNotifications]);

  return {
    filteredData,
    hasUnseenNotifications,
    markNotificationsAsSeen,
    isLoading: finalIsLoading,
    error: finalError,
  };
}
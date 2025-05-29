"use client";
import { useMemo, useState, useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import { usePathname } from "next/navigation";
import { BASE_URL } from "@/lib/helpers";
import useSWR from "swr";
import type { NotificationType } from "@/app/api/notifications/route";

const currentDateTime = new Date().getTime();

export function useNotifications() {
  const currentPath = usePathname();
  const [seenNotifications, setSeenNotifications] = useLocalStorage<NotificationType[]>(
    "seenNotifications",
    [],
  );

  const { data, isLoading, isValidating, error } = useSWR<NotificationType[]>(
    BASE_URL + "/api/notifications",
    {
      refreshInterval: 1000 * 60 * 5, // Refresh every 5 minutes
    },
  );

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
    if (!data) return null;
    const filtered = data.filter(
      (record) =>
        currentDateTime >= record.startTimestamp &&
        currentDateTime < record.endTimestamp &&
        urlEnabled(record.displayPages ? record.displayPages : ""),
    );
    return filtered;
  }, [data, urlEnabled]);

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
    isLoading,
    error,
  };
}
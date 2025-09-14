"use client";
import React from "react";
import { Icon } from "@iconify/react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import type { NotificationType } from "@/app/api/notifications/route";
import { GTPIcon } from '../GTPIcon';
import { GTPIconName } from '@/icons/gtp-icon-names';

interface NotificationContentProps {
  width: number;
  notifications: NotificationType[] | null;
  isLoading: boolean;
  error: any;
}

const NotificationContent = ({ notifications, isLoading, error, width }: NotificationContentProps) => {
  if (isLoading) {
    return <div className="p-4 text-center text-forest-200">Loading notifications...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Failed to load notifications.</div>;
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col w-full p-4 gap-y-[5px] justify-center text-forest-200">
        <div className="heading-small-sm">
          There are currently no notifications.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full" style={{ width: `${width}px` }}>
      {notifications.map((item, index) => (
        <div key={item.id + (item.url || index)}> {/* Added index to key for unique fallback */}
          {item.url ? (
            <Link
              className={`group flex items-center gap-x-[15px] border-[#5A6462] border-dashed w-full hover:cursor-pointer p-[10px] pl-[15px] ${
                index < notifications.length - 1 ? "border-b" : "border-b-0"
              }`}
              href={item.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GTPIcon
                icon={(item.icon ? item.icon : "gtp-notification-monochrome") as GTPIconName}
                size="sm"
                className="text-[#5A6462]"
              />
              <div className="flex flex-col w-full"> {/* Added ml to align text with icon */}
                <div className="heading-small-xs group-hover:underline">
                  {item.desc}
                </div>
                <div className="text-xs">
                  <ReactMarkdown>{item.body}</ReactMarkdown>
                </div>
              </div>
              <div className="w-[24px] h-[24px] min-w-[24px] pr-[20px] self-center">
                <GTPIcon icon={"feather:chevron-right" as GTPIconName} size="md" />
              </div>
            </Link>
          ) : (
            <div
              className={`group flex items-center gap-x-[15px] border-[#5A6462] border-dashed w-full p-[10px] pl-[15px] ${
                index < notifications.length - 1 ? "border-b" : "border-b-0"
              }`}
            >
              <GTPIcon
                icon={(item.icon ? item.icon : "gtp-notification-monochrome") as GTPIconName}
                size="sm"
                className="text-[#5A6462]"
              />
              <div className="flex flex-col w-full"> {/* Added ml */}
                <div className="heading-small-xs">
                  {item.desc}
                </div>
                <div className="text-xs">
                  <ReactMarkdown>{item.body}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationContent;
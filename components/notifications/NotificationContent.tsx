"use client";
import React from "react";
import { Icon } from "@iconify/react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import type { NotificationType } from "@/app/api/notifications/route";

interface NotificationContentProps {
  notifications: NotificationType[] | null;
  isLoading: boolean;
  error: any;
}

const NotificationContent = ({ notifications, isLoading, error }: NotificationContentProps) => {
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
    <div className="flex flex-col w-full">
      {notifications.map((item, index) => (
        <div key={item.id + (item.url || index)}> {/* Added index to key for unique fallback */}
          {item.url ? (
            <Link
              className={`group flex items-start border-forest-500 border-dashed w-full hover:cursor-pointer px-4 py-[15px] hover:bg-forest-500/10 transition-colors duration-200 ${
                index < notifications.length - 1 ? "border-b" : "border-b-0"
              }`}
              href={item.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="w-[12px] h-[12px] min-w-[12px] mt-1"> {/* Adjusted margin-top for icon alignment */}
                <Icon
                  icon={item.icon ? item.icon : "feather:bell"}
                  className={`w-[12px] h-[12px] text-forest-800 ${
                    item.icon ? "visible" : "invisible"
                  }`}
                />
              </div>
              <div className="flex flex-col w-full gap-y-[8px] ml-[12px]"> {/* Added ml to align text with icon */}
                <div className="heading-small-sm">
                  {item.desc}
                </div>
                <div className="h-auto text-sm">
                  <ReactMarkdown>{item.body}</ReactMarkdown>
                </div>
              </div>
              <div className="w-[24px] h-[24px] min-w-[24px] pr-[20px] self-center">
                <Icon icon="feather:chevron-right" />
              </div>
            </Link>
          ) : (
            <div
              className={`group flex items-start border-forest-500 border-dashed w-full px-4 py-[15px] hover:bg-forest-500/10 transition-colors duration-200 ${
                index < notifications.length - 1 ? "border-b" : "border-b-0"
              }`}
            >
              <div className="w-[12px] h-[12px] min-w-[12px] mt-1"> {/* Adjusted margin-top for icon alignment */}
                <Icon
                  icon={item.icon ? item.icon : "feather:bell"}
                  className={`w-[12px] h-[12px] text-forest-800 ${
                    item.icon ? "visible" : "invisible"
                  }`}
                />
              </div>
              <div className="flex flex-col w-full gap-y-[8px] ml-[12px]"> {/* Added ml */}
                <div className="heading-small-sm">
                  {item.desc}
                </div>
                <div className="h-auto text-sm">
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
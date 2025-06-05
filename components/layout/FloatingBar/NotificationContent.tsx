// components/layout/MobileMenuContent.tsx
"use client";
import { useRef, useState } from "react";
import NotificationInsideContent from "@/components/notifications/NotificationContent";
import { useNotifications } from "@/hooks/useNotifications";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPIcon } from "../GTPIcon";
// import Backgrounds from "./Backgrounds"; // Optional: if you want the visual effect

type MobileMenuContentProps = {
  onClose: () => void;
};



export default function NotificationContent({ onClose }: MobileMenuContentProps) {
 
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollableHeight, setScrollableHeight] = useState(0);

  const { filteredData, hasUnseenNotifications, markNotificationsAsSeen, isLoading, error } = useNotifications();

  const handleClickOutside = (event: MouseEvent | TouchEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col py-[15px] gap-y-[5px] max-w-[532px] w-[calc(100vw-80px)] md:min-w-[480px] ml-auto mr-0 max-h-[70vh] scrollbar-thin scrollbar-thumb-[rgba(136,160,157,0.3)] scrollbar-track-[rgba(0,0,0,0.3)] bg-[#1F2726] border-forest-500 rounded-[12px] overflow-hidden shadow-lg"
      style={{ overflowY: 'auto' }}
    >
      <div className="flex pl-[15px] gap-x-[15px]">
        <GTPIcon icon={(hasUnseenNotifications ? "gtp-notification-new" : "gtp-notification") as GTPIconName} size="sm" />
        <div className="heading-small-xs">
          Notification Center
        </div>
      </div>
      <NotificationInsideContent
        notifications={filteredData}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { FloatingBarButton } from './FloatingBar/FloatingBarButton';
import { useNotifications } from '@/hooks/useNotifications';
import { GTPIconName } from '@/icons/gtp-icon-names';
import NotificationInsideContent from '@/components/notifications/NotificationContent';
import { GTPIcon } from './GTPIcon';
interface NotificationButtonProps {
  placement?: 'top' | 'bottom';
  className?: string;
  hideIfNoNotifications?: boolean;
}

export default function NotificationButton({ 
  placement = 'bottom', 
  className = '',
  hideIfNoNotifications = false,
}: NotificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const { filteredData, hasUnseenNotifications, markNotificationsAsSeen, isLoading, error } = useNotifications();

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside both button and popover
      if (
        buttonRef.current && 
        popoverRef.current &&
        !buttonRef.current.contains(target) && 
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
        markNotificationsAsSeen();
      }
    };

    // Add listener after a small delay to avoid immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, markNotificationsAsSeen]);

  // Handle button click
  const handleButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (isOpen) {
      setIsOpen(false);
      markNotificationsAsSeen();
    } else {
      setIsOpen(true);
    }
  };

  // Handle close from within popover content
  const handleClose = () => {
    setIsOpen(false);
    markNotificationsAsSeen();
  };

  if (hideIfNoNotifications && filteredData && filteredData.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Button */}
      <div ref={buttonRef} onClick={handleButtonClick}>
        <FloatingBarButton
          icon={(hasUnseenNotifications ? "gtp-notification-new" : "gtp-notification") as GTPIconName}
          title="Notifications"
          className={`${className?.includes('md:hidden') ? '!bg-color-bg-medium' : ''} ${className} shadow-[0px_0px_50px_0px_#000000] md:shadow-none active:scale-[0.98]`}
        />
      </div>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className={`
            absolute z-global-search-tooltip
            ${placement === 'top' 
              ? 'bottom-full mb-2' 
              : 'top-full mt-2'
            }
            ${placement === 'top' && className?.includes('md:hidden')
              ? 'left-0'
              : 'right-0'
            }
            flex flex-col py-[15px] gap-y-[5px] 
            max-w-[532px] w-[calc(100vw-80px)] md:min-w-[480px] 
            ml-auto mr-0 max-h-[70vh] 
            scrollbar-thin scrollbar-thumb-[rgba(136,160,157,0.3)] scrollbar-track-[rgba(0,0,0,0.3)] 
            bg-color-bg-default border-forest-500 
            rounded-[12px] overflow-hidden shadow-[0px_0px_50px_0px_#000000]
            transition-[opacity,transform] duration-200 ease-out
          `}
          style={{ overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="flex pl-[15px] gap-x-[15px]">
            <GTPIcon 
              icon={(hasUnseenNotifications ? "gtp-notification-new" : "gtp-notification") as GTPIconName} 
              size="sm" 
            />
            <div className="heading-small-xs">
              Notification Center
            </div>
          </div>
          
          {/* Content */}
          <NotificationInsideContent
            notifications={filteredData}
            isLoading={isLoading}
            error={error}
          />
        </div>
      )}
    </div>
  );
}
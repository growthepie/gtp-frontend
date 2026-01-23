"use client";
import React, { useEffect, useRef, useState } from 'react';
import ExpandableMenu, { Placement } from '@/components/layout/FloatingBar/ExpandableMenu';
import { useNotifications } from '@/hooks/useNotifications';
import { GTPIconName } from '@/icons/gtp-icon-names';
import NotificationContent from './NotificationContent';
import { GTPIcon } from '../GTPIcon';
import { useUIContext } from '@/contexts/UIContext';

interface NotificationButtonExpandableProps {
  className?: string;
  hideIfNoNotifications?: boolean;
  size?: { width: number | string; height: number | string };
  expandedSize?: { width: number | string; height: number | string };
  placement?: Placement;
  shadow?: boolean;
}

export default function NotificationButtonExpandable({
  className = '',
  hideIfNoNotifications = false,
  size = { width: 44, height: 44 },
  expandedSize = { width: 380, height: "auto" },
  placement = "top-end",
  shadow = false
}: NotificationButtonExpandableProps) {
  const [open, setOpen] = useState(false);
  const notificationContentRef = useRef<HTMLDivElement>(null);
  // const [customExpandedSize, setCustomExpandedSize] = useState({ width: 380, height: 0 });
  const [customExpandedWidth, setCustomExpandedWidth] = useState(380);
  const [customExpandedHeight, setCustomExpandedHeight] = useState(0);
  
  const MAX_HEIGHT = 300;


  useEffect(() => {
    
    const handleResize = () => {
      let viewportWidth = window.innerWidth;
      
      if (viewportWidth < 768) {
        setCustomExpandedWidth(viewportWidth - 50);
      }else{
        setCustomExpandedWidth(380);
      }
    };

    window.addEventListener('resize', handleResize);

    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const {
    filteredData,
    hasUnseenNotifications,
    markNotificationsAsSeen,
    isLoading,
    error
  } = useNotifications();

  // Mark notifications as seen when closing
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      markNotificationsAsSeen();
    }
  };

  const updateDimensions = () => {
    const contentEl = notificationContentRef.current;
    if (!contentEl) return;
    setCustomExpandedHeight(Math.min(contentEl.clientHeight + 50, MAX_HEIGHT));
  };

  // observe the height of the notification content and update the custom expanded size
  useEffect(() => {
    updateDimensions();
    const contentEl = notificationContentRef.current;
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (contentEl) {
      resizeObserver.observe(contentEl);
    }
    return () => {
      if (contentEl) {
        resizeObserver.unobserve(contentEl);
      }
    };
  }, [filteredData]);

  useEffect(() => {
    const contentEl = notificationContentRef.current;
    if (!contentEl) return;
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(contentEl);
    return () => resizeObserver.unobserve(contentEl);
  }, [filteredData]);

  // Determine if we should hide the button
  // Only hide after loading confirms there are no notifications
  const shouldHide = hideIfNoNotifications && !isLoading && filteredData && filteredData.length === 0;

  const buttonWidth = typeof size.width === 'number' ? size.width : 44;

  return (
    <div
      className={`relative shrink-0 transition-all duration-300 ease-out ${className}`}
      style={shouldHide ? {
        width: buttonWidth,
        marginLeft: `${-buttonWidth - 15}px`,
        opacity: 0,
        pointerEvents: 'none',
      } : undefined}
    >
      <ExpandableMenu
        open={open}
        onOpenChange={handleOpenChange}
        openOn="both"
        placement={placement} // Panel grows downward, aligned to right
        closeOnSelect={false} // Don't auto-close when clicking content
        collapsedSize={size}
        expandedSize={{ width: customExpandedWidth, height: customExpandedHeight }}
        triggerClassName={shadow && !open ? "md:shadow-none shadow-soft-lg !px-0 !gap-0" : "!px-0 !gap-0"}
        panelClassName=" md:shadow-none shadow-soft-lg"
        contentClassName="gap-y-0 pt-0 pb-0" // Remove default spacing for custom content
        renderTrigger={({ open, props }) => (
          <button
            {...props}
            type="button"
            className={`relative flex items-center w-full h-full rounded-full overflow-hidden ${open ? '' : ''}`}
            aria-label="Notifications"
          >
            <GTPIcon
              icon={(hasUnseenNotifications ? "gtp-notification-new" : "gtp-notification") as GTPIconName}
              size="md"
              containerClassName={`!size-[44px] min-w-[44px] flex items-center justify-center`}
            />
            <div className={`heading-small-sm whitespace-nowrap min-w-0 ${open ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
              Notification Center
            </div>
          </button>
        )}
        renderContent={({ onClose }) => (
          <div className="flex flex-col w-full h-full z-[1000]">
            {/* Scrollable Content */}
            <ScrollableContainer>
              <div ref={notificationContentRef}>
                <NotificationContent
                  width={customExpandedWidth}
                  notifications={filteredData}
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            </ScrollableContainer>
          </div>
        )}
      />
    </div>
  );
}

const ScrollableContainer = ({ children }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  });

  // Effect to update dimensions on content change or resize
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const updateDimensions = () => {
      setScrollState({
        scrollTop: contentEl.scrollTop,
        scrollHeight: contentEl.scrollHeight,
        clientHeight: contentEl.clientHeight,
      });
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(contentEl);
    return () => resizeObserver.unobserve(contentEl);
  }, [children]);

  // Effect to handle scroll events
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;
    
    const handleScroll = () => {
      setScrollState(prevState => ({ ...prevState, scrollTop: contentEl.scrollTop }));
    };

    contentEl.addEventListener('scroll', handleScroll);
    return () => contentEl.removeEventListener('scroll', handleScroll);
  }, []);
  
  const { scrollTop, scrollHeight, clientHeight } = scrollState;
  
  // Determine if fades should be visible
  const showTopFade = scrollTop > 0;
  const showBottomFade = scrollTop < scrollHeight - clientHeight - 1;
  const isScrollable = scrollHeight > clientHeight;

  // Build the className string for the wrapper
  let containerClassName = 'scrollable-container-wrapper';
  if (showTopFade) containerClassName += ' show-top-fade';
  if (showBottomFade) containerClassName += ' show-bottom-fade';

  // Calculate scrollbar thumb size and position
  const thumbHeight = (clientHeight / scrollHeight) * 100;
  const thumbPosition = (scrollTop / scrollHeight) * 100;

  return (
    <div className={containerClassName}>
      <div className="scrollable-content" ref={contentRef}>
        {children}
      </div>
      
      {/* Custom scrollbar remains the same */}
      {/* {isScrollable && (
         <div className="custom-scrollbar-track">
            <div 
              className="custom-scrollbar-thumb" 
              style={{
                height: `${thumbHeight}%`,
                top: `${thumbPosition}%`
              }} 
            />
         </div>
      )} */}
    </div>
  );
};
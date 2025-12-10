// src/components/context-menu/IconContextMenu.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { useOutsideAlerter } from "@/hooks/useOutsideAlerter";
import { GTPIcon } from "../layout/GTPIcon"; // Adjust path if needed
import { GTPIconName } from "@/icons/gtp-icon-names"; // Adjust path if needed
import { useToast } from "../toast/GTPToast"; // Adjust path if needed
import { triggerBlobDownload, convertSvgToPngBlob } from "@/lib/icon-library/clientSvgUtils"; // Adjust path if needed

interface IconContextMenuProps {
  children: React.ReactNode;
  // Function to get SVG data (string, width, height) for copy/download
  getSvgData: () => Promise<{ svgString: string | null; width: number; height: number } | null>;
  // Name used for downloading the file
  itemName: string;
  // URL for the "See more icons" link
  iconPageUrl?: string;
  // Optional class name for the wrapper div
  wrapperClassName?: string;
  // Whether this is the logo (to show "Open in new tab" option)
  isLogo?: boolean;
  // Optional context menu options
  contextMenuOptions?: {
    isLink: boolean;
  };
}

export const IconContextMenu = ({
  children,
  getSvgData,
  itemName,
  iconPageUrl = "https://icons.growthepie.com", // Default URL
  wrapperClassName,
  isLogo = false, // Default to false
  contextMenuOptions = { isLink: false },
}: IconContextMenuProps) => {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{
    top?: number | undefined;
    left?: number | undefined;
    bottom?: number | undefined;
    right?: number | undefined;
  }>({ top: undefined, left: undefined, bottom: undefined, right: undefined });
  const menuRef = useRef<HTMLDivElement>(null);

  // Add effect to log menu options when menu is open
  useEffect(() => {
    if (isOpen) {
      console.log("Context menu options:", options.map(option => option.label));
    }
  }, [isOpen]);

  // Close menu on outside click
  useOutsideAlerter(menuRef, () => {
    setIsOpen(false);
  });

  // Close menu on scroll or resize
  useEffect(() => {
    const handleClose = () => setIsOpen(false);

    if (isOpen) {
      window.addEventListener("scroll", handleClose, true); // Use capture phase for scroll
      window.addEventListener("resize", handleClose);
    }

    // Cleanup listeners
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [isOpen]);


  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent triggering parent context menus if nested
    // 
    const viewportWidth = window.innerWidth;

    // if 767px or less
    if (viewportWidth <= 767) {
      console.log("Viewport width is less than or equal to 767px");
      // Use clientX/clientY for mobile devices
      const windowHeight = window.innerHeight;
      setPosition({ left: event.clientX, bottom: windowHeight - event.clientY, top: undefined, right: undefined });
    } else {
    
      console.log("Viewport width is greater than 767px");
      
      setPosition({ left: event.clientX, top: event.clientY, bottom: undefined, right: undefined });
    }
    setIsOpen(true);
  };

  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation(); // Add this line
    const data = await getSvgData();
    if (!data?.svgString) {
      toast.addToast({
        title: "Error",
        message: "Icon SVG data not found",
        type: "error",
      });
      setIsOpen(false);
      return;
    }
    navigator.clipboard.writeText(data.svgString);
    toast.addToast({
      title: "Success",
      message: `${itemName} copied to clipboard`,
      type: "success",
    });
    setIsOpen(false);
  };

  const handleDownload = async (event: React.MouseEvent) => {
    event.stopPropagation(); // Add this line
    const data = await getSvgData();
    if (!data?.svgString) {
      toast.addToast({
        title: "Error",
        message: "Icon SVG data not found",
        type: "error",
      });
      setIsOpen(false);
      return;
    }

    // Use provided dimensions or default to a reasonable size like 32x32
    const width = data.width || 32;
    const height = data.height || 32;

    const blob = await convertSvgToPngBlob(data.svgString, width, height);
    if (!blob) {
      toast.addToast({
        title: "Error",
        message: `Failed to convert ${itemName} to PNG`,
        type: "error",
      });
      setIsOpen(false);
      return;
    }
    triggerBlobDownload(`${itemName}.png`, blob);
    setIsOpen(false);
  };

  const handleGoToIconsPage = (event: React.MouseEvent) => {
    event.stopPropagation(); // Add this line
    if (iconPageUrl) {
        window.open(iconPageUrl, "_blank");
    }
    setIsOpen(false);
  };

  // Add new handler for opening homepage in new tab
  const handleOpenInNewTab = (event: React.MouseEvent) => {
    event.stopPropagation(); // Add this line
    window.open("/", "_blank");
    setIsOpen(false);
  };

  // Add new handler for Brand Guide
  const handleBrandGuide = (event: React.MouseEvent) => {
    event.stopPropagation();
    window.open("https://api.growthepie.com/brand/growthepie_brand_guide.zip", "_blank");
    setIsOpen(false);
  };

  const options = [
    ...(isLogo || contextMenuOptions.isLink ? [{ icon: "gtp-plus", label: "Open in new tab", onClick: handleOpenInNewTab }] : []),
     { icon: "gtp-copy", label: "Copy", onClick: handleCopy },
     { icon: "gtp-download", label: "Download", onClick: handleDownload },
     ...(isLogo ? [{ icon: "gtp-growthepie-logo", label: "Brand Guide", onClick: handleBrandGuide }] : []),
     { icon: "gtp-growthepie-icons", label: "See more icons", onClick: handleGoToIconsPage },
  ];

  // Define the menu content
  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-context-menu flex flex-col w-fit gap-y-[5px] rounded-[15px] overflow-hidden bg-color-bg-default text-color-text-primary text-xs shadow-[0px_0px_8px_0px_rgba(0,_0,_0,_0.66)]"
      style={{ left: position.left, top: position.top, bottom: position.bottom, right: position.right }}
      // Prevent context menu on the menu itself
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex flex-col gap-y-[5px] w-full py-[10px]">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={option.onClick}
            className="flex w-full items-center justify-between gap-x-[30px] pl-[20px] pr-[25px] py-[5px] cursor-pointer hover:bg-color-ui-hover/50"
          >
            <div className="flex justify-start items-center gap-x-[10px] text-[12px]">
              {/* Ensure GTPIcon is imported correctly */}
              <div className={`flex items-center justify-center w-[16px] h-[16px] ${option.label === "Brand Guide" ? "pt-[3px]" : ""}`}>
                <GTPIcon 
                  icon={option.icon as GTPIconName} 
                  size={option.label === "Brand Guide" ? "md" : "sm"} 
                  className={option.label === "Brand Guide" ? "!size-[16px]" : "!size-[12px]"} 
                />
              </div>
              <span>{option.label}</span>
            </div>
            {/* Optional: Shortcut placeholder */}
          </button>
        ))}
      </div>
    </div>
  );

  // Ensure portal only attempts to render client-side
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);


  return (
    <div className={wrapperClassName || "relative w-fit"} onContextMenu={handleContextMenu}>
      {children}
      {isMounted && isOpen && createPortal(menuContent, document.body)}
    </div>
  );
};
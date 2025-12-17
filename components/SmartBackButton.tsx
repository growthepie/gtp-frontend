"use client";

import { useRouter, usePathname } from 'next/navigation';
import Icon from "@/components/layout/Icon";
import { useNavigation } from '@/contexts/NavigationContext';

interface SmartBackButtonProps {
  fallbackHref?: string;
  className?: string;
  iconClassName?: string;
  variant?: 'desktop' | 'mobile';
}

/**
 * Get the intelligent fallback URL based on current path
 * Navigates to parent route if it exists, otherwise uses fallbackHref
 */
function getIntelligentFallback(currentPath: string, fallbackHref: string): string {
  // Remove trailing slash
  const cleanPath = currentPath.endsWith('/') && currentPath.length > 1
    ? currentPath.slice(0, -1)
    : currentPath;

  // Split path into segments
  const segments = cleanPath.split('/').filter(Boolean);

  // If we're at root or only one segment deep, use fallbackHref
  if (segments.length <= 1) {
    return fallbackHref;
  }

  // Remove last segment to get parent path
  // e.g., /applications/uniswap -> /applications
  const parentPath = '/' + segments.slice(0, -1).join('/');

  return parentPath;
}

export function SmartBackButton({
  fallbackHref = "/",
  className = "",
  iconClassName = "",
  variant = 'desktop'
}: SmartBackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { canGoBack, getPreviousPath } = useNavigation();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();

    if (canGoBack) {
      // set goBack-scrollPos-key session storage key
      // console.log("[SmartBackButton / NavigationContext] Setting goBack-scrollPos-pathname session storage key", `scrollPos-${pathname}`);
      const previousPath = getPreviousPath();
      sessionStorage.setItem(`goBack-scrollPos-pathname`, `scrollPos-${previousPath}`);
      router.back();
    } else {
      
      // Use intelligent fallback that navigates to parent route
      const intelligentFallback = getIntelligentFallback(pathname, fallbackHref);

      // set goBack-${intelligentFallback} session storage key
      // console.log("[SmartBackButton / NavigationContext] Setting goBack-scrollPos-pathname session storage key", `scrollPos-${intelligentFallback}`);
      sessionStorage.setItem(`goBack-scrollPos-pathname`, `scrollPos-${intelligentFallback}`);

      router.push(intelligentFallback);
    }
  };

  const baseClasses = "flex items-center justify-center rounded-full w-[36px] h-[36px] bg-color-bg-medium hover:bg-color-ui-hover transition-colors cursor-pointer";
  const desktopClasses = "lg:flex hidden";
  const mobileClasses = "lg:hidden flex";

  const buttonClasses = `${baseClasses} ${variant === 'desktop' ? desktopClasses : mobileClasses} ${className}`;

  const iconName = variant === 'desktop' ? "feather:arrow-left" : 'fluent:arrow-left-32-filled';
  const iconSize = variant === 'desktop' ? "size-[26px]" : "w-[20px] h-[25px]";
  const iconColor = "text-color-text-primary";

  // Generate tooltip based on navigation state
  const getTooltip = () => {
    if (canGoBack) {
      const previousPath = getPreviousPath();
      return previousPath ? `Go back to ${previousPath}` : 'Go back';
    }
    const intelligentFallback = getIntelligentFallback(pathname, fallbackHref);
    return intelligentFallback === '/' ? 'Go to home page' : `Go to ${intelligentFallback}`;
  };

  return (
    <button
      onClick={handleBack}
      className={buttonClasses}
      aria-label="Go back"
      title={getTooltip()}
    >
      <Icon
        icon={iconName}
        className={`${iconSize} ${iconColor} ${iconClassName}`}
      />
    </button>
  );
}
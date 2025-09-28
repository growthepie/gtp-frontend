"use client";

import { useRouter } from 'next/navigation';
import Icon from "@/components/layout/Icon";
import { useNavigation } from '@/contexts/NavigationContext';

interface SmartBackButtonProps {
  fallbackHref?: string;
  className?: string;
  iconClassName?: string;
  variant?: 'desktop' | 'mobile';
}

export function SmartBackButton({ 
  fallbackHref = "/", 
  className = "",
  iconClassName = "",
  variant = 'desktop'
}: SmartBackButtonProps) {
  const router = useRouter();
  const { canGoBack, getPreviousPath } = useNavigation();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (canGoBack) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  const baseClasses = "flex items-center justify-center rounded-full w-[36px] h-[36px] bg-color-bg-medium hover:bg-color-ui-hover transition-colors cursor-pointer";
  const desktopClasses = "lg:flex hidden";
  const mobileClasses = "lg:hidden flex";
  
  const buttonClasses = `${baseClasses} ${variant === 'desktop' ? desktopClasses : mobileClasses} ${className}`;

  const iconName = variant === 'desktop' ? "feather:arrow-left" : 'fluent:arrow-left-32-filled';
  const iconSize = variant === 'desktop' ? "size-[26px]" : "w-[20px] h-[25px]";
  const iconColor = "text-color-text-primary";

  return (
    <button 
      onClick={handleBack}
      className={buttonClasses}
      aria-label={`Go back${canGoBack ? ' to previous page' : ' to home'}`}
      title={canGoBack ? `Go back to ${getPreviousPath()}` : 'Go to home page'}
    >
      <Icon 
        icon={iconName} 
        className={`${iconSize} ${iconColor} ${iconClassName}`} 
      />
    </button>
  );
}
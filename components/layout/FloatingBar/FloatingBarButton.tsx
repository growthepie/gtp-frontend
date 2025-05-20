import React from 'react';
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

interface FloatingBarButtonProps {
  onClick?: () => void;
  label?: string;
  icon?: string | GTPIconName;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBadge?: boolean;
  badgeContent?: React.ReactNode;
  title?: string;
}

export const FloatingBarButton: React.FC<FloatingBarButtonProps> = ({
  onClick,
  label,
  icon,
  iconPosition = 'left',
  size = 'md',
  className = '',
  showBadge = false,
  badgeContent,
  title,
}) => {
  const getBaseClasses = () => {
    const baseClasses = "flex items-center rounded-full bg-[#1F2726]";
    
    if (!label) {
      // Icon-only buttons are circular
      return `${baseClasses} justify-center ${size === 'sm' ? 'w-[30px] h-[30px]' : 'w-[44px] h-[44px]'}`;
    }
    
    // Buttons with text have padding and gap
    return `${baseClasses} gap-x-[10px] ${size === 'sm' ? 'px-[10px] h-[30px]' : 'px-[15px] h-[44px]'}`;
  };

  return (
    <button
      className={`${getBaseClasses()} ${className}`}
      onClick={onClick}
      title={title}
    >
      {/* Icon on the left if iconPosition is 'left' and icon exists */}
      {icon && iconPosition === 'left' && (
        <GTPIcon 
          icon={icon as GTPIconName} 
          size={size === 'sm' ? 'sm' : 'md'} 
        />
      )}
      
      {/* Label if provided */}
      {label && (
        <span className="heading-small-sm">{label}</span>
      )}
      
      {/* Icon on the right if iconPosition is 'right' and icon exists */}
      {icon && iconPosition === 'right' && (
        <GTPIcon 
          icon={icon as GTPIconName} 
          size={size === 'sm' ? 'sm' : 'md'} 
        />
      )}
      
      {/* Badge if showBadge is true */}
      {showBadge && (
        <div className="flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-[#FE5468] text-white text-xs">
          {badgeContent}
        </div>
      )}
    </button>
  );
};
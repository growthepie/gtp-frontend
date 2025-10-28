import React, { useMemo } from 'react';
import { GTPIcon, sizeClassMap } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { Icon } from '@iconify/react';

interface FloatingBarButtonProps {
  onClick?: () => void;
  label?: string;
  icon?: GTPIconName | React.ReactNode;
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
    const baseClasses = "flex items-center rounded-full bg-color-bg-default";
    
    if (!label) {
      // Icon-only buttons are circular
      return `${baseClasses} justify-center ${size === 'sm' ? 'w-[30px] h-[30px]' : 'w-[44px] h-[44px]'}`;
    }
    
    // Buttons with text have padding and gap
    return `${baseClasses} gap-x-[10px] ${size === 'sm' ? 'px-[10px] h-[30px]' : 'px-[15px] h-[44px]'}`;
  };

  const iconComponent = useMemo(() => {
    if (!icon) return null;
    if(typeof icon === 'string') {
      if(icon.includes(":")) {
        return <Icon icon={icon} className={sizeClassMap[size]} />;
      }
      return <GTPIcon icon={icon as GTPIconName} size={size === 'sm' ? 'sm' : 'md'} />;
    }
    return icon;
  }, [icon, size]);

  return (
    <button
      className={`${getBaseClasses()} ${className} active:scale-[0.98]`}
      onClick={onClick}
      title={title}
    >
      {/* Icon on the left if iconPosition is 'left' and icon exists */}
      {icon && iconPosition === 'left' && (
        iconComponent
      )}
      
      {/* Label if provided */}
      {label && (
        <span className="heading-small-sm">{label}</span>
      )}
      
      {/* Icon on the right if iconPosition is 'right' and icon exists */}
      {icon && iconPosition === 'right' && (
        iconComponent
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

export const FloatingBarButtonContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-center">
      {children}
    </div>
  );
};
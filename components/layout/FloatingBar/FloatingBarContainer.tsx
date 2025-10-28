import React from 'react';

interface FloatingBarContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const FloatingBarContainer: React.FC<FloatingBarContainerProps> = ({
  children,
  className = '',
}) => {
  return (
      <div 
        data-floating-bar
        className={`flex p-[5px] items-center w-full rounded-full bg-color-bg-medium shadow-standard gap-x-[5px] md:gap-x-[15px] z-0 pointer-events-auto ${className}`}
      >
        {children}
      </div>
  );
};
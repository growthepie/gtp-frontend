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
      <div className={`flex p-[5px] items-center w-full rounded-full bg-[#344240] shadow-[0px_0px_50px_0px_#000000] gap-x-[5px] md:gap-x-[15px] z-0 pointer-events-auto ${className}`}>
        {children}
      </div>
  );
};
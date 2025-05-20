import React, { useEffect, useRef, useState } from 'react';

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  width?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  closeOnClickOutside?: boolean;
  openOnHover?: boolean;
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  content,
  position = 'bottom',
  width = 'auto',
  className = '',
  triggerClassName = '',
  contentClassName = '',
  closeOnClickOutside = true,
  openOnHover = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const useOutsideAlerter = (ref: React.RefObject<HTMLElement>, callback: () => void) => {
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          callback();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref, callback]);
  };

  useOutsideAlerter(containerRef, () => {
    setIsOpen(false);
    setIsLocked(false);
  });

  // Get position styles for the popover content
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
      case 'right':
        return { left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' };
      case 'bottom':
        return { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { right: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' };
      default:
        return { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onClick={(e) => {
        if (!isLocked) {
          setIsLocked(true);
        }
      }}
      onMouseEnter={() => openOnHover && setIsOpen(true)}
      onMouseLeave={() => openOnHover && !isLocked && setIsOpen(false)}
    >
      {/* Trigger element */}
      <div
        className={`cursor-pointer ${triggerClassName}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </div>

      {/* Popover content */}
      <div
        className={`absolute z-50 bg-[#151A19] rounded-[22px] shadow-[0px_0px_50px_0px_#000000] transition-all duration-300 overflow-hidden ${contentClassName}`}
        style={{
          width,
          maxHeight: isOpen ? '70vh' : '0',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          ...getPositionStyles(),
        }}
      >
        {content}
      </div>
    </div>
  );
};
"use client";
import { use, useEffect, useRef, useState } from "react";

interface ToggleValue {
  value: string;
  label: string;
}

interface ToggleProps {
  values: {
    left: ToggleValue;
    right: ToggleValue;
  };
  value: string;
  onChange: (value: string) => void;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  textColor?: string;
  containerColor?: string;
  sliderColor?: string;
  size?: "sm" | "md" | "lg" | "xl"
}

export function ToggleSwitch({
  values,
  value,
  onChange,
  leftComponent,
  rightComponent,
  className = "",
  disabled = false,
  size = "md",
  ariaLabel = "Toggle option",
  textColor = "text-[#CDD8D3]",
  containerColor = "bg-[#344240]",
  sliderColor = "bg-[#1F2726]",
}: ToggleProps) {
  const toggleSelectionRef = useRef<HTMLDivElement>(null);
  const [toggleWidth, setToggleWidth] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      // Set mounted to true after a short delay to ensure the component is fully rendered
    setMounted(true);
    }, 500);
  }, []);
  
  // Measure the toggle width when the component mounts or window resizes
  useEffect(() => {
    const toggle = toggleSelectionRef.current;
    if (!toggle) return;

    // Debounced resize handler
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      if(!mounted) return;
      
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (toggle) {
          setToggleWidth(toggle.getBoundingClientRect().width);
        }
      }, 100);
    };

    // Initial measurement using requestAnimationFrame to ensure DOM is ready
    animationFrameRef.current = requestAnimationFrame(() => {
      setToggleWidth(toggle.getBoundingClientRect().width);
    });

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle focus styling
  useEffect(() => {
    const toggle = toggleSelectionRef.current;
    if (!toggle) return;

    const handleFocus = () => toggle.classList.add('focus-visible');
    const handleBlur = () => toggle.classList.remove('focus-visible');

    toggle.addEventListener('focus', handleFocus);
    toggle.addEventListener('blur', handleBlur);

    return () => {
      toggle.removeEventListener('focus', handleFocus);
      toggle.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleToggle = () => {
    if (disabled || isAnimating) return;
    
    // Set animating state to prevent multiple rapid toggles
    setIsAnimating(true);

    // Schedule the actual state change
    onChange(value === values.left.value ? values.right.value : values.left.value);
    
    // Use requestAnimationFrame to coordinate with browser's rendering cycle
    animationFrameRef.current = requestAnimationFrame(() => {
      setTimeout(() => {
        setIsAnimating(false);
      }, 100);
    });
  };

  // Handle keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(); 
    }
  };

  // Determine which value is active
  const isLeftActive = value === values.left.value;

  const containerHeightMap = {
    sm: "h-[24px]",
    md: "h-[28px]",
    lg: "h-[32px]",
    xl: "h-[36px]"
  };

  const selectionHeightMap = {
    sm: "h-[20px]",
    md: "h-[24px]",
    lg: "h-[28px]",
    xl: "h-[32px]"
  };

  const fontSizeMap = {
    sm: "heading-small-xxs",
    md: "heading-small-xs",
    lg: "heading-small-sm",
    xl: "heading-small-sm"
  };

  const componentPaddingMap = {
    sm: "px-[2px]",
    md: "px-[4px]",
    lg: "px-[8px]",
    xl: "px-[12px]"
  };
  
  

  return (
    <div className={`flex items-center gap-x-[10px] ${className}`}>
      <div
        className={`
          ${fontSizeMap[size]} ${textColor} whitespace-nowrap
          select-none rounded-full
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:opacity-75'}
          transition-opacity duration-200
        `}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="switch"
        aria-checked={isLeftActive}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        {/* Background container with both labels */}
        <div
          className={`flex items-center justify-between rounded-full cursor-pointer p-[2px] ${containerHeightMap[size]} ${containerColor}`}
        >
          {leftComponent && (
            <div className={`flex items-center justify-center ${componentPaddingMap[size]}`}>
              {leftComponent}
            </div>
          )}
          <div 
            ref={toggleSelectionRef} 
            className={`relative flex items-center gap-x-[19px] h-[24px] px-[10px]`}
          >
            <div className="flex items-center justify-center">
              <div>
                {values.left.label}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div>
                {values.right.label}
              </div>
            </div>
            {/* Sliding highlighter */}
            <div
              className={`
                absolute left-0 ${selectionHeightMap[size]}
                flex items-center justify-center
                rounded-full ${sliderColor}
                ${mounted && "transition-all duration-300 will-change-transform"}
                px-[10px]
              `}
              style={{
                transform: isLeftActive ? "translateX(0px)" : `translateX(calc(${toggleWidth}px - 100%))`,
                maxWidth: toggleWidth
              }}
            >
              <div className="flex items-center justify-center">
                {isLeftActive ? values.left.label : values.right.label}
              </div>
            </div>
          </div>
          {rightComponent && (
            <div className={`flex items-center justify-center ${componentPaddingMap[size]}`}>
              {rightComponent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
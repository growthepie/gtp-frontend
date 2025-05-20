import React, { useEffect, useRef, useState, memo } from 'react';

interface DraggableContainerProps {
  children: React.ReactNode;
  className?: string;
  direction?: "horizontal" | "vertical";
}

export const DraggableContainer = memo(({
  children,
  className = '',
  direction = "horizontal",
}: DraggableContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maskGradient, setMaskGradient] = useState<string>("");
  
  // Add a resize observer to monitor content changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Function to check for overflow and update gradients
    const checkOverflow = () => {
      if (!container) return;
      
      const hasHorizontalOverflow = container.scrollWidth > container.clientWidth;
      const hasScrolledRight = container.scrollLeft > 0;
      const hasMoreToScroll = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1);
      
      // Force update gradients based on actual scroll position and content width
      if (direction === 'horizontal') {
        if (hasHorizontalOverflow) {
          if (hasScrolledRight && hasMoreToScroll) {
            setMaskGradient(
              "linear-gradient(to right, transparent, black 50px, black calc(100% - 50px), transparent)"
            );
          } else if (hasScrolledRight) {
            setMaskGradient(
              "linear-gradient(to right, transparent, black 50px, black)"
            );
          } else if (hasMoreToScroll) {
            setMaskGradient(
              "linear-gradient(to left, transparent, black 50px, black)"
            );
          }
        } else {
          setMaskGradient("");
        }
      }
    };
    
    // Create a resize observer to detect when content changes size
    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });
    
    // Observe both the container and its children
    resizeObserver.observe(container);
    Array.from(container.children).forEach(child => {
      resizeObserver.observe(child);
    });
    
    // Also check on scroll events
    const handleScroll = () => checkOverflow();
    container.addEventListener('scroll', handleScroll);
    
    // Initial check
    checkOverflow();
    
    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, direction]);
  
  // Also update when children prop changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Use requestAnimationFrame to ensure DOM has updated
    const rafId = requestAnimationFrame(() => {
      if (container) {
        const hasHorizontalOverflow = container.scrollWidth > container.clientWidth;
        const hasScrolledRight = container.scrollLeft > 0;
        const hasMoreToScroll = container.scrollLeft < (container.scrollWidth - container.clientWidth - 1);
        
        if (direction === 'horizontal') {
          if (hasHorizontalOverflow) {
            if (hasScrolledRight && hasMoreToScroll) {
              setMaskGradient(
                "linear-gradient(to right, transparent, black 50px, black calc(100% - 50px), transparent)"
              );
            } else if (hasScrolledRight) {
              setMaskGradient(
                "linear-gradient(to right, transparent, black 50px, black)"
              );
            } else if (hasMoreToScroll) {
              setMaskGradient(
                "linear-gradient(to left, transparent, black 50px, black)"
              );
            } else {
              setMaskGradient("");
            }
          } else {
            setMaskGradient("");
          }
        }
      }
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [children, containerRef, direction]);

  return (
    <div
      ref={containerRef}
      className={`flex gap-x-[10px] items-center overflow-x-auto scrollbar-hide h-full ${className}`}
      style={{
        maskClip: "padding-box",
        WebkitMaskClip: "padding-box",
        WebkitMaskImage: maskGradient,
        maskImage: maskGradient,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        transition: "all 0.3s",
      }}
    >
      {children}
    </div>
  );
});

DraggableContainer.displayName = 'DraggableContainer';
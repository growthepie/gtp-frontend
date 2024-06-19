"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useElementSizeObserver } from '@/hooks/useElementSizeObserver';

type VerticalScrollContainerProps = {
  className?: string;
  children: React.ReactNode;
  height: number;
  paddingRight?: number;
  paddingLeft?: number;
  paddingTop?: number;
  paddingBottom?: number;
};

export default function VerticalScrollContainer({ children, className, height, paddingRight, paddingLeft, paddingTop, paddingBottom }: VerticalScrollContainerProps) {

  const [currentScrollPercentage, setCurrentScrollPercentage] = useState(0);
  const [contentSrollAreaRef, { height: contentSrollAreaHeight }] = useElementSizeObserver<HTMLDivElement>();
  const [scrollerRef, { height: scrollerHeight }] = useElementSizeObserver<HTMLDivElement>();
  const [contentRef, { height: contentHeight }] = useElementSizeObserver<HTMLDivElement>();
  const grabberRef = useRef<HTMLDivElement>(null);

  const updateScrollableAreaScroll = useCallback(() => {
    const contentArea = contentSrollAreaRef.current;
    if (contentArea) {
      const scrollableHeight = contentArea.scrollHeight - contentArea.clientHeight
      const scrollPercentage = (contentArea.scrollTop / scrollableHeight) * 100;
      setCurrentScrollPercentage(scrollPercentage);
    }
  }, [contentSrollAreaRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!contentSrollAreaRef.current || !grabberRef.current) {
      return;
    }



    // keep track of scroll top and the y position of the mouse
    const startPos = {
      top: contentSrollAreaRef.current.scrollTop,
      y: e.clientY,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!contentSrollAreaRef.current || !grabberRef.current) {
        return;
      }
      // calculate the distance moved by the mouse
      const dy = e.clientY - startPos.y;

      // calculate the scrollable height
      const scrollableHeight = contentSrollAreaRef.current.scrollHeight - contentSrollAreaRef.current.clientHeight;

      // scale the dy value to match the scrollable height proportionately
      const scaledDy = (dy / contentSrollAreaRef.current.clientHeight) * scrollableHeight;

      // calculate the new scrollTop value
      const scrollTop = startPos.top + scaledDy;

      // set the new scrollTop value
      contentSrollAreaRef.current.scrollTop = Math.max(0, Math.min(scrollableHeight, scrollTop));

      updateScrollableAreaScroll();
      updateCursor(grabberRef.current);
    };

    const handleMouseUp = () => {
      if (!contentSrollAreaRef.current || !grabberRef.current) {
        return;
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      resetCursor(grabberRef.current);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [contentSrollAreaRef, updateScrollableAreaScroll]);


  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!contentSrollAreaRef.current || !grabberRef.current) {
      return;
    }
    const touch = e.touches[0];
    const startPos = {
      top: contentSrollAreaRef.current.scrollTop,
      y: touch.clientY,
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!contentSrollAreaRef.current || !grabberRef.current) {
        return;
      }
      const touch = e.touches[0];
      const dy = touch.clientY - startPos.y;
      const scrollableHeight = contentSrollAreaRef.current.scrollHeight - contentSrollAreaRef.current.clientHeight;
      const scrollTop = startPos.top + dy;
      contentSrollAreaRef.current.scrollTop = Math.max(0, Math.min(scrollableHeight, scrollTop));

      updateScrollableAreaScroll();
      updateCursor(grabberRef.current);
    };

    const handleTouchEnd = () => {
      if (!contentSrollAreaRef.current || !grabberRef.current) {
        return;
      }
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      resetCursor(grabberRef.current);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [contentSrollAreaRef, updateScrollableAreaScroll]);

  const updateCursor = (node: HTMLDivElement) => {
    node.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  const resetCursor = (node: HTMLDivElement) => {
    node.style.cursor = 'grab'
    document.body.style.removeProperty('user-select');
  }



  useEffect(() => {
    const scrollableArea = contentSrollAreaRef.current;

    if (scrollableArea) {
      scrollableArea.addEventListener('scroll', updateScrollableAreaScroll);
    }
    return () => {
      if (scrollableArea) {
        scrollableArea.removeEventListener('scroll', updateScrollableAreaScroll);
      }
    };
  }, [contentSrollAreaRef, updateScrollableAreaScroll]);

  const scrollerY = useMemo(() => {
    if (scrollerHeight === 0) {
      return '0px';
    }
    return currentScrollPercentage * (scrollerHeight / 100) + '%';
  }, [currentScrollPercentage, scrollerHeight]);

  // const [showScroller, setShowScroller] = useState(false);

  const showScroller = useMemo(() => {
    return contentHeight > contentSrollAreaHeight;
  }, [contentHeight, contentSrollAreaHeight]);

  const handleBarClick = (e: React.MouseEvent) => {
    if (!contentSrollAreaRef.current) {
      return;
    }
    const scrollableHeight = contentSrollAreaRef.current.scrollHeight - contentSrollAreaRef.current.clientHeight;
    const y = e.clientY - contentSrollAreaRef.current.getBoundingClientRect().top;
    const scrollPercentage = (y / contentSrollAreaRef.current.clientHeight) * 100;
    const scrollTop = (scrollPercentage / 100) * scrollableHeight;
    contentSrollAreaRef.current.scrollTop = scrollTop;
    updateScrollableAreaScroll();

    handleMouseDown(e);
  };

  const [maskGradient, setMaskGradient] = useState<string>('');

  const showTopGradient = useMemo(() => {
    return currentScrollPercentage > 0;
  }, [currentScrollPercentage]);

  const showBottomGradient = useMemo(() => {
    return currentScrollPercentage < 100;
  }, [currentScrollPercentage]);

  useEffect(() => {
    if (showTopGradient && showBottomGradient) {
      setMaskGradient('linear-gradient(to bottom, transparent, black 50px, black calc(100% - 50px), transparent)');
    }
    else if (showTopGradient) {
      setMaskGradient('linear-gradient(to bottom, transparent, black 50px, black)');
    }
    else if (showBottomGradient) {
      setMaskGradient('linear-gradient(to top, transparent, black 50px, black)');
    }
    else {
      setMaskGradient('');
    }
  }, [showTopGradient, showBottomGradient]);

  return (
    <div className={`flex w-full px-0 overflow-y-hidden ${className}`}>
      <div className="overflow-y-visible w-full">
        <div
          className="relative overflow-y-scroll scrollbar-none max-w-full transition-all duration-300" ref={contentSrollAreaRef}
          style={{
            height: `${height}px`,
            maskClip: 'padding-box',
            WebkitMaskClip: 'padding-box',
            WebkitMaskImage: maskGradient,
            maskImage: maskGradient,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            paddingRight: paddingRight ? `${paddingRight}px` : undefined,
            paddingLeft: paddingLeft ? `${paddingLeft}px` : undefined,
            paddingTop: paddingTop ? `${paddingTop}px` : undefined,
            paddingBottom: paddingBottom ? `${paddingBottom}px` : undefined,
          }}
        >
          <div className={showScroller ? "" : ''}>
            <div className="min-w-fit w-full max-w-full" ref={contentRef} >
              <div>{children}</div>
            </div>
          </div>
        </div>
      </div>
      <div className={`pl-[10px] h-full flex flex-col justify-center ${showScroller ? 'block' : 'hidden'}`} style={{ height: height }}>
        <div className="h-full pb-[22px] p-0.5 bg-black/30 rounded-full" onMouseDown={handleBarClick} onMouseUp={handleMouseDown}>
          <div className='h-full w-2 relative' ref={scrollerRef}>
            <div
              className="h-5 w-2 bg-forest-400/30 rounded-full"
              style={{
                position: 'absolute',
                top: currentScrollPercentage + '%',
                left: "0px",
                cursor: 'grab'
              }}
              onMouseDown={handleMouseDown}
              ref={grabberRef}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
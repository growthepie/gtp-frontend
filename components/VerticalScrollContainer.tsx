"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useElementSizeObserver } from '@/hooks/useElementSizeObserver';

type HorizontalScrollContainerProps = {
  className?: string;
  children: React.ReactNode;
  height: number;
};

export default function VerticalScrollContainer({ children, className, height }: HorizontalScrollContainerProps) {

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

    console.log("startPos", startPos);
    console.log("e", e);

    const handleMouseMove = (e: MouseEvent) => {
      if (!contentSrollAreaRef.current || !grabberRef.current) {
        return;
      }

      // calculate the distance moved by the mouse
      const dy = e.clientY - startPos.y;

      console.log("dy", dy);

      // calculate the scrollable height
      const scrollableHeight = contentSrollAreaRef.current.scrollHeight - contentSrollAreaRef.current.clientHeight;

      // calculate the new scrollTop value
      const scrollTop = startPos.top + dy;

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
    const clickY = e.clientY - contentSrollAreaRef.current.getBoundingClientRect().top;
    const scrollTop = (clickY / contentSrollAreaRef.current.clientHeight) * scrollableHeight;
    contentSrollAreaRef.current.scrollLeft = scrollTop;
  };

  return (
    <div className={`flex w-full px-0 overflow-y-hidden ${className}`}>
      <div className="overflow-y-visible">
        <div
          className="pl-[20px] md:pl-[50px] relative overflow-y-scroll scrollbar-none max-w-full" ref={contentSrollAreaRef}
          style={{
            height: `${height}px`
          }}
        >
          <div className={showScroller ? "mr-[20px] md:mr-[50px]" : ''}>
            <div className="min-w-fit w-full max-w-full pr-[20px] md:pr-[50px]" ref={contentRef} >
              <div>{children}</div>
            </div>
          </div>
        </div>
      </div>
      <div className={`pl-[10px] py-[20px] md:py-[50px] h-full flex flex-col justify-center ${showScroller ? 'block' : 'hidden'}`} style={{ height: height }}>
        <div className="h-full pb-[22px] p-0.5 bg-forest-200/50 dark:bg-black/50 rounded-full" onClick={handleBarClick}>
          <div className='h-full w-2 relative' ref={scrollerRef}>
            <div
              className="h-5 w-2 bg-white dark:bg-forest-1000 rounded-full"
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
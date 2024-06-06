"use client";

import { use, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useElementSizeObserver } from '@/hooks/useElementSizeObserver';
import React from 'react';

type HorizontalScrollContainerProps = {
  className?: string;
  children: React.ReactNode;
  setHorizontalScrollAmount?: React.Dispatch<React.SetStateAction<number>>;
  style?: React.CSSProperties;
};

export default React.forwardRef(function LabelsHorizontalScrollContainer(
  {
    className = '',
    children,
    setHorizontalScrollAmount,
    style,
  }: HorizontalScrollContainerProps,
  ref: React.Ref<HTMLDivElement>
) {
  // const contentSrollAreaRef = useRef<HTMLDivElement>(null);
  // const contentRef = useRef<HTMLDivElement>(null);
  const [currentScrollPercentage, setCurrentScrollPercentage] = useState(0);
  const [contentSrollAreaRef, { width: contentSrollAreaWidth }] = useElementSizeObserver<HTMLDivElement>();
  const [scrollerRef, { width: scrollerWidth }] = useElementSizeObserver<HTMLDivElement>();
  const [contentRef, { width: contentWidth }] = useElementSizeObserver<HTMLDivElement>();
  const grabberRef = useRef<HTMLDivElement>(null);

  const updateScrollableAreaScroll = useCallback(() => {
    const contentArea = contentSrollAreaRef.current;
    if (contentArea) {
      const scrollableWidth = contentArea.scrollWidth - contentArea.clientWidth;
      const scrollPercentage = (contentArea.scrollLeft / scrollableWidth) * 100;
      setCurrentScrollPercentage(scrollPercentage);


      if (setHorizontalScrollAmount) {
        setHorizontalScrollAmount(contentArea.scrollLeft);
      }
    }
  }, [contentSrollAreaRef, setHorizontalScrollAmount]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!contentSrollAreaRef.current || !grabberRef.current) {
      return;
    }

    const startPos = {
      left: contentSrollAreaRef.current.scrollLeft,
      x: e.clientX,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!contentSrollAreaRef.current || !grabberRef.current) {
        return;
      }
      const dx = e.clientX - startPos.x;
      const scrollableWidth = contentSrollAreaRef.current.scrollWidth - contentSrollAreaRef.current.clientWidth;
      const scrollLeft = startPos.left + dx;
      contentSrollAreaRef.current.scrollLeft = Math.max(0, Math.min(scrollableWidth, scrollLeft));


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
      left: contentSrollAreaRef.current.scrollLeft,
      x: touch.clientX,
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!contentSrollAreaRef.current || !grabberRef.current) {
        return;
      }
      const touch = e.touches[0];
      const dx = touch.clientX - startPos.x;
      const scrollableWidth = contentSrollAreaRef.current.scrollWidth - contentSrollAreaRef.current.clientWidth;
      const scrollLeft = startPos.left + dx;
      contentSrollAreaRef.current.scrollLeft = Math.max(0, Math.min(scrollableWidth, scrollLeft));

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

  const scrollerX = useMemo(() => {
    if (scrollerWidth === 0) {
      return '0px';
    }
    return currentScrollPercentage * (scrollerWidth / 100) + 'px';
  }, [currentScrollPercentage, scrollerWidth]);

  // const [showScroller, setShowScroller] = useState(false);

  const showScroller = useMemo(() => {
    return contentWidth > contentSrollAreaWidth;
  }, [contentWidth, contentSrollAreaWidth]);

  const handleBarClick = (e: React.MouseEvent) => {
    if (!contentSrollAreaRef.current) {
      return;
    }
    const scrollableWidth = contentSrollAreaRef.current.scrollWidth - contentSrollAreaRef.current.clientWidth;
    const clickX = e.clientX - contentSrollAreaRef.current.getBoundingClientRect().left;
    const scrollLeft = (clickX / contentSrollAreaRef.current.clientWidth) * scrollableWidth;
    contentSrollAreaRef.current.scrollLeft = scrollLeft;
  };

  return (
    <div className={`w-full px-0 overflow-x-hidden ${className}`} style={style} ref={ref}>
      <div className={`pt-[10px] px-[20px] md:px-[64px] w-full flex justify-center ${showScroller ? 'block' : 'hidden'}`}>
        <div className="w-full pr-[22px] p-0.5 bg-forest-200/50 dark:bg-black/50 rounded-full" onClick={handleBarClick}>
          <div className='w-full' ref={scrollerRef}>
            <div
              className="w-5 h-2 bg-white dark:bg-forest-1000 rounded-full"
              style={{
                transform: `translateX(${scrollerX})`,
                cursor: 'grab'
              }}
              onMouseDown={handleMouseDown}
              ref={grabberRef}
            ></div>
          </div>
        </div>
      </div>
      <div className="overflow-x-visible ">
        <div className="pl-[20px] md:pl-[60px] relative overflow-x-scroll scrollbar-none max-w-full" ref={contentSrollAreaRef}>

          <div className={showScroller ? "mr-[20px] md:mr-[60px]" : ''}>
            <div className="min-w-fit w-full max-w-full pr-[30px] md:pr-[60px]" ref={contentRef} >
              <div>{children}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
});
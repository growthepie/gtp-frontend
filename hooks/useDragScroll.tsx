import { useEffect, useRef, useState, useCallback } from 'react';

const useDragScroll = (direction: 'horizontal' | 'vertical' = 'horizontal') => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDragged, setIsDragged] = useState(false);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    setIsDragging(true);
    setIsDragged(false);
    setStartPos({ x: event.clientX, y: event.clientY });

    if (containerRef.current) {
      setScrollPos({
        left: containerRef.current.scrollLeft,
        top: containerRef.current.scrollTop,
      });
    }

    event.preventDefault(); // Prevent text selection
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return;

    setIsDragged(true);

    if (containerRef.current) {
      if (direction === 'horizontal') {
        const dx = event.clientX - startPos.x;
        containerRef.current.scrollLeft = scrollPos.left - dx;
      } else {
        const dy = event.clientY - startPos.y;
        containerRef.current.scrollTop = scrollPos.top - dy;
      }
    }
  }, [isDragging, direction, scrollPos, startPos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    if (!containerRef.current) return;

    if (direction === 'horizontal') {
      containerRef.current.scrollLeft += event.deltaY;
    } else {
      containerRef.current.scrollTop += event.deltaY;
    }
  }, [direction]);

  const updateGradients = useCallback(() => {
    if (!containerRef.current) return;

    if (direction === 'horizontal') {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftGradient(scrollLeft > 0);
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth);
    } else {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      setShowLeftGradient(scrollTop > 0);
      setShowRightGradient(scrollTop < scrollHeight - clientHeight);
    }
  }, [direction]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleGlobalMouseMove = (event: MouseEvent) => handleMouseMove(event);
    const handleGlobalMouseUp = () => handleMouseUp();

    container.style.cursor = isDragging ? 'grabbing' : 'grab';

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('resize', updateGradients);
    window.addEventListener('keydown', updateGradients);
    window.addEventListener('keyup', updateGradients);
    container.addEventListener('scroll', updateGradients);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('resize', updateGradients);
      window.removeEventListener('keydown', updateGradients);
      window.removeEventListener('keyup', updateGradients);
      container.removeEventListener('scroll', updateGradients);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, updateGradients, isDragging, handleWheel]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      if (isDragged) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    container.addEventListener('click', handleClick, true);
    updateGradients();

    return () => {
      container.removeEventListener('click', handleClick, true);
    };
  }, [isDragged, updateGradients]);

  return { containerRef, showLeftGradient, showRightGradient };
};

export default useDragScroll;

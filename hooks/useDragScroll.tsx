import { useEffect, useRef, useState, useCallback } from 'react';

const useDragScroll = (direction: 'horizontal' | 'vertical' = 'horizontal') => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDragged, setIsDragged] = useState(false);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [lastMoveTime, setLastMoveTime] = useState(Date.now());

  const isMouseDownInside = useRef(false);
  const velocityHistory = useRef<{ x: number; y: number; time: number }[]>([]);
  const rafId = useRef<number | null>(null);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (containerRef.current) {
      isMouseDownInside.current = true;
      setIsDragging(true);
      setIsDragged(false);
      setStartPos({ x: clientX, y: clientY });
      setVelocity({ x: 0, y: 0 });
      velocityHistory.current = [];

      rafId.current && cancelAnimationFrame(rafId.current);

      setScrollPos({
        left: containerRef.current.scrollLeft,
        top: containerRef.current.scrollTop,
      });
    }
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const currentTime = Date.now();
    const timeDelta = currentTime - lastMoveTime;

    setIsDragged(true);

    if (containerRef.current) {
      if (direction === 'horizontal') {
        const dx = clientX - startPos.x;
        containerRef.current.scrollLeft = scrollPos.left - dx;
        velocityHistory.current.push({ x: -dx / timeDelta, y: 0, time: currentTime });
      } else {
        const dy = clientY - startPos.y;
        containerRef.current.scrollTop = scrollPos.top - dy;
        velocityHistory.current.push({ x: 0, y: -dy / timeDelta, time: currentTime });
      }
    }

    setLastMoveTime(currentTime);
  }, [isDragging, lastMoveTime, direction, startPos.x, startPos.y, scrollPos.left, scrollPos.top]);

  const handleEnd = useCallback(() => {
    if (!isMouseDownInside.current) return;

    isMouseDownInside.current = false;
    setIsDragging(false);

    const avgVelocity = calculateAverageVelocity();
    setVelocity(avgVelocity);

    if (avgVelocity.x !== 0 || avgVelocity.y !== 0) {
      const startTime = Date.now();
      const decay = 0.96;

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const factor = Math.pow(decay, elapsed / 16);

        if (containerRef.current) {
          if (direction === 'horizontal') {
            containerRef.current.scrollLeft += avgVelocity.x * factor;
          } else {
            containerRef.current.scrollTop += avgVelocity.y * factor;
          }

          if (Math.abs(avgVelocity.x * factor) > 0.5 || Math.abs(avgVelocity.y * factor) > 0.5) {
            rafId.current = requestAnimationFrame(animate);
          }
        }
      };

      animate();
    }
  }, [direction]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (containerRef.current && containerRef.current.contains(event.target as Node)) {
      handleStart(event.clientX, event.clientY);
      event.preventDefault();
    }
  }, [handleStart]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    handleMove(event.clientX, event.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (containerRef.current && containerRef.current.contains(event.target as Node)) {
      const touch = event.touches[0];
      handleStart(touch.clientX, touch.clientY);
    }
  }, [handleStart]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const handleWheel = useCallback((event: WheelEvent) => {
    if (!containerRef.current) return;

    if (direction === 'horizontal') {
      event.preventDefault();
      containerRef.current.scrollLeft += event.deltaY;
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

  const calculateAverageVelocity = () => {
    const now = Date.now();
    velocityHistory.current = velocityHistory.current.filter(item => now - item.time < 100);
    const total = velocityHistory.current.reduce((acc, item) => ({
      x: acc.x + item.x,
      y: acc.y + item.y
    }), { x: 0, y: 0 });
    const count = velocityHistory.current.length;
    return count > 0 ? { x: total.x / count, y: total.y / count } : { x: 0, y: 0 };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.style.cursor = isDragging ? 'grabbing' : 'grab';

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('resize', updateGradients);
    window.addEventListener('keydown', updateGradients);
    window.addEventListener('keyup', updateGradients);
    container.addEventListener('scroll', updateGradients);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', updateGradients);
      window.removeEventListener('keydown', updateGradients);
      window.removeEventListener('keyup', updateGradients);
      container.removeEventListener('scroll', updateGradients);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd, updateGradients, isDragging, handleWheel]);

  return { containerRef, showLeftGradient, showRightGradient, updateGradients };
};

export default useDragScroll;
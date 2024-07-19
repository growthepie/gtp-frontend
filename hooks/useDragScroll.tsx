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

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (containerRef.current && containerRef.current.contains(event.target as Node)) {
      isMouseDownInside.current = true;
      setIsDragging(true);
      setIsDragged(false);
      setStartPos({ x: event.clientX, y: event.clientY });
      setVelocity({ x: 0, y: 0 });
      velocityHistory.current = [];

      rafId.current && cancelAnimationFrame(rafId.current);

      if (containerRef.current) {
        setScrollPos({
          left: containerRef.current.scrollLeft,
          top: containerRef.current.scrollTop,
        });
      }

      event.preventDefault(); // Prevent text selection
    }
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return;

    const currentTime = Date.now();
    const timeDelta = currentTime - lastMoveTime;

    setIsDragged(true);

    if (containerRef.current) {
      if (direction === 'horizontal') {
        const dx = event.clientX - startPos.x;
        containerRef.current.scrollLeft = scrollPos.left - dx;
        velocityHistory.current.push({ x: -dx / timeDelta, y: 0, time: currentTime });
      } else {
        const dy = event.clientY - startPos.y;
        containerRef.current.scrollTop = scrollPos.top - dy;
        velocityHistory.current.push({ x: 0, y: -dy / timeDelta, time: currentTime });
      }
    }

    setLastMoveTime(currentTime);
  }, [isDragging, lastMoveTime, direction, startPos.x, startPos.y, scrollPos.left, scrollPos.top]);

  const calculateAverageVelocity = () => {
    const now = Date.now();
    velocityHistory.current = velocityHistory.current.filter(item => now - item.time < 100); // Only consider the last 100ms
    const total = velocityHistory.current.reduce((acc, item) => ({
      x: acc.x + item.x,
      y: acc.y + item.y
    }), { x: 0, y: 0 });
    const count = velocityHistory.current.length;
    return count > 0 ? { x: total.x / count, y: total.y / count } : { x: 0, y: 0 };
  };

  const handleMouseUp = useCallback(() => {
    if (!isMouseDownInside.current) return;

    isMouseDownInside.current = false;
    setIsDragging(false);

    const avgVelocity = calculateAverageVelocity();
    setVelocity(avgVelocity);

    if (avgVelocity.x !== 0 || avgVelocity.y !== 0) {
      const startTime = Date.now();
      const decay = 0.96; // Decay factor for the velocity

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const factor = Math.pow(decay, elapsed / 16); // Adjust based on 60fps (16ms per frame)

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
  }, [direction, velocity.x, velocity.y]);

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

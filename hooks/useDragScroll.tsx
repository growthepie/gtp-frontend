import { useEffect, useRef, useState, useCallback } from 'react';

type Direction = 'horizontal' | 'vertical';

interface DragScrollOptions {
  snap?: boolean; // if true, snap when drag ends or inertia slows down
  snapThreshold?: number; // velocity threshold under which snapping occurs (in pixels/ms)
}

export const useDragScroll = (
  direction: Direction = 'horizontal',
  decay = 0.96,
  options: DragScrollOptions = {}
) => {
  const { snap = false, snapThreshold = 0.2 } = options; // adjust threshold as needed

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

  // Add a minimum drag threshold
  const MIN_DRAG_THRESHOLD = 3; // pixels
  const isDragThresholdExceeded = useRef(false);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (containerRef.current && containerRef.current.contains(event.target as Node)) {
      isMouseDownInside.current = true;
      isDragThresholdExceeded.current = false; // Reset the flag
      setIsDragging(true);
      setIsDragged(false);
      setStartPos({ x: clientX, y: clientY });
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

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const currentTime = Date.now();
    const timeDelta = currentTime - lastMoveTime;
    // Calculate the distance moved
    const dx = event.clientX - startPos.x;
    const dy = event.clientY - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only consider it a drag if it exceeds the threshold
    if (distance > MIN_DRAG_THRESHOLD) {
      isDragThresholdExceeded.current = true;
      setIsDragged(true);
    
      if (containerRef.current) {
        if (direction === 'horizontal') {
          containerRef.current.scrollLeft = scrollPos.left - dx;
          velocityHistory.current.push({ x: -dx / timeDelta, y: 0, time: currentTime });
        } else {
          containerRef.current.scrollTop = scrollPos.top - dy;
          velocityHistory.current.push({ x: 0, y: -dy / timeDelta, time: currentTime });
        }
      }
      setLastMoveTime(currentTime);
    }
  }, [isDragging, lastMoveTime, direction, startPos.x, startPos.y, scrollPos.left, scrollPos.top]);

  const calculateAverageVelocity = () => {
    const now = Date.now();
    // Only consider velocity entries from the last 100ms
    velocityHistory.current = velocityHistory.current.filter(item => now - item.time < 100);
    const total = velocityHistory.current.reduce((acc, item) => ({
      x: acc.x + item.x,
      y: acc.y + item.y,
    }), { x: 0, y: 0 });
    const count = velocityHistory.current.length;
    return count > 0 ? { x: total.x / count, y: total.y / count } : { x: 0, y: 0 };
  };
  
  // Custom smooth scroll function with an easing function.
  const smoothScrollTo = (element: HTMLElement, target: number, duration: number) => {
    const start = element.scrollLeft;
    const change = target - start;
    const startTime = performance.now();



    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(1, elapsed / duration);
      const easedT = 0.5 - 0.5 * Math.cos(t * Math.PI);
      element.scrollLeft = start + change * easedT;

      
      if (t < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  // A helper that snaps to the nearest element.
  // In this example we assume that the children are equally sized,
  // so we use the first child's size as a reference.
  const snapToClosest = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    // Calculate the container's center in scroll coordinates.
    const containerCenter = container.scrollLeft + container.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;
    Array.from(container.children).forEach((child, index) => {
      const childEl = child as HTMLElement;
      // Compute the child's center using its offset.
      const childCenter = childEl.offsetLeft + childEl.offsetWidth / 2;
      const distance = Math.abs(childCenter - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    // Calculate the target scroll position so that the chosen child's center
    // aligns with the container center.
    const closestChild = container.children[closestIndex] as HTMLElement;
    const targetScrollLeft =
      closestChild.offsetLeft +
      closestChild.offsetWidth / 2 -
      container.clientWidth / 2;
    
    // Use custom smooth scrolling over 300ms (adjust duration as needed)
    smoothScrollTo(container, targetScrollLeft, 300);
  };

  const handleMouseUp = useCallback(() => {
    if (!isMouseDownInside.current) return;

    isMouseDownInside.current = false;
    setIsDragging(false);

    const avgVelocity = calculateAverageVelocity();
    setVelocity(avgVelocity);

    // Calculate velocity magnitude (pixels per ms)
    const velocityMagnitude = Math.hypot(avgVelocity.x, avgVelocity.y);

    // If snapping is enabled and velocity is below our threshold, snap immediately.
    // Otherwise, continue with inertia.
    if (snap && velocityMagnitude < snapThreshold) {
      snapToClosest();
    } else if (avgVelocity.x !== 0 || avgVelocity.y !== 0) {
      const startTime = Date.now();

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        // Factor based on decay per frame (assuming ~16ms per frame)
        const factor = Math.pow(decay, elapsed / 16);

        if (containerRef.current) {
          if (direction === 'horizontal') {
            containerRef.current.scrollLeft += avgVelocity.x * factor;
          } else {
            containerRef.current.scrollTop += avgVelocity.y * factor;
          }

          // If the velocity has decayed below a minimal threshold, finish the animation
          if (!snap && Math.abs(avgVelocity.x * factor) > 0.5 || Math.abs(avgVelocity.y * factor) > 0.5) {
            rafId.current = requestAnimationFrame(animate);
          } else if (snap) {
            // When inertia ends, if snapping is enabled, snap to the nearest element.
            snapToClosest();
          }
        }
      };

      animate();
    }
  }, [decay, direction, snap, snapThreshold]);

  const handleWheel = useCallback((event: WheelEvent) => {
    if (!containerRef.current) return;
    if (direction === 'horizontal') {
      event.preventDefault();
      containerRef.current.scrollLeft += event.deltaY;
    }
  }, [direction]);

  const updateGradients = useCallback(() => {
    if (!containerRef.current) return;
    
    // Add a small buffer (1px) to account for potential rounding errors
    const scrollBuffer = 1;
    
    if (direction === 'horizontal') {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      
      // Check if there's actual overflow that would require scrolling
      const hasOverflow = scrollWidth > clientWidth;
      
      // Only show left gradient if we've scrolled and there's overflow
      setShowLeftGradient(hasOverflow && scrollLeft > 0);
      
      // Only show right gradient if there's more to scroll and there's overflow
      // The buffer helps with edge cases where scrollLeft + clientWidth is very close to scrollWidth
      setShowRightGradient(hasOverflow && scrollLeft < (scrollWidth - clientWidth - scrollBuffer));

    } else {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const hasOverflow = scrollHeight > clientHeight;
      
      setShowLeftGradient(hasOverflow && scrollTop > 0);
      setShowRightGradient(hasOverflow && scrollTop < (scrollHeight - clientHeight - scrollBuffer));
    }
  }, [direction]);
  
  // Add this effect to ensure gradients update when children change
  useEffect(() => {
    // Force update gradients on next animation frame to ensure the DOM has updated
    const rafId = requestAnimationFrame(() => updateGradients());
    return () => cancelAnimationFrame(rafId);
  }, [updateGradients]);

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
    if(snap)
      window.addEventListener('resize', snapToClosest);
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
      if(snap)
        window.removeEventListener('resize', snapToClosest);
      window.removeEventListener('keydown', updateGradients);
      window.removeEventListener('keyup', updateGradients);
      container.removeEventListener('scroll', updateGradients);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, updateGradients, isDragging, handleWheel, snap, snapToClosest]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let scrollRAF: number | null = null;
    
    const handleScroll = () => {
      // Cancel any pending RAF to avoid multiple updates
      if (scrollRAF !== null) {
        cancelAnimationFrame(scrollRAF);
      }
      
      // Schedule a new update on next frame
      scrollRAF = requestAnimationFrame(() => {
        updateGradients();
        scrollRAF = null;
      });
    };
    
    // Use passive: true for better performance
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial update
    updateGradients();
    
    return () => {
      if (scrollRAF !== null) {
        cancelAnimationFrame(scrollRAF);
      }
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isDragged, updateGradients]);

  return { containerRef, showLeftGradient, showRightGradient };
};

export default useDragScroll;
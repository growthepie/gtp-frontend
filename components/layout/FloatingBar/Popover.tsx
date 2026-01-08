// components/layout/FloatingBar/Popover.tsx

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useLayoutEffect,
  ReactNode,
  RefObject,
  FC,
  Ref,
  Children,
} from 'react';
import { createPortal } from 'react-dom';

// useClickOutside hook (remains the same)
export function useClickOutside<T extends HTMLElement>(
  callback: () => void,
  enabled: boolean = true,
  additionalRefs: React.RefObject<HTMLElement>[] = []
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      const allRefs = [ref, ...additionalRefs];
      const clickedInsideAnyRef = allRefs.some(
        (currentRef) => currentRef.current && currentRef.current.contains(event.target as Node)
      );
      if (!clickedInsideAnyRef) {
        callback();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [callback, enabled, additionalRefs]);
  return ref;
}

// mergeRefs utility (remains the same)
function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    refs.forEach(ref => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    });
  };
}

export interface PopoverState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function usePopover(initialOpen: boolean = false): PopoverState {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}

export type PopoverPlacement =
  | 'top-start' | 'top' | 'top-end'
  | 'right-start' | 'right' | 'right-end'
  | 'bottom-start' | 'bottom' | 'bottom-end'
  | 'left-start' | 'left' | 'left-end';


interface PopoverContentProps {
  children: ReactNode;
  triggerRef: RefObject<HTMLElement>;
  placement?: PopoverPlacement;
  offset?: number;
  className?: string;
  portal?: boolean;
  ref?: Ref<HTMLDivElement>;
}

// calculatePosition function (remains the same)
function calculatePosition(
  triggerRect: DOMRect,
  popoverRect: DOMRect,
  placement: PopoverPlacement,
  offset: number
) {
  const { width: popoverWidth, height: popoverHeight } = popoverRect;
  const [side, align] = placement.split('-') as [string, string | undefined];

  let top = 0;
  let left = 0;

  switch (side) {
    case 'top':
      top = triggerRect.top - popoverHeight - offset;
      left = triggerRect.left + triggerRect.width / 2 - popoverWidth / 2;
      break;
    case 'bottom':
      top = triggerRect.bottom + offset;
      left = triggerRect.left + triggerRect.width / 2 - popoverWidth / 2;
      break;
    case 'left':
      top = triggerRect.top + triggerRect.height / 2 - popoverHeight / 2;
      left = triggerRect.left - popoverWidth - offset;
      break;
    case 'right':
      top = triggerRect.top + triggerRect.height / 2 - popoverHeight / 2;
      left = triggerRect.right + offset;
      break;
    default: // Default to bottom
      top = triggerRect.bottom + offset;
      left = triggerRect.left + triggerRect.width / 2 - popoverWidth / 2;
  }

  if (side === 'top' || side === 'bottom') {
    switch (align) {
      case 'start':
        left = triggerRect.left;
        break;
      case 'end':
        left = triggerRect.right - popoverWidth;
        break;
    }
  } else if (side === 'left' || side === 'right') {
    switch (align) {
      case 'start':
        top = triggerRect.top;
        break;
      case 'end':
        top = triggerRect.bottom - popoverHeight;
        break;
    }
  }
  return { top, left };
}


export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  (
    {
      children,
      triggerRef,
      placement = 'bottom',
      offset = 8,
      className = '',
      portal = false,
    },
    forwardedRef
  ) => {
    const localRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isVisible, setIsVisible] = useState(false); // For animation classes

    // Calculates and sets the popover's position.
    const calculateAndSetPosition = useCallback(() => {
      if (!triggerRef.current || !localRef.current) {
        return false; // Indicate failure or inability to position
      }

      const triggerElement = triggerRef.current;
      const popoverElement = localRef.current;

      const triggerRect = triggerElement.getBoundingClientRect();
      const popoverRect = popoverElement.getBoundingClientRect();
      
      if (popoverRect.width === 0 && popoverRect.height === 0 && Children.count(children) > 0) {
        // console.warn("PopoverContent: Popover has zero dimensions. Positioning might be inaccurate.");
      }

      const viewportPosition = calculatePosition(triggerRect, popoverRect, placement, offset);

      let finalTop: number, finalLeft: number;
      if (portal) {
        finalTop = viewportPosition.top + window.scrollY;
        finalLeft = viewportPosition.left + window.scrollX;
      } else {
        const parentEl = triggerElement.offsetParent;
        if (parentEl instanceof HTMLElement) {
            const parentRect = parentEl.getBoundingClientRect();
            finalTop = (viewportPosition.top - parentRect.top) + parentEl.scrollTop;
            finalLeft = (viewportPosition.left - parentRect.left) + parentEl.scrollLeft;
        } else {
            finalTop = viewportPosition.top - triggerRect.top;
            finalLeft = viewportPosition.left - triggerRect.left;
        }
      }
      
      setPosition({ top: finalTop, left: finalLeft });
      return true; // Indicate success
    }, [triggerRef, /* localRef removed */ placement, offset, portal, children]);


    useLayoutEffect(() => {
      let visibilityFrameId: number;
      let debounceTimer: NodeJS.Timeout;

      const updateAndAnimateIn = () => {
        if (calculateAndSetPosition()) {
          // After position is set, animate in on the next frame
          visibilityFrameId = requestAnimationFrame(() => {
            // Re-check refs in case component unmounted during rAF
            if (triggerRef.current && localRef.current) { 
              setIsVisible(true);
            }
          });
        }
      };
      
      updateAndAnimateIn(); // Initial attempt to position and show

      const popoverElem = localRef.current;
      const triggerElem = triggerRef.current;

      if (!popoverElem || !triggerElem) {
        return;
      }

      const debouncedUpdate = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (triggerRef.current && localRef.current) {
            calculateAndSetPosition(); // Only recalculate position, visibility is handled by mount/unmount
          }
        }, 50);
      };

      const popoverResizeObserver = new ResizeObserver(debouncedUpdate);
      popoverResizeObserver.observe(popoverElem);

      const triggerResizeObserver = new ResizeObserver(debouncedUpdate);
      triggerResizeObserver.observe(triggerElem);
      
      window.addEventListener('resize', debouncedUpdate);
      // document.addEventListener('scroll', debouncedUpdate, true);

      return () => {
        clearTimeout(debounceTimer);
        cancelAnimationFrame(visibilityFrameId);
        popoverResizeObserver.disconnect();
        triggerResizeObserver.disconnect();
        window.removeEventListener('resize', debouncedUpdate);
        // document.removeEventListener('scroll', debouncedUpdate, true);
        setIsVisible(false); // Reset visibility for fade-out animation on unmount
      };
    // `calculateAndSetPosition` has its own stable dependencies.
    // `localRef` and `triggerRef` are stable.
    }, [calculateAndSetPosition, localRef, triggerRef]);

    const handleMouseDown = (e: React.MouseEvent) => {
      if (portal) {
        e.stopPropagation();
      }
    };

    // The `opacity-0` initially might cause a flicker if `isVisible` becomes true
    // very quickly without the position being ready.
    // The use of requestAnimationFrame for setIsVisible(true) should help.
    // If still flickering, consider adding a "opacity-0" class by default and only remove it
    // when `isVisible` is true, AND a small delay or another rAF.
    const popoverClasses = `
      absolute z-50 
      bg-color-ui-active 
      rounded-[22px] 
      shadow-[0px_0px_50px_0px_#000000]
      ${className}
      transition-[opacity,transform] duration-200 ease-out
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}
    `;

    const contentEl = (
      <div
        ref={mergeRefs(localRef, forwardedRef)}
        onMouseDown={handleMouseDown}
        className={popoverClasses}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {children}
      </div>
    );

    return portal && typeof document !== 'undefined'
      ? createPortal(contentEl, document.body)
      : contentEl;
  }
);
PopoverContent.displayName = 'PopoverContent';


// Popover (Parent Component) - (remains the same as your previous version)
interface PopoverProps {
  children: ReactNode;
  content: ReactNode | ((props: { close: () => void }) => ReactNode);
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: PopoverPlacement;
  offset?: number;
  className?: string;
  contentClassName?: string;
  closeOnClickOutside?: boolean;
  portal?: boolean;
  trigger?: 'click' | 'hover' | 'manual';
}

export const Popover: FC<PopoverProps> = ({
  children,
  content,
  isOpen,
  onOpenChange,
  placement = 'bottom',
  offset = 8,
  className = '',
  contentClassName = '',
  closeOnClickOutside = true,
  trigger = 'click',
  portal = false,
}) => {
  const popoverContentRef = useRef<HTMLDivElement | null>(null);
  const triggerWrapperRef = useClickOutside<HTMLDivElement>(
    () => {
      if (isOpen && closeOnClickOutside) {
        onOpenChange(false);
      }
    },
    closeOnClickOutside && isOpen,
    [popoverContentRef as React.RefObject<HTMLElement>]
  );

  const handleTriggerClick = () => {
    if (trigger === 'click') {
      onOpenChange(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      onOpenChange(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      onOpenChange(false);
    }
  };

  const renderContent = () => {
    if (typeof content === 'function') {
      return content({ close: () => onOpenChange(false) });
    }
    return content;
  };

  return (
    <div
      ref={triggerWrapperRef}
      className={`inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        onClick={handleTriggerClick}
        className="cursor-pointer"
      >
        {children}
      </div>

      {isOpen && (
        <PopoverContent
          ref={popoverContentRef}
          triggerRef={triggerWrapperRef as React.RefObject<HTMLElement>}
          placement={placement}
          offset={offset}
          className={contentClassName}
          portal={portal}
        >
          {renderContent()}
        </PopoverContent>
      )}
    </div>
  );
};
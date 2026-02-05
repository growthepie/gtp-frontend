"use client";

import { ReactNode, forwardRef, useState, useRef, useCallback } from "react";
import { GTPIcon } from "./GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import {
  useFloating,
  useHover,
  useInteractions,
  useDismiss,
  FloatingPortal,
  offset,
  flip,
  shift,
  autoUpdate,
  Placement,
} from "@floating-ui/react";
import { CSSTransition } from "react-transition-group";
import { AIInsightsModal } from "./AIInsightsModal";
import { useAIInsights } from "@/hooks/useAIInsights";
import {
  ChainInsightContext,
  TableInsightContext,
  InsightComponentType,
} from "@/types/api/AIInsightsResponse";

export type AIInsightsWrapperProps = {
  children: ReactNode;
  /** Placement of the button relative to the wrapped element (Floating UI placement) */
  placement?: Placement;
  /** Offset from the reference element */
  placementOffset?: { mainAxis?: number; crossAxis?: number };
  /** Custom icon name, defaults to feather:zap */
  icon?: GTPIconName;
  /** Size of the icon button */
  size?: "sm" | "md" | "lg";
  /** Callback when the AI insights button is clicked */
  onClick?: () => void;
  /** Additional class names for the wrapper */
  className?: string;
  /** Additional class names for the button */
  buttonClassName?: string;
  /** Tooltip/title for the button */
  title?: string;
  /** Whether to show the button (controlled mode, bypasses hover behavior) */
  show?: boolean;
  /** Duration of fade-in animation in ms (default: 200) */
  fadeInDuration?: number;
  /** Duration of fade-out animation in ms (default: 200) */
  fadeOutDuration?: number;
  /** Whether the wrapper should be inline (span) vs block (div) */
  inline?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Delay in ms before showing the button on hover (default: 0) */
  showDelay?: number;
  /** Delay in ms before hiding the button when unhovered (default: 150) */
  hideDelay?: number;
  /** Portal ID for rendering the button */
  portalId?: string;
  /** Type of component for AI insights context */
  insightType?: InsightComponentType;
  /** Context data for generating AI insights */
  insightContext?: TableInsightContext | ChainInsightContext;
};

const sizeMap = {
  sm: "size-[24px]",
  md: "size-[32px]",
  lg: "size-[40px]",
};

const iconSizeMap: Record<"sm" | "md" | "lg", "sm" | "md" | "lg"> = {
  sm: "sm",
  md: "md",
  lg: "lg",
};

export const AIInsightsWrapper = forwardRef<HTMLDivElement, AIInsightsWrapperProps>(
  function AIInsightsWrapper(
    {
      children,
      placement = "right-start",
      placementOffset = { mainAxis: 8, crossAxis: 0 },
      icon = "feather:zap" as GTPIconName,
      size = "md",
      onClick,
      className = "",
      buttonClassName = "",
      title = "AI Insights",
      show: controlledShow,
      fadeInDuration = 1000,
      fadeOutDuration = 500,
      inline = false,
      disabled = false,
      showDelay = 0,
      hideDelay = 150,
      portalId = "ai-insights-portal",
      insightType,
      insightContext,
    },
    ref
  ) {
    const isControlled = controlledShow !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    // AI Insights hook - only active when context is provided
    const hasInsightContext = insightType && insightContext;
    const { data, isLoading, error, fetchInsights, reset } = useAIInsights({
      componentType: insightType || "table",
      title: title,
      context: insightContext || { totalChains: 0, chains: [], timeframe: "7d" },
    });

    const handleButtonClick = useCallback(async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;

      // Call external onClick if provided
      onClick?.();

      // If we have insight context, open modal and fetch insights
      if (hasInsightContext) {
        setModalOpen(true);
        await fetchInsights();
      }
    }, [disabled, onClick, hasInsightContext, fetchInsights]);

    const handleModalClose = useCallback(() => {
      setModalOpen(false);
    }, []);

    const handleRetry = useCallback(async () => {
      reset();
      await fetchInsights();
    }, [reset, fetchInsights]);

    const isOpen = isControlled ? controlledShow : uncontrolledOpen;

    const { refs, floatingStyles, context } = useFloating({
      open: isOpen,
      onOpenChange: isControlled ? undefined : setUncontrolledOpen,
      placement,
      middleware: [
        offset({
          mainAxis: placementOffset.mainAxis ?? 8,
          crossAxis: placementOffset.crossAxis ?? 0,
        }),
        flip(),
        shift({ padding: 8 }),
      ],
      whileElementsMounted: autoUpdate,
    });

    const hover = useHover(context, {
      enabled: !isControlled,
      delay: { open: showDelay, close: hideDelay },
    });

    const dismiss = useDismiss(context, {
      enabled: !isControlled,
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([
      hover,
      dismiss,
    ]);

    const Wrapper = inline ? "span" : "div";

    return (
      <>
        <Wrapper
          ref={(node) => {
            refs.setReference(node);
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          className={className}
          {...getReferenceProps()}
        >
          {children}
        </Wrapper>

        <FloatingPortal id={portalId}>
          <CSSTransition
            in={isOpen}
            nodeRef={buttonRef}
            timeout={{ enter: fadeInDuration, exit: fadeOutDuration }}
            classNames="ai-insights-fade"
            mountOnEnter
            unmountOnExit
          >
            <button
              ref={(node) => {
                buttonRef.current = node;
                refs.setFloating(node);
              }}
              type="button"
              disabled={disabled}
              className={`
                flex items-center justify-center
                rounded-full
                bg-transparent hover:bg-color-ui-hover
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-color-bg-medium
                ${sizeMap[size]}
                ${buttonClassName}
              `}
              style={{
                ...floatingStyles,
                zIndex: 50,
                "--fade-in-duration": `${fadeInDuration}ms`,
                "--fade-out-duration": `${fadeOutDuration}ms`,
              } as React.CSSProperties}
              onClick={handleButtonClick}
              title={title}
              aria-label={title}
              {...getFloatingProps()}
            >
              {isLoading ? (
                <div className="relative size-5">
                  <div className="absolute inset-0 rounded-full border-2 border-color-ui-hover" />
                  <div className="absolute inset-0 rounded-full border-2 border-accent-turquoise border-t-transparent animate-spin" />
                </div>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_6111_109928)">
                  <path d="M8.10062 22.2198C6.9726 23.2027 5.97099 24.0425 5.86402 24.0807C5.60146 24.1856 5.31945 24.1093 5.10552 23.8707C4.88186 23.6131 4.89158 23.4031 5.15414 23.05C5.3778 22.7542 10.2303 18.6603 10.2303 18.6603L11.2999 17.7824C11.2999 17.7824 12.039 16.6754 12.1071 16.1601C12.1362 15.8833 12.0973 15.5207 12.0001 15.1867C11.8056 14.5092 11.8056 13.9748 12.0001 13.4881C12.1654 13.0873 14.4312 11.026 20.1491 6.09236C22.7552 3.84025 22.9303 3.6303 22.7358 3.0291C22.5316 2.41836 21.8606 2.15116 21.2285 2.43745C21.0924 2.4947 19.9741 3.62076 18.7294 4.93768C14.1881 9.76636 11.4555 12.5147 11.0568 12.6674C10.5706 12.8583 9.89963 12.8583 9.44259 12.6769C9.25782 12.6006 8.82995 12.5338 8.49932 12.5338C7.41992 12.5338 7.18653 12.7056 4.53178 15.5207C1.17688 19.0707 0.933766 19.3092 0.63231 19.3092C0.107195 19.3092 -0.165087 18.7653 0.107195 18.2977C0.175265 18.1832 1.11853 17.1525 2.21738 16.0074C6.18492 11.8467 6.35996 11.694 7.3713 11.3409C7.92558 11.1501 9.04389 11.1405 9.59817 11.3314C10.522 11.6558 10.4539 11.7036 12.5836 9.46099C17.6986 4.08836 20.1977 1.57859 20.6645 1.3591C22.2107 0.624302 24.0097 1.72173 24 3.39173C23.9902 4.0979 23.7374 4.59413 23.0081 5.26213C21.9967 6.19733 18.1751 9.58505 15.6759 11.7513C14.3826 12.8773 13.2837 13.8889 13.2254 14.0034C13.1573 14.1656 13.1767 14.4137 13.3129 14.9768C13.5949 16.0742 13.4587 16.9521 12.8753 17.8587C12.7391 18.0782 12.0682 18.7367 11.3875 19.3379C10.697 19.9391 9.21892 21.2369 8.10062 22.2198Z" fill="url(#paint0_linear_6111_109928)"/>
                  <path d="M6.88508 20.0631C8.36318 18.6603 9.53983 17.4675 9.569 17.3434C9.66625 16.9712 9.37451 16.6372 8.96609 16.6372C8.67436 16.6372 8.4896 16.7613 7.48799 17.6774C6.8559 18.25 5.65008 19.376 4.81379 20.1776C3.61769 21.3228 3.28706 21.7045 3.28706 21.8953C3.28706 22.2293 3.61769 22.5538 3.97749 22.5538C4.2206 22.5538 4.64847 22.1912 6.88508 20.0631Z" fill="url(#paint1_linear_6111_109928)"/>
                  <path d="M5.15413 18.374C7.46853 16.1124 7.76026 15.7879 7.76026 15.5207C7.76026 15.139 7.5366 14.9195 7.15735 14.9195C6.91424 14.9195 6.51554 15.2535 4.43453 17.2384C3.09257 18.5076 1.91592 19.6814 1.80895 19.8341C1.57557 20.2158 1.58529 20.4735 1.85757 20.7216C2.31462 21.1415 2.38269 21.0937 5.15413 18.374Z" fill="url(#paint2_linear_6111_109928)"/>
                  <path d="M12.6929 0.181295C12.7199 0.108513 12.8378 0.108514 12.8647 0.181295C13.0589 0.705834 13.571 1.94751 14.2869 2.61926C15.0028 3.29102 16.326 3.77158 16.885 3.95376C16.9626 3.97904 16.9626 4.08969 16.885 4.11497C16.326 4.29715 15.0028 4.77771 14.2869 5.44946C13.571 6.12122 13.0589 7.36289 12.8647 7.88743C12.8378 7.96021 12.7199 7.96021 12.6929 7.88743C12.4988 7.36289 11.9867 6.12122 11.2708 5.44946C10.5549 4.77771 9.23164 4.29715 8.67265 4.11497C8.59508 4.08969 8.59508 3.97904 8.67265 3.95376C9.23164 3.77158 10.5549 3.29102 11.2708 2.61926C11.9867 1.94751 12.4988 0.705834 12.6929 0.181295Z" fill="url(#paint3_linear_6111_109928)"/>
                  <path d="M3.18843 9.11134C3.20289 9.07229 3.26616 9.07229 3.28061 9.11134C3.38479 9.3928 3.6596 10.0591 4.04373 10.4195C4.42786 10.78 5.13789 11.0378 5.43784 11.1356C5.47946 11.1492 5.47946 11.2085 5.43784 11.2221C5.13789 11.3198 4.42786 11.5777 4.04373 11.9382C3.6596 12.2986 3.38479 12.9649 3.28061 13.2463C3.26616 13.2854 3.20289 13.2854 3.18843 13.2463C3.08425 12.9649 2.80945 12.2986 2.42532 11.9382C2.04119 11.5777 1.33115 11.3198 1.0312 11.2221C0.989582 11.2085 0.989584 11.1492 1.0312 11.1356C1.33115 11.0378 2.04119 10.78 2.42532 10.4195C2.80945 10.0591 3.08425 9.3928 3.18843 9.11134Z" fill="url(#paint4_linear_6111_109928)"/>
                  <path d="M14.8749 13.2463C14.8883 13.21 14.9473 13.21 14.9608 13.2463C15.0578 13.5086 15.3139 14.1295 15.6718 14.4653C16.0298 14.8012 16.6914 15.0415 16.9709 15.1326C17.0097 15.1452 17.0097 15.2005 16.9709 15.2132C16.6914 15.3043 16.0298 15.5446 15.6718 15.8804C15.3139 16.2163 15.0578 16.8371 14.9608 17.0994C14.9473 17.1358 14.8883 17.1358 14.8749 17.0994C14.7778 16.8371 14.5217 16.2163 14.1638 15.8804C13.8058 15.5446 13.1442 15.3043 12.8647 15.2132C12.8259 15.2005 12.8259 15.1452 12.8647 15.1326C13.1442 15.0415 13.8058 14.8012 14.1638 14.4653C14.5217 14.1295 14.7778 13.5086 14.8749 13.2463Z" fill="url(#paint5_linear_6111_109928)"/>
                  </g>
                  <defs>
                    <linearGradient id="paint0_linear_6111_109928" x1="12" y1="1.12671" x2="12" y2="24.1267" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#10808C"/>
                    <stop offset="1" stopColor="#1DF7EF"/>
                    </linearGradient>
                    <linearGradient id="paint1_linear_6111_109928" x1="12" y1="1.12671" x2="12" y2="24.1267" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#10808C"/>
                    <stop offset="1" stopColor="#1DF7EF"/>
                    </linearGradient>
                    <linearGradient id="paint2_linear_6111_109928" x1="12" y1="1.12671" x2="12" y2="24.1267" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#10808C"/>
                    <stop offset="1" stopColor="#1DF7EF"/>
                    </linearGradient>
                    <linearGradient id="paint3_linear_6111_109928" x1="5.01535" y1="23.5372" x2="11.9521" y2="3.00262" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FE5468"/>
                    <stop offset="1" stopColor="#FFDF27"/>
                    </linearGradient>
                    <linearGradient id="paint4_linear_6111_109928" x1="5.01535" y1="23.5372" x2="11.9521" y2="3.00262" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FE5468"/>
                    <stop offset="1" stopColor="#FFDF27"/>
                    </linearGradient>
                    <linearGradient id="paint5_linear_6111_109928" x1="5.01535" y1="23.5372" x2="11.9521" y2="3.00262" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FE5468"/>
                    <stop offset="1" stopColor="#FFDF27"/>
                    </linearGradient>
                    <clipPath id="clip0_6111_109928">
                    <rect width="24" height="24" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              )}
            </button>
          </CSSTransition>
        </FloatingPortal>

        {/* AI Insights Modal */}
        {hasInsightContext && (
          <AIInsightsModal
            isOpen={modalOpen}
            onClose={handleModalClose}
            data={data}
            isLoading={isLoading}
            error={error}
            title={title}
            onRetry={handleRetry}
            componentType={insightType}
            context={insightContext}
          />
        )}
      </>
    );
  }
);

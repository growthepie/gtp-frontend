"use client";

import { ReactNode, forwardRef, useState, useRef, useCallback } from "react";
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
import {
  ChainInsightContext,
  TableInsightContext,
  InsightComponentType,
} from "@/types/api/AIInsightsResponse";
import { useAIInsightsContext } from "@/contexts/AIInsightsContext";
import { AIWandSparkleIcon } from "./AIWandSparkleIcon";

export type AIInsightsWrapperProps = {
  children: ReactNode;
  placement?: Placement;
  placementOffset?: { mainAxis?: number; crossAxis?: number };
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  buttonClassName?: string;
  title?: string;
  show?: boolean;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  inline?: boolean;
  disabled?: boolean;
  showDelay?: number;
  hideDelay?: number;
  portalId?: string;
  insightType?: InsightComponentType;
  /** Eager context — computed at render time */
  insightContext?: TableInsightContext | ChainInsightContext;
  /** Lazy context — computed only when the user clicks the button */
  getInsightContext?: () => TableInsightContext | ChainInsightContext;
};

const sizeMap = {
  sm: "size-[34px]",
  md: "size-[32px]",
  lg: "size-[40px]",
};

export const AIInsightsWrapper = forwardRef<HTMLDivElement, AIInsightsWrapperProps>(
  function AIInsightsWrapper(
    {
      children,
      placement = "right-start",
      placementOffset = { mainAxis: 8, crossAxis: 0 },
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
      getInsightContext,
    },
    ref,
  ) {
    const isControlled = controlledShow !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    const { openInsights, phase } = useAIInsightsContext();

    const hasInsightContext = insightType && (insightContext || getInsightContext);
    const isLoading = phase === "thinking" || phase === "fetching" || phase === "streaming";

    const handleButtonClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;

        onClick?.();

        if (hasInsightContext && insightType) {
          // Prefer lazy context if available, otherwise use eager
          const context = getInsightContext
            ? getInsightContext()
            : insightContext!;

          openInsights({
            componentType: insightType,
            title,
            context,
          });
        }
      },
      [disabled, onClick, hasInsightContext, insightType, getInsightContext, insightContext, openInsights, title],
    );

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
                p-[5px]
                flex items-center justify-center
                rounded-[5px]
                bg-transparent hover:bg-color-ui-hover/50
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
                <AIWandSparkleIcon className="size-6" />
              )}
            </button>
          </CSSTransition>
        </FloatingPortal>
      </>
    );
  },
);

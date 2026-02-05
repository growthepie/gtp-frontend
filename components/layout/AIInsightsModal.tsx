"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { FloatingPortal } from "@floating-ui/react";
import { CSSTransition } from "react-transition-group";
import { Icon } from "@iconify/react";
import { Streamdown } from "streamdown";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useMaster } from "@/contexts/MasterContext";
import { GTPIcon } from "./GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import {
  AIInsightsResponse,
  InsightComponentType,
  ChainInsightContext,
  TableInsightContext,
} from "@/types/api/AIInsightsResponse";

export interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AIInsightsResponse | null;
  isLoading: boolean;
  error: Error | null;
  title?: string;
  onRetry?: () => void;
  componentType?: InsightComponentType;
  context?: TableInsightContext | ChainInsightContext;
}

/**
 * Chain badge component rendered inline when a chain link is detected
 */
function ChainBadge({
  chainUrlKey,
  children,
}: {
  chainUrlKey: string;
  children: ReactNode;
}) {
  const { AllChainsByKeys } = useMaster();
  const { resolvedTheme } = useTheme();

  // Find the chain by urlKey
  const chainEntry = Object.entries(AllChainsByKeys).find(
    ([, chain]) => chain.urlKey === chainUrlKey
  );

  const originKey = chainEntry?.[0];
  const chain = chainEntry?.[1];

  if (!chain || !originKey) {
    // Fallback to a plain link if chain not found
    return (
      <Link
        href={`/chains/${chainUrlKey}`}
        className="inline-flex items-center font-medium underline decoration-dotted underline-offset-2 hover:decoration-solid"
      >
        {children}
      </Link>
    );
  }

  const color =
    chain.colors[resolvedTheme === "dark" ? "dark" : "light"][0];

  return (
    <Link
      href={`/chains/${chainUrlKey}`}
      className="inline-flex items-center gap-x-[5px] pl-[2px] pr-[5px] py-[2px] rounded-full border border-color-ui-hover/30 hover:border-color-ui-hover hover:bg-color-ui-hover/10 transition-colors text-xxs whitespace-nowrap align-middle"
    >
      <GTPIcon
        icon={`${chainUrlKey}-logo-monochrome` as GTPIconName}
        className="w-[15px] h-[15px]"
        size="sm"
        style={{ color }}
      />
      {children}
    </Link>
  );
}

/**
 * Fixed bottom-right panel for displaying AI insights
 */
export function AIInsightsModal({
  isOpen,
  onClose,
  data,
  isLoading,
  error,
  title = "AI Insights",
  onRetry,
  componentType,
  context,
}: AIInsightsModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [showToolCalls, setShowToolCalls] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <FloatingPortal id="ai-insights-modal-portal">
      <CSSTransition
        in={isOpen}
        nodeRef={panelRef}
        timeout={{ enter: 200, exit: 150 }}
        classNames="ai-modal"
        mountOnEnter
        unmountOnExit
      >
        <div
          ref={panelRef}
          className="fixed bottom-4 right-4 z-[100] w-[420px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] bg-color-bg-default rounded-[15px] shadow-standard overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-[15px] py-[15px] flex-shrink-0">
            <div className="flex items-center gap-[10px]">
              <AISparkleIcon className="size-5" />
              <span className="heading-small-xs text-color-text-primary">{title}</span>
              {data?.cached && (
                <span className="text-xxs text-color-text-secondary border border-color-ui-hover/40 px-[8px] py-[2px] rounded-full">
                  cached
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center size-[28px] rounded-full text-color-text-secondary hover:text-color-text-primary hover:bg-color-ui-hover/50 transition-colors"
              aria-label="Close"
            >
              <Icon icon="feather:x" className="size-4" />
            </button>
          </div>

          {/* Content */}
          <div
            ref={scrollRef}
            className="px-[15px] py-[15px] min-h-[80px] max-h-[500px] overflow-y-auto flex-1 scrollbar-utility"
          >
            {/* Inline loading indicator - shown alongside content area */}
            {/* {isLoading && !data && <ThinkingIndicator />} */}
            {error && <ErrorState error={error} onRetry={onRetry} />}
            {/* {data && ( */}
              <InsightContent
                data={data}
                scrollRef={scrollRef}
                showDebug={showDebug}
                setShowDebug={setShowDebug}
                showThinking={showThinking}
                setShowThinking={setShowThinking}
                showToolCalls={showToolCalls}
                setShowToolCalls={setShowToolCalls}
                componentType={componentType}
                context={context}
              />
            {/* )} */}
          </div>

          {/* Footer input bar */}
          <div className="flex items-center gap-[10px] px-[15px] py-[10px] flex-shrink-0">
            <input
              type="text"
              placeholder="Ask anything"
              className="flex-1 bg-color-ui-active rounded-full px-[15px] py-[6px] text-sm text-color-text-primary placeholder:text-color-text-secondary outline-none"
              disabled
            />
            <button
              className="flex items-center justify-center size-[32px] rounded-full bg-color-accent-petrol text-white transition-colors hover:opacity-90 disabled:opacity-30"
              disabled
              aria-label="Send"
            >
              <Icon icon="feather:arrow-up" className="size-4" />
            </button>
          </div>
        </div>
      </CSSTransition>
    </FloatingPortal>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-[10px] py-[10px]">
      <div className="flex gap-[5px]">
        <span className="size-1.5 rounded-full bg-color-accent-turquoise/70 animate-pulse" style={{ animationDelay: "0ms" }} />
        <span className="size-1.5 rounded-full bg-color-accent-turquoise/70 animate-pulse" style={{ animationDelay: "150ms" }} />
        <span className="size-1.5 rounded-full bg-color-accent-turquoise/70 animate-pulse" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-sm text-color-text-secondary">Analyzing...</span>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-[30px] gap-[15px] text-center">
      <div className="size-10 rounded-full border border-color-accent-red/30 flex items-center justify-center">
        <Icon icon="feather:alert-circle" className="size-5 text-color-accent-red" />
      </div>
      <div>
        <p className="text-sm font-medium text-color-text-primary">
          Failed to generate insights
        </p>
        <p className="text-xs text-color-text-secondary mt-1">
          {error.message || "Something went wrong"}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-[15px] py-[6px] text-xs font-medium border border-color-ui-hover/40 hover:border-color-ui-hover hover:bg-color-ui-hover/10 rounded-full transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  variant = "default",
}: {
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  variant?: "default" | "debug" | "thinking";
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<string>("0");

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(`${contentRef.current.scrollHeight}px`);
    }
  }, [isOpen, children]);

  const variantStyles = {
    default: "border-color-ui-hover/40",
    debug: "border-color-accent-yellow/30",
    thinking: "border-color-accent-petrol/30",
  };

  return (
    <div
      className={`rounded-lg border ${variantStyles[variant]} overflow-hidden`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-[10px] py-[10px] heading-small-xxs text-color-text-secondary hover:text-color-text-primary hover:bg-color-ui-hover/20 transition-colors"
      >
        <div className="flex items-center gap-[8px]">
          <Icon icon={icon} className="size-3.5" />
          <span>{title}</span>
        </div>
        <Icon
          icon="feather:chevron-down"
          className={`size-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="overflow-hidden transition-[max-height] duration-300"
        style={{ maxHeight: isOpen ? contentHeight : "0" }}
      >
        <div ref={contentRef} className="px-[10px] pb-[10px] pt-[8px]">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Custom streamdown components with chain badge support
 */
const streamdownComponents = {
  a: ({
    href,
    children,
  }: {
    href?: string;
    children?: ReactNode;
  }) => {
    // Check if this is a chain link
    const chainMatch = href?.match(/^\/chains\/(.+)/);
    if (chainMatch) {
      const chainUrlKey = chainMatch[1];
      return <ChainBadge chainUrlKey={chainUrlKey}>{children}</ChainBadge>;
    }

    // Regular external link
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-color-accent-petrol hover:underline"
      >
        {children}
      </a>
    );
  },
};

const componentTypeLabels: Record<InsightComponentType, { label: string; icon: string }> = {
  table: { label: "Table", icon: "feather:grid" },
  chart: { label: "Chart", icon: "feather:bar-chart-2" },
  card: { label: "Card", icon: "feather:square" },
  chain: { label: "Chain", icon: "feather:link" },
};

/**
 * Small card summarising what context the AI was given
 */
function ContextCard({
  componentType,
  context,
}: {
  componentType: InsightComponentType;
  context: TableInsightContext | ChainInsightContext;
}) {
  const meta = componentTypeLabels[componentType];

  const details: string[] = [];
  if (componentType === "chain") {
    const c = context as ChainInsightContext;
    details.push(c.chainName);
    if (c.purpose) details.push(c.purpose);
  } else if ("totalChains" in context) {
    const t = context as TableInsightContext;
    details.push(`${t.totalChains} chains`);
    if (t.sortedBy) details.push(`sorted by ${t.sortedBy}`);
    if (t.timeframe) details.push(t.timeframe);
  }

  return (
    <div className="flex items-center gap-[10px] px-[15px] py-[10px] rounded-lg border border-color-ui-hover/40 text-xs text-color-text-secondary">
      <Icon icon={meta.icon} className="size-3.5 flex-shrink-0 text-color-accent-petrol" />
      <span className="font-medium text-color-text-primary">{meta.label}</span>
      {details.length > 0 && (
        <>
          <span className="text-color-ui-hover">&middot;</span>
          <span className="truncate">{details.join(" · ")}</span>
        </>
      )}
    </div>
  );
}

/**
 * Hook that reveals text progressively to simulate streaming.
 * Returns the portion of `fullText` to show so far, plus whether it's still animating.
 */
function useTypewriter(fullText: string, charsPerTick = 3, tickMs = 16) {
  const [displayed, setDisplayed] = useState("");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!fullText) {
      setDisplayed("");
      setAnimating(false);
      return;
    }

    let index = 0;
    setDisplayed("");
    setAnimating(true);

    const id = setInterval(() => {
      index += charsPerTick;
      if (index >= fullText.length) {
        setDisplayed(fullText);
        setAnimating(false);
        clearInterval(id);
      } else {
        setDisplayed(fullText.slice(0, index));
      }
    }, tickMs);

    return () => clearInterval(id);
  }, [fullText, charsPerTick, tickMs]);

  return { displayed, animating };
}

function InsightContent({
  data,
  scrollRef,
  showDebug,
  setShowDebug,
  showThinking,
  setShowThinking,
  showToolCalls,
  setShowToolCalls,
  componentType,
  context,
}: {
  data: AIInsightsResponse | null;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  showDebug: boolean;
  setShowDebug: (show: boolean) => void;
  showThinking: boolean;
  setShowThinking: (show: boolean) => void;
  showToolCalls: boolean;
  setShowToolCalls: (show: boolean) => void;
  componentType?: InsightComponentType;
  context?: TableInsightContext | ChainInsightContext;
}) {
  const { displayed, animating } = useTypewriter(data ? data.insight : "", 3, 16);

  // Auto-scroll while animating
  const autoScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [scrollRef]);

  useEffect(() => {
    if (animating) autoScroll();
  }, [displayed, animating, autoScroll]);

  return (
    <div className="space-y-[15px]">
      {/* 1. Debug section (top — sent first) */}
      {data && data.debug && (
        <CollapsibleSection
          title="Debug Info (MVP)"
          icon="feather:terminal"
          isOpen={showDebug}
          onToggle={() => setShowDebug(!showDebug)}
          variant="debug"
        >
          <div className="space-y-[10px]">
            <div>
              <p className="text-[10px] font-medium text-color-text-secondary mb-[5px]">
                Model
              </p>
              <code className="text-[11px] bg-color-bg-default px-2 py-1 rounded block">
                {data && data.debug.model}
              </code>
            </div>
            <div>
              <p className="text-[10px] font-medium text-color-text-secondary mb-1">
                System Prompt
              </p>
              <pre className="text-[11px] bg-color-bg-default p-2 rounded overflow-x-auto max-h-[100px] overflow-y-auto whitespace-pre-wrap">
                {data && data.debug.systemPrompt}
              </pre>
            </div>
            <div>
              <p className="text-[10px] font-medium text-color-text-secondary mb-1">
                User Prompt
              </p>
              <pre className="text-[11px] bg-color-bg-default p-2 rounded overflow-x-auto max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                {data && data.debug.prompt}
              </pre>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* 2. Context card */}
      {componentType && context && (
        <ContextCard componentType={componentType} context={context} />
      )}

      {/* 3. Thinking section */}
      {data && data.thinking && (
        <CollapsibleSection
          title="Model Thinking"
          icon="feather:cpu"
          isOpen={showThinking}
          onToggle={() => setShowThinking(!showThinking)}
          variant="thinking"
        >
          <div className="text-xs text-color-text-primary whitespace-pre-wrap font-mono leading-relaxed max-h-[200px] overflow-y-auto">
            <Streamdown>
            {data.thinking}
            </Streamdown>
          </div>
        </CollapsibleSection>
      )}

      {/* 4. Tool Calls section */}
      {data && data.debug?.toolCalls && data.debug.toolCalls.length > 0 && (
        <CollapsibleSection
          title={`Tool Calls (${data.debug.toolCalls.length})`}
          icon="feather:tool"
          isOpen={showToolCalls}
          onToggle={() => setShowToolCalls(!showToolCalls)}
          variant="default"
        >
          <div className="space-y-[8px]">
            {data.debug.agenticTurns && (
              <p className="text-[10px] text-color-text-secondary">
                {data.debug.agenticTurns} agentic turn{data.debug.agenticTurns > 1 ? "s" : ""}
              </p>
            )}
            {data.debug.toolCalls.map((call, index) => (
              <div
                key={index}
                className="bg-color-bg-default rounded p-2 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <code className="text-[11px] font-semibold">
                    {call.name}
                  </code>
                  <span className="text-[10px] text-color-text-secondary">
                    Turn {call.turn} &middot; {call.durationMs}ms
                  </span>
                </div>
                {Object.keys(call.args).length > 0 && (
                  <div>
                    <p className="text-[10px] text-color-text-secondary">
                      Args
                    </p>
                    <pre className="text-[10px] bg-color-bg-medium p-1 rounded overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(call.args, null, 2)}
                    </pre>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-color-text-secondary">
                    {call.error ? "Error" : "Result"}
                  </p>
                  <pre
                    className={`text-[10px] p-1 rounded overflow-x-auto max-h-[80px] overflow-y-auto whitespace-pre-wrap ${
                      call.error
                        ? "bg-color-accent-red/10 text-color-accent-red"
                        : "bg-color-bg-medium"
                    }`}
                  >
                    {JSON.stringify(call.result, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* 5. Animated response */}
      <div className="text-md leading-relaxed [&_p]:my-[10px] [&_strong]:font-semibold [&_ul]:my-[12px] [&_ul]:list-disc [&_ul]:pl-[20px] [&_li]:my-[5px] [&_ol]:my-[12px] [&_ol]:list-decimal [&_ol]:pl-[20px]">
        <Streamdown components={streamdownComponents}>
          {displayed}
        </Streamdown>
      </div>

      {/* Sources from Google Search grounding */}
      {!animating && data && data.sources && data.sources.length > 0 && (
        <div>
          <p className="heading-small-xxs text-color-text-secondary mb-[10px] flex items-center gap-[5px]">
            <Icon icon="feather:globe" className="size-3" />
            Sources
          </p>
          <div className="flex flex-wrap gap-[5px]">
            {data.sources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] px-[10px] py-[4px] border border-color-ui-hover/40 hover:border-color-ui-hover hover:bg-color-ui-hover/10 rounded-full transition-colors flex items-center gap-[5px] max-w-[200px] truncate"
                title={source.title}
              >
                <Icon
                  icon="feather:external-link"
                  className="size-3 flex-shrink-0"
                />
                <span className="truncate">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Highlighted metrics */}
      {!animating && data && data.highlightedMetrics && data.highlightedMetrics.length > 0 && (
        <div className="flex flex-wrap gap-[8px]">
          {data.highlightedMetrics.map((metric, index) => (
            <div
              key={index}
              className="flex items-center gap-[5px] px-[10px] py-[4px] border border-color-ui-hover/40 rounded-full"
            >
              <span className="text-xs text-color-text-secondary">
                {metric.metric}:
              </span>
              <span className="numbers-xs">{metric.value}</span>
              {metric.trend && (
                <Icon
                  icon={
                    metric.trend === "up"
                      ? "feather:trending-up"
                      : metric.trend === "down"
                        ? "feather:trending-down"
                        : "feather:minus"
                  }
                  className={`size-3 ${
                    metric.trend === "up"
                      ? "text-color-positive"
                      : metric.trend === "down"
                        ? "text-color-negative"
                        : "text-color-text-secondary"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {!animating && data && data.suggestions && data.suggestions.length > 0 && (
        <div>
          <p className="heading-small-xxs text-color-text-secondary mb-[10px]">
            Key points
          </p>
          <ul className="space-y-[8px]">
            {data.suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="text-sm text-color-text-primary flex items-start gap-[10px] leading-relaxed"
              >
                <span className="text-color-accent-turquoise mt-1 text-[8px]">●</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AISparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.6929 0.181295C12.7199 0.108513 12.8378 0.108514 12.8647 0.181295C13.0589 0.705834 13.571 1.94751 14.2869 2.61926C15.0028 3.29102 16.326 3.77158 16.885 3.95376C16.9626 3.97904 16.9626 4.08969 16.885 4.11497C16.326 4.29715 15.0028 4.77771 14.2869 5.44946C13.571 6.12122 13.0589 7.36289 12.8647 7.88743C12.8378 7.96021 12.7199 7.96021 12.6929 7.88743C12.4988 7.36289 11.9867 6.12122 11.2708 5.44946C10.5549 4.77771 9.23164 4.29715 8.67265 4.11497C8.59508 4.08969 8.59508 3.97904 8.67265 3.95376C9.23164 3.77158 10.5549 3.29102 11.2708 2.61926C11.9867 1.94751 12.4988 0.705834 12.6929 0.181295Z"
        fill="url(#paint0)"
      />
      <path
        d="M6.23 10.11C6.25 10.05 6.32 10.05 6.34 10.11C6.45 10.39 6.73 11.06 7.12 11.42C7.51 11.78 8.22 12.04 8.52 12.14C8.57 12.15 8.57 12.21 8.52 12.22C8.22 12.32 7.51 12.58 7.12 12.94C6.73 13.3 6.45 13.97 6.34 14.25C6.32 14.29 6.25 14.29 6.23 14.25C6.12 13.97 5.85 13.3 5.46 12.94C5.07 12.58 4.36 12.32 4.06 12.22C4.02 12.21 4.02 12.15 4.06 12.14C4.36 12.04 5.07 11.78 5.46 11.42C5.85 11.06 6.12 10.39 6.23 10.11Z"
        fill="url(#paint1)"
      />
      <path
        d="M14.87 14.25C14.89 14.21 14.95 14.21 14.96 14.25C15.06 14.51 15.31 15.13 15.67 15.47C16.03 15.8 16.69 16.04 16.97 16.13C17.01 16.15 17.01 16.2 16.97 16.21C16.69 16.3 16.03 16.54 15.67 16.88C15.31 17.22 15.06 17.84 14.96 18.1C14.95 18.14 14.89 18.14 14.87 18.1C14.78 17.84 14.52 17.22 14.16 16.88C13.81 16.54 13.14 16.3 12.86 16.21C12.83 16.2 12.83 16.15 12.86 16.13C13.14 16.04 13.81 15.8 14.16 15.47C14.52 15.13 14.78 14.51 14.87 14.25Z"
        fill="url(#paint2)"
      />
      <path
        d="M9 17C9.02 16.96 9.08 16.96 9.1 17C9.2 17.26 9.45 17.88 9.81 18.22C10.17 18.55 10.83 18.79 11.11 18.88C11.15 18.9 11.15 18.95 11.11 18.96C10.83 19.05 10.17 19.29 9.81 19.63C9.45 19.97 9.2 20.59 9.1 20.85C9.08 20.89 9.02 20.89 9 20.85C8.9 20.59 8.66 19.97 8.3 19.63C7.94 19.29 7.28 19.05 7 18.96C6.96 18.95 6.96 18.9 7 18.88C7.28 18.79 7.94 18.55 8.3 18.22C8.66 17.88 8.9 17.26 9 17Z"
        fill="url(#paint3)"
      />
      <defs>
        <linearGradient id="paint0" x1="5" y1="24" x2="12" y2="3" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--icon-accent-petrol)" />
          <stop offset="1" stopColor="var(--icon-accent-turquoise)" />
        </linearGradient>
        <linearGradient id="paint1" x1="5" y1="24" x2="12" y2="3" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--icon-accent-petrol)" />
          <stop offset="1" stopColor="var(--icon-accent-turquoise)" />
        </linearGradient>
        <linearGradient id="paint2" x1="5" y1="24" x2="12" y2="3" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--icon-accent-petrol)" />
          <stop offset="1" stopColor="var(--icon-accent-turquoise)" />
        </linearGradient>
        <linearGradient id="paint3" x1="5" y1="24" x2="12" y2="3" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--icon-accent-petrol)" />
          <stop offset="1" stopColor="var(--icon-accent-turquoise)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default AIInsightsModal;

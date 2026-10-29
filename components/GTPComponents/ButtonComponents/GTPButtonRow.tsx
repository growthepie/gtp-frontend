"use client";

import { useEffect, useRef, useState } from "react";
import GTPTabButtonSet from "../GTPTabButtonSet";

export default function GTPButtonRow({
  children,
  className,
  style,
  wrap = false,
  onWrapChange,
  autoFill = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  wrap?: boolean;
  onWrapChange?: (wrapped: boolean) => void;
  /** Stretch the buttons to fill the bar once they'd take up more than half of it. */
  autoFill?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);

  useEffect(() => {
    const row = ref.current;
    const container = row?.parentElement;
    if (!autoFill || !row || !container) return;

    // Compares the row's natural width, so it's measured with the fill briefly
    // switched off (restored before the browser paints).
    const checkFill = () => {
      const current = row.dataset.fill;
      row.dataset.fill = "false";
      const natural = row.getBoundingClientRect().width;
      row.dataset.fill = current;
      setFilled(natural > container.clientWidth / 2);
    };

    const observer = new ResizeObserver(checkFill);
    observer.observe(container);
    observer.observe(row);
    checkFill();

    return () => observer.disconnect();
  }, [autoFill]);

  // A wrapping row tracks whether it actually spans several lines: its outline then
  // drops the full rounding (see className below), and onWrapChange is told.
  useEffect(() => {
    const container = ref.current;
    if (!container || (!wrap && !onWrapChange)) return;

    const checkWrap = () => {
      const children = Array.from(container.children) as HTMLElement[];
      const firstTop = children[0]?.offsetTop ?? 0;
      const wrapped = children.length > 1 && children.some((child) => child.offsetTop > firstTop);
      setIsWrapped(wrapped);
      onWrapChange?.(wrapped);
    };

    // The observer also fires once right after observe(), so no separate initial call.
    const observer = new ResizeObserver(checkWrap);
    observer.observe(container);

    return () => observer.disconnect();
  }, [wrap, onWrapChange]);

  return (
    <GTPTabButtonSet
      ref={ref}
      data-fill={autoFill && filled ? "true" : "false"}
      // Wrapped over several lines, a fully rounded outline looks wrong: 13px fits inside
      // GTPButtonContainer's 15px corners with its 2px padding.
      className={`${wrap ? "flex-wrap" : ""} ${wrap && isWrapped ? "!rounded-[13px]" : ""} data-[fill=true]:flex-auto [&[data-fill=true]>*]:flex-1 [&[data-fill=true]>*>button]:w-full ${className ?? ""}`}
      style={style}
    >
      {children}
    </GTPTabButtonSet>
  );
}

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

  useEffect(() => {
    const container = ref.current;
    if (!container || !onWrapChange) return;

    const checkWrap = () => {
      const children = Array.from(container.children) as HTMLElement[];
      if (children.length < 2) {
        onWrapChange(false);
        return;
      }
      const firstTop = children[0].offsetTop;
      onWrapChange(children.some((child) => child.offsetTop > firstTop));
    };

    const observer = new ResizeObserver(checkWrap);
    observer.observe(container);
    checkWrap();

    return () => observer.disconnect();
  }, [onWrapChange]);

  return (
    <GTPTabButtonSet
      ref={ref}
      data-fill={autoFill && filled ? "true" : "false"}
      className={`${wrap ? "flex-wrap" : ""} data-[fill=true]:flex-auto [&[data-fill=true]>*]:flex-1 [&[data-fill=true]>*>button]:w-full ${className ?? ""}`}
      style={style}
    >
      {children}
    </GTPTabButtonSet>
  );
}

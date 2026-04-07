"use client";

import { useEffect, useRef } from "react";
import GTPTabButtonSet from "../GTPTabButtonSet";

export default function GTPButtonRow({
  children,
  className,
  style,
  wrap = false,
  onWrapChange,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  wrap?: boolean;
  onWrapChange?: (wrapped: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

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
    <GTPTabButtonSet ref={ref} className={`${wrap ? "flex-wrap" : ""} ${className ?? ""}`} style={style}>
      {children}
    </GTPTabButtonSet>
  );
}

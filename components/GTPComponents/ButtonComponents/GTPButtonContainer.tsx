"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function GTPButtonContainer({
  children,
  className,
  style,
  isWrapping,
  setIsWrapping,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  wrap?: boolean;
  isWrapping?: boolean;
  setIsWrapping?: (isWrapping: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Fully rounded while the bar is one row; 15px corners once its content takes two
  // or more rows. Measured by height, so it catches both the bar's own items wrapping
  // and a button row inside it wrapping. Independent of setIsWrapping below.
  const [isMultiRow, setIsMultiRow] = useState(false);

  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;

    const checkRows = () => {
      const styles = getComputedStyle(container);
      const contentHeight =
        container.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
      const rowHeight = container.querySelector("button")?.getBoundingClientRect().height ?? contentHeight;
      setIsMultiRow(rowHeight > 0 && contentHeight > rowHeight * 1.5);
    };

    const observer = new ResizeObserver(checkRows);
    observer.observe(container);
    checkRows();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = ref.current;
    if (!container || !setIsWrapping) return;

    const checkWrap = () => {
      const children = Array.from(container.children) as HTMLElement[];
      if (children.length < 2) {
        setIsWrapping(false);
        return;
      }
      const firstTop = children[0].offsetTop;
      setIsWrapping(children.some((child) => child.offsetTop > firstTop));
    };

    const observer = new ResizeObserver(checkWrap);
    observer.observe(container);
    checkWrap();

    return () => observer.disconnect();
  }, [setIsWrapping]);

  return (
    <div
      ref={ref}
      className={`select-none  flex gap-y-[5px] ${isMultiRow ? "rounded-[15px]" : "rounded-full"} py-[2px] px-[2px] text-xs lg:gap-y-0 flex-wrap flex-row w-full justify-between items-center bg-color-bg-medium ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

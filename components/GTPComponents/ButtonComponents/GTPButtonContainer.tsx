"use client";

import { useEffect, useRef } from "react";

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
      className={`select-none  flex gap-y-[5px] rounded-[15px] py-[2px] px-[2px] text-xs lg:gap-y-0 lg:text-base flex-wrap flex-row w-full justify-between items-center lg:rounded-full bg-color-bg-medium ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

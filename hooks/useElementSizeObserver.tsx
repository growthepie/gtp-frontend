import { RefObject, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

type Size = {
  width: number;
  height: number;
};

export const useElementSizeObserver = <
  T extends HTMLElement = HTMLDivElement
>(): [RefObject<T | null>, Size] => {
  const ref = useRef<T| null>(null);
  const [size, setSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  useIsomorphicLayoutEffect(() => {
    const updateSize = (element: Element | null) => {
      const { width, height } = element?.getBoundingClientRect() ?? {
        width: 0,
        height: 0,
      };
      setSize({ width, height });
    };

    updateSize(ref.current);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        updateSize(entry.target);
      }
    });

    ref.current && resizeObserver.observe(ref.current);
    return () => {
      ref.current && resizeObserver.unobserve(ref.current);
    };
  }, [ref.current]);

  return [ref, size];
};

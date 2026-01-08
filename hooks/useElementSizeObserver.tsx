import { RefObject, useMemo, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

type Size = {
  width: number;
  height: number;
};

type Options = {
  enabled?: boolean;
  initialSize?: Partial<Size>;
  box?: ResizeObserverBoxOptions;
};

const DEFAULT_SIZE: Size = {
  width: 0,
  height: 0,
};

export const useElementSizeObserver = <T extends HTMLElement = HTMLDivElement>(
  options: Options = {},
): [RefObject<T | null>, Size] => {
  const { enabled = true, initialSize, box = "border-box" } = options;
  const ref = useRef<T | null>(null);
  const mergedInitialSize = useMemo(
    () => ({
      ...DEFAULT_SIZE,
      ...initialSize,
    }),
    [initialSize?.height, initialSize?.width],
  );
  const [size, setSize] = useState<Size>(mergedInitialSize);
  const element = ref.current;

  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      setSize((prev) =>
        prev.width === mergedInitialSize.width &&
        prev.height === mergedInitialSize.height
          ? prev
          : mergedInitialSize,
      );
      return;
    }

    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const applySize = (next: Size) => {
      setSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      );
    };

    let frameId: number | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries.at(-1);
      if (!entry) return;

      const { width, height } = entry.contentRect;

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      frameId =
        typeof window !== "undefined"
          ? window.requestAnimationFrame(() =>
              applySize({
                width,
                height,
              }),
            )
          : null;
    });

    resizeObserver.observe(element, { box });

    return () => {
      if (frameId !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(frameId);
      }

      resizeObserver.unobserve(element);
      resizeObserver.disconnect();
    };
  }, [box, element, enabled, mergedInitialSize]);

  return [ref, size];
};

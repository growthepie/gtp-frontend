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
): [RefObject<T>, Size] => {
  const { enabled = true, initialSize, box = "border-box" } = options;
  const ref = useRef<T>(null);
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

      // Use borderBoxSize when box="border-box" to include padding
      // contentRect always returns content-box regardless of box option
      let width: number;
      let height: number;

      if (box === "border-box" && entry.borderBoxSize?.[0]) {
        width = entry.borderBoxSize[0].inlineSize;
        height = entry.borderBoxSize[0].blockSize;
        // Fallback to contentRect if borderBoxSize returns 0
        if (width === 0 && entry.contentRect.width > 0) {
          width = entry.contentRect.width;
        }
        if (height === 0 && entry.contentRect.height > 0) {
          height = entry.contentRect.height;
        }
      } else {
        width = entry.contentRect.width;
        height = entry.contentRect.height;
      }

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

const HTML2CANVAS_CDN_URL =
  "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";

export type Html2CanvasFn = (
  element: HTMLElement,
  options?: {
    backgroundColor?: string | null;
    useCORS?: boolean;
    logging?: boolean;
    scale?: number;
    removeContainer?: boolean;
    onclone?: (documentClone: Document) => void;
  },
) => Promise<HTMLCanvasElement>;

declare global {
  interface Window {
    html2canvas?: Html2CanvasFn;
  }
}

let html2CanvasLoaderPromise: Promise<Html2CanvasFn | null> | null = null;

export async function loadHtml2Canvas(): Promise<Html2CanvasFn | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.html2canvas) {
    return window.html2canvas;
  }

  if (html2CanvasLoaderPromise) {
    return html2CanvasLoaderPromise;
  }

  html2CanvasLoaderPromise = new Promise<Html2CanvasFn | null>((resolve) => {
    const scriptId = "gtp-html2canvas-loader";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const resolveFromWindow = () => resolve(window.html2canvas ?? null);

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = HTML2CANVAS_CDN_URL;
      script.async = true;
      script.onload = resolveFromWindow;
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
      return;
    }

    if (window.html2canvas) {
      resolve(window.html2canvas);
      return;
    }

    script.addEventListener("load", resolveFromWindow, { once: true });
    script.addEventListener("error", () => resolve(null), { once: true });
  });

  return html2CanvasLoaderPromise;
}

export async function downloadElementAsImage(
  element: HTMLElement,
  label: string,
): Promise<void> {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  const html2canvas = await loadHtml2Canvas();
  if (!html2canvas) {
    return;
  }

  const canvas = await html2canvas(element, {
    backgroundColor: null,
    useCORS: true,
    logging: false,
    scale: Math.min(Math.max(window.devicePixelRatio || 1, 1), 2),
    removeContainer: true,
    onclone: (documentClone) => {
      const style = documentClone.createElement("style");
      style.textContent = `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
        }
        span[class*="text-"],
        span[class*="heading-"],
        span[class*="numbers-"],
        div[class*="text-"],
        div[class*="heading-"],
        div[class*="numbers-"],
        a[class*="text-"],
        a[class*="heading-"],
        a[class*="numbers-"],
        th,
        td,
        label {
          position: relative !important;
          top: -8px !important;
        }
      `;
      documentClone.head.appendChild(style);
    },
  });

  const imageBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });

  if (!imageBlob) {
    return;
  }

  const metricSlug =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "metric";
  const dateStamp = new Date().toISOString().slice(0, 10);
  const objectUrl = URL.createObjectURL(imageBlob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `growthepie-${metricSlug}-${dateStamp}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const returnTrue = () => true;
const returnFalse = () => false;

/**
 * SSR-safe hook to detect if the component is mounted on the client.
 *
 * Uses useSyncExternalStore to avoid the ESLint warning about
 * calling setState directly within useEffect.
 *
 * @returns false during SSR, true on the client
 *
 * @example
 * ```tsx
 * const isMounted = useIsMounted();
 *
 * if (isMounted) {
 *   return createPortal(content, document.body);
 * }
 * return fallbackContent;
 * ```
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, returnTrue, returnFalse);
}
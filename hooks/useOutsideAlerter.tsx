import { useEffect } from "react";

export const useOutsideAlerter = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  enabled?: boolean
) => {
  const isEnabled = enabled ?? true;
  useEffect(() => {
    if (!isEnabled) return; // if enabled is false, return
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [ref, callback, isEnabled]);
};
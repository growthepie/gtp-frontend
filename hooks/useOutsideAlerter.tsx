import { useEffect } from "react";

type Props = {
  ref: React.RefObject<HTMLElement>;
  callback: () => void;
  enabled: boolean;
}

export const useOutsideAlerter = ({ ref, callback, enabled }: Props) => {
  useEffect(() => {
    if (!enabled) return; // if enabled is false, return
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
  }, [ref, callback, enabled]);
};
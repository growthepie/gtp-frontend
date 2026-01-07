"use client";
import { memo, useEffect, useState, useRef, ReactNode } from "react";
import { GTPIcon } from "../layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { createPortal } from "react-dom";

// Toast Types
export type ToastType = "success" | "error" | "info" | "warning";

// Toast configuration
export interface ToastConfig {
  id: string;
  message: string | ReactNode;
  type: ToastType;
  icon?: ReactNode;
  className?: string;
  title?: string;
  rightIcon?: ReactNode;
  iconClassName?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Context and Provider for Toast management
import { createContext, useContext } from "react";

interface ToastContextType {
  addToast: (toast: Omit<ToastConfig, "id">) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  maxToasts?: number;
}

// Toast Item Component
const ToastItem = memo(({
  toast,
  onDismiss
}: {
  toast: ToastConfig;
  onDismiss: () => void;
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (toast.duration !== Infinity) {
      const timer = setTimeout(() => {
        onDismiss();
      }, toast.duration || 2000);

      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  // Define icon and color based on type
  const getTypeStyles = (): { title: string; icon: ReactNode; iconClassName: string } => {
    switch (toast.type) {
      case "success":
        return {
          title: toast.title || "Success",
          icon: toast.icon || <GTPIcon icon={"feather:check" as GTPIconName} size="sm" className="text-[#a3e877]" />,
          iconClassName: toast.iconClassName || "text-[#a3e877]",
        };
      case "error":
        return {
          title: toast.title || "Error",
          icon: toast.icon || <GTPIcon icon={"feather:alert-triangle" as GTPIconName} size="sm" className="text-color-accent-red" />,
          iconClassName: toast.iconClassName || "text-color-accent-red",
        };
      case "warning":
        return {
          title: toast.title || "Warning",
          icon: toast.icon || <GTPIcon icon={"feather:alert-circle" as GTPIconName} size="sm" className="text-[#ffa542]" />,
          iconClassName: toast.iconClassName || "text-[#ffa542]",
        };
      case "info":
      default:
        return {
          title: toast.title || "Info",
          icon: toast.icon || <GTPIcon icon={"feather:info" as GTPIconName} size="sm" className="text-[#2ef5df]" />,
          iconClassName: toast.iconClassName || "text-[#2ef5df]",
        };
    }
  };

  const { icon, iconClassName, title } = getTypeStyles();


  return (
    <div
      ref={nodeRef}
      className={`flex flex-col gap-y-[5px] w-[350px] max-w-[90vw] py-[15px] pr-[15px] rounded-[15px] bg-color-bg-default text-color-text-primary text-xs shadow-[0px_0px_4px_0px_rgba(0,_0,_0,_0.25)] z-50`}
    >
      <div className={`flex w-full gap-x-[10px] pl-[20px] h-[18px] items-center ${toast.className}`}>
        {icon && icon}
        {title && <div className="heading-small-xs h-[18px] flex items-center">{title}</div>}
        {toast.rightIcon && <>{toast.rightIcon}</>}
        <div className="flex-1" />
        <button
          onClick={onDismiss}
          className="text-[#5A6462] hover:text-color-text-primary transition-colors flex-shrink-0"
        >
          <GTPIcon icon={"feather:x" as GTPIconName} size="sm" />
        </button>
      </div>
      <div className={`flex items-start w-full pl-[20px] gap-x-[10px]`}>
        <div className="flex-1 text-xs">
          {toast.message}

          {toast.action && (
            <div className="mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.action?.onClick();
                  onDismiss();
                }}
                className="text-xs underline text-[#76ECAD]"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ToastItem.displayName = 'ToastItem';

// ToastContainer Component
const ToastContainer = memo(({
  toasts,
  onDismiss,
  position = "bottom-right"
}: {
  toasts: ToastConfig[];
  onDismiss: (id: string) => void;
  position: ToastProviderProps["position"]
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Position classes
  const positionClasses = {
    "top-right": "top-6 right-6 items-end",
    "top-left": "top-6 left-6 items-start",
    "bottom-right": "bottom-6 right-6 items-end",
    "bottom-left": "bottom-6 left-6 items-start",
    "top-center": "top-6 left-1/2 -translate-x-1/2 items-center",
    "bottom-center": "bottom-6 left-1/2 -translate-x-1/2 items-center"
  };

  // Don't render on server
  if (!isMounted) return null;

  return createPortal(
    <div
      className={`fixed z-50 flex flex-col gap-y-[10px] pb-[125px] md:pb-[75px] md:pr-[40px] ${positionClasses[position || "bottom-right"]}`}
      style={{ pointerEvents: "none" }}
    >
      <TransitionGroup component={null}>
        {toasts.map((toast) => (
          <CSSTransition
            key={toast.id}
            timeout={300}
            classNames={{
              enter: "toast-enter",
              enterActive: "toast-enter-active",
              exit: "toast-exit",
              exitActive: "toast-exit-active"
            }}
          >
            <div style={{ pointerEvents: "auto" }}>
              <ToastItem
                toast={toast}
                onDismiss={() => onDismiss(toast.id)}
              />
            </div>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>,
    document.body
  );
});

ToastContainer.displayName = 'ToastContainer';

// Toast Provider
export const ToastProvider = ({
  children,
  position = "bottom-right",
  maxToasts = 5
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const addToast = (toast: Omit<ToastConfig, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setToasts((prevToasts) => {
      // Add new toast and limit by maxToasts
      const updatedToasts = [
        { ...toast, id },
        ...prevToasts,
      ].slice(0, maxToasts);

      return updatedToasts;
    });

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearAllToasts }}>
      {children}
      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
        position={position}
      />
      <style jsx global>{`
        /* Toast Animation Styles */
        .toast-enter {
          opacity: 0;
          transform: translateY(20px);
        }
        .toast-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 300ms, transform 300ms;
        }
        .toast-exit {
          opacity: 1;
        }
        .toast-exit-active {
          opacity: 0;
          transform: translateY(-20px);
          transition: opacity 300ms, transform 300ms;
        }
      `}</style>
    </ToastContext.Provider>
  );
};
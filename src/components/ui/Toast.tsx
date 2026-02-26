"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "error" | "success";

type ToastState = {
  message: string;
  type: ToastType;
} | null;

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((message: string, type: ToastType = "error") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState({ message, type });
    timeoutRef.current = setTimeout(() => {
      setState(null);
      timeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {state && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white bg-neutral-800 border border-neutral-700"
          data-type={state.type}
        >
          {state.type === "error" && (
            <span className="flex items-center gap-2">
              <span className="text-red-400" aria-hidden>●</span>
              {state.message}
            </span>
          )}
          {state.type === "success" && (
            <span className="flex items-center gap-2">
              <span className="text-green-400" aria-hidden>●</span>
              {state.message}
            </span>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

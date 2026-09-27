'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CircleCheck, X } from 'lucide-react';
import styles from './Toast.module.css';

type ToastItem = { id: number; message: string };

const ToastContext = createContext<(message: string) => void>(() => {});

const TOAST_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_MS),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className={styles.region}>
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast}>
            <CircleCheck size={18} aria-hidden="true" className={styles.icon} />
            <p className={styles.message}>{toast.message}</p>
            <button type="button" aria-label="Dismiss" className={styles.close} onClick={() => dismiss(toast.id)}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Returns a function that shows a short confirmation message. */
export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}

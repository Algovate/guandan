import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

const toastStyles = {
  success: 'bg-ui-success text-white',
  error: 'bg-ui-error text-white',
  info: 'bg-ui-primary text-white',
  warning: 'bg-ui-warning text-white',
};

const icons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

export default function Toast({ 
  message, 
  type = 'info', 
  duration = 3000,
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3, type: "spring" }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 ${toastStyles[type]} px-5 md:px-6 py-2.5 md:py-3 rounded-xl shadow-2xl flex items-center gap-2 md:gap-3 min-w-[200px] max-w-[90vw] md:max-w-md mx-4 backdrop-blur-sm`}
          style={{
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          }}
        >
          <div className="text-2xl font-bold">{icons[type]}</div>
          <div className="font-semibold flex-1">{message}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toast管理器
let toastQueue: Array<{ id: number; message: string; type?: 'success' | 'error' | 'info' | 'warning'; duration?: number }> = [];
let toastId = 0;
let listeners: Array<() => void> = [];

export const toast = {
  show: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => {
    const id = toastId++;
    toastQueue.push({ id, message, type, duration });
    listeners.forEach(listener => listener());
  },
  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  getQueue: () => toastQueue,
  remove: (id: number) => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    listeners.forEach(listener => listener());
  },
};

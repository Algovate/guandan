import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

const toastStyles = {
  success: 'bg-[#0a3d24]/90 border-[#4CAF50]/50 text-white',
  error: 'bg-[#3d0a0a]/90 border-[#F44336]/50 text-white',
  info: 'bg-[#0a2a3d]/90 border-[#2196F3]/50 text-white',
  warning: 'bg-[#3d2a0a]/90 border-[#FFC107]/50 text-white',
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
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] ${toastStyles[type]} px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[200px] max-w-[90vw] md:max-w-md mx-4 backdrop-blur-md border`}
          style={{
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="text-2xl font-bold drop-shadow-md">{icons[type]}</div>
          <div className="font-semibold flex-1 font-display tracking-wide text-shadow-sm">{message}</div>
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

'use client';

import React, { createContext, useContext, useState } from 'react';
import { haptics } from '@/lib/audio-haptics';

interface ToastContextType {
  showToast: (message: string, icon?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; icon: string } | null>(null);

  const showToast = (message: string, icon = '✨') => {
    setToast({ message, icon });
    haptics.playSuccess();
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-2/95 border border-fitness-primary/40 shadow-glow-fitness text-white text-sm backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-lg">{toast.icon}</span>
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

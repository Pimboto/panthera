import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, Zap } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);

    // Auto remove
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onRemove(toast.id), 200);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-200 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100 slide-in-right' : 'translate-x-full opacity-0 slide-out-right'}
        ${getToastStyles()}
        desktop-card rounded-lg p-3
        max-w-sm w-full pointer-events-auto
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.title}</p>
          {toast.message && (
            <p className="text-xs opacity-80 mt-1">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(() => onRemove(toast.id), 200);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};
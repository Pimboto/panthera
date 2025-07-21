import { useState, useCallback, useMemo } from 'react';
import { Toast, ToastType } from '../components/Toast';

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      type,
      title,
      message,
      duration: duration || 4000,
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    addToast('success', title, message);
  }, [addToast]);

  const showError = useCallback((title: string, message?: string) => {
    addToast('error', title, message);
  }, [addToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    addToast('info', title, message);
  }, [addToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    addToast('warning', title, message);
  }, [addToast]);

  // Memoize el objeto para evitar re-renders innecesarios
  return useMemo(() => ({
    toasts,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  }), [toasts, removeToast, showSuccess, showError, showInfo, showWarning]);
};

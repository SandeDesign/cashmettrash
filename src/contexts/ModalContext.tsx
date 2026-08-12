import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import VlottrModal, { ModalType } from '../components/common/VlottrModal';
import Toast, { ToastItem, ToastType } from '../components/common/Toast';

interface ModalConfig {
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  showCancel?: boolean;
}

interface ModalContextType {
  showAlert: (title: string, message: string, type?: ModalType) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm?: () => void | Promise<void>,
    type?: ModalType
  ) => Promise<boolean>;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ModalConfig>({
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Annuleren',
    showCancel: false,
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showAlert = useCallback((
    title: string,
    message: string,
    type: ModalType = 'info'
  ) => {
    setConfig({
      title,
      message,
      type,
      confirmText: 'OK',
      showCancel: false,
    });
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm?: () => void | Promise<void>,
    type: ModalType = 'warning'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({
        title,
        message,
        type,
        confirmText: 'Bevestigen',
        cancelText: 'Annuleren',
        showCancel: true,
        onConfirm: async () => {
          if (onConfirm) {
            await onConfirm();
          }
          setIsOpen(false);
          resolve(true);
        },
      });
      setIsOpen(true);
      setResolvePromise(() => resolve);
    });
  }, []);

  const showSuccess = useCallback((message: string) => {
    addToast(message, 'success');
  }, [addToast]);

  const showError = useCallback((message: string) => {
    showAlert('Fout', message, 'error');
  }, [showAlert]);

  const showWarning = useCallback((message: string) => {
    addToast(message, 'warning');
  }, [addToast]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  return (
    <ModalContext.Provider
      value={{
        showAlert,
        showConfirm,
        showSuccess,
        showError,
        showWarning,
      }}
    >
      {children}
      <VlottrModal
        isOpen={isOpen}
        onClose={closeModal}
        {...config}
      />
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

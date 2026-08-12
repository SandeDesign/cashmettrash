import { useState, useCallback } from 'react';
import { ModalType } from '../components/common/VlottrModal';

interface ModalConfig {
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  showCancel?: boolean;
}

export const useVlottrModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ModalConfig>({
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Annuleren',
    showCancel: false,
  });

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
          resolve(true);
        },
      });
      setIsOpen(true);

      // If user closes without confirming, resolve to false
      const checkClosed = setInterval(() => {
        if (!isOpen) {
          resolve(false);
          clearInterval(checkClosed);
        }
      }, 100);
    });
  }, [isOpen]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    config,
    showAlert,
    showConfirm,
    closeModal,
  };
};

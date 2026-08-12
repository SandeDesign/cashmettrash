import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type ModalType = 'success' | 'error' | 'warning' | 'info';

interface VlottrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  showCancel?: boolean;
}

const VlottrModal: React.FC<VlottrModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Annuleren',
  onConfirm,
  showCancel = false,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-400" />;
      default:
        return <Info className="w-12 h-12 text-blue-400" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          gradient: 'from-green-900 to-green-950',
          border: 'border-green-600',
          button: 'bg-green-500 hover:bg-green-400',
        };
      case 'error':
        return {
          gradient: 'from-red-900 to-red-950',
          border: 'border-red-600',
          button: 'bg-red-500 hover:bg-red-400',
        };
      case 'warning':
        return {
          gradient: 'from-yellow-900 to-yellow-950',
          border: 'border-yellow-600',
          button: 'bg-yellow-500 hover:bg-yellow-400',
        };
      default:
        return {
          gradient: 'from-blue-900 to-blue-950',
          border: 'border-blue-600',
          button: 'bg-blue-500 hover:bg-blue-400',
        };
    }
  };

  const colors = getColors();

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`bg-gradient-to-br ${colors.gradient} bg-[#0d0d0d] border ${colors.border} rounded-2xl shadow-2xl overflow-hidden`}>
            {/* Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                {getIcon()}
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-white text-center mb-2">
                {title}
              </h2>
            </div>

            {/* Message */}
            <div className="px-6 pb-6">
              <p className="text-neutral-300 text-center text-sm leading-relaxed whitespace-pre-line">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className={`p-4 border-t border-neutral-700 ${showCancel ? 'grid grid-cols-2 gap-3' : 'flex'}`}>
              {showCancel && (
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium text-sm"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`${showCancel ? '' : 'w-full'} px-4 py-3 ${colors.button} text-white rounded-lg transition-colors font-medium text-sm shadow-lg`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VlottrModal;

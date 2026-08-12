// src/components/common/CmtModal.tsx
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ModalType = 'success' | 'error' | 'warning' | 'info';

interface CmtModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

const ICONS: Record<ModalType, React.ReactNode> = {
  success: <CheckCircle className="w-6 h-6" />,
  error: <AlertCircle className="w-6 h-6" />,
  warning: <AlertTriangle className="w-6 h-6" />,
  info: <Info className="w-6 h-6" />,
};

const COLORS: Record<ModalType, string> = {
  success: 'var(--cmt-glas)',
  error: 'var(--cmt-error)',
  warning: 'var(--cmt-warning)',
  info: 'var(--cmt-stat)',
};

const CmtModal: React.FC<CmtModalProps> = ({
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
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div
      className="cmt-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="cmt-modal cmt-animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <span style={{ color: COLORS[type] }} className="flex-shrink-0 mt-0.5">
            {ICONS[type]}
          </span>
          <h3 className="flex-1 text-lg font-bold" style={{ color: 'var(--cmt-ink)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p
          className="text-sm leading-relaxed whitespace-pre-line mb-6"
          style={{ color: 'var(--cmt-ink-soft)' }}
        >
          {message}
        </p>

        <div className="flex gap-2 justify-end">
          {showCancel && (
            <button className="cmt-btn-ghost" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button
            className="cmt-btn-primary"
            style={{ background: COLORS[type] }}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CmtModal;

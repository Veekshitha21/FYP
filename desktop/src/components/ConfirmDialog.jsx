import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-primary border border-border-color rounded-2xl p-6 shadow-2xl animate-scaleIn">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${isDanger ? 'bg-red-500/20 text-red-400' : 'bg-accent-primary/20 text-accent-secondary'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-txt-primary">{title}</h3>
            <p className="text-xs text-txt-muted mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border-color/60">
          <button
            onClick={onCancel}
            className="btn-secondary px-4 py-2 text-xs h-9 rounded-lg"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`${isDanger ? 'btn-danger' : 'btn-primary'} px-4 py-2 text-xs h-9 rounded-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

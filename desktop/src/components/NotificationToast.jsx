import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const NotificationToast = ({ toasts = [] }) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    danger: <AlertCircle className="w-4 h-4 text-red-400" />,
    info: <Info className="w-4 h-4 text-cyan-400" />
  };

  const borderColors = {
    success: 'border-emerald-500/40',
    warning: 'border-amber-500/40',
    danger: 'border-red-500/40',
    info: 'border-cyan-500/40'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2.5 p-3.5 rounded-xl bg-surface-primary/95 backdrop-blur-xl border ${
            borderColors[toast.type] || borderColors.info
          } shadow-card text-xs text-txt-primary animate-fadeIn`}
        >
          {icons[toast.type] || icons.info}
          <span className="flex-1 font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;

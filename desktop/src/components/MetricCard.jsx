import React from 'react';

export const MetricCard = ({ icon: Icon, title, value, unit, status = 'normal', helperText }) => {
  const statusStyles = {
    normal: 'text-txt-primary',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    accent: 'text-cyan-400'
  };

  return (
    <div className="bg-surface-primary border border-border-color rounded-2xl p-4 flex flex-col justify-between hover:border-accent-primary/30 transition-all">
      <div className="flex items-center justify-between text-txt-muted mb-2">
        <span className="text-xs uppercase font-semibold tracking-wider">{title}</span>
        {Icon && <Icon className="w-4 h-4 text-accent-primary" />}
      </div>
      <div className="flex items-baseline gap-1.5 my-1">
        <span className={`text-2xl font-bold font-mono tracking-tight ${statusStyles[status] || statusStyles.normal}`}>
          {value}
        </span>
        {unit && <span className="text-xs font-mono text-txt-muted">{unit}</span>}
      </div>
      {helperText && (
        <span className="text-[11px] text-txt-muted mt-1 truncate">{helperText}</span>
      )}
    </div>
  );
};

export default MetricCard;

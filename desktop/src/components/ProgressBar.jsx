import React from 'react';

export const ProgressBar = ({ progress = 0, label, showValue = true, color = 'cyan' }) => {
  const percentage = Math.min(100, Math.max(0, Math.round(progress * 100)));

  const colorGradients = {
    cyan: 'from-accent-primary to-accent-secondary',
    emerald: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
    purple: 'from-indigo-500 to-purple-400'
  };

  return (
    <div className="w-full space-y-1.5">
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs">
          {label && <span className="text-txt-secondary">{label}</span>}
          {showValue && <span className="font-mono font-medium text-txt-primary">{percentage}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 bg-surface-secondary rounded-full overflow-hidden border border-border-color/50">
        <div
          className={`h-full bg-gradient-to-r ${colorGradients[color] || colorGradients.cyan} rounded-full transition-all duration-150`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

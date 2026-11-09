import React from 'react';
import StatusBadge from './StatusBadge';
import ToggleSwitch from './ToggleSwitch';

export const StatusCard = ({
  icon: Icon,
  title,
  isActive,
  onToggle,
  primaryValue,
  secondaryValue,
  badgeText,
  badgeStatus = 'active',
  children
}) => {
  return (
    <div className={`p-5 rounded-2xl border transition-all duration-200 ${
      isActive 
        ? 'bg-surface-primary border-accent-primary/40 shadow-glow' 
        : 'bg-surface-primary/60 border-border-color opacity-75'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isActive ? 'bg-accent-primary/20 text-accent-secondary' : 'bg-surface-secondary text-txt-muted'
          }`}>
            {Icon && <Icon className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-semibold text-txt-primary text-base">{title}</h4>
            <div className="mt-0.5">
              <StatusBadge status={badgeStatus} text={badgeText || (isActive ? 'Active' : 'Disabled')} size="sm" />
            </div>
          </div>
        </div>

        {onToggle && (
          <ToggleSwitch checked={isActive} onChange={onToggle} label={`Toggle ${title}`} />
        )}
      </div>

      <div className="space-y-2 mt-4 pt-3 border-t border-border-color/60">
        {primaryValue && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-txt-muted">{primaryValue.label}</span>
            <span className="font-mono font-medium text-txt-primary">{primaryValue.value}</span>
          </div>
        )}
        {secondaryValue && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-txt-muted">{secondaryValue.label}</span>
            <span className="font-mono text-xs text-accent-secondary">{secondaryValue.value}</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default StatusCard;

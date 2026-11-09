import React from 'react';

export const SettingsCard = ({ title, description, icon: Icon, children }) => {
  return (
    <div className="bg-surface-primary border border-border-color rounded-2xl p-6 shadow-card space-y-5">
      <div className="flex items-start gap-3.5 pb-4 border-b border-border-color/60">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-surface-secondary text-accent-secondary border border-border-color/60">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-base text-txt-primary">{title}</h3>
          {description && <p className="text-xs text-txt-muted mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default SettingsCard;

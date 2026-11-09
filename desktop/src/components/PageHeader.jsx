import React from 'react';

export const PageHeader = ({ title, subtitle, badge, actionButton }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border-color/50">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold font-display text-txt-primary tracking-tight">{title}</h2>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-txt-secondary mt-1">{subtitle}</p>}
      </div>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};

export default PageHeader;

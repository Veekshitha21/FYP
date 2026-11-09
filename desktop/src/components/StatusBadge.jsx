import React from 'react';

export const StatusBadge = ({ status = 'active', text, size = 'md' }) => {
  const styles = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30',
    error: 'bg-red-500/15 text-red-400 border-red-500/30',
    processing: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 animate-pulse',
    calibrated: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };

  const dots = {
    active: 'bg-emerald-400',
    inactive: 'bg-slate-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    error: 'bg-red-400',
    processing: 'bg-cyan-400',
    calibrated: 'bg-blue-400',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const statusKey = status.toLowerCase();
  const currentStyle = styles[statusKey] || styles.inactive;
  const dotColor = dots[statusKey] || dots.inactive;
  const label = text || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClasses[size]} ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;

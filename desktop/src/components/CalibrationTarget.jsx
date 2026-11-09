import React from 'react';

export const CalibrationTarget = ({
  x = 0.5,
  y = 0.5,
  isActive = false,
  isCollected = false,
  pointNumber = 1
}) => {
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`
      }}
    >
      <div className="relative flex items-center justify-center">
        {/* Pulsating Outer Ring when active */}
        {isActive && (
          <div className="absolute w-16 h-16 rounded-full border-2 border-accent-secondary animate-ping opacity-75" />
        )}

        {/* Outer Ring */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
            isActive
              ? 'border-cyan-400 bg-cyan-500/20 shadow-glow scale-125'
              : isCollected
              ? 'border-emerald-500 bg-emerald-500/20'
              : 'border-slate-600 bg-surface-primary/60'
          }`}
        >
          {/* Inner Bullseye Core */}
          <div
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
              isActive
                ? 'bg-cyan-300 scale-110'
                : isCollected
                ? 'bg-emerald-400'
                : 'bg-slate-400'
            }`}
          />
        </div>

        {/* Target Index Number Tag */}
        <span
          className={`absolute -bottom-5 text-[10px] font-mono font-bold ${
            isActive ? 'text-cyan-400' : isCollected ? 'text-emerald-400' : 'text-txt-muted'
          }`}
        >
          #{pointNumber}
        </span>
      </div>
    </div>
  );
};

export default CalibrationTarget;

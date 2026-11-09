import React from 'react';

export const SliderControl = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  helperText
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <label className="text-txt-primary font-medium">{label}</label>
        <span className="font-mono text-xs font-semibold text-accent-secondary bg-surface-secondary px-2 py-0.5 rounded-md border border-border-color">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange && onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-surface-secondary rounded-lg appearance-none cursor-pointer accent-accent-secondary"
      />
      {helperText && <p className="text-[11px] text-txt-muted">{helperText}</p>}
    </div>
  );
};

export default SliderControl;

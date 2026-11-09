import React from 'react';

export const ToggleSwitch = ({ checked, onChange, disabled = false, label = '' }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer select-none">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.checked)}
        aria-label={label}
      />
      <div className={`w-11 h-6 rounded-full peer transition-colors duration-200 ease-in-out ${
        disabled 
          ? 'bg-surface-secondary opacity-50 cursor-not-allowed'
          : 'bg-surface-secondary peer-checked:bg-gradient-to-r peer-checked:from-accent-primary peer-checked:to-accent-secondary'
      }`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        } mt-0.5`} />
      </div>
    </label>
  );
};

export default ToggleSwitch;

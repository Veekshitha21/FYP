import React, { useState } from 'react';
import { Delete, CornerDownLeft, Space, RotateCcw, ArrowBigUp } from 'lucide-react';
import SuggestionPanel from './SuggestionPanel';

export const VirtualKeyboard = ({
  text = '',
  suggestions = [],
  slmInfo = {},
  onKeyPress,
  onSelectSuggestion,
  onClear
}) => {
  const [isShift, setIsShift] = useState(false);

  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.']
  ];

  const handleKeyClick = (key) => {
    if (key === 'SHIFT') {
      setIsShift(!isShift);
    } else {
      const char = isShift ? key.toUpperCase() : key;
      onKeyPress && onKeyPress(char);
    }
  };

  return (
    <div className="w-full bg-surface-primary border border-border-color rounded-2xl p-5 shadow-card space-y-4">
      {/* Typed Text Display Area */}
      <div className="relative w-full min-h-[90px] p-4 bg-bg-secondary rounded-xl border border-border-color font-mono text-base text-txt-primary focus-within:border-accent-primary transition-all">
        <div className="whitespace-pre-wrap break-words">{text || <span className="text-txt-muted select-none">Start typing using gaze dwell or direct clicks...</span>}</div>
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg bg-surface-primary hover:bg-surface-secondary text-txt-muted hover:text-red-400 transition-colors"
            title="Clear text"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggestion Bar */}
      <SuggestionPanel
        suggestions={suggestions}
        onSelectSuggestion={onSelectSuggestion}
        slmInfo={slmInfo}
      />

      {/* QWERTY Layout Grid */}
      <div className="space-y-2 select-none">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1.5 w-full">
            {row.map((key) => {
              const displayChar = isShift ? key.toUpperCase() : key;
              return (
                <button
                  key={key}
                  onClick={() => handleKeyClick(key)}
                  className="flex-1 max-w-[56px] h-12 rounded-xl bg-surface-secondary border border-border-color font-semibold text-sm text-txt-primary hover:bg-surface-hover hover:border-accent-primary hover:text-cyan-300 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                >
                  {displayChar}
                </button>
              );
            })}
          </div>
        ))}

        {/* Bottom Control Row */}
        <div className="flex justify-center gap-1.5 w-full pt-1">
          <button
            onClick={() => handleKeyClick('SHIFT')}
            className={`w-20 h-12 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1 transition-all ${
              isShift
                ? 'bg-accent-primary/20 border-accent-primary text-cyan-300'
                : 'bg-surface-secondary border-border-color text-txt-primary hover:bg-surface-hover'
            }`}
          >
            <ArrowBigUp className="w-4 h-4" />
            Shift
          </button>

          <button
            onClick={() => handleKeyClick('SPACE')}
            className="flex-1 max-w-[280px] h-12 rounded-xl bg-surface-secondary border border-border-color font-semibold text-xs text-txt-primary hover:bg-surface-hover hover:border-accent-primary flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Space className="w-4 h-4 text-txt-muted" />
            Space
          </button>

          <button
            onClick={() => handleKeyClick('BACKSPACE')}
            className="w-24 h-12 rounded-xl bg-surface-secondary border border-border-color font-semibold text-xs text-txt-primary hover:bg-surface-hover hover:border-accent-primary flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Delete className="w-4 h-4 text-amber-400" />
            Delete
          </button>

          <button
            onClick={() => handleKeyClick('ENTER')}
            className="w-24 h-12 rounded-xl bg-accent-primary/20 border border-accent-primary/50 font-semibold text-xs text-cyan-300 hover:bg-accent-primary/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <CornerDownLeft className="w-4 h-4" />
            Enter
          </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;

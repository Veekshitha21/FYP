import React from 'react';
import { Sparkles } from 'lucide-react';

export const SuggestionPanel = ({
  suggestions = [],
  onSelectSuggestion,
  slmInfo = {}
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-[11px] text-txt-muted px-1">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          AI Predictive Text Suggestions
        </span>
        <span className="font-mono text-cyan-400/80">
          {slmInfo.engine || 'Dictionary Fallback'} {slmInfo.latency_ms ? `(${slmInfo.latency_ms}ms)` : ''}
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {suggestions.length === 0 ? (
          <span className="text-xs text-txt-muted italic py-1.5 px-3">Type letters to see autocomplete suggestions...</span>
        ) : (
          suggestions.map((sugg, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSuggestion && onSelectSuggestion(sugg)}
              className="px-4 py-2 rounded-xl bg-surface-secondary border border-border-color text-xs font-medium text-txt-primary hover:border-accent-primary hover:bg-surface-hover hover:text-cyan-300 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm active:scale-95"
            >
              <span>{sugg}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default SuggestionPanel;

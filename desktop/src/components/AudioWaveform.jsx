import React from 'react';
import { Mic } from 'lucide-react';

export const AudioWaveform = ({ audioLevel = 0, isListening = true }) => {
  // Generate 24 animated bars simulating real-time audio energy
  const bars = Array.from({ length: 24 }).map((_, idx) => {
    // Dynamic height based on level + harmonic variations
    const variance = Math.sin(idx * 0.4 + Date.now() * 0.01) * 0.2;
    const heightPct = isListening ? Math.min(100, Math.max(12, (audioLevel + variance) * 100)) : 8;
    return heightPct;
  });

  return (
    <div className="bg-surface-primary border border-border-color rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase font-semibold text-txt-muted tracking-wider flex items-center gap-1.5">
          <Mic className={`w-4 h-4 ${isListening ? 'text-cyan-400' : 'text-txt-muted'}`} />
          Audio Input Level
        </span>
        <span className="font-mono text-xs text-accent-secondary">
          {(audioLevel * 100).toFixed(0)}% RMS
        </span>
      </div>

      <div className="h-14 flex items-end justify-between gap-1 px-2 py-1 bg-bg-secondary rounded-xl overflow-hidden border border-border-color/60">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-full rounded-full transition-all duration-75"
            style={{
              height: `${h}%`,
              background: audioLevel > 0.05
                ? 'linear-gradient(180deg, #06B6D4 0%, #3B82F6 100%)'
                : 'rgba(148, 163, 184, 0.2)'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AudioWaveform;

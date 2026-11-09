import React from 'react';
import { Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export const HeadPoseIndicator = ({ head }) => {
  const pitch = head?.pitch || 0;
  const yaw = head?.yaw || 0;
  const roll = head?.roll || 0;
  const direction = head?.direction || 'neutral';
  const scrollAction = head?.scroll_action;

  return (
    <div className="bg-surface-primary border border-border-color rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase font-semibold text-txt-muted tracking-wider flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-accent-primary" />
          Head Pose & Orientation
        </span>
        {scrollAction && (
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse flex items-center gap-1">
            {scrollAction === 'SCROLL_UP' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {scrollAction}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center py-2">
        <div className="bg-surface-secondary/60 rounded-xl p-2 border border-border-color/50">
          <div className="text-[11px] text-txt-muted">Pitch (Tilt)</div>
          <div className="font-mono text-base font-bold text-txt-primary mt-0.5">{pitch.toFixed(1)}°</div>
        </div>
        <div className="bg-surface-secondary/60 rounded-xl p-2 border border-border-color/50">
          <div className="text-[11px] text-txt-muted">Yaw (Turn)</div>
          <div className="font-mono text-base font-bold text-txt-primary mt-0.5">{yaw.toFixed(1)}°</div>
        </div>
        <div className="bg-surface-secondary/60 rounded-xl p-2 border border-border-color/50">
          <div className="text-[11px] text-txt-muted">Roll (Lean)</div>
          <div className="font-mono text-base font-bold text-txt-primary mt-0.5">{roll.toFixed(1)}°</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-txt-muted pt-2 border-t border-border-color/40">
        <span>Current Direction:</span>
        <span className="font-semibold text-accent-secondary uppercase font-mono">{direction}</span>
      </div>
    </div>
  );
};

export default HeadPoseIndicator;

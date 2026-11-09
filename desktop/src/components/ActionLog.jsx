import React from 'react';
import { Activity, MousePointer, Volume2, Move, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

export const ActionLog = ({ actions = [], maxHeight = '320px' }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'LEFT_CLICK':
      case 'RIGHT_CLICK':
      case 'DOUBLE_CLICK':
        return <MousePointer className="w-4 h-4 text-cyan-400" />;
      case 'SCROLL':
        return <Move className="w-4 h-4 text-blue-400" />;
      case 'VOICE_COMMAND':
        return <Volume2 className="w-4 h-4 text-purple-400" />;
      case 'GESTURE':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'EMERGENCY_STOP':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-txt-muted" />;
    }
  };

  return (
    <div className="bg-surface-primary border border-border-color rounded-2xl p-4 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-border-color/60 mb-2">
        <h4 className="text-xs uppercase font-semibold text-txt-muted tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-accent-primary" />
          Real-Time Action Log
        </h4>
        <span className="text-xs font-mono text-txt-muted">{actions.length} events</span>
      </div>

      <div className="overflow-y-auto space-y-2 pr-1" style={{ maxHeight }}>
        {actions.length === 0 ? (
          <div className="text-center py-8 text-txt-muted text-xs">
            No system actions dispatched yet. Start hands-free tracking to record interactions.
          </div>
        ) : (
          actions.map((act, idx) => (
            <div
              key={act.id || idx}
              className="flex items-start gap-2.5 p-2 rounded-xl bg-surface-secondary/40 border border-border-color/40 text-xs hover:border-accent-primary/20 transition-all"
            >
              <div className="mt-0.5 p-1 rounded-lg bg-surface-primary border border-border-color/40">
                {getIcon(act.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-txt-primary truncate">{act.type}</span>
                  <span className="text-[11px] font-mono text-txt-muted">{act.timestamp}</span>
                </div>
                <p className="text-txt-secondary text-[11px] truncate mt-0.5">{act.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActionLog;

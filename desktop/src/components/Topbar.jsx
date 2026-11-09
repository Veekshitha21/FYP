import React from 'react';
import { Play, Pause, Wifi, WifiOff, Bell, ShieldCheck, User } from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';
import StatusBadge from './StatusBadge';

export const Topbar = () => {
  const {
    isConnected,
    systemStatus,
    startTracking,
    pauseTracking,
    currentPage
  } = useMotionEase();

  const pageTitles = {
    landing: 'Welcome to MotionEase',
    setup: 'Hardware & Device Configuration',
    dashboard: 'System Dashboard & Telemetry',
    studio: 'Live Multimodal Control Studio',
    calibration: '9-Point Eye Gaze Calibration',
    gestures: 'Facial Gesture Recognition',
    voice: 'Offline Speech & Command Parser',
    keyboard: 'Assistive Virtual Keyboard',
    slm: 'On-Device Small Language Model',
    settings: 'Accessibility & Signal Filtering',
    tutorial: 'Interactive User Guide & Documentation'
  };

  return (
    <header className="h-[72px] px-8 bg-bg-primary/95 backdrop-blur-md border-b border-border-color flex items-center justify-between select-none z-20">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-txt-primary font-display">
          {pageTitles[currentPage] || 'MotionEase'}
        </h2>
        <span className="text-xs text-txt-muted flex items-center gap-2">
          <span>Batch 61 • JSS Science and Technology University</span>
        </span>
      </div>

      {/* Real-time Status and Controls */}
      <div className="flex items-center gap-4">
        {/* Latency meter */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-primary border border-border-color text-xs">
          <span className="text-txt-muted">Latency:</span>
          <span className="font-mono font-bold text-accent-secondary">
            {systemStatus.latency_ms.toFixed(1)} ms
          </span>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-primary border border-border-color text-xs">
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Local Engine</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 font-medium">Reconnecting</span>
            </>
          )}
        </div>

        {/* Tracking quick toggle */}
        {systemStatus.is_tracking ? (
          <button
            onClick={pauseTracking}
            className="btn-secondary h-10 px-3.5 text-xs rounded-xl flex items-center gap-2 hover:border-amber-400/50"
          >
            <Pause className="w-3.5 h-3.5 text-amber-400" />
            <span>Pause Control</span>
          </button>
        ) : (
          <button
            onClick={startTracking}
            className="btn-primary h-10 px-3.5 text-xs rounded-xl flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 text-white" />
            <span>Start Control</span>
          </button>
        )}

        {/* Local session profile badge */}
        <div className="w-9 h-9 rounded-xl bg-surface-secondary border border-border-color flex items-center justify-center text-accent-secondary" title="Local Offline Session">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
      </div>
    </header>
  );
};

export default Topbar;

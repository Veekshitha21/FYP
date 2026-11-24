import React, { useState } from 'react';
import {
  Play,
  Pause,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Eye,
  Sliders,
  Compass,
  Smile,
  Mic,
  Activity,
  Layers,
  MousePointer,
  Keyboard,
  Zap,
  Gauge,
  Hand,
  CheckCircle2,
  Crosshair,
  ArrowUpDown,
  ArrowLeftRight,
  HelpCircle
} from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';
import WebcamPreview from '../components/WebcamPreview';
import HeadPoseIndicator from '../components/HeadPoseIndicator';
import ActionLog from '../components/ActionLog';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

export const ControlStudioPage = () => {
  const {
    telemetry,
    systemStatus,
    modalities,
    actionLog,
    settings,
    updateSettings,
    startTracking,
    pauseTracking,
    triggerEmergencyStop,
    resumeEmergencyStop,
    setCurrentPage,
    calibrateNeutralHead,
    recenterGaze,
    setTrackingMode
  } = useMotionEase();

  const [showOverlay, setShowOverlay] = useState(true);

  // Determine active input source for friendly user feedback
  const activeInputSource = telemetry.hand?.detected
    ? '🖐️ Hand Tracking (Active Pointer)'
    : telemetry.face_detected
    ? '👤 Head & Gaze (Active Pointer)'
    : '🔍 Searching for User Face / Hand';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Live Control Studio"
        subtitle="High-fidelity multimodal telemetry, real-time hand & face tracking overlay, and instant directional tuning."
        badge={
          <StatusBadge
            status={telemetry.hand?.detected || telemetry.face_detected ? 'active' : 'warning'}
            text={activeInputSource}
          />
        }
        actionButton={
          <div className="flex items-center gap-2">
            {systemStatus.emergency_stop ? (
              <button
                onClick={resumeEmergencyStop}
                className="btn-primary h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5"
              >
                <span>Clear Lock (F8)</span>
              </button>
            ) : (
              <button
                onClick={triggerEmergencyStop}
                className="btn-danger h-9 px-4 text-xs flex items-center gap-1.5"
                title="Stop all computer control (F8 hotkey)"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Emergency Stop</span>
                <kbd className="px-1 py-0.2 rounded bg-red-900/60 font-mono text-[10px]">F8</kbd>
              </button>
            )}

            {systemStatus.is_tracking ? (
              <button
                onClick={pauseTracking}
                className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5 border-amber-400/40 text-amber-300 hover:border-amber-400"
                title="Pause control (ESC hotkey)"
              >
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Pause</span>
                <kbd className="px-1 py-0.2 rounded bg-surface-secondary font-mono text-[10px]">ESC</kbd>
              </button>
            ) : (
              <button
                onClick={startTracking}
                className="btn-primary h-9 px-4 text-xs flex items-center gap-1.5"
                title="Resume control (ESC hotkey)"
              >
                <Play className="w-3.5 h-3.5 text-white" />
                <span>Resume Tracking</span>
                <kbd className="px-1 py-0.2 rounded bg-blue-700 font-mono text-[10px]">ESC</kbd>
              </button>
            )}
          </div>
        }
      />

      {/* Mode Selector Strip */}
      <div className="card-base p-3 bg-surface-primary border-border-color flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-txt-muted uppercase tracking-wider">
            Tracking Mode:
          </span>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'auto', label: '✨ Hybrid (Hand + Face)', desc: 'Auto-switches to hand when raised' },
              { id: 'hand', label: '🖐️ Hand Only', desc: 'Control cursor exclusively by moving hand' },
              { id: 'face', label: '👤 Head & Eyes Only', desc: 'Hands-free control via head movement & gaze' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setTrackingMode(m.id)}
                title={m.desc}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  (settings.tracking_mode || 'auto') === m.id
                    ? 'bg-accent-primary text-white shadow-glow'
                    : 'bg-surface-secondary text-txt-muted hover:text-txt-primary border border-border-color'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center Baseline Button */}
        <button
          onClick={recenterGaze}
          className="btn-secondary h-8 px-3 rounded-xl text-xs flex items-center gap-1.5 hover:border-cyan-400 text-cyan-300"
          title="Recenter cursor and head baseline to wherever you are currently positioned"
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>Center Cursor Baseline</span>
        </button>
      </div>

      {/* Safety & User Control Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-surface-primary to-surface-secondary border border-accent-primary/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-cyan-400">
            <MousePointer className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-txt-primary">Smart Touch-to-Yield Active:</span>{' '}
            <span className="text-txt-muted">
              Touching your laptop trackpad or physical mouse immediately yields control to you for 2s.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-txt-muted font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border-color text-cyan-400 font-bold">ESC</kbd>
            <span>Toggle Pause</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border-color text-red-400 font-bold">F8</kbd>
            <span>Stop All</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Webcam Stream with Real-Time Canvas Overlay (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <WebcamPreview
            telemetry={telemetry}
            showOverlay={showOverlay}
            onToggleOverlay={() => setShowOverlay(!showOverlay)}
          />

          {/* Quick Studio Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-primary border border-border-color text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={calibrateNeutralHead}
                className="btn-secondary h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 hover:border-cyan-400"
                title="Pause tracking and save the current head position as neutral"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Recenter Head Baseline</span>
              </button>

              <button
                onClick={() => setCurrentPage('calibration')}
                className="btn-secondary h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 hover:border-accent-primary"
              >
                <Eye className="w-3.5 h-3.5 text-accent-primary" />
                <span>9-Point Eye Calibration</span>
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-txt-muted">
              <span>Loop: {systemStatus.latency_ms.toFixed(0)}ms</span>
              <span>•</span>
              <span className="text-emerald-400">{systemStatus.fps.toFixed(0)} FPS</span>
            </div>
          </div>

          {/* How To Use Quick Guide Card */}
          <div className="card-base p-4 bg-surface-primary border border-border-color space-y-3">
            <h4 className="text-xs uppercase font-bold text-txt-muted tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              How Input Gestures Work
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-secondary border border-border-color/60 space-y-1">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  🖐️ Hand Tracking
                </span>
                <p className="text-[11px] text-txt-muted leading-relaxed">
                  Move your hand up, down, left, or right. The cursor follows your index fingertip.
                </p>
                <span className="inline-block text-[10px] text-emerald-300 font-mono bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Pinch thumb+index = Click
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-secondary border border-border-color/60 space-y-1">
                <span className="font-semibold text-cyan-400 flex items-center gap-1">
                  👤 Head Movement
                </span>
                <p className="text-[11px] text-txt-muted leading-relaxed">
                  Turn or tilt your head up, down, left, or right. The cursor smoothly follows head posture.
                </p>
                <span className="inline-block text-[10px] text-cyan-300 font-mono bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  Tilt ~20° = Scroll
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-secondary border border-border-color/60 space-y-1">
                <span className="font-semibold text-amber-400 flex items-center gap-1">
                  👁️ Eye Closures
                </span>
                <p className="text-[11px] text-txt-muted leading-relaxed">
                  Close eyes for ~300ms and open to click! Left wink clicks, right wink opens menu.
                </p>
                <span className="inline-block text-[10px] text-amber-300 font-mono bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Smile = Double Click
                </span>
              </div>
            </div>
          </div>

          {/* Head Pose Indicator Widget */}
          <HeadPoseIndicator head={telemetry.head} />
        </div>

        {/* Right Column: Directional Inversion, Jitter Tuning & Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Real-time Cursor, Speed, Direction & Jitter Control Card */}
          <div className="bg-surface-primary border border-accent-primary/30 rounded-2xl p-4 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-bold text-accent-secondary tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-accent-secondary" />
                Direction, Speed & Jitter Controls
              </h4>
              <button
                onClick={() => setCurrentPage('settings')}
                className="text-[11px] text-txt-muted hover:text-cyan-400 underline"
              >
                All Settings
              </button>
            </div>

            {/* Horizontal Direction Invert Toggle */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-txt-muted block">
                Horizontal Direction (Left ↔ Right)
              </label>
              <button
                type="button"
                onClick={() => updateSettings({ invert_x: !settings.invert_x })}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  settings.invert_x
                    ? 'border-cyan-500/60 bg-cyan-950/30 text-cyan-300'
                    : 'border-amber-500/60 bg-amber-950/30 text-amber-300'
                }`}
                title="Click to flip horizontal cursor direction"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>
                    {settings.invert_x
                      ? 'Looking / Moving Right → Moves Right'
                      : 'Looking / Moving Right → Moves Left'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-primary border border-border-color font-mono uppercase">
                  Flip X
                </span>
              </button>
            </div>

            {/* Vertical Direction Invert Toggle */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-txt-muted block">
                Vertical Direction (Up ↕ Down)
              </label>
              <button
                type="button"
                onClick={() => updateSettings({ invert_y: !settings.invert_y })}
                className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  settings.invert_y
                    ? 'border-amber-500/60 bg-amber-950/30 text-amber-300'
                    : 'border-cyan-500/60 bg-cyan-950/30 text-cyan-300'
                }`}
                title="Click to flip vertical cursor direction"
              >
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span>
                    {settings.invert_y
                      ? 'Moving Up → Moves Down (Inverted)'
                      : 'Moving Up → Moves Up (Natural)'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-primary border border-border-color font-mono uppercase">
                  Flip Y
                </span>
              </button>
            </div>

            {/* Deliberate Blink to Click Toggle */}
            <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-color flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-txt-primary block">
                  Blink / Close Eyes to Click
                </span>
                <span className="text-[10px] text-txt-muted">
                  Hold eyes closed ~300ms & reopen to trigger Left Click
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ blink_click: !(settings.blink_click !== false) })}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  settings.blink_click !== false
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-primary text-txt-muted border border-border-color'
                }`}
              >
                {settings.blink_click !== false ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Speed / Sensitivity Controls */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-txt-muted font-medium">Cursor Speed (Gain):</span>
                <span className="font-mono font-bold text-accent-secondary">{settings.cursor_speed.toFixed(1)}x</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { label: 'Slow (0.6x)', val: 0.6 },
                  { label: 'Normal (1.0x)', val: 1.0 },
                  { label: 'Fast (1.5x)', val: 1.5 }
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => updateSettings({ cursor_speed: btn.val })}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium transition-all ${
                      Math.abs(settings.cursor_speed - btn.val) < 0.15
                        ? 'border-accent-primary bg-accent-primary/20 text-cyan-300 font-bold'
                        : 'border-border-color bg-surface-secondary text-txt-muted hover:border-border-color/80'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Jitter Fixation Deadband */}
            <div className="space-y-1.5 pt-1 border-t border-border-color/50">
              <div className="flex justify-between items-center text-xs">
                <span className="text-txt-muted font-medium">Jitter Fixation Lock:</span>
                <span className="font-mono font-bold text-emerald-400">{settings.deadband_px} px</span>
              </div>
              <input
                type="range"
                min={2}
                max={20}
                step={1}
                value={settings.deadband_px}
                onChange={(e) => updateSettings({ deadband_px: Number(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 rounded-lg bg-surface-secondary"
              />
              <div className="flex justify-between text-[10px] text-txt-muted font-mono">
                <span>Fastest Response (2px)</span>
                <span>Zero Drift / Rock Solid (20px)</span>
              </div>
            </div>
          </div>

          {/* Tracking Telemetry Inspection Card */}
          <div className="bg-surface-primary border border-border-color rounded-2xl p-4 space-y-3">
            <h4 className="text-xs uppercase font-bold text-txt-muted tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-accent-primary" />
              Live Telemetry & Gesture State
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-color/50">
                <span className="text-txt-muted block text-[11px]">Active Input Source</span>
                <span className="font-semibold text-emerald-400 mt-1 block truncate">
                  {telemetry.hand?.detected ? '🖐️ Hand Detected' : telemetry.face_detected ? '👤 Face / Head' : 'Not Detected'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-color/50">
                <span className="text-txt-muted block text-[11px]">Filtered Pointer</span>
                <span className="font-mono font-bold text-txt-primary mt-1 block">
                  {(telemetry.gaze.x * 100).toFixed(1)}%, {(telemetry.gaze.y * 100).toFixed(1)}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-color/50">
                <span className="text-txt-muted block text-[11px]">Left / Right Eye EAR</span>
                <span className="font-mono font-bold text-txt-primary mt-1 block">
                  {telemetry.gesture.left_ear.toFixed(2)} / {telemetry.gesture.right_ear.toFixed(2)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-color/50">
                <span className="text-txt-muted block text-[11px]">Detected Gesture</span>
                <span className="font-semibold text-emerald-400 mt-1 block truncate">
                  {telemetry.gesture.detected || telemetry.hand?.gesture || (telemetry.gesture.is_blink ? 'Closing Eyes...' : 'Neutral')}
                </span>
              </div>
            </div>

            {/* Multimodal Modality Indicators */}
            <div className="pt-2 border-t border-border-color/50 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-txt-secondary flex items-center gap-1.5">
                  <Hand className="w-3.5 h-3.5 text-emerald-400" /> Hand Gesture Tracking
                </span>
                <StatusBadge status={telemetry.hand?.detected ? 'active' : 'inactive'} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-txt-secondary flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-accent-primary" /> Head & Gaze Pointer Control
                </span>
                <StatusBadge status={telemetry.face_detected ? 'active' : 'inactive'} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-txt-secondary flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-cyan-400" /> Facial Gesture Actions
                </span>
                <StatusBadge status={modalities.gesture ? 'active' : 'inactive'} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-txt-secondary flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-purple-400" /> Voice Commands & Launcher
                </span>
                <StatusBadge status={modalities.voice ? 'active' : 'inactive'} size="sm" />
              </div>
            </div>
          </div>

          {/* Real-Time Action Log */}
          <ActionLog actions={actionLog} maxHeight="220px" />
        </div>
      </div>
    </div>
  );
};

export default ControlStudioPage;

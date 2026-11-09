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
  Layers
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
    startTracking,
    pauseTracking,
    triggerEmergencyStop,
    resumeEmergencyStop,
    setCurrentPage,
    calibrateNeutralHead
  } = useMotionEase();

  const [showOverlay, setShowOverlay] = useState(true);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Live Control Studio"
        subtitle="High-fidelity visual telemetry, real-time facial mesh overlay, and action stream."
        badge={
          <StatusBadge
            status={telemetry.face_detected ? 'active' : 'warning'}
            text={telemetry.face_detected ? 'Face Tracking Active' : 'Locating User'}
          />
        }
        actionButton={
          <div className="flex items-center gap-2">
            {systemStatus.emergency_stop ? (
              <button
                onClick={resumeEmergencyStop}
                className="btn-primary h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-500"
              >
                Clear Emergency Lock
              </button>
            ) : (
              <button
                onClick={triggerEmergencyStop}
                className="btn-danger h-9 px-4 text-xs flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Emergency Stop</span>
              </button>
            )}

            {systemStatus.is_tracking ? (
              <button
                onClick={pauseTracking}
                className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={startTracking}
                className="btn-primary h-9 px-4 text-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-white" />
                <span>Resume Tracking</span>
              </button>
            )}
          </div>
        }
      />

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
                title="Recalibrate neutral center head position"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zero Head Center</span>
              </button>

              <button
                onClick={() => setCurrentPage('calibration')}
                className="btn-secondary h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 hover:border-accent-primary"
              >
                <Eye className="w-3.5 h-3.5 text-accent-primary" />
                <span>Recalibrate Gaze</span>
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-txt-muted">
              <span>Loop: {systemStatus.latency_ms.toFixed(0)}ms</span>
              <span>•</span>
              <span className="text-emerald-400">{systemStatus.fps.toFixed(0)} FPS</span>
            </div>
          </div>

          {/* Head Pose Indicator Widget */}
          <HeadPoseIndicator head={telemetry.head} />
        </div>

        {/* Right Column: Telemetry Breakdown & Action Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Tracking Telemetry Inspection Card */}
          <div className="bg-surface-primary border border-border-color rounded-2xl p-4 space-y-3">
            <h4 className="text-xs uppercase font-bold text-txt-muted tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-accent-primary" />
              Tracking Telemetry Vectors
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-color/50">
                <span className="text-txt-muted block text-[11px]">Filtered Gaze (X, Y)</span>
                <span className="font-mono font-bold text-txt-primary mt-1 block">
                  {(telemetry.gaze.x * 100).toFixed(1)}%, {(telemetry.gaze.y * 100).toFixed(1)}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-color/50">
                <span className="text-txt-muted block text-[11px]">Raw Iris Gaze (X, Y)</span>
                <span className="font-mono text-cyan-400 mt-1 block">
                  {(telemetry.gaze.raw_x * 100).toFixed(1)}%, {(telemetry.gaze.raw_y * 100).toFixed(1)}%
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
                  {telemetry.gesture.detected || 'None (Neutral)'}
                </span>
              </div>
            </div>

            {/* Multimodal Modality Indicators */}
            <div className="pt-2 border-t border-border-color/50 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-txt-secondary flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-accent-primary" /> Gaze Pointer Control
                </span>
                <StatusBadge status={modalities.gaze ? 'active' : 'inactive'} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-txt-secondary flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-accent-secondary" /> Head Tilt Viewport Scrolling
                </span>
                <StatusBadge status={modalities.head ? 'active' : 'inactive'} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-txt-secondary flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-emerald-400" /> Facial Gesture Actions
                </span>
                <StatusBadge status={modalities.gesture ? 'active' : 'inactive'} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-txt-secondary flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" /> Voice Commands & Launcher
                </span>
                <StatusBadge status={modalities.voice ? 'active' : 'inactive'} size="sm" />
              </div>
            </div>
          </div>

          {/* Real-Time Action Log */}
          <ActionLog actions={actionLog} maxHeight="280px" />
        </div>
      </div>
    </div>
  );
};

export default ControlStudioPage;

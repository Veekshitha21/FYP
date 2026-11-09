import React from 'react';
import {
  Eye,
  Compass,
  Smile,
  Mic,
  Activity,
  Cpu,
  Layers,
  MousePointer,
  Play,
  Pause,
  Sliders,
  Keyboard,
  ArrowUpRight
} from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';
import StatusCard from '../components/StatusCard';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

export const DashboardPage = () => {
  const {
    telemetry,
    systemStatus,
    modalities,
    toggleModality,
    startTracking,
    pauseTracking,
    stopTracking,
    setCurrentPage
  } = useMotionEase();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="card-base p-6 bg-gradient-to-r from-surface-primary via-surface-primary to-bg-secondary border-border-color flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-accent-secondary font-semibold">
            Assistive Multimodal Hub
          </span>
          <h2 className="text-2xl font-bold font-display text-txt-primary mt-1">
            Welcome to MotionEase
          </h2>
          <p className="text-xs text-txt-secondary mt-1">
            Your computer. Your control. No physical interaction required.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {systemStatus.is_tracking ? (
            <button
              onClick={pauseTracking}
              className="btn-secondary h-10 px-4 text-xs flex items-center gap-2 hover:border-amber-400"
            >
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>Pause Control</span>
            </button>
          ) : (
            <button
              onClick={startTracking}
              className="btn-primary h-10 px-5 text-xs flex items-center gap-2 shadow-glow"
            >
              <Play className="w-3.5 h-3.5 text-white" />
              <span>Start Control</span>
            </button>
          )}

          <button
            onClick={() => setCurrentPage('calibration')}
            className="btn-secondary h-10 px-3.5 text-xs flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Calibration</span>
          </button>

          <button
            onClick={() => setCurrentPage('keyboard')}
            className="btn-secondary h-10 px-3.5 text-xs flex items-center gap-1.5"
          >
            <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Virtual Keyboard</span>
          </button>
        </div>
      </div>

      {/* Four Parallel Modality Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs uppercase font-bold text-txt-muted tracking-wider">
            Active Input Modalities (Parallel Feature Fusion)
          </h3>
          <span className="text-xs text-txt-muted">Continuous Multimodal Processing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Eye Gaze Tracking */}
          <StatusCard
            icon={Eye}
            title="Eye Gaze Tracking"
            isActive={modalities.gaze}
            onToggle={(enabled) => toggleModality('gaze', enabled)}
            badgeStatus={telemetry.face_detected && modalities.gaze ? 'active' : 'inactive'}
            badgeText={telemetry.gaze.is_calibrated ? '9-Pt Calibrated' : 'Heuristic'}
            primaryValue={{
              label: 'Screen Coord',
              value: `X: ${(telemetry.gaze.x * 100).toFixed(0)}%, Y: ${(telemetry.gaze.y * 100).toFixed(0)}%`
            }}
            secondaryValue={{
              label: 'Confidence',
              value: `${((telemetry.gaze.confidence || 0) * 100).toFixed(0)}%`
            }}
          />

          {/* Card 2: Head Gesture Control */}
          <StatusCard
            icon={Compass}
            title="Head Pose Scroll"
            isActive={modalities.head}
            onToggle={(enabled) => toggleModality('head', enabled)}
            badgeStatus={modalities.head ? 'active' : 'inactive'}
            badgeText={telemetry.head.scroll_action || telemetry.head.direction}
            primaryValue={{
              label: 'Head Direction',
              value: telemetry.head.direction.toUpperCase()
            }}
            secondaryValue={{
              label: 'Pitch / Yaw',
              value: `${telemetry.head.pitch.toFixed(1)}° / ${telemetry.head.yaw.toFixed(1)}°`
            }}
          />

          {/* Card 3: Facial Gesture Recognition */}
          <StatusCard
            icon={Smile}
            title="Facial Gestures"
            isActive={modalities.gesture}
            onToggle={(enabled) => toggleModality('gesture', enabled)}
            badgeStatus={modalities.gesture ? 'active' : 'inactive'}
            badgeText={telemetry.gesture.detected || 'Monitoring'}
            primaryValue={{
              label: 'Last Gesture',
              value: telemetry.gesture.detected || 'None'
            }}
            secondaryValue={{
              label: 'Left/Right EAR',
              value: `${telemetry.gesture.left_ear.toFixed(2)} / ${telemetry.gesture.right_ear.toFixed(2)}`
            }}
          />

          {/* Card 4: Voice Recognition */}
          <StatusCard
            icon={Mic}
            title="Voice Commands"
            isActive={modalities.voice}
            onToggle={(enabled) => toggleModality('voice', enabled)}
            badgeStatus={modalities.voice ? 'active' : 'inactive'}
            badgeText={systemStatus.microphone === 'connected' ? 'Offline ASR' : 'Disconnected'}
            primaryValue={{
              label: 'Audio Input Level',
              value: `${((telemetry.audio_level || 0) * 100).toFixed(0)}% RMS`
            }}
            secondaryValue={{
              label: 'Safe Allowlist',
              value: 'Active'
            }}
          />
        </div>
      </div>

      {/* System Statistics Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs uppercase font-bold text-txt-muted tracking-wider">
            Live Measured System Telemetry
          </h3>
          <span className="text-xs text-txt-muted">Real-Time Measurements</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            title="Camera FPS"
            value={systemStatus.fps.toFixed(1)}
            unit="FPS"
            icon={Activity}
            status={systemStatus.fps >= 25 ? 'success' : 'warning'}
            helperText="Webcam capture speed"
          />

          <MetricCard
            title="Latency"
            value={systemStatus.latency_ms.toFixed(1)}
            unit="ms"
            icon={Activity}
            status={systemStatus.latency_ms < 40 ? 'success' : 'warning'}
            helperText="End-to-end frame loop"
          />

          <MetricCard
            title="CPU Usage"
            value={systemStatus.cpu_usage.toFixed(1)}
            unit="%"
            icon={Cpu}
            status="normal"
            helperText="Host processor load"
          />

          <MetricCard
            title="Memory"
            value={systemStatus.memory_usage_mb.toFixed(0)}
            unit="MB"
            icon={Layers}
            status="normal"
            helperText="Engine RAM footprint"
          />

          <MetricCard
            title="Actions Run"
            value={systemStatus.actions_executed}
            unit="events"
            icon={MousePointer}
            status="accent"
            helperText="OS dispatches executed"
          />

          <MetricCard
            title="Predictive AI"
            value={systemStatus.slm?.is_loaded ? 'SLM GGUF' : 'Dictionary'}
            unit=""
            icon={Eye}
            status={systemStatus.slm?.is_loaded ? 'success' : 'normal'}
            helperText="Autocomplete text engine"
          />
        </div>
      </div>

      {/* Bottom Shortcuts / Status Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div
          onClick={() => setCurrentPage('studio')}
          className="card-base p-4 cursor-pointer hover:border-accent-primary/50 group transition-all"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-txt-primary group-hover:text-cyan-300">Live Control Studio</h4>
            <ArrowUpRight className="w-4 h-4 text-txt-muted group-hover:text-cyan-300" />
          </div>
          <p className="text-[11px] text-txt-muted mt-1">View real-time facial wireframe overlay and telemetry vectors.</p>
        </div>

        <div
          onClick={() => setCurrentPage('gestures')}
          className="card-base p-4 cursor-pointer hover:border-accent-primary/50 group transition-all"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-txt-primary group-hover:text-cyan-300">Gesture Thresholds</h4>
            <ArrowUpRight className="w-4 h-4 text-txt-muted group-hover:text-cyan-300" />
          </div>
          <p className="text-[11px] text-txt-muted mt-1">Adjust wink closure frame duration and smile sensitivities.</p>
        </div>

        <div
          onClick={() => setCurrentPage('settings')}
          className="card-base p-4 cursor-pointer hover:border-accent-primary/50 group transition-all"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-txt-primary group-hover:text-cyan-300">One-Euro Filter Tuning</h4>
            <ArrowUpRight className="w-4 h-4 text-txt-muted group-hover:text-cyan-300" />
          </div>
          <p className="text-[11px] text-txt-muted mt-1">Fine-tune cursor smoothing cutoff frequencies and dynamic dwell.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

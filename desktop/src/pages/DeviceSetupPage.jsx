import React, { useState } from 'react';
import { Camera, Mic, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Volume2 } from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';
import WebcamPreview from '../components/WebcamPreview';
import AudioWaveform from '../components/AudioWaveform';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

export const DeviceSetupPage = () => {
  const { devices, telemetry, systemStatus, setCurrentPage, addToast } = useMotionEase();
  const [selectedCam, setSelectedCam] = useState(0);
  const [selectedMic, setSelectedMic] = useState(0);
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  const isCamConnected = systemStatus.camera === 'connected';
  const isMicConnected = systemStatus.microphone === 'connected';

  const handleTestAudio = () => {
    setIsTestingAudio(true);
    addToast('Speak into your microphone to verify audio signal level', 'info');
    setTimeout(() => setIsTestingAudio(false), 5000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Hardware & Device Setup"
        subtitle="Configure and test your webcam and microphone for ultra-low latency multimodal tracking."
        badge={<StatusBadge status={isCamConnected && isMicConnected ? 'active' : 'warning'} text={isCamConnected && isMicConnected ? 'Hardware Ready' : 'Setup Required'} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Webcam Section */}
        <div className="card-base p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-color/60">
            <div className="flex items-center gap-2.5">
              <Camera className="w-5 h-5 text-accent-secondary" />
              <h3 className="font-semibold text-base text-txt-primary">Webcam Input</h3>
            </div>
            <StatusBadge status={isCamConnected ? 'active' : 'inactive'} text={isCamConnected ? 'Connected' : 'Offline'} size="sm" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-txt-secondary font-medium">Select Camera Device</label>
            <select
              value={selectedCam}
              onChange={(e) => setSelectedCam(parseInt(e.target.value))}
              className="w-full bg-surface-secondary border border-border-color rounded-xl px-3 py-2.5 text-xs text-txt-primary focus:border-accent-primary outline-none"
            >
              {devices.cameras.map((cam) => (
                <option key={cam.index} value={cam.index}>
                  {cam.name}
                </option>
              ))}
            </select>
          </div>

          {/* Live Video Preview Box */}
          <div className="pt-2">
            <WebcamPreview telemetry={telemetry} cameraIndex={selectedCam} showOverlay={true} />
          </div>

          <div className="text-[11px] text-txt-muted flex items-center justify-between pt-2">
            <span>Optimal distance: 50–70 cm from camera</span>
            <span className="font-mono text-cyan-400">Target: 30+ FPS</span>
          </div>
        </div>

        {/* Microphone Section */}
        <div className="card-base p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-color/60">
              <div className="flex items-center gap-2.5">
                <Mic className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-base text-txt-primary">Microphone Input</h3>
              </div>
              <StatusBadge status={isMicConnected ? 'active' : 'inactive'} text={isMicConnected ? 'Connected' : 'Offline'} size="sm" />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-txt-secondary font-medium">Select Microphone Device</label>
              <select
                value={selectedMic}
                onChange={(e) => setSelectedMic(parseInt(e.target.value))}
                className="w-full bg-surface-secondary border border-border-color rounded-xl px-3 py-2.5 text-xs text-txt-primary focus:border-accent-primary outline-none"
              >
                {devices.microphones.map((mic) => (
                  <option key={mic.index} value={mic.index}>
                    {mic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Audio Level Meter */}
            <div className="pt-2">
              <AudioWaveform audioLevel={telemetry.audio_level} isListening={isMicConnected} />
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary/50 border border-border-color/50 text-xs text-txt-secondary space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-txt-primary">
                <Volume2 className="w-4 h-4 text-accent-secondary" />
                <span>Microphone Diagnostics</span>
              </div>
              <p className="text-[11px] text-txt-muted">
                Ensure low ambient room noise. The offline voice parser recognizes system macros and direct typing dictation.
              </p>
              <button
                onClick={handleTestAudio}
                className="btn-secondary text-xs h-8 px-3 rounded-lg mt-2"
              >
                {isTestingAudio ? 'Listening...' : 'Test Microphone'}
              </button>
            </div>
          </div>

          {/* Privacy & Permissions Card */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="leading-relaxed">
              <strong className="block text-txt-primary">Camera & Microphone Access Granted</strong>
              Raw video and audio are processed exclusively on this computer. No streams are ever uploaded or transmitted externally.
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border-color/60">
        <button
          onClick={() => setCurrentPage('landing')}
          className="btn-secondary text-xs h-10 px-4"
        >
          Back to Welcome
        </button>

        <button
          onClick={() => setCurrentPage('dashboard')}
          className="btn-primary text-xs h-10 px-6 shadow-glow"
        >
          <span>Continue to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DeviceSetupPage;

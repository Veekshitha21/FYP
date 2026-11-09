import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, RefreshCw, Eye, Sparkles } from 'lucide-react';
import FaceLandmarkOverlay from './FaceLandmarkOverlay';
import StatusBadge from './StatusBadge';

export const WebcamPreview = ({
  telemetry,
  showOverlay = true,
  onToggleOverlay,
  cameraIndex = 0
}) => {
  const videoRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    let currentStream = null;

    async function startWebcam() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (err) {
        console.warn('Browser webcam preview access error:', err);
        setCameraError(err.message || 'Webcam unavailable');
        setStreamActive(false);
      }
    }

    startWebcam();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraIndex]);

  return (
    <div className="relative w-full aspect-[4/3] max-h-[440px] bg-bg-secondary rounded-2xl overflow-hidden border border-border-color shadow-card flex items-center justify-center">
      {/* Video Stream (Direct browser MediaStream) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
          streamActive ? 'opacity-100' : 'hidden'
        }`}
      />

      {/* Python AI Engine Video Stream Fallback */}
      {!streamActive && telemetry?.preview_frame && (
        <img
          src={telemetry.preview_frame}
          alt="AI Camera Feed"
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
      )}

      {/* Disconnected / Loading Fallback */}
      {!streamActive && !telemetry?.preview_frame && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-bg-secondary/90 backdrop-blur-sm z-10">
          <div className="w-14 h-14 rounded-2xl bg-surface-primary flex items-center justify-center text-txt-muted mb-3 border border-border-color">
            {cameraError ? <CameraOff className="w-7 h-7 text-red-400" /> : <Camera className="w-7 h-7 text-accent-primary animate-pulse" />}
          </div>
          <h4 className="text-base font-semibold text-txt-primary">
            {cameraError ? 'Camera Access Notice' : 'Connecting to Camera...'}
          </h4>
          <p className="text-xs text-txt-muted mt-1 max-w-xs leading-relaxed">
            {cameraError
              ? 'Python AI Engine is processing the webcam directly. Start python main.py to stream live video.'
              : 'Acquiring high-resolution video stream for AI landmark estimation.'}
          </p>
        </div>
      )}

      {/* Canvas Landmark Overlay */}
      {showOverlay && streamActive && (
        <FaceLandmarkOverlay
          landmarks={telemetry?.landmarks || []}
          bbox={telemetry?.bbox}
          gaze={telemetry?.gaze}
          head={telemetry?.head}
          dwell={telemetry?.dwell}
          width={640}
          height={480}
        />
      )}

      {/* Overlay Status Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <div className="pointer-events-auto">
          <StatusBadge
            status={telemetry?.face_detected ? 'active' : 'inactive'}
            text={telemetry?.face_detected ? 'Face Locked' : 'Searching Face'}
            size="sm"
          />
        </div>

        {onToggleOverlay && (
          <button
            onClick={onToggleOverlay}
            className="pointer-events-auto px-2.5 py-1 rounded-lg bg-surface-primary/80 backdrop-blur-md border border-border-color text-xs text-txt-secondary hover:text-white flex items-center gap-1.5 transition-all"
            title="Toggle AI Landmark Wireframe Overlay"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent-secondary" />
            <span>{showOverlay ? 'Overlay On' : 'Overlay Off'}</span>
          </button>
        )}
      </div>

      {/* Gaze Confidence & Mode Tag */}
      {telemetry?.face_detected && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-20">
          <span className="px-2 py-0.5 rounded-md bg-surface-primary/85 backdrop-blur-md border border-border-color text-[11px] font-mono text-cyan-300">
            Conf: {((telemetry?.gaze?.confidence || 0) * 100).toFixed(0)}%
          </span>
          <span className="px-2 py-0.5 rounded-md bg-surface-primary/85 backdrop-blur-md border border-border-color text-[11px] font-mono text-slate-300">
            {telemetry?.gaze?.is_calibrated ? 'Calibrated 9-Pt' : 'Uncalibrated'}
          </span>
        </div>
      )}
    </div>
  );
};

export default WebcamPreview;

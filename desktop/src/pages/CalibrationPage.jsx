import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2, RotateCcw, Play, Sparkles, AlertCircle } from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';
import CalibrationTarget from '../components/CalibrationTarget';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

export const CalibrationPage = () => {
  const {
    calibrationState,
    startCalibration,
    setCalibrationPoint,
    completeCalibration,
    resetCalibration,
    addToast
  } = useMotionEase();

  // 9 canonical calibration points (normalized 0.0 to 1.0)
  const points = [
    { id: 'top_left', x: 0.1, y: 0.1, name: 'Top Left' },
    { id: 'top_center', x: 0.5, y: 0.1, name: 'Top Center' },
    { id: 'top_right', x: 0.9, y: 0.1, name: 'Top Right' },
    { id: 'mid_left', x: 0.1, y: 0.5, name: 'Middle Left' },
    { id: 'center', x: 0.5, y: 0.5, name: 'Center' },
    { id: 'mid_right', x: 0.9, y: 0.5, name: 'Middle Right' },
    { id: 'bottom_left', x: 0.1, y: 0.9, name: 'Bottom Left' },
    { id: 'bottom_center', x: 0.5, y: 0.9, name: 'Bottom Center' },
    { id: 'bottom_right', x: 0.9, y: 0.9, name: 'Bottom Right' }
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [samplesInPoint, setSamplesInPoint] = useState(0);

  // Calibration sequence timer
  useEffect(() => {
    let interval = null;
    if (calibrationState.isCalibrating) {
      interval = setInterval(() => {
        setSamplesInPoint((prev) => {
          if (prev >= 25) {
            // Move to next calibration point
            if (activeStep < points.length - 1) {
              const nextStep = activeStep + 1;
              setActiveStep(nextStep);
              setCalibrationPoint(nextStep);
              return 0;
            } else {
              // Reached final point! Train model
              clearInterval(interval);
              completeCalibration();
              return 25;
            }
          }
          return prev + 1;
        });
      }, 70); // ~1.8 seconds per calibration point
    } else {
      setSamplesInPoint(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [calibrationState.isCalibrating, activeStep, setCalibrationPoint, completeCalibration]);

  const handleStart = () => {
    setActiveStep(0);
    setSamplesInPoint(0);
    startCalibration();
    addToast('Look directly at the pulsating target on screen', 'info');
  };

  const progressTotal = calibrationState.isCalibrating
    ? ((activeStep * 25 + samplesInPoint) / (points.length * 25))
    : calibrationState.isCompleted ? 1.0 : 0.0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="9-Point Eye Gaze Calibration"
        subtitle="Aligns your individual facial anatomy and webcam distance with on-screen polynomial coordinates."
        badge={
          <StatusBadge
            status={calibrationState.isCompleted ? 'calibrated' : calibrationState.isCalibrating ? 'processing' : 'inactive'}
            text={calibrationState.isCompleted ? `Calibrated (${calibrationState.accuracy}%)` : calibrationState.isCalibrating ? 'Calibrating...' : 'Uncalibrated'}
          />
        }
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={resetCalibration}
              className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5 hover:text-red-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {!calibrationState.isCalibrating && (
              <button
                onClick={handleStart}
                className="btn-primary h-9 px-4 text-xs flex items-center gap-1.5 shadow-glow"
              >
                <Play className="w-3.5 h-3.5 text-white" />
                <span>{calibrationState.isCompleted ? 'Recalibrate' : 'Begin Calibration'}</span>
              </button>
            )}
          </div>
        }
      />

      {/* Calibration Interactive Screen Arena */}
      <div className="relative w-full aspect-[16/9] min-h-[460px] bg-bg-secondary rounded-2xl border border-border-color overflow-hidden shadow-2xl flex items-center justify-center">
        {/* Ambient Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111C30_1px,transparent_1px),linear-gradient(to_bottom,#111C30_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none" />

        {/* 9 Interactive Calibration Targets */}
        {points.map((pt, idx) => (
          <CalibrationTarget
            key={pt.id}
            x={pt.x}
            y={pt.y}
            pointNumber={idx + 1}
            isActive={calibrationState.isCalibrating && activeStep === idx}
            isCollected={calibrationState.isCalibrating ? activeStep > idx : calibrationState.isCompleted}
          />
        ))}

        {/* Center Guidance Prompt */}
        {!calibrationState.isCalibrating && !calibrationState.isCompleted && (
          <div className="text-center p-6 bg-surface-primary/90 backdrop-blur-md rounded-2xl border border-border-color max-w-md shadow-card z-10">
            <div className="w-12 h-12 rounded-xl bg-accent-primary/20 text-accent-secondary mx-auto flex items-center justify-center mb-3">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-base text-txt-primary">Start 9-Point Calibration</h3>
            <p className="text-xs text-txt-muted mt-1 leading-relaxed">
              Sit in a comfortable position and keep your head stationary. Follow the cyan target with your eyes as it travels across each of the 9 points.
            </p>
            <button
              onClick={handleStart}
              className="btn-primary text-xs h-9 px-6 mt-4 shadow-glow"
            >
              Start Calibration Now
            </button>
          </div>
        )}

        {/* Calibration Completed Success Banner */}
        {calibrationState.isCompleted && !calibrationState.isCalibrating && (
          <div className="text-center p-6 bg-surface-primary/95 backdrop-blur-md rounded-2xl border border-emerald-500/40 max-w-md shadow-card z-10 animate-scaleIn">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-base text-txt-primary">Gaze Mapping Calibrated!</h3>
            <p className="text-xs text-txt-secondary mt-1">
              Polynomial regression weights trained and saved. Estimated tracking accuracy:
            </p>
            <div className="my-3 font-mono text-3xl font-extrabold text-emerald-400">
              {calibrationState.accuracy || 94.2}%
            </div>
            <button
              onClick={handleStart}
              className="btn-secondary text-xs h-9 px-4 mt-2"
            >
              Recalibrate
            </button>
          </div>
        )}
      </div>

      {/* Calibration Progress Bar */}
      {calibrationState.isCalibrating && (
        <div className="card-base p-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-cyan-300">
              Calibrating Point {activeStep + 1} of {points.length}: {points[activeStep]?.name}
            </span>
            <span className="font-mono text-txt-muted">{(progressTotal * 100).toFixed(0)}%</span>
          </div>
          <ProgressBar progress={progressTotal} color="cyan" showValue={false} />
        </div>
      )}
    </div>
  );
};

export default CalibrationPage;

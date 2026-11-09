import React, { useState, useEffect } from 'react';
import { Sliders, MousePointer, Clock, Eye, ShieldCheck, RotateCcw, Save } from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';
import SettingsCard from '../components/SettingsCard';
import SliderControl from '../components/SliderControl';
import ToggleSwitch from '../components/ToggleSwitch';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

export const AccessibilitySettingsPage = () => {
  const { updateSettings, resetCalibration, addToast } = useMotionEase();

  // One-Euro Filter Tuning
  const [minCutoff, setMinCutoff] = useState(1.0);
  const [beta, setBeta] = useState(0.05);

  // Dynamic Dwell Scaling
  const [minDwellMs, setMinDwellMs] = useState(600);
  const [maxDwellMs, setMaxDwellMs] = useState(1500);
  const [dwellRadiusPx, setDwellRadiusPx] = useState(35);

  // UI Visual Settings
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Load from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('motionease_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.minCutoff) setMinCutoff(parsed.minCutoff);
        if (parsed.beta) setBeta(parsed.beta);
        if (parsed.minDwellMs) setMinDwellMs(parsed.minDwellMs);
        if (parsed.dwellRadiusPx) setDwellRadiusPx(parsed.dwellRadiusPx);
        if (parsed.highContrast !== undefined) setHighContrast(parsed.highContrast);
        if (parsed.reducedMotion !== undefined) setReducedMotion(parsed.reducedMotion);
      }
    } catch (e) {
      console.warn('Could not read saved settings:', e);
    }
  }, []);

  const handleSave = () => {
    const settings = {
      one_euro: { min_cutoff: minCutoff, beta: beta },
      dwell: { min_dwell_ms: minDwellMs, max_dwell_ms: maxDwellMs, radius_px: dwellRadiusPx },
      ui: { highContrast, reducedMotion }
    };
    try {
      localStorage.setItem('motionease_settings', JSON.stringify({
        minCutoff, beta, minDwellMs, maxDwellMs, dwellRadiusPx, highContrast, reducedMotion
      }));
    } catch (e) {
      console.error(e);
    }
    updateSettings(settings);
  };

  const handleResetDefaults = () => {
    setMinCutoff(1.0);
    setBeta(0.05);
    setMinDwellMs(600);
    setMaxDwellMs(1500);
    setDwellRadiusPx(35);
    setHighContrast(false);
    setReducedMotion(false);
    addToast('Reset to default values', 'info');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Accessibility & Filter Calibration"
        subtitle="Fine-tune cursor filtering algorithms, dwell-time thresholds, and privacy preferences."
        badge={<StatusBadge status="active" text="Settings Synchronized" />}
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>
            <button
              onClick={handleSave}
              className="btn-primary h-9 px-4 text-xs flex items-center gap-1.5 shadow-glow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Apply</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Speed-Gain Adaptive One-Euro Signal Filter */}
        <SettingsCard
          title="Speed-Gain Adaptive 1€ Signal Filter"
          description="Eradicates high-frequency micro-tremors during fixation while eliminating lag during fast saccades."
          icon={Sliders}
        >
          <SliderControl
            label="Minimum Cutoff Frequency (Min Cutoff)"
            value={minCutoff}
            min={0.1}
            max={3.0}
            step={0.1}
            unit="Hz"
            onChange={setMinCutoff}
            helperText="Lower values filter out tremor jitter when stationary. Default: 1.0 Hz."
          />

          <SliderControl
            label="Speed Coefficient (Beta)"
            value={beta}
            min={0.001}
            max={0.2}
            step={0.005}
            unit="coeff"
            onChange={setBeta}
            helperText="Higher values reduce pointer lag when your gaze shifts rapidly. Default: 0.05."
          />
        </SettingsCard>

        {/* Dynamic Dwell Scaling */}
        <SettingsCard
          title="Context-Aware Dynamic Dwell Scaling"
          description="Fixation dwell timer with automatic velocity scaling to prevent the Midas Touch."
          icon={Clock}
        >
          <SliderControl
            label="Minimum Dwell Hold Duration"
            value={minDwellMs}
            min={300}
            max={1200}
            step={50}
            unit="ms"
            onChange={setMinDwellMs}
            helperText="Base dwell duration on stationary targets. Default: 600ms."
          />

          <SliderControl
            label="Dwell Target Radius Tolerance"
            value={dwellRadiusPx}
            min={15}
            max={70}
            step={5}
            unit="px"
            onChange={setDwellRadiusPx}
            helperText="Pixel distance tolerance for ocular stability. Default: 35px."
          />
        </SettingsCard>

        {/* Visual Accessibility Preferences */}
        <SettingsCard
          title="Visual & UI Accessibility"
          description="Adjust contrast and interface responsiveness to individual patient requirements."
          icon={Eye}
        >
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-sm font-medium text-txt-primary">High Contrast Borders</div>
              <p className="text-[11px] text-txt-muted">Intensifies UI borders and target visibility.</p>
            </div>
            <ToggleSwitch checked={highContrast} onChange={setHighContrast} />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-sm font-medium text-txt-primary">Reduced Motion Animations</div>
              <p className="text-[11px] text-txt-muted">Minimizes page transitions and decorative animations.</p>
            </div>
            <ToggleSwitch checked={reducedMotion} onChange={setReducedMotion} />
          </div>
        </SettingsCard>

        {/* Local Storage & Privacy Management */}
        <SettingsCard
          title="Local Privacy & Session Storage"
          description="All tracking coordinates and facial vectors stay local on this hardware."
          icon={ShieldCheck}
        >
          <div className="text-xs text-txt-muted space-y-2 leading-relaxed">
            <p>
              MotionEase adheres to a strict zero-cloud architecture. Facial landmarks, voice audio chunks, and gaze coordinates are never stored permanently or uploaded.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  resetCalibration();
                  addToast('Calibration file deleted', 'info');
                }}
                className="btn-secondary h-8 px-3 text-xs text-red-400 hover:border-red-400"
              >
                Clear Calibration Data
              </button>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
};

export default AccessibilitySettingsPage;

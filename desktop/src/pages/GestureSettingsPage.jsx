import React, { useState } from 'react';
import { Smile, Eye, Compass, Hand, ShieldCheck, Sliders, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';
import SettingsCard from '../components/SettingsCard';
import ToggleSwitch from '../components/ToggleSwitch';
import SliderControl from '../components/SliderControl';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

export const GestureSettingsPage = () => {
  const { telemetry, settings, updateSettings, addToast } = useMotionEase();

  // Gesture Toggles
  const [gestures, setGestures] = useState({
    blinkClick: settings.blink_click !== false,
    leftWink: true,
    rightWink: true,
    smile: true,
    mouthOpen: true,
    headScroll: true,
    handPinch: true
  });

  // Thresholds
  const [blinkMinFrames, setBlinkMinFrames] = useState(4);
  const [winkMinFrames, setWinkMinFrames] = useState(3);
  const [winkMaxFrames, setWinkMaxFrames] = useState(20);
  const [smileThreshold, setSmileThreshold] = useState(0.45);
  const [scrollPitchThreshold, setScrollPitchThreshold] = useState(16);

  const handleToggle = (key) => {
    const updated = { ...gestures, [key]: !gestures[key] };
    setGestures(updated);
    if (key === 'blinkClick') {
      updateSettings({ blink_click: updated.blinkClick });
    }
    addToast(`Updated gesture configuration`, 'info');
  };

  const handleReset = () => {
    setBlinkMinFrames(4);
    setWinkMinFrames(3);
    setWinkMaxFrames(20);
    setSmileThreshold(0.45);
    setScrollPitchThreshold(16);
    setGestures({
      blinkClick: true,
      leftWink: true,
      rightWink: true,
      smile: true,
      mouthOpen: true,
      headScroll: true,
      handPinch: true
    });
    updateSettings({ blink_click: true });
    addToast('Gesture settings reset to defaults', 'info');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Gesture Recognition & Thresholds"
        subtitle="Configure facial expressions, eye closures, and hand pinches. Deliberate windows prevent involuntary twitches from triggering accidental clicks."
        badge={<StatusBadge status="active" text="Midas Touch Prevention Active" />}
        actionButton={
          <button
            onClick={handleReset}
            className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        }
      />

      {/* Real-Time Live Gesture Feedback Bar */}
      <div className="card-base p-4 bg-surface-primary border-border-color flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/20 text-accent-secondary flex items-center justify-center">
            {telemetry.hand?.detected ? <Hand className="w-5 h-5 text-emerald-400" /> : <Eye className="w-5 h-5 text-cyan-400" />}
          </div>
          <div>
            <span className="text-[11px] text-txt-muted block">Live Detector Feed</span>
            <span className="text-sm font-semibold text-txt-primary">
              {telemetry.gesture.detected ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 inline" /> {telemetry.gesture.detected} TRIGGERED!
                </span>
              ) : telemetry.hand?.gesture ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 inline" /> {telemetry.hand.gesture} TRIGGERED!
                </span>
              ) : telemetry.gesture.is_blink ? (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Eyes Closed ({telemetry.gesture.both_eyes_closed_frames || 1} frames) - Release to Click!
                </span>
              ) : (
                <span className="text-txt-muted">Eyes Open & Tracking (Neutral)</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="bg-surface-secondary px-3 py-1.5 rounded-lg border border-border-color">
            <span className="text-txt-muted">Left EAR: </span>
            <span className="text-txt-primary">{telemetry.gesture.left_ear.toFixed(2)}</span>
          </div>
          <div className="bg-surface-secondary px-3 py-1.5 rounded-lg border border-border-color">
            <span className="text-txt-muted">Right EAR: </span>
            <span className="text-txt-primary">{telemetry.gesture.right_ear.toFixed(2)}</span>
          </div>
          {telemetry.hand?.detected && (
            <div className="bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
              <span>Hand Pinch Dist: {telemetry.hand.pinch_dist}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Eye Gestures Section */}
        <SettingsCard
          title="Eye Closures & Deliberate Clicks"
          description="Enforces deliberate duration windows so quick natural blinks (50-100ms) are safe, while holding for ~250ms clicks upon opening."
          icon={Eye}
        >
          {/* Deliberate Blink to Click */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
            <div>
              <div className="text-sm font-semibold text-cyan-300">Deliberate Blink (Left Click)</div>
              <p className="text-[11px] text-txt-muted mt-0.5">
                Close both eyes intentionally for half a second and reopen to click.
              </p>
            </div>
            <ToggleSwitch checked={gestures.blinkClick} onChange={() => handleToggle('blinkClick')} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-sm font-medium text-txt-primary">Left Wink (Left Click)</div>
              <p className="text-[11px] text-txt-muted">Close only left eye deliberately to click.</p>
            </div>
            <ToggleSwitch checked={gestures.leftWink} onChange={() => handleToggle('leftWink')} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-sm font-medium text-txt-primary">Right Wink (Right Click)</div>
              <p className="text-[11px] text-txt-muted">Close only right eye deliberately for context menu.</p>
            </div>
            <ToggleSwitch checked={gestures.rightWink} onChange={() => handleToggle('rightWink')} />
          </div>

          <div className="pt-3 border-t border-border-color/60 space-y-4">
            <SliderControl
              label="Deliberate Blink Minimum Hold"
              value={blinkMinFrames}
              min={3}
              max={10}
              unit="frames (~130ms)"
              onChange={setBlinkMinFrames}
              helperText="Blinks shorter than this are recognized as involuntary twitches and discarded."
            />

            <SliderControl
              label="Wink Duration Window"
              value={winkMinFrames}
              min={2}
              max={8}
              unit="frames"
              onChange={setWinkMinFrames}
              helperText="Number of frames eye must be closed before wink is recognized on release."
            />
          </div>
        </SettingsCard>

        {/* Hand Gestures & Head Controls Section */}
        <SettingsCard
          title="Hand Gestures & Facial Expressions"
          description="Transforms hand pinches, smiles, and head tilts into effortless action macros."
          icon={Hand}
        >
          {/* Hand Pinch to Click */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
            <div>
              <div className="text-sm font-semibold text-emerald-300">Hand Pinch (Left Click)</div>
              <p className="text-[11px] text-txt-muted mt-0.5">
                Pinch index finger and thumb together in camera view to click.
              </p>
            </div>
            <ToggleSwitch checked={gestures.handPinch} onChange={() => handleToggle('handPinch')} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-sm font-medium text-txt-primary">Smile (Double Click)</div>
              <p className="text-[11px] text-txt-muted">Sustained smile gesture triggers double click.</p>
            </div>
            <ToggleSwitch checked={gestures.smile} onChange={() => handleToggle('smile')} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-sm font-medium text-txt-primary">Head Tilt Viewport Scroll</div>
              <p className="text-[11px] text-txt-muted">Tilt head up or down to scroll documents and web pages.</p>
            </div>
            <ToggleSwitch checked={gestures.headScroll} onChange={() => handleToggle('headScroll')} />
          </div>

          <div className="pt-3 border-t border-border-color/60 space-y-4">
            <SliderControl
              label="Smile Blendshape Sensitivity"
              value={smileThreshold}
              min={0.2}
              max={0.8}
              step={0.05}
              unit="score"
              onChange={setSmileThreshold}
              helperText="MediaPipe blendshape threshold for mouthSmileLeft and mouthSmileRight."
            />

            <SliderControl
              label="Head Pitch Scroll Threshold"
              value={scrollPitchThreshold}
              min={10}
              max={30}
              step={1}
              unit="degrees"
              onChange={setScrollPitchThreshold}
              helperText="Degrees of pitch tilt required before triggering scrolling."
            />
          </div>
        </SettingsCard>
      </div>
    </div>
  );
};

export default GestureSettingsPage;

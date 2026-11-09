import React, { useState } from 'react';
import { Smile, Eye, Compass, ShieldCheck, Sliders, RotateCcw } from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';
import SettingsCard from '../components/SettingsCard';
import ToggleSwitch from '../components/ToggleSwitch';
import SliderControl from '../components/SliderControl';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

export const GestureSettingsPage = () => {
  const { telemetry, updateSettings, addToast } = useMotionEase();

  // Gesture Toggles
  const [gestures, setGestures] = useState({
    leftWink: true,
    rightWink: true,
    smile: true,
    mouthOpen: true,
    headScroll: true
  });

  // Thresholds
  const [winkMinFrames, setWinkMinFrames] = useState(3);
  const [winkMaxFrames, setWinkMaxFrames] = useState(20);
  const [smileThreshold, setSmileThreshold] = useState(0.45);
  const [scrollPitchThreshold, setScrollPitchThreshold] = useState(12);

  const handleToggle = (key) => {
    const updated = { ...gestures, [key]: !gestures[key] };
    setGestures(updated);
    addToast(`Updated gesture configuration`, 'info');
  };

  const handleReset = () => {
    setWinkMinFrames(3);
    setWinkMaxFrames(20);
    setSmileThreshold(0.45);
    setScrollPitchThreshold(12);
    addToast('Gesture settings reset to defaults', 'info');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Gesture Recognition & Thresholds"
        subtitle="Configure facial expressions, eye closures, and head tilts. Deliberate windows prevent involuntary twitches from triggering clicks."
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
      <div className="card-base p-4 bg-surface-primary border-border-color flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-primary/20 text-accent-secondary flex items-center justify-center">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-txt-muted block">Live Detector Feed</span>
            <span className="text-sm font-semibold text-txt-primary">
              {telemetry.gesture.detected ? (
                <span className="text-emerald-400 font-bold">{telemetry.gesture.detected} TRIGGERED</span>
              ) : telemetry.gesture.is_blink ? (
                <span className="text-amber-400">Involuntary Blink (Filtered Out)</span>
              ) : (
                <span className="text-txt-muted">Neutral Facial State</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-surface-secondary px-3 py-1.5 rounded-lg border border-border-color">
            <span className="text-txt-muted">Left EAR: </span>
            <span className="text-txt-primary">{telemetry.gesture.left_ear.toFixed(2)}</span>
          </div>
          <div className="bg-surface-secondary px-3 py-1.5 rounded-lg border border-border-color">
            <span className="text-txt-muted">Right EAR: </span>
            <span className="text-txt-primary">{telemetry.gesture.right_ear.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Eye Gestures Section */}
        <SettingsCard
          title="Eye Gestures & Deliberate Winks"
          description="Enforces deliberate duration windows so involuntary natural blinks are strictly filtered out."
          icon={Eye}
        >
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
              label="Minimum Wink Hold Duration"
              value={winkMinFrames}
              min={2}
              max={8}
              unit="frames (~100ms)"
              onChange={setWinkMinFrames}
              helperText="Frames below this are recognized as involuntary blinks and discarded."
            />

            <SliderControl
              label="Maximum Wink Hold Duration"
              value={winkMaxFrames}
              min={10}
              max={30}
              unit="frames"
              onChange={setWinkMaxFrames}
              helperText="Closures longer than this are recognized as resting eye closure."
            />
          </div>
        </SettingsCard>

        {/* Facial & Head Gestures Section */}
        <SettingsCard
          title="Facial Expressions & Head Scrolling"
          description="Transforms deliberate mouth expressions and head tilts into action macros."
          icon={Smile}
        >
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
              min={6}
              max={25}
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

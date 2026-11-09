import React from 'react';
import {
  Eye,
  Compass,
  Smile,
  Mic,
  Keyboard,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

export const TutorialPage = () => {
  const sections = [
    {
      icon: Eye,
      title: '1. Eye Gaze Tracking & Cursor Navigation',
      desc: 'Look naturally at any point on your screen. MotionEase extracts relative pupil/iris positions from the MediaPipe 3D face mesh and filters the coordinates with a Speed-Gain Adaptive One-Euro filter to completely eliminate tremor jitter while preserving instantaneous saccadic responsiveness.'
    },
    {
      icon: Eye,
      title: '2. 9-Point Eye Calibration',
      desc: 'Navigate to "Eye Calibration" to adapt the polynomial regression engine to your specific monitor size, distance, and eye geometry. Focus your gaze on each of the 9 pulsating targets in sequence until the 100% calibration progress is achieved.'
    },
    {
      icon: Smile,
      title: '3. Mouse Clicking without False Triggers',
      desc: 'MotionEase prevents accidental "Midas Touch" triggers using two parallel mechanisms: (A) Dynamic Dwell Scaling: Fixating your gaze within a target bubble for ~600ms initiates a click; (B) Deliberate Left Wink: A deliberate ~150ms wink with your left eye triggers an instant Left Click. Involuntary double-eye blinks are strictly recognized and ignored.'
    },
    {
      icon: Compass,
      title: '4. Viewport Document & Web Scrolling',
      desc: 'Tilt your head up slightly to scroll up, or tilt your head down slightly to scroll down. The system utilizes OpenCV solvePnP head pitch estimation to provide hands-free document and web navigation.'
    },
    {
      icon: Mic,
      title: '5. Voice Commands & Safe Launcher',
      desc: 'Say natural commands like "open notepad", "open chrome", "click", "double click", "press enter", or "scroll down". Spoken input is parsed completely offline by an on-device ASR engine and routed through the safe application allowlist.'
    },
    {
      icon: Keyboard,
      title: '6. Hands-Free Virtual Keyboard & Predictive AI',
      desc: 'Open the Virtual Keyboard to type using gaze dwell or facial clicks. The on-device predictive text engine suggests context-aware words and sentences above the keyboard, accelerating typing speed up to 15+ WPM.'
    },
    {
      icon: ShieldAlert,
      title: '7. Safety Controls & Emergency Stop',
      desc: 'At any moment, saying "emergency stop" or clicking the red Emergency Stop button in the sidebar will immediately suspend all OS mouse and keyboard emulation without quitting the application.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Interactive Tutorial & Assistive HCI Guide"
        subtitle="Complete instructions for motor-impaired individuals, caregivers, and evaluation committees."
        badge={<StatusBadge status="active" text="Guide v1.0" />}
      />

      <div className="space-y-4">
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <div
              key={idx}
              className="card-base p-5 hover:border-accent-primary/40 transition-all flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-secondary text-accent-secondary border border-border-color/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-txt-primary">{sec.title}</h3>
                <p className="text-xs text-txt-muted leading-relaxed">{sec.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TutorialPage;

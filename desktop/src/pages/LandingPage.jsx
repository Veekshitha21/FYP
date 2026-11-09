import React from 'react';
import { Eye, ShieldCheck, ArrowRight, Video, Mic, Sparkles, Cpu, Layers } from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';

export const LandingPage = () => {
  const { setCurrentPage } = useMotionEase();

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] select-none">
      {/* Privacy Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-primary border border-border-color shadow-sm mb-6 animate-fadeIn">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-medium text-txt-secondary">
          100% On-Device AI • Zero Cloud Latency • Complete Privacy
        </span>
      </div>

      {/* Main Logo & Headline */}
      <div className="text-center space-y-4 max-w-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center shadow-glow mb-2">
          <Eye className="w-9 h-9 text-white" />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold font-display tracking-tight text-txt-primary">
          Motion<span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">Ease</span>
        </h1>

        <p className="text-xl font-medium text-cyan-300">
          Freedom Beyond Physical Interaction.
        </p>

        <p className="text-sm text-txt-secondary leading-relaxed">
          An ultra-low latency, multi-modal hands-free computer control system.
          Designed for individuals with severe motor impairments (ALS, Quadriplegia, Cerebral Palsy)
          to operate a computer using standard webcams and microphones with parallel multimodal fusion.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-10 max-w-4xl">
        <div className="card-base p-5 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/20 text-accent-secondary flex items-center justify-center mb-3">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-txt-primary">Parallel Multimodal Fusion</h3>
          <p className="text-xs text-txt-muted mt-1 leading-relaxed">
            Simultaneously processes eye gaze, head tilt, facial expressions, and voice commands without mode-switching friction.
          </p>
        </div>

        <div className="card-base p-5 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-accent-secondary/20 text-cyan-400 flex items-center justify-center mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-txt-primary">1€ Adaptive Filtering</h3>
          <p className="text-xs text-txt-muted mt-1 leading-relaxed">
            Speed-Gain Adaptive One-Euro filtering eradicates micro-tremor cursor jitter and dynamic dwell prevents accidental clicks.
          </p>
        </div>

        <div className="card-base p-5 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-sm text-txt-primary">Local SLM Predictive Text</h3>
          <p className="text-xs text-txt-muted mt-1 leading-relaxed">
            Accelerates hands-free text entry up to 3x via on-device small language models and contextual dictionary prediction.
          </p>
        </div>
      </div>

      {/* Requirements Box */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-8 py-3 px-6 rounded-2xl bg-surface-primary/60 border border-border-color text-xs text-txt-muted">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-accent-secondary" />
          <span>Standard Webcam (720p/1080p @ 30 FPS)</span>
        </div>
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-accent-secondary" />
          <span>Standard Consumer Microphone</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent-secondary" />
          <span>Local CPU/GPU Inference</span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
        <button
          onClick={() => setCurrentPage('setup')}
          className="btn-primary text-sm px-7 h-12 shadow-glow"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => setCurrentPage('tutorial')}
          className="btn-secondary text-sm px-6 h-12"
        >
          How It Works
        </button>

        <button
          onClick={() => setCurrentPage('settings')}
          className="btn-secondary text-sm px-5 h-12 text-txt-secondary"
        >
          Privacy Information
        </button>
      </div>
    </div>
  );
};

export default LandingPage;

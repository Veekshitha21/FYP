import React, { useState } from 'react';
import { Mic, ShieldCheck, Send, CheckCircle2, Terminal, Volume2 } from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';
import AudioWaveform from '../components/AudioWaveform';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

export const VoiceControlPage = () => {
  const {
    telemetry,
    systemStatus,
    modalities,
    toggleModality,
    testVoiceCommand,
    actionLog
  } = useMotionEase();

  const [testInput, setTestInput] = useState('');

  const supportedCommands = [
    { cmd: 'open chrome', desc: 'Launches Google Chrome browser (Allowlisted)' },
    { cmd: 'open notepad', desc: 'Launches Windows Notepad' },
    { cmd: 'click / left click', desc: 'Performs primary mouse left click' },
    { cmd: 'double click', desc: 'Performs mouse double click' },
    { cmd: 'right click', desc: 'Opens context menu' },
    { cmd: 'scroll up / scroll down', desc: 'Scrolls active window' },
    { cmd: 'press enter', desc: 'Submits form or sends message' },
    { cmd: 'press backspace', desc: 'Deletes previous character' },
    { cmd: 'type [text]', desc: 'Types spoken sentence into active window' },
    { cmd: 'pause / resume', desc: 'Freezes or unfreezes hands-free tracking' },
    { cmd: 'emergency stop', desc: 'Immediately suspends all OS actions' }
  ];

  const handleTestSubmit = (e) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    testVoiceCommand(testInput.trim());
    setTestInput('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Voice Control & Command Engine"
        subtitle="Offline speech recognition and strict allowlisted system intent parsing."
        badge={
          <StatusBadge
            status={systemStatus.microphone === 'connected' ? 'active' : 'inactive'}
            text={systemStatus.microphone === 'connected' ? 'Offline Speech Ready' : 'Mic Offline'}
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Live Microphone Waveform & Test Console */}
        <div className="space-y-4">
          <AudioWaveform
            audioLevel={telemetry.audio_level}
            isListening={systemStatus.microphone === 'connected'}
          />

          {/* Test Voice Command Console */}
          <div className="card-base p-5 space-y-3">
            <div className="flex items-center gap-2 text-txt-primary font-semibold text-sm">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Test Command Input</span>
            </div>
            <p className="text-xs text-txt-muted">
              Speak a command into your microphone, or test the NLP intent parser directly:
            </p>

            <form onSubmit={handleTestSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder='e.g. "open notepad", "scroll down", "type hello"'
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="flex-1 bg-surface-secondary border border-border-color rounded-xl px-3.5 py-2 text-xs text-txt-primary focus:border-accent-primary outline-none"
              />
              <button type="submit" className="btn-primary h-9 px-4 text-xs">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {['open notepad', 'scroll down', 'double click', 'press enter'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => testVoiceCommand(preset)}
                  className="px-2.5 py-1 rounded-lg bg-surface-secondary border border-border-color text-[11px] text-txt-secondary hover:text-cyan-300 hover:border-accent-primary transition-all"
                >
                  "{preset}"
                </button>
              ))}
            </div>
          </div>

          {/* Privacy & Allowlist Guarantee Card */}
          <div className="p-4 rounded-xl bg-surface-primary border border-border-color space-y-2 text-xs">
            <div className="flex items-center gap-2 text-txt-primary font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safe Allowlist Security Policy</span>
            </div>
            <p className="text-[11px] text-txt-muted leading-relaxed">
              To guarantee user safety, arbitrary shell commands (e.g. PowerShell scripts, format, deletion) are completely disallowed. Only verified applications in the safe registry are permitted.
            </p>
          </div>
        </div>

        {/* Right Column: Supported Commands Allowlist */}
        <div className="card-base p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-txt-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Supported Voice Commands
            </h3>

            <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
              {supportedCommands.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-surface-secondary/50 border border-border-color/50 text-xs flex flex-col gap-0.5"
                >
                  <span className="font-mono font-semibold text-cyan-300">"{item.cmd}"</span>
                  <span className="text-[11px] text-txt-muted">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceControlPage;

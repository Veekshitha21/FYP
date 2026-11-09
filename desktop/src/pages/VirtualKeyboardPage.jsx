import React, { useState } from 'react';
import { Keyboard, Copy, Check, Sparkles, Send, RotateCcw } from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';
import VirtualKeyboard from '../components/VirtualKeyboard';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

export const VirtualKeyboardPage = () => {
  const {
    keyboardState,
    virtualKeyboardPress,
    virtualKeyboardSuggestion,
    virtualKeyboardClear,
    addToast
  } = useMotionEase();

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!keyboardState.text) return;
    navigator.clipboard.writeText(keyboardState.text);
    setCopied(true);
    addToast('Typed text copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Assistive Virtual Keyboard"
        subtitle="Full QWERTY layout with dwell-time key selection and on-device predictive text."
        badge={<StatusBadge status="active" text="Typing Engine Ready" />}
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!keyboardState.text}
              className="btn-secondary h-9 px-3.5 text-xs flex items-center gap-1.5 disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              onClick={virtualKeyboardClear}
              disabled={!keyboardState.text}
              className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5 hover:text-red-400 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        }
      />

      {/* Main Keyboard Component */}
      <VirtualKeyboard
        text={keyboardState.text}
        suggestions={keyboardState.suggestions}
        slmInfo={keyboardState.slm_info}
        onKeyPress={virtualKeyboardPress}
        onSelectSuggestion={virtualKeyboardSuggestion}
        onClear={virtualKeyboardClear}
      />

      {/* AAC Clinical Tips */}
      <div className="p-4 rounded-2xl bg-surface-primary border border-border-color text-xs text-txt-muted flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-txt-primary">AAC Acceleration Tip:</strong> Using the predictive text suggestions above the keyboard increases hands-free typing throughput from ~5 WPM to over 15+ WPM, reducing muscular and optical fatigue.
        </div>
      </div>
    </div>
  );
};

export default VirtualKeyboardPage;

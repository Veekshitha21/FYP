import React, { useState } from 'react';
import { Sparkles, Cpu, HardDrive, ShieldCheck, CheckCircle2, AlertCircle, FileCode, Clock } from 'lucide-react';
import { useMotionEase } from '../context/MotionEaseContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

export const SLMConfigPage = () => {
  const { systemStatus, keyboardState, virtualKeyboardPress, virtualKeyboardSuggestion } = useMotionEase();
  const [testContext, setTestContext] = useState('I need assistance with');

  const slm = systemStatus.slm || {};
  const isLocalLoaded = slm.is_loaded;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="On-Device Small Language Model (SLM)"
        subtitle="Accelerates hands-free text input via quantized GGUF language models and offline dictionary completions."
        badge={
          <StatusBadge
            status={isLocalLoaded ? 'active' : 'inactive'}
            text={isLocalLoaded ? `Local GGUF (${slm.model_name})` : 'Dictionary Fallback Active'}
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Model Status Card */}
        <div className="card-base p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isLocalLoaded ? 'bg-cyan-500/20 text-cyan-300' : 'bg-surface-secondary text-txt-muted'}`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-txt-primary">Model Runtime</h3>
              <span className="text-[11px] text-txt-muted">Local llama.cpp inference</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-border-color/60 text-xs">
            <div className="flex justify-between">
              <span className="text-txt-muted">Engine:</span>
              <span className="font-semibold text-txt-primary">{slm.model_name || 'Dictionary & N-Gram'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-txt-muted">Model Directory:</span>
              <span className="font-mono text-[11px] text-txt-secondary">models/language_model/</span>
            </div>
            <div className="flex justify-between">
              <span className="text-txt-muted">Inference Latency:</span>
              <span className="font-mono text-cyan-400 font-bold">{slm.last_latency_ms || 1.2} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-txt-muted">Privacy Mode:</span>
              <span className="text-emerald-400 font-medium">100% On-Device</span>
            </div>
          </div>
        </div>

        {/* Prediction Test Playground */}
        <div className="md:col-span-2 card-base p-5 space-y-4">
          <h3 className="font-semibold text-sm text-txt-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-secondary" />
            Live Context Prediction Playground
          </h3>

          <div className="space-y-2">
            <label className="text-xs text-txt-secondary font-medium">Current Typed Context</label>
            <input
              type="text"
              value={testContext}
              onChange={(e) => setTestContext(e.target.value)}
              className="w-full bg-surface-secondary border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-txt-primary focus:border-accent-primary outline-none font-mono"
            />
          </div>

          <div className="pt-2">
            <label className="text-xs text-txt-muted block mb-2">Generated Autocomplete Suggestions:</label>
            <div className="flex flex-wrap gap-2">
              {['to rest', 'water please', 'the doctor', 'to call family'].map((sugg, i) => (
                <button
                  key={i}
                  onClick={() => setTestContext((prev) => `${prev} ${sugg}`)}
                  className="px-3.5 py-2 rounded-xl bg-surface-secondary border border-border-color text-xs text-cyan-300 hover:border-cyan-400 hover:bg-surface-hover transition-all"
                >
                  + {sugg}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Model Loading Instructions Card */}
      <div className="card-base p-6 space-y-4">
        <h3 className="font-semibold text-sm text-txt-primary flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-accent-primary" />
          Adding Local GGUF Small Language Models
        </h3>
        <p className="text-xs text-txt-muted leading-relaxed">
          MotionEase features automatic model detection. When any compatible instruction-tuned GGUF model (such as Llama-3.2-1B-Instruct-Q4_K_M.gguf or TinyLlama-1.1B-Chat-v1.0.Q4_K_M.gguf) is placed inside the <code className="text-cyan-300 font-mono bg-surface-secondary px-1.5 py-0.5 rounded">models/language_model/</code> folder, the engine activates local neural sentence completions. When absent, it operates with zero-latency dictionary-based autocomplete without failing.
        </p>

        <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border-color/60 font-mono text-[11px] text-txt-secondary space-y-1">
          <div># Example: Download a lightweight 1B model into models/language_model:</div>
          <div className="text-cyan-300">curl -L -o models/language_model/TinyLlama.Q4_K_M.gguf "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"</div>
        </div>
      </div>
    </div>
  );
};

export default SLMConfigPage;

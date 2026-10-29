import React, { useState, useEffect } from 'react';
import { Cpu, Mic, Volume2, ShieldCheck, Sliders, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const AIConfigView: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(0.65);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.getAIConfig();
        setConfig(res.data);
        if (res.data.confidence_threshold) {
          setThreshold(res.data.confidence_threshold);
        }
      } catch (err) {
        console.error('Failed to load AI config', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading || !config) {
    return <div className="text-center py-12 text-slate-400 text-xs">Loading AI configuration...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">AI Voice & Models Configuration</h1>
          <p className="text-xs text-slate-500">
            Fine-tune multilingual neural voice personas, confidence thresholds, and anti-hallucination settings.
          </p>
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Save Configuration
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">AI voice models and confidence threshold saved successfully!</span>
        </div>
      )}

      {/* Threshold & LLM Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anti-Hallucination Grounding Threshold */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">Anti-Hallucination & Grounding Gate</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700">RAG Semantic Similarity Threshold</span>
                <span className="font-mono font-bold text-blue-700">{threshold}</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                If the retrieved company knowledge similarity falls below {threshold}, the receptionist will refuse to speculate and immediately transfer the call to a human specialist.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700 block mb-1">Strict Grounding Rule:</span>
              <p className="text-[11px] text-slate-500">
                Under no circumstances does NEXORA AI fabricate pricing, stock availability, or company policy. Verified company documents and database records are the sole source of truth.
              </p>
            </div>
          </div>
        </div>

        {/* Local LLM & Ollama Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">Local LLM & Dialogue Orchestrator</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ollama Base URL</label>
              <input
                type="text"
                defaultValue={config.ollama_base_url || 'http://localhost:11434'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary LLM Model</label>
              <select
                defaultValue={config.default_model}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="llama3.2:latest">Llama 3.2 (Default - Recommended)</option>
                <option value="mistral:latest">Mistral 7B Instruct</option>
                <option value="gemma2:9b">Google Gemma 2 (9B)</option>
                <option value="qwen2.5:7b">Qwen 2.5 (Multilingual Specialist)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">STT Engine</label>
              <input
                type="text"
                disabled
                value="Faster-Whisper (CUDA / Int8 CPU Streaming)"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Multilingual Voice Personas Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Volume2 className="w-4 h-4 text-purple-600" />
          <h2 className="text-sm font-bold text-slate-800">Multilingual Voice Personas (TTS)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {config.supported_languages?.map((lang: any) => (
            <div key={lang.code} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">{lang.name} ({lang.native_name})</span>
                <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                  {lang.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mb-2">Voice: {lang.voice}</p>
              <div className="p-2 bg-white rounded-lg border border-slate-100 text-[10px] text-slate-600 italic">
                "{config.refusals?.[lang.code]?.slice(0, 75)}..."
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};

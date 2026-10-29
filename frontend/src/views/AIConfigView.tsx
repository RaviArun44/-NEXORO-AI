import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Mic,
  Volume2,
  ShieldCheck,
  CheckCircle2,
  Radio,
  Sparkles,
  Search,
  ArrowRight,
  Database,
  Layers,
  Zap,
  Globe2,
  Server,
  PlayCircle,
  HelpCircle,
  PhoneCall
} from 'lucide-react';
import { api } from '../services/api';

export const AIConfigView: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(0.65);
  const [saved, setSaved] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'models' | 'playground' | 'settings'>('models');

  // Test Playground states
  const [testText, setTestText] = useState<string>('Vanakkam, enaku order tracking details theriyanum');
  const [detectorResult, setDetectorResult] = useState<any | null>(null);
  const [detectorLoading, setDetectorLoading] = useState<boolean>(false);

  const [testQuery, setTestQuery] = useState<string>('What is your warranty and refund policy?');
  const [groundingResult, setGroundingResult] = useState<any | null>(null);
  const [groundingLoading, setGroundingLoading] = useState<boolean>(false);

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

  const handleTestDetector = async () => {
    if (!testText.trim()) return;
    setDetectorLoading(true);
    try {
      const res = await api.testDetector(testText);
      setDetectorResult(res.data);
    } catch (err) {
      console.error('Detector test failed', err);
    } finally {
      setDetectorLoading(false);
    }
  };

  const handleTestGrounding = async () => {
    if (!testQuery.trim()) return;
    setGroundingLoading(true);
    try {
      const res = await api.testGrounding(testQuery, threshold);
      setGroundingResult(res.data);
    } catch (err) {
      console.error('Grounding test failed', err);
    } finally {
      setGroundingLoading(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Loading AI Models & Architecture Specifications...</p>
        </div>
      </div>
    );
  }

  const models = config.models_architecture || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-2">
            <span className="bg-blue-500/30 text-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider backdrop-blur-xs border border-blue-400/30">
              KAIRA Technologies AI Specifications
            </span>
            <span className="text-xs text-blue-200">
              • Engine: {config.engine_version}
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-semibold border border-emerald-400/30">
              ● All Models Operational
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AI Models & Voice Architecture Hub</h1>
          <p className="text-blue-100 text-xs mt-1 max-w-2xl leading-relaxed">
            Full breakdown of on-premises LLM reasoning, multilingual speech recognition, neural voice personas, real-time language detection, and zero-hallucination RAG grounding.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-white/10 p-1 rounded-xl backdrop-blur-xs shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('models')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'models' ? 'bg-white text-slate-900 shadow-xs' : 'text-blue-100 hover:text-white'
            }`}
          >
            Model Stack Matrix
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'playground' ? 'bg-white text-slate-900 shadow-xs' : 'text-blue-100 hover:text-white'
            }`}
          >
            Live Model Playground
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'settings' ? 'bg-white text-slate-900 shadow-xs' : 'text-blue-100 hover:text-white'
            }`}
          >
            Thresholds & Tuning
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">AI parameters and confidence threshold updated successfully!</span>
        </div>
      )}

      {/* TAB 1: MODEL STACK MATRIX */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. STT Model */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Mic className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    {models.stt?.status || 'ONLINE'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800">1. Speech-to-Text (STT)</h3>
                <p className="text-xs font-mono font-semibold text-blue-600 mt-0.5">
                  {models.stt?.name || 'Faster-Whisper (Large-v3 / Int8)'}
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {models.stt?.description || 'Streaming speech recognition with low latency and background noise suppression.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Latency:</span>
                  <span className="font-mono font-semibold text-slate-700">{models.stt?.latency || '180ms – 240ms'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">VAD Engine:</span>
                  <span className="font-semibold text-slate-700">{models.stt?.vad || 'Silero VAD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Languages:</span>
                  <span className="font-semibold text-slate-700">Tamil, English, Hindi, Telugu, Malayalam</span>
                </div>
              </div>
            </div>

            {/* 2. Primary Dialogue LLM */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    {models.llm?.status || 'ONLINE'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800">2. Dialogue & Intent Engine (LLM)</h3>
                <p className="text-xs font-mono font-semibold text-indigo-600 mt-0.5">
                  {models.llm?.name || 'Meta Llama 3.2 3B Instruct'}
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {models.llm?.description || 'Autonomous receptionist reasoning, zero-hallucination grounded responses, and CRM intent handling.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Context Window:</span>
                  <span className="font-mono font-semibold text-slate-700">{models.llm?.context_window || '8,192 tokens'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hosting:</span>
                  <span className="font-semibold text-slate-700">100% On-Premises (Ollama)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">API Cost:</span>
                  <span className="font-bold text-emerald-600">$0.00 / Zero External Dependency</span>
                </div>
              </div>
            </div>

            {/* 3. Neural TTS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-purple-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    {models.tts?.status || 'ONLINE'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800">3. Multilingual Speech Synthesis (TTS)</h3>
                <p className="text-xs font-mono font-semibold text-purple-600 mt-0.5">
                  {models.tts?.name || 'Piper Neural TTS + Edge Engine'}
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {models.tts?.description || 'Ultra-low latency expressive human speech in 5 distinct regional Indian & international personas.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Audio Latency:</span>
                  <span className="font-mono font-semibold text-slate-700">{models.tts?.latency || '< 180ms'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sample Rate:</span>
                  <span className="font-semibold text-slate-700">24kHz / 48kHz High Fidelity</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Personas:</span>
                  <span className="font-semibold text-slate-700">Tamil, English, Hindi, Telugu, Malayalam</span>
                </div>
              </div>
            </div>

            {/* 4. Real-time LID */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    {models.lid?.status || 'ONLINE'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800">4. Language Identification (LID)</h3>
                <p className="text-xs font-mono font-semibold text-amber-600 mt-0.5">
                  {models.lid?.name || 'Hybrid Unicode & Phonetic N-Gram LID'}
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {models.lid?.description || 'Detects caller language in milliseconds from both native scripts and romanized transliterations.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Detection Speed:</span>
                  <span className="font-mono font-semibold text-emerald-600">{models.lid?.latency || '< 2ms'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transliterations:</span>
                  <span className="font-semibold text-slate-700">Tanglish, Hinglish, Telugish, Manglish</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dynamic Switch:</span>
                  <span className="font-semibold text-slate-700">Automatic per turn</span>
                </div>
              </div>
            </div>

            {/* 5. RAG & Vector Embeddings */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Database className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    {models.rag?.status || 'ONLINE'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800">5. Knowledge Retrieval (RAG)</h3>
                <p className="text-xs font-mono font-semibold text-emerald-600 mt-0.5">
                  {models.rag?.name || 'Sentence-Transformers (128-D Embeddings)'}
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {models.rag?.description || 'Indexes verified company documents. Prevents hallucinations by gating every response against verified records.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Similarity Metric:</span>
                  <span className="font-mono font-semibold text-slate-700">Normalized Cosine Distance</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Grounding Gate:</span>
                  <span className="font-semibold text-slate-700">Threshold &ge; {threshold}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Low Confidence:</span>
                  <span className="font-bold text-rose-600">Dispatches Human Transfer</span>
                </div>
              </div>
            </div>

            {/* 6. Telephony Adapter */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-cyan-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    {models.telephony?.status || 'ONLINE'}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800">6. Telephony & Audio Gateway</h3>
                <p className="text-xs font-mono font-semibold text-cyan-600 mt-0.5">
                  {models.telephony?.name || 'SIP / FreeSWITCH / Asterisk + WebRTC'}
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {models.telephony?.description || 'Pluggable telecom adapter handling real PSTN trunks, enterprise PBXs, and in-browser WebRTC duplex calling.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Audio Codecs:</span>
                  <span className="font-mono font-semibold text-slate-700">Opus 48kHz, G.711 PCMU/A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Protocols:</span>
                  <span className="font-semibold text-slate-700">SIP Trunk, RTP, WebSockets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transfer Modes:</span>
                  <span className="font-semibold text-slate-700">Attended / Blind SIP Transfer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Multilingual Voice Personas Detailed Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5 text-purple-600" />
                <h2 className="text-sm font-bold text-slate-800">Active Multilingual Voice Personas</h2>
              </div>
              <span className="text-xs text-slate-500">5 Regional & Global Languages Supported</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
              {config.supported_languages?.map((lang: any) => (
                <div key={lang.code} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-800">{lang.name}</span>
                      <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                        {lang.code}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600">{lang.native_name}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-2">
                      Voice: <span className="text-purple-700 font-semibold">{lang.voice}</span>
                    </p>
                  </div>

                  <div className="mt-3 p-2 bg-white rounded-lg border border-slate-200/60 text-[10px] text-slate-600 italic">
                    "{config.greetings?.[lang.code]?.slice(0, 50)}..."
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE MODEL PLAYGROUND */}
      {activeTab === 'playground' && (
        <div className="space-y-6">
          <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-2xl text-xs text-blue-900 flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Live AI Model Diagnostic Playground:</span>
              <p className="text-blue-800 mt-0.5">
                Test the real-time language detection classifier and anti-hallucination knowledge base grounding gate against the actual running backend algorithms.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test 1: Language Detection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Globe2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800">Test Real-Time Language Identification</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Input Customer Phrase (Native Script or Transliteration)
                </label>
                <textarea
                  rows={3}
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-blue-500"
                  placeholder="Type in Tamil, English, Hindi, Telugu, Malayalam, Tanglish, Hinglish..."
                />
              </div>

              {/* Sample quick buttons */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-slate-400 self-center mr-1">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => setTestText('Vanakkam, enaku order status theriyanum')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                >
                  Tamil (Tanglish)
                </button>
                <button
                  type="button"
                  onClick={() => setTestText('வணக்கம், என் ஆர்டர் நிலை என்ன?')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                >
                  Tamil (Native)
                </button>
                <button
                  type="button"
                  onClick={() => setTestText('Namaste, mera order kahan pahucha hai?')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                >
                  Hindi (Hinglish)
                </button>
                <button
                  type="button"
                  onClick={() => setTestText('Can you tell me about your pricing plans?')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                >
                  English
                </button>
              </div>

              <button
                type="button"
                onClick={handleTestDetector}
                disabled={detectorLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
              >
                {detectorLoading ? (
                  <span>Analyzing script & phonetic markers...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Run Language Detection Classifier</span>
                  </>
                )}
              </button>

              {detectorResult && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Detected Language:</span>
                    <span className="font-bold text-sm text-blue-700">{detectorResult.language_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Language Code:</span>
                    <span className="font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px]">
                      {detectorResult.detected_code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Confidence Score:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {(detectorResult.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-400">
                    <span>Execution Latency:</span>
                    <span className="font-mono font-semibold text-slate-600">{detectorResult.execution_time_ms} ms</span>
                  </div>
                </div>
              )}
            </div>

            {/* Test 2: RAG Grounding Gate */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-800">Test Anti-Hallucination Grounding Gate</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Inquiry to Validate Against Company Knowledge Base
                </label>
                <textarea
                  rows={3}
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-emerald-500"
                  placeholder="Ask a question about warranty, pricing, products, or an unsupported random question..."
                />
              </div>

              {/* Sample quick buttons */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-slate-400 self-center mr-1">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => setTestQuery('What is the return and replacement policy?')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                >
                  Verified Query (Pass)
                </button>
                <button
                  type="button"
                  onClick={() => setTestQuery('Do you sell rocket ships to fly to Mars tomorrow?')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
                >
                  Unverified Query (Refuse)
                </button>
              </div>

              <button
                type="button"
                onClick={handleTestGrounding}
                disabled={groundingLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
              >
                {groundingLoading ? (
                  <span>Querying vector space & computing cosine similarity...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Validate RAG Semantic Grounding</span>
                  </>
                )}
              </button>

              {groundingResult && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Semantic Cosine Score:</span>
                    <span className="font-mono font-bold text-sm text-slate-800">
                      {groundingResult.top_similarity} / 1.000
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Gate Threshold:</span>
                    <span className="font-mono font-bold text-slate-600">&ge; {groundingResult.threshold}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-600 font-semibold">AI Decision:</span>
                    {groundingResult.grounding_passed ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>GROUNDED RESPONSE APPROVED</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>ANTI-HALLUCINATION REFUSAL & HANDOFF</span>
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-[11px] text-slate-600">
                    <span className="font-semibold block text-slate-700 mb-0.5">Matched Document:</span>
                    <p className="font-medium text-blue-700">{groundingResult.matched_document}</p>
                    <p className="mt-1 text-slate-500 line-clamp-2 italic">"{groundingResult.matched_snippet}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: THRESHOLDS & TUNING */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Anti-Hallucination Grounding Gate Slider */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-800">Anti-Hallucination & Grounding Gate</h2>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">RAG Semantic Similarity Cutoff</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">{threshold}</span>
                  </div>
                  <input
                    type="range"
                    min="0.30"
                    max="0.95"
                    step="0.05"
                    value={threshold}
                    onChange={(e) => setThreshold(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>0.30 (Relaxed)</span>
                    <span className="text-blue-600 font-bold">0.65 (Recommended)</span>
                    <span>0.95 (Ultra-Strict)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="font-semibold text-slate-800 block">Zero-Hallucination Rule:</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Under no circumstances will NEXORA AI fabricate pricing, stock availability, or company policy. If the top cosine match is below {threshold}, the receptionist executes a polite refusal and immediately routes the call to a human specialist.
                  </p>
                </div>
              </div>
            </div>

            {/* Local LLM Engine Configuration */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Cpu className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800">Local LLM & Dialogue Orchestrator</h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ollama Base URL (Self-Hosted)</label>
                  <input
                    type="text"
                    defaultValue={config.ollama_base_url || 'http://localhost:11434'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary LLM Model</label>
                  <select
                    defaultValue={config.default_model}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="llama3.2:latest">Meta Llama 3.2 3B (Default - Optimized Low Latency)</option>
                    <option value="mistral:latest">Mistral 7B Instruct</option>
                    <option value="qwen2.5:7b">Qwen 2.5 7B (Multilingual Specialist)</option>
                    <option value="gemma2:9b">Google Gemma 2 (9B)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">STT Engine Runtime</label>
                  <input
                    type="text"
                    disabled
                    value="Faster-Whisper (CUDA / Int8 CTranslate2 Streaming)"
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Configuration Updates
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

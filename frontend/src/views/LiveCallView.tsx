import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Headphones,
  Send,
  Radio,
  FileText,
  Server,
  Zap,
  Play
} from 'lucide-react';
import { api } from '../services/api';
import { NexoraAvatar } from '../components/layout/NexoraAvatar';

interface Turn {
  speaker: string;
  text: string;
  timestamp: string;
  language?: string;
  grounded?: boolean;
  sources?: string[];
  intent?: string;
  sentiment?: string;
}

export const LiveCallView: React.FC = () => {
  const [callActive, setCallActive] = useState<boolean>(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [callerNumber, setCallerNumber] = useState<string>('+91 (44) 6789-0199');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [lastLatency, setLastLatency] = useState<number>(195);
  const [handoffTriggered, setHandoffTriggered] = useState<boolean>(false);
  const [handoffReason, setHandoffReason] = useState<string>('');

  // Concurrency Simulation States
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  const timerRef = useRef<any>(null);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Duration timer
  useEffect(() => {
    if (callActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive]);

  // Speech playback helper: uses backend neural TTS audio URL first, then browser fallback
  const speakText = (text: string, langCode: string, audioUrl?: string) => {
    if (audioMuted) return;

    // Halt any active speech first
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          setIsSpeaking(false);
          fallbackWebSpeech(text, langCode);
        };
        audio.play().catch(() => fallbackWebSpeech(text, langCode));
        return;
      } catch {
        fallbackWebSpeech(text, langCode);
        return;
      }
    }

    fallbackWebSpeech(text, langCode);
  };

  const fallbackWebSpeech = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = {
      en: 'en-IN',
      ta: 'ta-IN',
      hi: 'hi-IN',
      te: 'te-IN',
      ml: 'ml-IN'
    };
    utterance.lang = langMap[langCode] || 'en-US';
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleStartCall = async () => {
    try {
      setHandoffTriggered(false);
      setHandoffReason('');
      const res = await api.startCall(callerNumber, selectedLanguage);
      const data = res.data;
      setCallId(data.call_id);
      setCallActive(true);

      const initialTurn: Turn = {
        speaker: 'ai',
        text: data.greeting_text,
        timestamp: new Date().toLocaleTimeString(),
        language: data.language,
        grounded: true,
        sources: ['Khaira Company Virtual Assistant Greeting']
      };
      setTranscript([initialTurn]);

      speakText(data.greeting_text, data.language, data.tts?.audio_url);
    } catch (err: any) {
      console.error('Failed to start live call', err);
      alert(err.response?.data?.detail || 'Failed to start call. Concurrency queue limit reached.');
    }
  };

  const handleEndCall = async () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    if (callId) {
      try {
        await api.endCall(callId, handoffTriggered ? 'HANDOFF_TO_HUMAN' : 'RESOLVED_BY_AI');
      } catch (err) {
        console.error('Failed to end call', err);
      }
    }
    setCallActive(false);
    setCallId(null);
  };

  const handleBargeIn = async () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    if (callId) {
      try {
        await api.bargeIn(callId);
      } catch (err) {
        console.error('Barge-in error', err);
      }
    }
  };

  const handleSendTurn = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || !callId) return;

    // Immediately stop AI speech if user starts speaking (barge-in)
    handleBargeIn();

    const startTime = performance.now();
    const userTurn: Turn = {
      speaker: 'customer',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };
    setTranscript((prev) => [...prev, userTurn]);
    setInputQuery('');

    try {
      const res = await api.sendTurn(callId, textToSend, selectedLanguage);
      const elapsed = Math.round(performance.now() - startTime);
      setLastLatency(elapsed);

      const data = res.data;
      const aiTurn: Turn = {
        speaker: 'ai',
        text: data.reply_text,
        timestamp: new Date().toLocaleTimeString(),
        language: data.language,
        grounded: data.grounded,
        sources: data.sources,
        intent: data.intent,
        sentiment: data.sentiment
      };
      setTranscript((prev) => [...prev, aiTurn]);

      if (data.trigger_handoff) {
        setHandoffTriggered(true);
        setHandoffReason(data.handoff_reason || 'Call transferred to senior human specialist');
      }

      speakText(data.reply_text, data.language, data.tts?.audio_url);

      if (data.is_terminal) {
        setTimeout(() => {
          handleEndCall();
        }, 3500);
      }
    } catch (err) {
      console.error('Error processing turn', err);
    }
  };

  // Browser speech recognition (STT) toggle
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can type in any language below.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      const langMap: Record<string, string> = {
        en: 'en-IN',
        ta: 'ta-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        ml: 'ml-IN',
        auto: 'en-IN'
      };
      recognition.lang = langMap[selectedLanguage] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          handleSendTurn(text);
        }
      };

      recognition.start();
    } catch (e) {
      console.error('STT error', e);
      setIsListening(false);
    }
  };

  const handleRunLoadSimulation = async (count: number) => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await api.simulateLoad(count, 12);
      setSimResult(res.data);
    } catch (err) {
      console.error('Simulation failed', err);
    } finally {
      setSimulating(false);
    }
  };

  const sampleScenarios = [
    { label: 'English: Warranty & SLA Policy', query: 'What is your warranty and refund policy on hardware?' },
    { label: 'Tamil: தயாரிப்பு விவரம் & விலை', query: 'Ultra-HD headset விலை என்ன மற்றும் இருப்பு உள்ளதா?' },
    { label: 'Tanglish: Code-Mixed Tamil Order', query: 'Vanakkam, ennoda order ORD-849201 status theriyuma?' },
    { label: 'Hindi: आर्डर ट्रैकिंग एवं डिलीवरी', query: 'नमस्ते, मेरे आर्डर ORD-849201 की वर्तमान स्थिति बताइए।' },
    { label: 'Hinglish: Code-Mixed Hindi Courier', query: 'Namaste, mera parcel courier tracking details bataiye please.' },
    { label: 'Telugu: డెలివరీ సమాచారం', query: 'నమస్కారం, నా ఆర్డర్ డెలివరీ ఎప్పుడు వస్తుంది?' },
    { label: 'Teluglish: Code-Mixed Telugu', query: 'Namaskaram, naa product delivery eppudu vastundi?' },
    { label: 'Malayalam: ഓർഡർ വിവരങ്ങൾ', query: 'നമസ്കാരം, എന്റെ ഓർഡർ ORD-739120 വിവരങ്ങൾ അറിയണം.' },
    { label: 'Manglish: Code-Mixed Malayalam', query: 'Namaskaram, ente complaint status onnu parayamo?' },
    { label: 'Complaint: Broken Device Ticket', query: 'I have a complaint, my device arrived damaged and broken' },
    { label: 'Appointment: Enterprise Demo Booking', query: 'I want to schedule an appointment for a demo session tomorrow' },
    { label: 'Urgent: Production Outage Emergency', query: 'This is an urgent emergency, our enterprise system is completely down!' },
    { label: 'Wrap-Up: Natural Call Closing', query: 'Thank you so much for your help, goodbye!' },
    { label: 'Human Specialist Transfer Request', query: 'I would like to speak to a senior human customer manager.' },
    { label: 'Unknown Question (Strict Grounding Refusal)', query: 'What is the private home address of your CEO?' },
  ];

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Khaira AI Voice Call Studio</h1>
          <p className="text-xs text-slate-500">
            Interactive full-duplex voice testing with automatic language detection, barge-in, and neural speech synthesis.
          </p>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
          <Languages className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-600">Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="auto">Auto-Detect (Tamil, English, Hindi, Telugu, Malayalam)</option>
            <option value="en">English (Indian / Global)</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="hi">Hindi (हिन्दी)</option>
            <option value="te">Telugu (తెలుగు)</option>
            <option value="ml">Malayalam (മലയാളം)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Softphone Console & Audio Visualizer (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center text-center">
            {/* Robot Avatar with speech halo */}
            <div className="mt-2">
              <NexoraAvatar size="xl" isSpeaking={isSpeaking} />
            </div>

            <h2 className="text-lg font-bold text-slate-800 mt-4">Khaira AI Voice Assistant</h2>
            <p className="text-xs text-slate-500">Autonomous Enterprise Voice Automation</p>

            {/* Call Status Badge */}
            <div className="mt-3">
              {callActive ? (
                <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Call In Progress • {formatSeconds(callDuration)}</span>
                </div>
              ) : (
                <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                  Ready to Connect • Idle
                </div>
              )}
            </div>

            {/* Audio Waveform Animation */}
            <div className="w-full h-16 bg-slate-50 rounded-xl my-5 flex items-center justify-center space-x-1 px-4 border border-slate-100 overflow-hidden">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isSpeaking
                      ? 'bg-blue-600 h-8 wave-bar'
                      : isListening
                        ? 'bg-cyan-500 h-6 wave-bar'
                        : 'bg-slate-200 h-2'
                  }`}
                  style={{
                    animationDelay: `${(i % 5) * 0.15}s`,
                    height: isSpeaking ? `${Math.max(10, Math.sin(i * 0.5) * 36 + 10)}px` : undefined
                  }}
                />
              ))}
            </div>

            {/* Caller Number Input */}
            <div className="w-full">
              <label className="block text-left text-xs font-semibold text-slate-600 mb-1">
                Caller Phone Number:
              </label>
              <input
                type="text"
                value={callerNumber}
                disabled={callActive}
                onChange={(e) => setCallerNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Softphone Action Controls */}
            <div className="flex items-center justify-center space-x-3 mt-6 w-full">
              {!callActive ? (
                <button
                  onClick={handleStartCall}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Start Voice Call</span>
                </button>
              ) : (
                <>
                  {/* Interrupt / Barge-In Button */}
                  <button
                    onClick={handleBargeIn}
                    title="Barge-in / Interrupt AI speech"
                    className="p-3 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl transition-all cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Interrupt</span>
                  </button>

                  {/* Microphone STT Toggle */}
                  <button
                    onClick={toggleSpeechRecognition}
                    title="Toggle Microphone"
                    className={`p-3 rounded-xl text-white transition-all cursor-pointer ${
                      isListening ? 'bg-cyan-500 ring-4 ring-cyan-200' : 'bg-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>

                  {/* Audio Mute Speaker Toggle */}
                  <button
                    onClick={() => setAudioMuted(!audioMuted)}
                    title="Toggle Speaker Output"
                    className={`p-3 rounded-xl transition-all cursor-pointer ${
                      audioMuted ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* Hang Up Button */}
                  <button
                    onClick={handleEndCall}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 shadow-sm shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Hang Up</span>
                  </button>
                </>
              )}
            </div>

            {/* Latency & Telemetry */}
            <div className="w-full mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Response Latency</span>
                <p className="text-xs font-mono font-bold text-slate-700">{lastLatency} ms</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Neural Audio</span>
                <p className="text-xs font-mono font-bold text-emerald-600">Edge-TTS HD</p>
              </div>
            </div>
          </div>

          {/* High-Volume Concurrency Simulator Tool */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span>High-Volume Call Load Simulator</span>
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Stress-test the platform's async queue and verify 1,000 concurrent call capacity.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={simulating}
                onClick={() => handleRunLoadSimulation(50)}
                className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 font-semibold text-xs py-2 rounded-xl transition-all border border-slate-200 cursor-pointer"
              >
                50 Calls
              </button>
              <button
                disabled={simulating}
                onClick={() => handleRunLoadSimulation(150)}
                className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 font-semibold text-xs py-2 rounded-xl transition-all border border-slate-200 cursor-pointer"
              >
                150 Calls
              </button>
              <button
                disabled={simulating}
                onClick={() => handleRunLoadSimulation(300)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                300 Calls
              </button>
            </div>

            {simResult && (
              <div className="mt-3 p-2.5 bg-blue-50 rounded-xl text-[11px] text-blue-900 border border-blue-200 font-mono">
                ✓ {simResult.simulated_calls} calls processed in {simResult.total_elapsed_seconds}s ({simResult.calls_per_second_throughput} calls/sec)
              </div>
            )}
          </div>

          {/* Quick Click Multilingual Test Scenarios */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Instant Test Scenarios</span>
            </h3>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {sampleScenarios.map((sc, idx) => (
                <button
                  key={idx}
                  disabled={!callActive}
                  onClick={() => handleSendTurn(sc.query)}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-all border ${
                    callActive
                      ? 'bg-slate-50 hover:bg-blue-50/70 border-slate-200/70 text-slate-700 cursor-pointer'
                      : 'bg-slate-50/50 border-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <p className="font-semibold text-slate-800">{sc.label}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{sc.query}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Turn-by-Turn Transcript & Grounding Sources (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-[750px] bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Transcript Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Live Conversation Transcript</span>
              </h2>
              <p className="text-xs text-slate-500">Autonomous multi-turn dialogue with verified Khaira facts</p>
            </div>
            {handoffTriggered && (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-full animate-pulse flex items-center space-x-1">
                <Headphones className="w-3.5 h-3.5" />
                <span>Specialist Escalation Logged</span>
              </span>
            )}
          </div>

          {/* Transcript Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
                <Phone className="w-10 h-10 text-slate-200 mb-2" />
                <p className="text-sm font-medium">Click "Start Voice Call" to begin speaking with Khaira AI.</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  You can speak naturally in English, Tamil, Hindi, Telugu, or Malayalam, or pick any of the quick test scenarios on the left.
                </p>
              </div>
            ) : (
              transcript.map((turn, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${turn.speaker === 'customer' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-1 px-1">
                    <span className="font-semibold text-slate-600">
                      {turn.speaker === 'customer' ? 'Customer (Caller)' : 'Khaira AI Voice'}
                    </span>
                    <span>•</span>
                    <span>{turn.timestamp}</span>
                    {turn.language && (
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border border-blue-200">
                        {turn.language}
                      </span>
                    )}
                    {turn.sentiment && (
                      <span className="bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                        {turn.sentiment}
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                      turn.speaker === 'customer'
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-slate-50 text-slate-800 rounded-bl-xs border border-slate-200'
                    }`}
                  >
                    <p>{turn.text}</p>

                    {/* Grounding Attribution & Intent Badge */}
                    {turn.grounded !== undefined && (
                      <div className="mt-2 pt-2 border-t border-slate-200/50 flex flex-wrap items-center gap-1.5 text-[11px]">
                        {turn.grounded ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>100% Verified Khaira Knowledge</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Headphones className="w-3.5 h-3.5 text-amber-600" />
                            <span>Outside Verified Knowledge Base</span>
                          </span>
                        )}

                        {turn.intent && (
                          <span className="bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                            {turn.intent.replace(/_/g, ' ')}
                          </span>
                        )}

                        {turn.sources && turn.sources.length > 0 && (
                          <span className="text-slate-500 text-[10px]">
                            Source: {turn.sources.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={transcriptBottomRef} />
          </div>

          {/* Interactive Text Input Box for Manual Queries or STT text */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendTurn();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder={callActive ? "Speak or type in Tamil, English, Hindi, Telugu, Malayalam..." : "Start voice call first..."}
                disabled={!callActive}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!callActive || !inputQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  Play,
  Pause,
  ImagePlus,
  X,
  Image as ImageIcon,
  CheckCircle2
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
  audio_url?: string;
  images?: string[];
}

interface StagedImage {
  file: File;
  previewUrl: string;
  name: string;
  sizeKb: number;
}

export const LiveCallView: React.FC = () => {
  const [callActive, setCallActive] = useState<boolean>(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [callerNumber, setCallerNumber] = useState<string>('+91 (44) 6789-0199');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [autoPlayVoice, setAutoPlayVoice] = useState<boolean>(true);
  const [playingTurnIndex, setPlayingTurnIndex] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, isAnalyzing]);

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
  const speakText = (text: string, langCode: string, audioUrl?: string, turnIndex?: number) => {
    if (audioMuted) return;

    // Halt any active speech first
    stopActiveAudio();

    if (turnIndex !== undefined) {
      setPlayingTurnIndex(turnIndex);
    }

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          setPlayingTurnIndex(null);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setPlayingTurnIndex(null);
          fallbackWebSpeech(text, langCode, turnIndex);
        };
        audio.play().catch(() => fallbackWebSpeech(text, langCode, turnIndex));
        return;
      } catch {
        fallbackWebSpeech(text, langCode, turnIndex);
        return;
      }
    }

    fallbackWebSpeech(text, langCode, turnIndex);
  };

  const stopActiveAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setPlayingTurnIndex(null);
  };

  const fallbackWebSpeech = (text: string, langCode: string, turnIndex?: number) => {
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
    utterance.onstart = () => {
      setIsSpeaking(true);
      if (turnIndex !== undefined) setPlayingTurnIndex(turnIndex);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setPlayingTurnIndex(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setPlayingTurnIndex(null);
    };
    window.speechSynthesis.speak(utterance);
  };

  const togglePlayTurnAudio = (turn: Turn, index: number) => {
    if (playingTurnIndex === index) {
      stopActiveAudio();
    } else {
      speakText(turn.text, turn.language || selectedLanguage, turn.audio_url, index);
    }
  };

  // Image File Selection (supports 2 or more images)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    const newStaged: StagedImage[] = filesArray.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      sizeKb: Math.round(file.size / 1024)
    }));

    setStagedImages((prev) => [...prev, ...newStaged]);
    // Reset input value so re-selecting same file works
    e.target.value = '';
  };

  const removeStagedImage = (index: number) => {
    setStagedImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
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
        sources: ['Khaira Company Virtual Assistant Greeting'],
        audio_url: data.tts?.audio_url
      };
      setTranscript([initialTurn]);

      if (autoPlayVoice) {
        speakText(data.greeting_text, data.language, data.tts?.audio_url, 0);
      }
    } catch (err: any) {
      console.error('Failed to start live call', err);
      alert(err.response?.data?.detail || 'Failed to start call. Concurrency queue limit reached.');
    }
  };

  const handleEndCall = async () => {
    stopActiveAudio();
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
    stopActiveAudio();
    if (callId) {
      try {
        await api.bargeIn(callId);
      } catch (err) {
        console.error('Barge-in error', err);
      }
    }
  };

  const handleSendTurn = async (queryText?: string) => {
    const rawText = (queryText !== undefined ? queryText : inputQuery).trim();
    if (!rawText && stagedImages.length === 0) return;

    // Halt active speech on new user message (barge-in)
    handleBargeIn();

    setIsAnalyzing(true);
    const startTime = performance.now();

    // 1. Upload Staged Images first (if any)
    let uploadedUrls: string[] = [];
    if (stagedImages.length > 0) {
      try {
        const formData = new FormData();
        stagedImages.forEach((img) => {
          formData.append('files', img.file);
        });
        const uploadRes = await api.uploadImages(formData);
        uploadedUrls = (uploadRes.data.images || []).map((img: any) => img.file_url);
      } catch (uploadErr) {
        console.error('Image upload failed', uploadErr);
      }
    }

    const defaultPrompt = stagedImages.length >= 2
      ? `Please compare and analyze these ${stagedImages.length} uploaded images in detail.`
      : stagedImages.length === 1
        ? 'Please inspect and analyze this uploaded image with Vision AI.'
        : rawText;

    const textToSend = rawText || defaultPrompt;

    // Record Customer Turn
    const userTurn: Turn = {
      speaker: 'customer',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
      images: uploadedUrls
    };

    setTranscript((prev) => [...prev, userTurn]);
    setInputQuery('');
    setStagedImages([]);

    try {
      // Auto-start session if not active yet
      let activeCallId = callId;
      if (!callActive || !activeCallId) {
        try {
          const initRes = await api.startCall(callerNumber, selectedLanguage);
          activeCallId = initRes.data.call_id;
          setCallId(activeCallId);
          setCallActive(true);
        } catch (initErr) {
          console.warn('Auto start call error, using turn auto-create fallback', initErr);
        }
      }

      const res = await api.sendTurn(activeCallId, textToSend, selectedLanguage, uploadedUrls);
      const elapsed = Math.round(performance.now() - startTime);
      setLastLatency(elapsed);

      const data = res.data;
      if (data.call_id && !callId) {
        setCallId(data.call_id);
        setCallActive(true);
      }

      const aiTurn: Turn = {
        speaker: 'ai',
        text: data.reply_text,
        timestamp: new Date().toLocaleTimeString(),
        language: data.language,
        grounded: data.grounded,
        sources: data.sources,
        intent: data.intent,
        sentiment: data.sentiment,
        audio_url: data.tts?.audio_url
      };

      setTranscript((prev) => {
        const updated = [...prev, aiTurn];
        const newIndex = updated.length - 1;
        if (autoPlayVoice && !audioMuted) {
          speakText(data.reply_text, data.language, data.tts?.audio_url, newIndex);
        }
        return updated;
      });

      if (data.trigger_handoff) {
        setHandoffTriggered(true);
        setHandoffReason(data.handoff_reason || 'Call transferred to senior human specialist');
      }

      if (data.is_terminal) {
        setTimeout(() => {
          handleEndCall();
        }, 3500);
      }
    } catch (err: any) {
      console.error('Error processing turn', err);
      // Ensure the user never receives a blank interface on network failure
      const errorTurn: Turn = {
        speaker: 'ai',
        text: 'I received your request, but experienced a momentary network delay. Please let me know how I can assist you further.',
        timestamp: new Date().toLocaleTimeString(),
        language: 'en',
        grounded: true,
        sources: ['Khaira System Resilience Engine']
      };
      setTranscript((prev) => [...prev, errorTurn]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Browser speech recognition (STT) toggle
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can type in any language or upload images below.');
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
    { label: 'Multimodal: 2 Image Upload Guidance', query: 'How do I upload multiple images for comparative analysis?' },
    { label: 'English: Warranty & SLA Policy', query: 'What is your warranty and refund policy on hardware?' },
    { label: 'Tamil: தயாரிப்பு விவரம் & விலை', query: 'Ultra-HD headset விலை என்ன மற்றும் இருப்பு உள்ளதா?' },
    { label: 'Tanglish: Code-Mixed Tamil Order', query: 'Vanakkam, ennoda order ORD-849201 status theriyuma?' },
    { label: 'Hindi: आर्डर ट्रैकिंग एवं डिलीवरी', query: 'नमस्ते, मेरे आर्डर ORD-849201 की वर्तमान स्थिति बताइए।' },
    { label: 'Hinglish: Code-Mixed Hindi Courier', query: 'Namaste, mera parcel courier tracking details bataiye please.' },
    { label: 'Telugu: డెలివరీ సమాచారం', query: 'నమస్కారం, నా ఆర్డర్ డెలివరీ ఎప్పుడు వస్తుంది?' },
    { label: 'Malayalam: ഓർഡർ വിവരങ്ങൾ', query: 'നമസ്കാരം, എന്റെ ഓർഡർ ORD-739120 വിവരങ്ങൾ അറിയണം.' },
    { label: 'General: Explain Voice Automation', query: 'Can you explain how conversational AI voice agents work?' },
    { label: 'Complaint: Broken Device Ticket', query: 'I have a complaint, my device arrived damaged and broken' },
    { label: 'Appointment: Enterprise Demo Booking', query: 'I want to schedule an appointment for a demo session tomorrow' },
    { label: 'Urgent: Production Outage Emergency', query: 'This is an urgent emergency, our enterprise system is completely down!' },
    { label: 'Human Specialist Transfer Request', query: 'I would like to speak to a senior human customer manager.' },
    { label: 'Confidential Inquiry (Strict Privacy Refusal)', query: 'What is the internal private home address of your CEO?' }
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
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-800">Khaira AI Multimodal Voice Studio</h1>
            <span className="bg-blue-100 text-blue-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full border border-blue-200">
              Voice + Vision v2.1
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full-duplex multilingual conversational AI, multimodal vision analysis (2+ images), and neural text-to-speech.
          </p>
        </div>

        {/* Global Controls: Language Selector & Auto-Play Voice Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Play Voice Toggle Switch */}
          <button
            onClick={() => setAutoPlayVoice(!autoPlayVoice)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
              autoPlayVoice
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle automatic neural voice playback on AI responses"
          >
            {autoPlayVoice ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span>Voice Auto-Play: <span className={autoPlayVoice ? 'text-blue-700 font-bold' : 'text-slate-400'}>{autoPlayVoice ? 'ON' : 'OFF'}</span></span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Softphone Console & Audio Visualizer (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center text-center">
            {/* Robot Avatar with speech halo */}
            <div className="mt-2">
              <NexoraAvatar size="xl" isSpeaking={isSpeaking} />
            </div>

            <h2 className="text-lg font-bold text-slate-800 mt-4">Khaira AI Voice & Vision</h2>
            <p className="text-xs text-slate-500">Multimodal Autonomous Enterprise Agent</p>

            {/* Call Status Badge */}
            <div className="mt-3">
              {callActive ? (
                <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Active Session • {formatSeconds(callDuration)}</span>
                </div>
              ) : (
                <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                  Ready to Converse • Idle
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
                        : isAnalyzing
                          ? 'bg-purple-500 h-4 wave-bar'
                          : 'bg-slate-200 h-2'
                  }`}
                  style={{
                    animationDelay: `${(i % 5) * 0.15}s`,
                    height: isSpeaking
                      ? `${Math.max(10, Math.sin(i * 0.5) * 36 + 10)}px`
                      : isAnalyzing
                        ? `${Math.max(6, Math.cos(i * 0.4) * 20 + 8)}px`
                        : undefined
                  }}
                />
              ))}
            </div>

            {/* Caller Number Input */}
            <div className="w-full">
              <label className="block text-left text-xs font-semibold text-slate-600 mb-1">
                Customer Phone Number:
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
                    onClick={() => {
                      if (!audioMuted) stopActiveAudio();
                      setAudioMuted(!audioMuted);
                    }}
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
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Neural Speech & Vision</span>
                <p className="text-xs font-mono font-bold text-emerald-600">Edge-TTS + Vision AI</p>
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
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {sampleScenarios.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendTurn(sc.query)}
                  className="w-full text-left p-2 rounded-xl text-xs transition-all border bg-slate-50 hover:bg-blue-50/70 border-slate-200/70 text-slate-700 cursor-pointer"
                >
                  <p className="font-semibold text-slate-800">{sc.label}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{sc.query}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Turn-by-Turn Transcript & Multimodal Input (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-[750px] bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Transcript Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Multimodal Conversation Stream</span>
              </h2>
              <p className="text-xs text-slate-500">Autonomous multi-turn dialogue with Vision AI & Speech Synthesis</p>
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
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3 border border-blue-100">
                  <Sparkles className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Khaira Multimodal AI Ready</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Upload two or more images for Vision AI inspection, speak naturally in 5 languages, or type any question below.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="bg-slate-100 text-slate-600 text-[11px] px-2.5 py-1 rounded-full font-medium">
                    📸 Multi-Image Vision
                  </span>
                  <span className="bg-slate-100 text-slate-600 text-[11px] px-2.5 py-1 rounded-full font-medium">
                    🔊 Text-to-Speech Audio
                  </span>
                  <span className="bg-slate-100 text-slate-600 text-[11px] px-2.5 py-1 rounded-full font-medium">
                    🌐 Tamil & English AI
                  </span>
                </div>
              </div>
            ) : (
              transcript.map((turn, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${turn.speaker === 'customer' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-1 px-1">
                    <span className="font-semibold text-slate-600">
                      {turn.speaker === 'customer' ? 'Customer' : 'Khaira AI'}
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
                    {/* Render Uploaded Images if turn contains them */}
                    {turn.images && turn.images.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center space-x-1.5 mb-1.5 text-xs font-semibold opacity-90">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Uploaded Images ({turn.images.length})</span>
                        </div>
                        <div className={`grid gap-2 ${turn.images.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {turn.images.map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="relative rounded-xl overflow-hidden border border-white/20 bg-black/10 aspect-4/3 flex items-center justify-center"
                            >
                              <img
                                src={imgUrl}
                                alt={`Upload ${imgIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                                Image #{imgIdx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Turn text */}
                    <p className="whitespace-pre-line">{turn.text}</p>

                    {/* AI Controls: Speaker Play/Pause/Replay Button */}
                    {turn.speaker === 'ai' && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                        {/* Play / Pause / Replay Audio Button */}
                        <button
                          onClick={() => togglePlayTurnAudio(turn, i)}
                          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            playingTurnIndex === i
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white hover:bg-blue-50 text-slate-700 border border-slate-200'
                          }`}
                          title={playingTurnIndex === i ? "Pause voice output" : "Play/Replay natural neural voice"}
                        >
                          {playingTurnIndex === i ? (
                            <>
                              <Pause className="w-3.5 h-3.5 text-white" />
                              <span className="text-[11px] font-semibold">Pause Audio</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-[11px] font-medium">Listen Voice</span>
                            </>
                          )}
                        </button>

                        {/* Grounding Attribution & Intent Badge */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          {turn.grounded ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Verified AI</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <Headphones className="w-3 h-3 text-amber-600" />
                              <span>Outside KB</span>
                            </span>
                          )}

                          {turn.intent && (
                            <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded text-[9px] font-semibold uppercase">
                              {turn.intent.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Loading / Vision Analyzing Indicator */}
            {isAnalyzing && (
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 px-1">
                  <span className="font-semibold text-slate-600">Khaira AI Voice & Vision</span>
                  <span>•</span>
                  <span className="text-blue-600 font-medium">Processing...</span>
                </div>
                <div className="bg-blue-50/70 border border-blue-200 text-blue-900 rounded-2xl rounded-bl-xs px-4 py-3 text-sm flex items-center space-x-3 shadow-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    {stagedImages.length > 0
                      ? 'Analyzing uploaded images with Vision AI & synthesizing speech...'
                      : 'Khaira AI is thinking & generating voice response...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={transcriptBottomRef} />
          </div>

          {/* Staged Image Preview Bar (Appears when 1, 2, or more images are selected) */}
          {stagedImages.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50/90 flex items-center space-x-3 overflow-x-auto">
              <div className="shrink-0 flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-700">
                  {stagedImages.length} Image{stagedImages.length > 1 ? 's' : ''} Staged:
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {stagedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group shrink-0 rounded-xl overflow-hidden border border-slate-300 bg-white shadow-2xs"
                  >
                    <img src={img.previewUrl} alt={img.name} className="w-14 h-14 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeStagedImage(idx)}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 cursor-pointer shadow-xs"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] truncate px-1 py-0.5 text-center">
                      {img.sizeKb} KB
                    </span>
                  </div>
                ))}
              </div>
              {stagedImages.length >= 2 && (
                <span className="text-[11px] bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full border border-purple-200 shrink-0 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-purple-600" />
                  <span>Multi-Image Compare Active</span>
                </span>
              )}
            </div>
          )}

          {/* Interactive Chat Message Input Bar */}
          <div className="p-3 border-t border-slate-200 bg-white">
            {/* Hidden multi-image file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*"
              className="hidden"
            />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendTurn();
              }}
              className="flex items-center space-x-2"
            >
              {/* Image Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload 2 or more images for Multimodal Vision AI"
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
                  stagedImages.length > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-slate-50 border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600'
                }`}
              >
                <ImagePlus className="w-4 h-4" />
              </button>

              {/* Message text input */}
              <input
                type="text"
                placeholder={
                  stagedImages.length > 0
                    ? `Ask a question about your ${stagedImages.length} image(s)...`
                    : 'Type a message or question in Tamil, English, Hindi, Telugu, Malayalam...'
                }
                value={inputQuery}
                disabled={isAnalyzing}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={isAnalyzing || (!inputQuery.trim() && stagedImages.length === 0)}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                title="Send message"
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

import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Package,
  Calendar,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Search,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  CreditCard,
  History,
  Send,
  Radio,
  FileText,
  User,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, Order, Product, Appointment, Complaint, CallRecord } from '../services/api';
import { NexoraAvatar } from '../components/layout/NexoraAvatar';

export const CustomerDashboardView: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'call' | 'orders' | 'products' | 'appointments' | 'complaints' | 'history' | 'faqs'>('call');

  // Call state
  const [callState, setCallState] = useState<'IDLE' | 'CALLING' | 'WAITING' | 'CONNECTING' | 'ACTIVE' | 'ENDED'>('IDLE');
  const [callId, setCallId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speakerEnabled, setSpeakerEnabled] = useState<boolean>(true);
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; language?: string }>>([]);
  const [userSpeechInput, setUserSpeechInput] = useState<string>('');
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [callSummary, setCallSummary] = useState<any | null>(null);

  // Business Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Forms
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  const [apptService, setApptService] = useState('Enterprise PBX Integration Consultation');
  const [apptDate, setApptDate] = useState('2026-11-02 10:30');
  const [apptSuccess, setApptSuccess] = useState(false);

  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load customer initial records
  useEffect(() => {
    loadCustomerData();
  }, [user]);

  // Duration Timer
  useEffect(() => {
    if (callState === 'ACTIVE') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const loadCustomerData = async () => {
    setLoadingData(true);
    try {
      const [ordRes, prodRes, apptRes, compRes, callRes] = await Promise.all([
        api.listOrders(),
        api.listProducts(),
        api.listAppointments(),
        api.listComplaints(),
        api.listCalls({ search: user?.phone || undefined })
      ]);
      setOrders(ordRes.data);
      setProducts(prodRes.data);
      setAppointments(apptRes.data);
      setComplaints(compRes.data);
      setCallHistory(callRes.data);
    } catch (e) {
      console.error('Error loading customer dashboard data', e);
    } finally {
      setLoadingData(false);
    }
  };

  // Start Call Flow
  const handleStartCall = async () => {
    try {
      setCallState('CALLING');
      setTranscript([]);
      setCallDuration(0);
      setCallSummary(null);

      // 1. Request microphone permission
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop track right away after obtaining permission
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch (micErr) {
        console.warn('Microphone permission request skipped or not granted, continuing with browser voice', micErr);
      }

      setCallState('WAITING');

      // 2. Request Call session from backend (which signals Agent Consoles)
      const res = await api.requestCall({
        caller_number: user?.phone || '+1-415-555-0142',
        caller_name: user?.full_name || 'Customer',
        language: selectedLanguage,
        customer_id: user?.id
      });

      const newCallId = res.data.call_id;
      setCallId(newCallId);

      // 3. Connect to call session (Auto-connecting / establishing connection)
      setCallState('CONNECTING');

      // Accept call immediately for autonomous AI receptionist
      const acceptRes = await api.acceptCall(newCallId, 'ai-receptionist');
      setCallState('ACTIVE');

      const greetingText = acceptRes.data.greeting_text || 'Welcome to Khaira Company! My name is Khaira AI, your autonomous voice assistant. How may I assist you today?';
      setTranscript([
        { speaker: 'ai', text: greetingText, language: selectedLanguage }
      ]);

      // Play neural TTS audio if present
      if (acceptRes.data.tts?.audio_url && speakerEnabled) {
        playAiAudio(acceptRes.data.tts.audio_url);
      }

      // Initialize Web Speech Recognition if available in browser
      initSpeechRecognition(newCallId);

    } catch (err: any) {
      console.error('Call initialization failed', err);
      alert(err.response?.data?.detail || 'Unable to establish call with AI Receptionist. Please try again.');
      setCallState('IDLE');
    }
  };

  const playAiAudio = (url: string) => {
    setIsAiSpeaking(true);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => console.log('Audio autoplay prevented by browser'));
    audio.onended = () => {
      setIsAiSpeaking(false);
    };
  };

  const initSpeechRecognition = (cId: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      const langMap: Record<string, string> = {
        en: 'en-US',
        ta: 'ta-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        ml: 'ml-IN'
      };
      recognition.lang = langMap[selectedLanguage] || 'en-US';

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript.trim();
        if (text && !isMuted) {
          handleSendTurn(text, cId);
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition start error', e);
      }
    }
  };

  const handleSendTurn = async (text: string, currentCallId?: string) => {
    const activeId = currentCallId || callId;
    if (!text.trim() || !activeId || callState !== 'ACTIVE') return;

    // Add user turn to transcript immediately
    setTranscript((prev) => [...prev, { speaker: 'customer', text }]);
    setUserSpeechInput('');

    try {
      const res = await api.sendTurn(activeId, text, selectedLanguage);
      const data = res.data;

      setTranscript((prev) => [
        ...prev,
        { speaker: 'ai', text: data.reply_text, language: data.language }
      ]);

      if (data.tts?.audio_url && speakerEnabled) {
        playAiAudio(data.tts.audio_url);
      }

      if (data.is_terminal) {
        setTimeout(() => handleEndCall(), 2500);
      }
    } catch (e) {
      console.error('Failed to send turn', e);
    }
  };

  const handleEndCall = async () => {
    if (!callId) {
      setCallState('IDLE');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const res = await api.endCall(callId, 'RESOLVED_BY_AI');
      setCallSummary(res.data);
    } catch (e) {
      console.warn('End call error', e);
    }

    setCallState('ENDED');
    loadCustomerData();
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTitle.trim() || !complaintDesc.trim()) return;
    try {
      await api.createComplaint({
        customer_id: user?.id,
        title: complaintTitle,
        description: complaintDesc,
        category: 'Service Request',
        priority: 'MEDIUM'
      });
      setComplaintTitle('');
      setComplaintDesc('');
      setComplaintSuccess(true);
      setTimeout(() => setComplaintSuccess(false), 3000);
      loadCustomerData();
    } catch (e) {
      alert('Failed to register complaint ticket');
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAppointment({
        customer_id: user?.id,
        service_name: apptService,
        scheduled_time: apptDate,
        duration_minutes: 30,
        location_type: 'ONLINE_VOICE',
        notes: `Booked by ${user?.full_name} via Customer Self-Service Portal`
      });
      setApptSuccess(true);
      setTimeout(() => setApptSuccess(false), 3000);
      loadCustomerData();
    } catch (e) {
      alert('Failed to schedule appointment');
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Customer Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-slate-50 rounded-xl border border-slate-200">
              <img src="/kaira-logo.png" alt="KAIRA" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm bg-gradient-to-r from-blue-700 to-sky-600 bg-clip-text text-transparent">
                  NEXORA Customer Portal
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  Client Hub
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Autonomous 24/7 AI Voice Assistance</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            {/* Live AI Status Pill */}
            <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>AI Receptionist Online & Ready</span>
            </div>

            {/* Profile Info */}
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {user?.full_name?.charAt(0) || 'C'}
              </div>
              <div className="hidden md:block text-left">
                <p className="font-bold text-slate-800 text-xs leading-none">{user?.full_name}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user?.phone || user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="ml-2 text-xs font-semibold text-slate-500 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto border-t border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('call')}
            className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${activeSubTab === 'call'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call AI Agent</span>
          </button>

          <button
            onClick={() => setActiveSubTab('orders')}
            className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${activeSubTab === 'orders'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>My Orders & Delivery</span>
            {orders.length > 0 && (
              <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {orders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('products')}
            className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${activeSubTab === 'products'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Product Catalog</span>
          </button>

          <button
            onClick={() => setActiveSubTab('appointments')}
            className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${activeSubTab === 'appointments'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Appointments Desk</span>
          </button>

          <button
            onClick={() => setActiveSubTab('complaints')}
            className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${activeSubTab === 'complaints'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Support & Tickets</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${activeSubTab === 'history'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Call History & Transcripts</span>
          </button>

          <button
            onClick={() => setActiveSubTab('faqs')}
            className={`py-2.5 px-4 border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${activeSubTab === 'faqs'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help & FAQs</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* SUBTAB 1: CALL AI AGENT */}
        {activeSubTab === 'call' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Call Hero & Controls */}
            <div className="lg:col-span-2 space-y-5">
              {/* Call Action Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center space-x-1.5 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold text-blue-700">
                      <Radio className="w-3.5 h-3.5 animate-pulse text-blue-600" />
                      <span>Zero-Wait Telephony Line</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                      Speak with NEXORA Voice Receptionist
                    </h1>
                    <p className="text-xs text-slate-500 max-w-md">
                      Ask about orders, delivery statuses, product quotes, consultation appointments, or request a human specialist in 5 languages.
                    </p>

                    {/* Language selector */}
                    <div className="pt-2 flex items-center justify-center sm:justify-start space-x-2">
                      <span className="text-xs font-semibold text-slate-600">Language:</span>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        disabled={callState === 'ACTIVE'}
                        className="px-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English (Indian English)</option>
                        <option value="ta">Tamil (தமிழ்)</option>
                        <option value="hi">Hindi (हिन्दी)</option>
                        <option value="te">Telugu (తెలుగు)</option>
                        <option value="ml">Malayalam (മലയാളം)</option>
                      </select>
                    </div>
                  </div>

                  {/* Big Call Button & Avatar */}
                  <div className="flex flex-col items-center shrink-0">
                    {callState === 'IDLE' || callState === 'ENDED' ? (
                      <button
                        onClick={handleStartCall}
                        className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-blue-500/30 flex flex-col items-center justify-center space-y-1.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer ring-8 ring-blue-50"
                      >
                        <PhoneCall className="w-8 h-8 animate-bounce" />
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">CALL AI</span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center space-y-3">
                        <div className="relative">
                          <NexoraAvatar size="lg" />
                          <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white animate-pulse"></span>
                        </div>
                        <button
                          onClick={handleEndCall}
                          className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                        >
                          <PhoneOff className="w-4 h-4" />
                          <span>Hang Up</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Call Status Bar */}
                {callState !== 'IDLE' && (
                  <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] tracking-wider ${callState === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                          : callState === 'ENDED'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-100 text-amber-700 animate-bounce'
                        }`}>
                        {callState}
                      </span>
                      {callState === 'ACTIVE' && (
                        <div className="flex items-center space-x-1 text-slate-500 font-mono font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatSeconds(callDuration)}</span>
                        </div>
                      )}
                      {isAiSpeaking && (
                        <span className="text-sky-600 font-semibold text-[11px] flex items-center space-x-1">
                          <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                          <span>AI Speaking...</span>
                        </span>
                      )}
                    </div>

                    {/* Audio Controls */}
                    {callState === 'ACTIVE' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${isMuted
                              ? 'bg-rose-50 border-rose-200 text-rose-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                        >
                          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setSpeakerEnabled(!speakerEnabled)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${!speakerEnabled
                              ? 'bg-rose-50 border-rose-200 text-rose-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          title={speakerEnabled ? 'Mute AI Audio' : 'Enable AI Audio'}
                        >
                          {speakerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Real-Time Live Transcript Screen */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col h-96">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800">Live Voice Conversation Transcript</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {transcript.length} turns recorded
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
                  {transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs space-y-2">
                      <NexoraAvatar size="md" />
                      <p className="font-medium text-slate-600">No active conversation yet.</p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Click the "CALL AI" button above to start a live voice call with the AI Receptionist.
                      </p>
                    </div>
                  ) : (
                    transcript.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${item.speaker === 'customer' ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                          {item.speaker === 'customer' ? 'You' : 'Khaira AI Receptionist'}
                        </span>
                        <div
                          className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed ${item.speaker === 'customer'
                              ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                              : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/80'
                            }`}
                        >
                          {item.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Text Message Fallback in Call */}
                {callState === 'ACTIVE' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendTurn(userSpeechInput);
                    }}
                    className="pt-3 border-t border-slate-100 flex items-center space-x-2"
                  >
                    <input
                      type="text"
                      placeholder="Or type a question (e.g. 'Where is order ORD-849201?')..."
                      value={userSpeechInput}
                      onChange={(e) => setUserSpeechInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Call Ended Summary Banner */}
                {callState === 'ENDED' && callSummary && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-emerald-800 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Call Concluded Successfully ({callSummary.duration_seconds}s)</span>
                    </p>
                    <p className="text-[11px] text-emerald-700">{callSummary.summary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Quick Customer Info & Fast Actions */}
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{user?.full_name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{user?.phone}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Orders</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{orders.length}</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Tickets</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{complaints.length}</p>
                  </div>
                </div>
              </div>

              {/* Sample Voice Queries to Try */}
              <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-3xl p-5 border border-blue-200 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Try Asking the AI Voice Agent:</span>
                </div>
                <div className="space-y-2 text-xs">
                  <button
                    onClick={() => handleSendTurn('Where is my order ORD-849201?')}
                    className="w-full text-left p-2.5 bg-white/90 hover:bg-white rounded-xl border border-blue-200/70 text-slate-700 transition-all cursor-pointer font-medium hover:border-blue-400 shadow-2xs"
                  >
                    💬 "Where is my order ORD-849201?"
                  </button>
                  <button
                    onClick={() => handleSendTurn('What products are currently in stock?')}
                    className="w-full text-left p-2.5 bg-white/90 hover:bg-white rounded-xl border border-blue-200/70 text-slate-700 transition-all cursor-pointer font-medium hover:border-blue-400 shadow-2xs"
                  >
                    💬 "What products are currently in stock?"
                  </button>
                  <button
                    onClick={() => handleSendTurn('என் ஆர்டர் ORD-739120 எங்கே உள்ளது?')}
                    className="w-full text-left p-2.5 bg-white/90 hover:bg-white rounded-xl border border-blue-200/70 text-slate-700 transition-all cursor-pointer font-medium hover:border-blue-400 shadow-2xs"
                  >
                    💬 "என் ஆர்டர் ORD-739120 எங்கே உள்ளது?" (Tamil)
                  </button>
                  <button
                    onClick={() => handleSendTurn('I want to schedule an appointment for a demo session tomorrow')}
                    className="w-full text-left p-2.5 bg-white/90 hover:bg-white rounded-xl border border-blue-200/70 text-slate-700 transition-all cursor-pointer font-medium hover:border-blue-400 shadow-2xs"
                  >
                    💬 "Book a demo appointment for tomorrow"
                  </button>
                  <button
                    onClick={() => handleSendTurn('Please connect me to a human specialist')}
                    className="w-full text-left p-2.5 bg-white/90 hover:bg-white rounded-xl border border-blue-200/70 text-slate-700 transition-all cursor-pointer font-medium hover:border-blue-400 shadow-2xs"
                  >
                    💬 "Please transfer me to a human specialist"
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: ORDERS & TRACKING */}
        {activeSubTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Your Orders & Deliveries</h2>
                <p className="text-xs text-slate-500">Track shipments, view courier numbers, and check delivery dates.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-blue-700">{ord.order_number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ord.status === 'SHIPPED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : ord.status === 'DELIVERED'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                      {ord.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600">
                    <p className="font-semibold text-slate-800">
                      Amount: {ord.currency} {ord.total_amount.toFixed(2)} ({ord.payment_status})
                    </p>
                    <p>Courier: <span className="font-medium text-slate-800">{ord.courier_name || 'FedEx Express'}</span></p>
                    <p className="font-mono text-[11px]">Tracking: <span className="text-blue-600 font-bold">{ord.tracking_number}</span></p>
                    <p className="text-[11px] text-slate-400">Shipping to: {ord.shipping_address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 3: PRODUCT CATALOG */}
        {activeSubTab === 'products' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Company Product Catalog & Hardware</h2>
              <p className="text-xs text-slate-500">Official catalog verified for the AI Receptionist knowledge base.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{p.sku}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {p.stock_quantity} in stock
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">{p.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900">{p.currency} {p.price.toFixed(2)}</span>
                    <button
                      onClick={() => {
                        setActiveSubTab('call');
                        handleSendTurn(`Tell me more about ${p.name} and warranty terms`);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      Ask AI about this →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 4: APPOINTMENTS */}
        {activeSubTab === 'appointments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Scheduled Appointments</h2>
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div key={appt.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                        {appt.appointment_number}
                      </span>
                      <h4 className="font-bold text-xs text-slate-800">{appt.service_name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {appt.scheduled_time} ({appt.duration_minutes} mins)
                      </p>
                      <p className="text-[10px] text-slate-400">{appt.notes}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {appt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Book Slot Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-3">
              <h3 className="font-bold text-sm text-slate-800">Book New Consultation</h3>
              {apptSuccess && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs">
                  Appointment scheduled successfully!
                </div>
              )}
              <form onSubmit={handleBookAppointment} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service</label>
                  <select
                    value={apptService}
                    onChange={(e) => setApptService(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Enterprise PBX Integration Consultation">Enterprise PBX Consultation</option>
                    <option value="Khaira Enterprise AI Solution Architecture Demo">AI Solution Architecture Demo</option>
                    <option value="Hardware Gateway Warranty Inspection">Hardware Warranty Inspection</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date & Time</label>
                  <input
                    type="text"
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Confirm Appointment
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SUBTAB 5: COMPLAINTS */}
        {activeSubTab === 'complaints' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Your Support Tickets & Disputes</h2>
              <div className="space-y-3">
                {complaints.map((comp) => (
                  <div key={comp.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-rose-600">{comp.ticket_number}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {comp.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-800">{comp.title}</h4>
                    <p className="text-xs text-slate-600">{comp.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Register Complaint Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-3">
              <h3 className="font-bold text-sm text-slate-800">Register Support Ticket</h3>
              {complaintSuccess && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs">
                  Ticket created and escalated to support!
                </div>
              )}
              <form onSubmit={handleCreateComplaint} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief issue summary..."
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Details</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe your issue or dispute in detail..."
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Submit Ticket
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SUBTAB 6: CALL HISTORY */}
        {activeSubTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Your Previous AI Voice Conversations</h2>
            <div className="space-y-3">
              {callHistory.map((call) => (
                <div key={call.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400 text-[11px]">{call.created_at}</span>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                      {call.language}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    {call.summary || 'Customer inquiry addressed by AI receptionist.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 7: HELP & FAQS */}
        {activeSubTab === 'faqs' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Frequently Asked Questions</h2>
            <div className="space-y-3 text-xs">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <h4 className="font-bold text-slate-800">How does the AI voice receptionist work?</h4>
                <p className="text-slate-600 leading-relaxed">
                  Our system combines Faster-Whisper automatic speech recognition, neural language detection, and on-premises LLaMA reasoning with 100% grounded company documents to answer questions accurately without hallucinating.
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <h4 className="font-bold text-slate-800">What is the return and replacement policy?</h4>
                <p className="text-slate-600 leading-relaxed">
                  All NEXORA hardware devices carry an unconditional 2-year manufacturer warranty. You may request returns within 30 days of delivery in original packaging. Express replacement units ship within 2 business days.
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <h4 className="font-bold text-slate-800">Can I speak in languages other than English?</h4>
                <p className="text-slate-600 leading-relaxed">
                  Yes! We natively support English, Tamil (தமிழ்), Hindi (हिन्दी), Telugu (తెలుగు), and Malayalam (മലയാളം) with automatic language detection.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

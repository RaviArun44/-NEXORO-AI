import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Mic,
  MicOff,
  Volume2,
  Headphones,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Package,
  Calendar,
  AlertOctagon,
  Search,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Send,
  Radio,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, CallRecord, Customer, Order, Appointment, Complaint } from '../services/api';
import { NexoraAvatar } from '../components/layout/NexoraAvatar';

export const AgentConsoleView: React.FC = () => {
  const { user, logout } = useAuth();
  const [agentStatus, setAgentStatus] = useState<'AVAILABLE' | 'ON_CALL' | 'BREAK' | 'OFFLINE'>('AVAILABLE');

  // Real-time incoming call queue
  const [incomingCalls, setIncomingCalls] = useState<any[]>([]);
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [agentReplyInput, setAgentReplyInput] = useState<string>('');

  // Lookup data & tools
  const [activeToolTab, setActiveToolTab] = useState<'orders' | 'appointments' | 'complaints' | 'knowledge' | 'outbound'>('orders');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([]);

  // Search queries for lookups
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Outbound Call State
  const [outboundPhone, setOutboundPhone] = useState<string>('+1-415-555-0142');
  const [outboundPurpose, setOutboundPurpose] = useState<string>('Appointment Reminder');
  const [outboundStarting, setOutboundStarting] = useState<boolean>(false);

  // Transfer state
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferDept, setTransferDept] = useState<string>('Senior Technical Support');
  const [transferReason, setTransferReason] = useState<string>('Customer requested escalation');

  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);

  // Load backend data and connect WebSocket for live calls
  useEffect(() => {
    loadConsoleData();
    pollPendingCalls();

    // Setup polling for incoming calls every 2 seconds
    const interval = setInterval(pollPendingCalls, 2000);
    return () => clearInterval(interval);
  }, []);

  // Duration Timer
  useEffect(() => {
    if (activeCall) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeCall]);

  const loadConsoleData = async () => {
    try {
      const [custRes, ordRes, apptRes, compRes, callRes] = await Promise.all([
        api.listCustomers(),
        api.listOrders(),
        api.listAppointments(),
        api.listComplaints(),
        api.listCalls({ limit: 8 })
      ]);
      setCustomers(custRes.data);
      setOrders(ordRes.data);
      setAppointments(apptRes.data);
      setComplaints(compRes.data);
      setRecentCalls(callRes.data);
    } catch (e) {
      console.warn('Failed to load console data', e);
    }
  };

  const pollPendingCalls = async () => {
    try {
      const res = await api.getPendingCallRequests();
      setIncomingCalls(res.data || []);
      if (res.data && res.data.length > 0 && !activeCall) {
        playIncomingChime();
      }
    } catch (e) {
      // ignore transient network hiccups
    }
  };

  const playIncomingChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  const handleAcceptCall = async (callId: string) => {
    try {
      const res = await api.acceptCall(callId, user?.id || 'agent-current');
      setActiveCall(res.data);
      setAgentStatus('ON_CALL');
      setTranscript(res.data.transcript || []);
      setIncomingCalls((prev) => prev.filter((c) => c.id !== callId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to accept call');
    }
  };

  const handleRejectCall = async (callId: string) => {
    try {
      await api.rejectCall(callId, 'Rejected by agent');
      setIncomingCalls((prev) => prev.filter((c) => c.id !== callId));
    } catch (err) {
      console.error('Failed to reject call', err);
    }
  };

  const handleSendAgentReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentReplyInput.trim() || !activeCall) return;

    const text = agentReplyInput;
    setAgentReplyInput('');

    try {
      const res = await api.sendTurn(activeCall.id || activeCall.call_id, text, activeCall.language || 'en');
      setTranscript(res.data.transcript || [
        ...transcript,
        { speaker: 'customer', text },
        { speaker: 'ai', text: res.data.reply_text }
      ]);
    } catch (err) {
      console.error('Error sending agent reply', err);
    }
  };

  const handleEndActiveCall = async () => {
    if (!activeCall) return;
    try {
      const cId = activeCall.id || activeCall.call_id;
      await api.endCall(cId, 'RESOLVED_BY_AI');
      setActiveCall(null);
      setAgentStatus('AVAILABLE');
      loadConsoleData();
    } catch (e) {
      setActiveCall(null);
      setAgentStatus('AVAILABLE');
    }
  };

  const handleStartOutboundCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutboundStarting(true);
    try {
      const res = await api.startCall(outboundPhone, 'en');
      setActiveCall(res.data);
      setAgentStatus('ON_CALL');
      setTranscript([
        {
          speaker: 'ai',
          text: `Outbound call initiated to ${outboundPhone} regarding: ${outboundPurpose}`
        }
      ]);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to start outbound call');
    } finally {
      setOutboundStarting(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Console Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-700">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent">
                  NEXORA AI Agent Console
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                  Operator Desk
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Live Voice Reception & Telephony Dispatch</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Availability State Selector */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 font-semibold text-[11px]">Status:</span>
              <select
                value={agentStatus}
                onChange={(e: any) => setAgentStatus(e.target.value)}
                className={`px-3 py-1 text-xs font-bold rounded-xl border focus:outline-none ${
                  agentStatus === 'AVAILABLE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : agentStatus === 'ON_CALL'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                }`}
              >
                <option value="AVAILABLE">● Available (Accepting Calls)</option>
                <option value="ON_CALL">● In Live Call</option>
                <option value="BREAK">● On Break</option>
                <option value="OFFLINE">○ Offline</option>
              </select>
            </div>

            {/* Profile & Sign Out */}
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-200 text-xs">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shadow-xs">
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-bold text-slate-800 leading-none">{user?.full_name}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ext. {user?.extension || '101'}</p>
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
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Real-time Incoming Call Alert Banner */}
        {incomingCalls.length > 0 && (
          <div className="space-y-3">
            {incomingCalls.map((call) => (
              <div
                key={call.id}
                className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <PhoneIncoming className="w-6 h-6 animate-pulse text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm uppercase tracking-wide">
                        Incoming Customer Call Request
                      </span>
                      <span className="text-[10px] bg-white/30 text-white px-2 py-0.5 rounded-full font-mono uppercase">
                        {call.language || 'EN'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-100 mt-0.5">
                      Caller: <span className="font-bold text-white">{call.caller_name || 'Customer'}</span> ({call.caller_number})
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleAcceptCall(call.id)}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept & Connect Call</span>
                  </button>
                  <button
                    onClick={() => handleRejectCall(call.id)}
                    className="px-4 py-2 bg-rose-500/80 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Active Call Screen & Live Transcript (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Active Call Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-2xl ${
                    activeCall ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">
                      {activeCall ? 'Active Voice Reception Channel' : 'Reception Channel Idle'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {activeCall
                        ? `Connected with ${activeCall.caller_number} in [${(activeCall.language || 'en').toUpperCase()}]`
                        : 'Waiting for incoming customer calls or dial outbound.'}
                    </p>
                  </div>
                </div>

                {activeCall && (
                  <div className="flex items-center space-x-2">
                    <div className="font-mono text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatSeconds(callDuration)}</span>
                    </div>
                    <button
                      onClick={handleEndActiveCall}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>End Call</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Live Transcript Stream */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 h-80 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Real-Time Conversation Stream</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {transcript.length} turns
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-2">
                  {transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs space-y-1">
                      <Headphones className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-500">No active audio transcript</p>
                      <p className="text-[11px]">When a customer calls or turns are spoken, live text streams here.</p>
                    </div>
                  ) : (
                    transcript.map((t, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${t.speaker === 'customer' ? 'items-start' : 'items-end'}`}
                      >
                        <span className="text-[10px] font-semibold text-slate-400 mb-0.5 px-1">
                          {t.speaker === 'customer' ? 'Customer' : 'AI Receptionist'}
                        </span>
                        <div
                          className={`p-2.5 rounded-xl max-w-sm text-xs leading-relaxed ${
                            t.speaker === 'customer'
                              ? 'bg-white border border-slate-200 text-slate-800'
                              : 'bg-indigo-600 text-white shadow-xs'
                          }`}
                        >
                          {t.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Agent Intervene / Speech Turn Input */}
                {activeCall && (
                  <form onSubmit={handleSendAgentReply} className="pt-2 border-t border-slate-200 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Type response for the AI voice to speak back to the customer..."
                      value={agentReplyInput}
                      onChange={(e) => setAgentReplyInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Quick Human Handoff Dispatch Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Specialist Human Escalation Desk</h4>
                  <p className="text-[11px] text-slate-500">Transfer complex or sensitive calls to a dedicated human department.</p>
                </div>
              </div>
              <button
                disabled={!activeCall}
                onClick={() => alert('Call escalated and dispatched to human specialist.')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Transfer to Human
              </button>
            </div>
          </div>

          {/* Right Column: Knowledge, Orders, Appointments & Outbound Lookups (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex flex-col h-[520px]">
              {/* Tool Switcher Tabs */}
              <div className="flex items-center space-x-1 pb-3 border-b border-slate-100 overflow-x-auto text-xs font-semibold">
                <button
                  onClick={() => setActiveToolTab('orders')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeToolTab === 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setActiveToolTab('appointments')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeToolTab === 'appointments' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Appointments
                </button>
                <button
                  onClick={() => setActiveToolTab('complaints')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeToolTab === 'complaints' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Complaints
                </button>
                <button
                  onClick={() => setActiveToolTab('outbound')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeToolTab === 'outbound' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Outbound Call
                </button>
              </div>

              {/* Tool Search Bar */}
              {activeToolTab !== 'outbound' && (
                <div className="pt-3 pb-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={`Search ${activeToolTab}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Content Panel */}
              <div className="flex-1 overflow-y-auto pt-2 space-y-2.5 text-xs">
                {activeToolTab === 'orders' && (
                  orders
                    .filter((o) => !searchQuery || o.order_number.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((ord) => (
                      <div key={ord.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-indigo-700">{ord.order_number}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          {ord.courier_name} • Track: <span className="font-mono font-bold text-slate-800">{ord.tracking_number}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Amount: {ord.currency} {ord.total_amount.toFixed(2)} ({ord.payment_status})
                        </p>
                      </div>
                    ))
                )}

                {activeToolTab === 'appointments' && (
                  appointments
                    .filter((a) => !searchQuery || a.service_name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((appt) => (
                      <div key={appt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-indigo-700">{appt.appointment_number}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                            {appt.status}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800">{appt.service_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{appt.scheduled_time}</p>
                      </div>
                    ))
                )}

                {activeToolTab === 'complaints' && (
                  complaints
                    .filter((c) => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((comp) => (
                      <div key={comp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-rose-600">{comp.ticket_number}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            {comp.status}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800">{comp.title}</p>
                        <p className="text-[11px] text-slate-500">{comp.description}</p>
                      </div>
                    ))
                )}

                {activeToolTab === 'outbound' && (
                  <form onSubmit={handleStartOutboundCall} className="space-y-3 pt-2">
                    <p className="text-[11px] text-slate-500">
                      Initiate an authorized automated outbound voice call to a customer using the AI receptionist.
                    </p>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Customer Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={outboundPhone}
                        onChange={(e) => setOutboundPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Call Purpose</label>
                      <select
                        value={outboundPurpose}
                        onChange={(e) => setOutboundPurpose(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Appointment Reminder">Appointment Reminder</option>
                        <option value="Order Dispatch Update">Order Dispatch Update</option>
                        <option value="Payment Confirmation">Payment Confirmation</option>
                        <option value="Customer Feedback">Customer Feedback</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={outboundStarting || !!activeCall}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <PhoneOutgoing className="w-4 h-4" />
                      <span>{outboundStarting ? 'Connecting...' : 'Dial Outbound Call'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};


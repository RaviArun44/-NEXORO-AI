import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  RotateCcw, 
  Volume2, 
  Play, 
  Pause, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Globe, 
  MessageSquare,
  FileText,
  AlertCircle,
  X
} from 'lucide-react';
import { api, AICallLog, AICallingStats } from '../services/api';

export const AICallingManagementView: React.FC = () => {
  const [logs, setLogs] = useState<AICallLog[]>([]);
  const [stats, setStats] = useState<AICallingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCall, setSelectedCall] = useState<AICallLog | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [retryLoading, setRetryLoading] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        api.getAICallLogs({
          search: search || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined
        }),
        api.getAICallingStats()
      ]);
      setLogs(logsRes.data);
      setStats(statsRes.data);
    } catch (e) {
      console.error("Failed to fetch AI calling logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleRetryCall = async (callId: string) => {
    try {
      setRetryLoading(callId);
      await api.retryAICall(callId);
      await fetchLogs();
    } catch (e) {
      console.error("Retry failed", e);
    } finally {
      setRetryLoading(null);
    }
  };

  const getLanguageLabel = (code: string) => {
    const map: Record<string, string> = {
      en: 'English',
      ta: 'Tamil (தமிழ்)',
      te: 'Telugu (తెలుగు)',
      ml: 'Malayalam (മലയാളം)',
      kn: 'Kannada (ಕನ್ನಡ)',
      hi: 'Hindi (हिन्दी)'
    };
    return map[code.toLowerCase()] || code.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Telemetry Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <PhoneCall className="w-5 h-5 text-blue-600" />
            <span>AI Voice Calling Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monitoring, multi-language neural recordings, transcripts, and retry dispatch.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer self-start transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Calls</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Calls</p>
          <p className="text-xl font-black text-slate-900 mt-1">{stats?.total_calls || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Completed</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{stats?.completed_calls || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase">Orders Confirmed</p>
          <p className="text-xl font-black text-blue-700 mt-1">{stats?.confirmed_orders || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase">Cancelled in Call</p>
          <p className="text-xl font-black text-rose-700 mt-1">{stats?.cancelled_orders || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase">Unanswered</p>
          <p className="text-xl font-black text-amber-700 mt-1">{stats?.unanswered_calls || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-indigo-600 uppercase">Avg Call Duration</p>
          <p className="text-xl font-black text-indigo-700 mt-1">{stats?.avg_duration_seconds || 0}s</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name, or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="INITIATED">Initiated</option>
            <option value="RINGING">Ringing</option>
            <option value="NOT_ANSWERED">Not Answered</option>
            <option value="FAILED">Failed</option>
            <option value="RETRY_SCHEDULED">Retry Scheduled</option>
          </select>
        </div>
      </div>

      {/* Call Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Call Status</th>
                <th className="py-3 px-4">Confirmation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading AI Voice Call records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No outbound AI voice calls found.
                  </td>
                </tr>
              ) : (
                logs.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{call.customer_name || 'Customer'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{call.customer_code}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {call.order_number || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {call.phone_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md text-[10px] inline-flex items-center space-x-1">
                        <Globe className="w-3 h-3 text-blue-500" />
                        <span>{getLanguageLabel(call.preferred_language)}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(call.call_initiation_time).toLocaleDateString()} {new Date(call.call_initiation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {call.duration_seconds}s
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          call.call_status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : call.call_status === 'NOT_ANSWERED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {call.call_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          call.confirmation_status === 'CONFIRMED'
                            ? 'text-emerald-700 bg-emerald-50'
                            : call.confirmation_status === 'CANCEL_REQUESTED'
                            ? 'text-rose-700 bg-rose-50'
                            : 'text-slate-500 bg-slate-100'
                        }`}
                      >
                        {call.confirmation_status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedCall(call)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer"
                          title="View Transcript & AI Summary"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleRetryCall(call.id)}
                          disabled={retryLoading === call.id}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer disabled:opacity-50"
                          title="Retry Outbound AI Call"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${retryLoading === call.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call Details & Transcript Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Call Details & AI Summary</h3>
                <p className="text-[11px] text-blue-100">
                  {selectedCall.customer_name} ({selectedCall.phone_number}) • Order {selectedCall.order_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Audio Player if available */}
              {selectedCall.recording_url && (
                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-900 font-bold">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    <span>Neural Edge-TTS Audio Recording</span>
                  </div>
                  <audio controls className="h-8 max-w-[200px]" src={selectedCall.recording_url} />
                </div>
              )}

              {/* AI Generated Summary */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  AI Contextual Conversation Summary
                </p>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {selectedCall.summary || 'Summary not recorded.'}
                </p>
              </div>

              {/* Full Multi-Turn Transcript */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Full Dialogue Transcript ({getLanguageLabel(selectedCall.preferred_language)})
                </p>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl max-h-56 overflow-y-auto space-y-2.5 divide-y divide-slate-800 text-xs">
                  {(selectedCall.transcript || []).map((msg, i) => (
                    <div key={i} className="pt-2 first:pt-0">
                      <div className="flex items-center space-x-1.5 text-[10px] font-bold">
                        <span className={msg.speaker === 'ai' ? 'text-sky-400' : 'text-emerald-400'}>
                          {msg.speaker === 'ai' ? '🤖 Khaira Voice AI' : `👤 ${selectedCall.customer_name || 'Customer'}`}
                        </span>
                        <span className="text-slate-500 font-normal">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                      <p className="mt-0.5 text-slate-200 leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedCall(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


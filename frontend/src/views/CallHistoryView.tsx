import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  MessageSquare,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { api, CallRecord } from '../services/api';

export const CallHistoryView: React.FC = () => {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDirection, setSelectedDirection] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const res = await api.listCalls({
        search: searchTerm || undefined,
        direction: selectedDirection || undefined,
        language: selectedLanguage || undefined
      });
      setCalls(res.data);
    } catch (err) {
      console.error('Failed to fetch call history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [selectedDirection, selectedLanguage]);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Call History & Recordings</h1>
          <p className="text-xs text-slate-500">
            Searchable historical transcripts, AI resolution summaries, and language distribution.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search phone number or conversation summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCalls()}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Direction Filter */}
        <select
          value={selectedDirection}
          onChange={(e) => setSelectedDirection(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
        >
          <option value="">All Directions</option>
          <option value="INBOUND">Inbound Calls</option>
          <option value="OUTBOUND">Outbound Calls</option>
        </select>

        {/* Language Filter */}
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
        >
          <option value="">All Languages</option>
          <option value="en">English</option>
          <option value="ta">Tamil (தமிழ்)</option>
          <option value="hi">Hindi (हिन्दी)</option>
          <option value="te">Telugu (తెలుగు)</option>
          <option value="ml">Malayalam (മലയാളം)</option>
        </select>

        <button
          onClick={fetchCalls}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          Apply Filters
        </button>
      </div>

      {/* Calls Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Direction & Caller</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Duration & Latency</th>
                <th className="py-3 px-4">AI Summary</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Transcript</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">Loading call records...</td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">No calls matching query.</td>
                </tr>
              ) : (
                calls.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${
                          c.direction === 'INBOUND' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {c.direction === 'INBOUND' ? <PhoneIncoming className="w-3.5 h-3.5" /> : <PhoneOutgoing className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{c.caller_number}</p>
                          <p className="text-[10px] text-slate-400">{c.direction}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase text-[10px]">
                        {c.language}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <p className="font-medium text-slate-700">{c.duration_seconds}s</p>
                      <p className="text-[10px] text-slate-400">{c.latency_ms} ms</p>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                      {c.summary || 'General business inquiry'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.outcome === 'RESOLVED_BY_AI'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.outcome?.replace(/_/g, ' ') || c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(c.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCall(c)}
                        className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-semibold px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcript Inspection Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Call Record: {selectedCall.caller_number}
                </h3>
                <p className="text-xs text-slate-500">
                  Duration: {selectedCall.duration_seconds}s • Language: {selectedCall.language.toUpperCase()} • Outcome: {selectedCall.outcome}
                </p>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 mb-2">
                <span className="font-bold">AI Executive Summary: </span>
                {selectedCall.summary || 'Inquiry addressed with grounded retrieval.'}
              </div>

              <div className="space-y-3">
                {selectedCall.transcript.map((turn, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      turn.speaker === 'customer'
                        ? 'bg-blue-600 text-white ml-8 rounded-br-xs'
                        : 'bg-slate-100 text-slate-800 mr-8 rounded-bl-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[10px] mb-1 opacity-80">
                      <span>{turn.speaker === 'customer' ? 'Customer' : 'Nexora AI'}</span>
                      <span>{turn.timestamp}</span>
                    </div>
                    <p>{turn.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedCall(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

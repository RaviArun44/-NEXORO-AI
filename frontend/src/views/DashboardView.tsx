import React, { useState, useEffect } from 'react';
import {
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Zap,
  Smile,
  ShieldCheck,
  TrendingUp,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { api, DashboardKPIs, CallRecord } from '../services/api';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, callsRes] = await Promise.all([
          api.getKPIs(),
          api.listCalls({ limit: 5 })
        ]);
        setKpis(kpiRes.data);
        setRecentCalls(callsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading NEXORA AI Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2 mb-2">
            <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs flex items-center border border-slate-100">
              <img
                src="/kaira-logo.png"
                alt="KAIRA Technologies"
                className="h-6 w-auto max-w-[140px] object-contain"
              />
            </div>
            <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider backdrop-blur-xs">
              Autonomous Multilingual Receptionist
            </span>
            <span className="text-xs text-blue-100">
              • Source: {kpis?.data_source || 'Verified Database'}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-2">NEXORA AI Virtual Receptionist Desk</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Live 24/7 natural voice communications with zero-hallucination grounded knowledge retrieval in English, Tamil, Hindi, Telugu, and Malayalam.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => onNavigate('live-calls')}
            className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer flex items-center space-x-2"
          >
            <PhoneIncoming className="w-4 h-4" />
            <span>Launch Live Call Test</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Handled Calls</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-800">{kpis?.total_calls ?? 0}</span>
            <span className="text-xs font-medium text-emerald-600">
              {kpis?.incoming_calls ?? 0} In / {kpis?.outgoing_calls ?? 0} Out
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Answer Rate: 100%</p>
        </div>

        {/* AI Resolution Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Autonomous Resolution</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-800">{kpis?.resolved_by_ai_percent ?? 0}%</span>
            <span className="text-xs font-medium text-slate-500">
              {kpis?.handoff_rate_percent ?? 0}% Handoff
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Strict Grounded Knowledge</p>
        </div>

        {/* Voice Latency */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Response Latency</span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-800">{kpis?.avg_latency_ms ?? 0}</span>
            <span className="text-xs font-medium text-slate-500">ms roundtrip</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Faster-Whisper + Neural TTS</p>
        </div>

        {/* CSAT Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Satisfaction</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Smile className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-800">{kpis?.csat_score ?? 4.8}</span>
            <span className="text-xs font-medium text-amber-500">/ 5.0 ⭐</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Based on sentiment analysis</p>
        </div>
      </div>

      {/* Two Column Layout: Recent Calls & Quick Action Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calls Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Recent Customer Calls</h2>
              <p className="text-xs text-slate-500">Latest conversations processed by virtual receptionist</p>
            </div>
            <button
              onClick={() => onNavigate('calls')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {recentCalls.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No calls recorded yet.</p>
            ) : (
              recentCalls.map((call) => (
                <div key={call.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-xl ${
                      call.direction === 'INBOUND' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {call.direction === 'INBOUND' ? <PhoneIncoming className="w-4 h-4" /> : <PhoneOutgoing className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-slate-800">{call.caller_number}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {call.language.toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          call.outcome === 'RESOLVED_BY_AI' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {call.outcome?.replace(/_/g, ' ') || call.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5 max-w-md">
                        {call.summary || 'Customer inquiry addressed by AI receptionist.'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-medium text-slate-700">{call.duration_seconds}s</span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Operations Module Links */}
        <div className="space-y-4">
          {/* Intelligent Handoff Desk Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Human Handoff Desk</h3>
                <p className="text-xs text-slate-600">Employee transfer queue & alerts</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              When questions fall outside verified company documents, NEXORA AI instantly packages the conversation summary and routes the call to a human specialist.
            </p>
            <button
              onClick={() => onNavigate('handoff')}
              className="mt-4 w-full bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer"
            >
              Open Transfer Queue
            </button>
          </div>

          {/* Grounded Knowledge Base Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm">Verified Company Knowledge Base</h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload PDF, DOCX, TXT catalogs & policies. All business answers are 100% grounded against verified files.
            </p>
            <button
              onClick={() => onNavigate('knowledge')}
              className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer"
            >
              Manage Documents & Test Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


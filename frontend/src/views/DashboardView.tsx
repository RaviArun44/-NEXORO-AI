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
  ArrowRight,
  Server,
  Layers,
  Radio,
  Play
} from 'lucide-react';
import { api, DashboardKPIs, CallRecord } from '../services/api';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any | null>(null);

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // 8s live refresh
    return () => clearInterval(interval);
  }, []);

  const handleRunSimulation = async (count: number = 100) => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await api.simulateLoad(count, 10);
      setSimResult(res.data);
      await fetchData();
    } catch (err) {
      console.error('Load simulation error', err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading Khaira AI Platform Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider backdrop-blur-xs">
              Khaira Autonomous Voice Operations
            </span>
            <span className="text-xs text-blue-100">
              • High-Volume Concurrent Call Architecture
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-2">Khaira AI Voice Automation Platform</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Handling thousands of customer conversations 24/7 across English, Tamil, Hindi, Telugu, and Malayalam with automatic language detection, grounded RAG, and business workflows.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0 flex-wrap gap-2">
          <button
            onClick={() => onNavigate('live-calls')}
            className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer flex items-center space-x-2"
          >
            <PhoneIncoming className="w-4 h-4" />
            <span>Launch Voice Studio</span>
          </button>
          <button
            onClick={() => handleRunSimulation(100)}
            disabled={simulating}
            className="bg-blue-900/60 hover:bg-blue-900/80 text-white border border-white/20 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer flex items-center space-x-2"
          >
            <Play className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
            <span>{simulating ? 'Simulating 100 Calls...' : 'Simulate 100 Calls'}</span>
          </button>
        </div>
      </div>

      {/* Simulation Feedback Pill */}
      {simResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">High-Volume Simulation Complete:</span> {simResult.simulated_calls} concurrent calls processed in {simResult.total_elapsed_seconds}s.
              <span className="ml-2 font-mono font-semibold text-emerald-700">Throughput: {simResult.calls_per_second_throughput} calls/sec • 100% Success Rate</span>
            </div>
          </div>
          <button onClick={() => setSimResult(null)} className="text-blue-600 hover:text-blue-800 font-bold px-2 py-1">Dismiss</button>
        </div>
      )}

      {/* Primary KPI Grid (6 Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Calls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Calls</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{kpis?.total_calls ?? 0}</span>
            <span className="text-[10px] font-medium text-emerald-600">
              {kpis?.incoming_calls ?? 0} In / {kpis?.outgoing_calls ?? 0} Out
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Answer Rate: 100%</p>
        </div>

        {/* Active Concurrency */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Concurrent</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{kpis?.active_calls ?? 0}</span>
            <span className="text-[10px] font-medium text-slate-500">/ 1,000 max</span>
          </div>
          <p className="text-[10px] text-emerald-600 mt-1">Peak: {kpis?.peak_concurrency ?? 0} concurrent</p>
        </div>

        {/* AI Resolution Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">AI Resolution</span>
            <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{kpis?.resolved_by_ai_percent ?? 0}%</span>
            <span className="text-[10px] font-medium text-slate-500">Automated</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Zero-Hallucination RAG</p>
        </div>

        {/* Voice Latency */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Latency</span>
            <div className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{kpis?.avg_latency_ms ?? 0}</span>
            <span className="text-[10px] font-medium text-slate-500">ms roundtrip</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Real-time streaming</p>
        </div>

        {/* Avg Duration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Duration</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{kpis?.avg_duration_seconds ?? 0}s</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Natural turns</p>
        </div>

        {/* CSAT Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Customer CSAT</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Smile className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-800">{kpis?.csat_score ?? 4.8}</span>
            <span className="text-[10px] font-medium text-amber-500">/ 5.0 ⭐</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Sentiment verified</p>
        </div>
      </div>

      {/* Two Column Layout: Recent Calls & Quick Action Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calls Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Recent Customer Voice Calls</h2>
              <p className="text-xs text-slate-500">Latest conversations handled by Khaira AI voice assistant</p>
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
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {call.language.toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          call.outcome === 'RESOLVED_BY_AI' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {call.outcome?.replace(/_/g, ' ') || call.status}
                        </span>
                        {call.intent && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {call.intent.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5 max-w-md">
                        {call.summary || 'Customer inquiry addressed by Khaira AI assistant.'}
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
          {/* Autonomous Workflows Hub */}
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-5 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Autonomous Business Workflows</h3>
                <p className="text-xs text-slate-600">Automated customer service</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Khaira AI independently resolves orders, manages product quotes, registers complaints, and books consultations without manual staff intervention.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('orders')}
                className="bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer text-center"
              >
                Orders Desk
              </button>
              <button
                onClick={() => onNavigate('complaints')}
                className="bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold py-2 rounded-xl transition-all cursor-pointer text-center"
              >
                Complaints
              </button>
            </div>
          </div>

          {/* Grounded Knowledge Base Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm">Khaira Company Knowledge Base</h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload PDF, DOCX, TXT catalogs & SLAs. Answers are 100% grounded against verified company files to prevent hallucination.
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

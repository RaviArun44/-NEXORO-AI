import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { BarChart3, TrendingUp, Globe2, ShieldCheck, Headphones, Award, Layers } from 'lucide-react';
import { api, DashboardKPIs } from '../services/api';

const COLORS = ['#2563EB', '#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];

export const AnalyticsView: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [languages, setLanguages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [kpiRes, langRes, catRes, trendsRes, empRes] = await Promise.all([
          api.getAnalyticsSummary(),
          api.getLanguagesDistribution(),
          api.getQueryCategories(),
          api.getCallTrends(),
          api.getEmployeePerformance()
        ]);
        setKpis(kpiRes.data);
        setLanguages(langRes.data);
        setCategories(catRes.data);
        setTrends(trendsRes.data);
        setEmployees(empRes.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 text-xs">
        Loading Khaira Company analytics charts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Khaira Company Voice Analytics & Enterprise Reports</h1>
        <p className="text-xs text-slate-500">
          True computed metrics directly from production call logs, multilingual detectors, and autonomous workflow engines.
        </p>
      </div>

      {/* Top 4 Metric Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Calls Handled</span>
          <p className="text-2xl font-bold text-slate-800 mt-2">{kpis?.total_calls}</p>
          <span className="text-[11px] text-emerald-600 font-medium">100% Connectivity</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Avg Call Duration</span>
          <p className="text-2xl font-bold text-slate-800 mt-2">{kpis?.avg_duration_seconds}s</p>
          <span className="text-[11px] text-slate-400">Natural Turn-Taking</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Avg Response Latency</span>
          <p className="text-2xl font-bold text-slate-800 mt-2">{kpis?.avg_latency_ms} ms</p>
          <span className="text-[11px] text-cyan-600 font-medium">Faster-Whisper + Edge-TTS</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Customer CSAT</span>
          <p className="text-2xl font-bold text-slate-800 mt-2">{kpis?.csat_score} / 5.0</p>
          <span className="text-[11px] text-amber-500 font-medium">High satisfaction</span>
        </div>
      </div>

      {/* Charts Grid Row 1: Hourly Trends & Multilingual Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Call Trends */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Hourly Call Volume Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Inbound customer inquiries vs outbound campaigns</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time_label" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip />
                <Area type="monotone" dataKey="inbound" stackId="1" stroke="#2563EB" fill="#3B82F6" name="Inbound Calls" />
                <Area type="monotone" dataKey="outbound" stackId="1" stroke="#06B6D4" fill="#67E8F9" name="Outbound Calls" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multilingual Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Multilingual Caller Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Breakdown across Tamil, English, Hindi, Telugu, and Malayalam</p>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languages}
                  dataKey="count"
                  nameKey="language"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  label={(entry: any) => `${entry.language || ''}: ${entry.percentage || ''}%`}
                >
                  {languages.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid Row 2: Customer Query Categories & Autonomous Workflow Resolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Query Categories Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Customer Query Categories</h2>
              <p className="text-xs text-slate-500">Autonomous workflow breakdown by intent</p>
            </div>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]} name="Calls Handled" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Staff & Senior Specialist Routing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Senior Support Routing Roster</h2>
                <p className="text-xs text-slate-500">Escalation staff status across regional languages</p>
              </div>
              <Award className="w-5 h-5 text-amber-500" />
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Specialist</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{emp.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{emp.department}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-amber-600 font-bold">⭐ {emp.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Primary Handling: Autonomous Khaira AI Agent (100% capacity)</span>
            <span className="font-semibold text-blue-600">Zero Unattended Calls</span>
          </div>
        </div>
      </div>
    </div>
  );
};

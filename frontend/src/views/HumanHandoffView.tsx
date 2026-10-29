import React, { useState, useEffect } from 'react';
import { Headphones, CheckCircle2, XCircle, RotateCcw, AlertTriangle, PhoneCall, Globe2, User } from 'lucide-react';
import { api, HandoffTicket } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const HumanHandoffView: React.FC = () => {
  const { user, setPendingHandoffsCount } = useAuth();
  const [tickets, setTickets] = useState<HandoffTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.listHandoffs({ status: filterStatus || undefined });
      setTickets(res.data);
      const pendingCount = res.data.filter((t: HandoffTicket) => t.status === 'PENDING').length;
      setPendingHandoffsCount(pendingCount);
    } catch (err) {
      console.error('Failed to load handoff tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const handleAccept = async (ticketId: string) => {
    try {
      await api.acceptHandoff(ticketId, user?.id || 'agent-01');
      alert('Call successfully transferred to your desk extension! Active audio channel opened.');
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to accept handoff');
    }
  };

  const handleReject = async (ticketId: string) => {
    try {
      await api.rejectHandoff(ticketId, user?.id || 'agent-01');
      fetchTickets();
    } catch (err) {
      console.error('Failed to return handoff', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Human Handoff Desk</h1>
          <p className="text-xs text-slate-500">
            Real-time queue for calls routed from AI when queries require human intervention.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        {['PENDING', 'ACCEPTED', 'RETURNED', ''].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === st
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st ? `${st} Transfers` : 'All Transfers'}
          </button>
        ))}
      </div>

      {/* Tickets Grid */}
      {loading && tickets.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading transfer queue...</div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Headphones className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Transfer Queue Is Clear</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            All customer inquiries are currently being handled autonomously by Nexora AI virtual receptionist.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                ticket.status === 'PENDING'
                  ? 'border-amber-200 ring-2 ring-amber-100'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {ticket.customer_name ? ticket.customer_name[0] : 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-800">{ticket.customer_name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">{ticket.customer_phone}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ticket.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : ticket.status === 'ACCEPTED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ticket.status}
                  </span>
                </div>

                {/* Transfer Reason & Language */}
                <div className="my-3 space-y-2 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <Globe2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Spoken Language: <b className="uppercase">{ticket.customer_language}</b></span>
                  </div>

                  <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                    <span className="font-semibold text-amber-900 block text-[11px] mb-0.5">
                      Transfer Trigger Reason:
                    </span>
                    <p className="text-amber-800 text-xs">{ticket.reason}</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="font-semibold text-slate-700 block text-[11px] mb-0.5">
                      AI Conversation Brief:
                    </span>
                    <p className="text-slate-600 text-xs">{ticket.ai_summary}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {ticket.status === 'PENDING' && (
                <div className="flex items-center space-x-2 pt-3 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => handleAccept(ticket.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept Call</span>
                  </button>
                  <button
                    onClick={() => handleReject(ticket.id)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

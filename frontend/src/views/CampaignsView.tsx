import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Play, CheckCircle2, ShieldCheck, Users, Clock, AlertTriangle, X } from 'lucide-react';
import { api, Campaign } from '../services/api';

export const CampaignsView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [runningCampaignId, setRunningCampaignId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('APPOINTMENT_REMINDER');
  const [language, setLanguage] = useState('en');
  const [scriptPrompt, setScriptPrompt] = useState('Remind registered customers regarding tomorrow scheduled consultation.');
  const [respectDnd, setRespectDnd] = useState(true);
  const [requireConsent, setRequireConsent] = useState(true);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.listCampaigns();
      setCampaigns(res.data);
    } catch (err) {
      console.error('Failed to load campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCampaign({
        name,
        campaign_type: type,
        script_prompt: scriptPrompt,
        target_language: language,
        respect_dnd: respectDnd,
        require_prior_consent: requireConsent
      });
      setShowCreateModal(false);
      setName('');
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create campaign');
    }
  };

  const handleLaunchCampaign = async (id: string) => {
    setRunningCampaignId(id);
    try {
      const res = await api.launchCampaign(id);
      alert(`Campaign launched! Processed ${res.data.total_processed} consented leads according to telecom regulations.`);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Campaign launch failed');
    } finally {
      setRunningCampaignId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Automated Outbound Voice Campaigns</h1>
          <p className="text-xs text-slate-500">
            Authorized automated voice calls for appointment reminders, order updates, and renewal notices.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Outbound Campaign</span>
        </button>
      </div>

      {/* Regulatory Compliance Notice */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start space-x-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-blue-900">Strict Regulatory Telecom Compliance Active</h3>
          <p className="text-blue-700 text-[11px] mt-0.5">
            NEXORA AI strictly enforces customer consent verification and Do-Not-Disturb (DND) opt-out rules. Numbers lacking explicit prior consent or listed on DND are automatically skipped.
          </p>
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Campaigns Created</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create an outbound campaign to automate appointment reminders or delivery notifications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((camp) => {
            const progress = camp.total_leads > 0 ? Math.round((camp.completed_calls / camp.total_leads) * 100) : 0;
            return (
              <div key={camp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {camp.campaign_type.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      camp.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : camp.status === 'RUNNING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {camp.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 mt-3">{camp.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{camp.script_prompt}</p>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Progress: {camp.completed_calls} / {camp.total_leads} calls</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Compliance badges */}
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-3">
                    <span>DND Checked: {camp.respect_dnd ? '✓' : '✗'}</span>
                    <span>•</span>
                    <span>Consent Required: {camp.require_prior_consent ? '✓' : '✗'}</span>
                  </div>
                </div>

                {/* Launch Button */}
                <div className="pt-4 border-t border-slate-100 mt-4">
                  {camp.status !== 'COMPLETED' ? (
                    <button
                      onClick={() => handleLaunchCampaign(camp.id)}
                      disabled={runningCampaignId === camp.id}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{runningCampaignId === camp.id ? 'Dialing Leads...' : 'Execute Outbound Batch'}</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-semibold text-emerald-600 py-1 flex items-center justify-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Campaign Completed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Create Outbound Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Appointment Reminder Outreach"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Purpose / Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="APPOINTMENT_REMINDER">Appointment Reminders</option>
                  <option value="ORDER_UPDATE">Order & Delivery Updates</option>
                  <option value="PAYMENT_REMINDER">Payment Verification Reminders</option>
                  <option value="CUSTOMER_FEEDBACK">Customer Feedback & Surveys</option>
                  <option value="LEAD_FOLLOWUP">Lead Follow-ups</option>
                  <option value="RENEWAL_NOTICE">Service Renewal Notifications</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Spoken Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="en">English (US)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="ml">Malayalam (മലയാളം)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">AI Voice Script & Objective</label>
                <textarea
                  rows={3}
                  required
                  value={scriptPrompt}
                  onChange={(e) => setScriptPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="consentCheck"
                    checked={requireConsent}
                    onChange={(e) => setRequireConsent(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="consentCheck" className="text-slate-600">
                    Verify prior calling consent before dialing.
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dndCheck"
                    checked={respectDnd}
                    onChange={(e) => setRespectDnd(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="dndCheck" className="text-slate-600">
                    Respect Do-Not-Disturb (DND) regulations.
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


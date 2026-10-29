import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building, Clock, Phone, Server, Save, CheckCircle2 } from 'lucide-react';
import { api, CompanySettings } from '../services/api';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSettings();
        setSettings(res.data);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update settings', err);
      alert('Failed to save settings');
    }
  };

  if (loading || !settings) {
    return <div className="text-center py-12 text-slate-400 text-xs">Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Company & Telephony Configuration</h1>
          <p className="text-xs text-slate-500">
            Customize company identity, operating hours, and SIP gateway integration.
          </p>
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">Company settings and telephony gateway updated successfully!</span>
        </div>
      )}

      {/* Grid: Company Profile & Receptionist Persona */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Identity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">Company Identity & Branding</h2>
          </div>

          {/* KAIRA Logo Preview */}
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <img
              src="/kaira-logo.png"
              alt="KAIRA Technologies"
              className="h-10 object-contain bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xs"
            />
            <div>
              <span className="font-bold text-slate-800 block text-xs">KAIRA Technologies</span>
              <span className="text-[11px] text-slate-500">Official Company Brand Logo</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Legal Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Industry / Sector</label>
              <input
                type="text"
                value={settings.industry || ''}
                onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Direct Phone</label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Office Address</label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* AI Receptionist Persona & Greeting */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Phone className="w-4 h-4 text-cyan-600" />
            <h2 className="text-sm font-bold text-slate-800">Virtual Receptionist Persona</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receptionist Name</label>
                <input
                  type="text"
                  value={settings.receptionist_name}
                  onChange={(e) => setSettings({ ...settings, receptionist_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Language</label>
                <select
                  value={settings.default_language}
                  onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="en">English (US)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="ml">Malayalam (മലയാളം)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Opening Greeting Template</label>
              <textarea
                rows={3}
                value={settings.greeting_template}
                onChange={(e) => setSettings({ ...settings, greeting_template: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Human Specialist Handoff Phone</label>
              <input
                type="text"
                value={settings.handoff_phone || ''}
                onChange={(e) => setSettings({ ...settings, handoff_phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Telephony Gateway Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Server className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800">Telephony Gateway & VoIP Connectivity</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Telephony Gateway Mode</label>
            <select
              value={settings.telephony_mode}
              onChange={(e) => setSettings({ ...settings, telephony_mode: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            >
              <option value="browser_simulated">Browser WebRTC & Simulated SIP Gateway</option>
              <option value="asterisk">Asterisk PBX (ARI / AMI)</option>
              <option value="freeswitch">FreeSWITCH (ESL)</option>
              <option value="sip_trunk">Direct SIP Trunk Provider</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">SIP Server Host / Port</label>
            <input
              type="text"
              value={settings.sip_server || '127.0.0.1:5060'}
              onChange={(e) => setSettings({ ...settings, sip_server: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Low-Confidence Auto-Handoff</label>
            <select
              value={settings.auto_handoff_on_low_confidence ? 'true' : 'false'}
              onChange={(e) => setSettings({ ...settings, auto_handoff_on_low_confidence: e.target.value === 'true' })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="true">Enabled (Never Invent Facts)</option>
              <option value="false">Disabled (Attempt Best Effort)</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
};


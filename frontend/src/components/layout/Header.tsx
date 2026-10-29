import React, { useState, useEffect } from 'react';
import { Bell, Radio, CheckCircle2, PhoneOutgoing, UserCircle, Globe2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface HeaderProps {
  onOpenLiveCall: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLiveCall }) => {
  const { user, pendingHandoffsCount } = useAuth();
  const [telephonyMode, setTelephonyMode] = useState<string>('Browser Simulated (Ready)');
  const [presence, setPresence] = useState<string>(user?.status || 'AVAILABLE');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.getTelephonyStatus();
        if (res.data?.mode_label) {
          setTelephonyMode(res.data.mode_label);
        }
      } catch {
        // default fallback
      }
    };
    fetchStatus();
  }, []);

  const handlePresenceChange = async (newStatus: string) => {
    setPresence(newStatus);
    if (user?.id) {
      try {
        await api.updateEmployeeStatus(user.id, newStatus);
      } catch (e) {
        console.error('Failed to update presence', e);
      }
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Company Logo, Telephony Gateway & Multi-language Badge */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 border-r border-slate-200 pr-5">
          <img
            src="/kaira-logo.png"
            alt="KAIRA Technologies"
            className="h-9 w-auto max-w-[170px] object-contain drop-shadow-xs"
          />
        </div>

        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold">Telephony:</span>
          <span>{telephonyMode}</span>
        </div>

        <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <Globe2 className="w-3.5 h-3.5 text-blue-500" />
          <span>Auto-Detection: English, Tamil, Hindi, Telugu, Malayalam</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Quick Launch Call Button */}
        <button
          onClick={onOpenLiveCall}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <PhoneOutgoing className="w-3.5 h-3.5" />
          <span>Test Voice Call</span>
        </button>

        {/* Staff Presence Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
          <button
            onClick={() => handlePresenceChange('AVAILABLE')}
            className={`px-2 py-1 rounded-lg transition-all ${presence === 'AVAILABLE' ? 'bg-white text-emerald-700 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
          >
            ● Available
          </button>
          <button
            onClick={() => handlePresenceChange('BUSY')}
            className={`px-2 py-1 rounded-lg transition-all ${presence === 'BUSY' ? 'bg-white text-amber-700 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
          >
            ● Busy
          </button>
          <button
            onClick={() => handlePresenceChange('OFFLINE')}
            className={`px-2 py-1 rounded-lg transition-all ${presence === 'OFFLINE' ? 'bg-white text-slate-600 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
          >
            ○ Offline
          </button>
        </div>

        {/* Transfer Alerts Notification */}
        <div className="relative">
          <button
            title="Transfer Alerts"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {pendingHandoffsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};


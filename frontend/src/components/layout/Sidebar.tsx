import React from 'react';
import {
  LayoutDashboard,
  PhoneCall,
  History,
  ShoppingCart,
  Headphones,
  BookOpen,
  LogOut,
  Users,
  Package,
  Calendar,
  AlertOctagon,
  Megaphone,
  Cpu,
  BarChart3,
  Shield,
  Settings,
  ShoppingBag
} from 'lucide-react';
import { NexoraAvatar } from './NexoraAvatar';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout, pendingHandoffsCount, setPortalMode } = useAuth();

  // Enterprise Voice Platform Navigation Categories
  const navGroups = [
    {
      title: 'Voice Operations',
      items: [
        { id: 'dashboard', label: 'Call Monitoring & KPIs', icon: LayoutDashboard },
        { id: 'ai-calling', label: 'AI Voice Calling', icon: PhoneCall, badge: '5-Lang' },
        { id: 'live-calls', label: 'AI Voice Receptionist', icon: PhoneCall, badge: 'Live' },
        { id: 'calls', label: 'Call History & Logs', icon: History },
        { id: 'handoff', label: 'Human Handoff Desk', icon: Headphones, count: pendingHandoffsCount },
      ]
    },
    {
      title: 'Business Automation',
      items: [
        { id: 'customers', label: 'Customer CRM', icon: Users },
        { id: 'orders', label: 'Order Fulfillment', icon: ShoppingCart },
        { id: 'products', label: 'Product Inventory', icon: Package },
        { id: 'appointments', label: 'Appointments Desk', icon: Calendar },
        { id: 'complaints', label: 'Complaints & Tickets', icon: AlertOctagon },
        { id: 'campaigns', label: 'Outbound Voice Campaigns', icon: Megaphone },
      ]
    },
    {
      title: 'Intelligence & Admin',
      items: [
        { id: 'knowledge', label: 'Company Knowledge RAG', icon: BookOpen },
        { id: 'ai-config', label: 'AI Voice & Persona Config', icon: Cpu },
        { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'employees', label: 'Staff Roster & Routing', icon: Shield },
        { id: 'settings', label: 'Company & SIP Settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 sticky top-0 shadow-sm">
      {/* Brand & KAIRA Technologies Logo Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        {/* Prominent KAIRA Technologies Logo */}
        <div className="flex flex-col items-center justify-center p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-xs mb-3">
          <img
            src="/kaira-logo.png"
            alt="KAIRA Technologies"
            className="h-14 w-auto max-w-[200px] object-contain drop-shadow-xs"
          />
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <NexoraAvatar size="sm" />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Khaira Voice AI
                </span>
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Enterprise Multilingual Platform</p>
            </div>
          </div>
        </div>
      </div>

      

      {/* Customer Storefront Live Switch Button */}
      <div className="p-3 pb-1">
        <button
          onClick={() => setPortalMode('customer')}
          className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-500/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
            <span>Customer Storefront</span>
          </div>
          <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full font-mono uppercase">
            Live
          </span>
        </button>
      </div>

      {/* Categorized Enterprise Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-100 text-emerald-700 animate-pulse'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold animate-bounce shrink-0">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* KAIRA Technologies Footer Credit */}
      <div className="px-3 pt-2 pb-1 text-center bg-slate-50/70 border-t border-slate-200">
        <p className="text-[10px] text-slate-400 flex items-center justify-center space-x-1">
          <span>Platform for</span>
          <span className="font-bold text-blue-600">KAIRA Technologies</span>
        </p>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 bg-slate-50/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-xs">
              {user?.full_name ? user.full_name[0] : 'K'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.full_name || 'KAIRA Admin'}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.department || 'Operations'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

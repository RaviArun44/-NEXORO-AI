import React from 'react';
import {
  LayoutDashboard,
  PhoneCall,
  History,
  Users,
  Package,
  ShoppingCart,
  Calendar,
  AlertCircle,
  Headphones,
  BookOpen,
  Megaphone,
  UserCheck,
  BarChart3,
  Settings,
  Cpu,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { NexoraAvatar } from './NexoraAvatar';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout, pendingHandoffsCount } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
    { id: 'live-calls', label: 'Live Calls & Studio', icon: PhoneCall, badge: 'Live' },
    { id: 'calls', label: 'Call History', icon: History },
    { id: 'customers', label: 'Customers (CRM)', icon: Users },
    { id: 'products', label: 'Products & Inventory', icon: Package },
    { id: 'orders', label: 'Orders & Tracking', icon: ShoppingCart },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'complaints', label: 'Complaints & Escalation', icon: AlertCircle },
    { id: 'handoff', label: 'Human Handoff Desk', icon: Headphones, count: pendingHandoffsCount },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'campaigns', label: 'Outbound Campaigns', icon: Megaphone },
    { id: 'employees', label: 'Employee Staff', icon: UserCheck },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'settings', label: 'Company Settings', icon: Settings },
    { id: 'ai-config', label: 'AI Voice & Models', icon: Cpu },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 sticky top-0">
      {/* Brand & KAIRA Technologies Logo Header */}
      <div className="p-4 border-b border-slate-200/80 bg-white">
        <div className="flex items-center justify-center py-2.5 px-2 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs mb-3">
          <img
            src="/kaira-logo.png"
            alt="KAIRA Technologies"
            className="h-11 w-auto max-w-[190px] object-contain drop-shadow-xs"
          />
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <NexoraAvatar size="sm" />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  NEXORA AI
                </span>
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Virtual Receptionist</p>
            </div>
          </div>
        </div>
      </div>

      {/* Multilingual Badge Indicator */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
        <span className="font-medium text-slate-500">Active Languages:</span>
        <div className="flex items-center space-x-1 font-mono font-semibold text-blue-700">
          <span>EN</span>
          <span>•</span>
          <span>தமிழ்</span>
          <span>•</span>
          <span>हिन्दी</span>
          <span>•</span>
          <span>తెలుగు</span>
          <span>•</span>
          <span>മല</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 animate-pulse'
                  }`}>
                  {item.badge}
                </span>
              )}

              {item.count !== undefined && item.count > 0 && (
                <span className="text-[11px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold animate-bounce">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* KAIRA Technologies Footer Credit */}
      <div className="px-3 pt-2 pb-0.5 text-center bg-slate-50/70 border-t border-slate-200">
        <p className="text-[10px] text-slate-400 flex items-center justify-center space-x-1">
          <span>Engineered by</span>
          <span className="font-bold text-blue-600">KAIRA Technologies</span>
        </p>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 bg-slate-50/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-xs">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.department || 'Operations'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};


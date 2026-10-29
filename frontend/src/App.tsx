import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './views/DashboardView';
import { LiveCallView } from './views/LiveCallView';
import { CallHistoryView } from './views/CallHistoryView';
import { CustomerManagementView } from './views/CustomerManagementView';
import { ProductsInventoryView } from './views/ProductsInventoryView';
import { OrdersView } from './views/OrdersView';
import { AppointmentsView } from './views/AppointmentsView';
import { ComplaintsView } from './views/ComplaintsView';
import { HumanHandoffView } from './views/HumanHandoffView';
import { KnowledgeBaseView } from './views/KnowledgeBaseView';
import { CampaignsView } from './views/CampaignsView';
import { EmployeesView } from './views/EmployeesView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { AIConfigView } from './views/AIConfigView';
import { AuthView } from './views/AuthView';
import { Bell, AlertCircle, X, Headphones } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, token, loading, setPendingHandoffsCount } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [liveHandoffAlert, setLiveHandoffAlert] = useState<any | null>(null);

  // Real-time Agent Dispatch WebSocket listener
  useEffect(() => {
    if (!token) return;

    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/handoffs/ws/agent`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'HANDOFF_ALERT') {
            setLiveHandoffAlert(data.ticket);
            setPendingHandoffsCount((prev) => prev + 1);

            // Audio notification chime
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              osc.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.3);
            } catch {
              // Audio context might be restricted before interaction
            }
          }
        } catch (e) {
          console.error('Error handling WebSocket alert', e);
        }
      };
    } catch (e) {
      console.warn('Agent WebSocket connection skipped', e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Authenticating NEXORA AI Session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <AuthView />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'live-calls':
        return <LiveCallView />;
      case 'calls':
        return <CallHistoryView />;
      case 'customers':
        return <CustomerManagementView />;
      case 'products':
        return <ProductsInventoryView />;
      case 'orders':
        return <OrdersView />;
      case 'appointments':
        return <AppointmentsView />;
      case 'complaints':
        return <ComplaintsView />;
      case 'handoff':
        return <HumanHandoffView />;
      case 'knowledge':
        return <KnowledgeBaseView />;
      case 'campaigns':
        return <CampaignsView />;
      case 'employees':
        return <EmployeesView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      case 'ai-config':
        return <AIConfigView />;
      default:
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenLiveCall={() => setCurrentTab('live-calls')} />

        {/* Real-time Transfer Toast Alert Popup */}
        {liveHandoffAlert && (
          <div className="m-4 p-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-2xl shadow-lg flex items-center justify-between animate-bounce">
            <div className="flex items-center space-x-3">
              <Headphones className="w-6 h-6 text-white shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  Incoming Human Handoff: {liveHandoffAlert.customer_name} ({liveHandoffAlert.customer_phone})
                </p>
                <p className="text-xs text-amber-100 mt-0.5">
                  Reason: {liveHandoffAlert.reason} • Language: {liveHandoffAlert.customer_language?.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setCurrentTab('handoff');
                  setLiveHandoffAlert(null);
                }}
                className="bg-white text-slate-900 font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-amber-50 cursor-pointer shadow-xs"
              >
                Go to Desk
              </button>
              <button
                onClick={() => setLiveHandoffAlert(null)}
                className="p-1 hover:bg-white/20 rounded-lg"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

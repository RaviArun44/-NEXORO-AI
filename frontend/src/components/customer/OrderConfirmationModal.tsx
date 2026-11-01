import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Package, 
  Truck, 
  ArrowRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: any;
  aiCallData: any;
  onViewOrders: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  orderData,
  aiCallData,
  onViewOrders
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCallData, setActiveCallData] = useState(aiCallData);
  const [selectedScenario, setSelectedScenario] = useState('CONFIRMED');
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setActiveCallData(aiCallData);
  }, [aiCallData]);

  if (!isOpen || !orderData) return null;

  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSimulateTurn = async (scenario: 'CONFIRMED' | 'DELIVERY_INQUIRY' | 'CANCEL_REQUESTED') => {
    setSelectedScenario(scenario);
    setLoadingSimulation(true);
    try {
      const res = await api.triggerAIOrderCall(orderData.id || orderData.order_number, scenario);
      setActiveCallData(res.data);
      if (res.data.audio_url && audioRef.current) {
        audioRef.current.src = res.data.audio_url;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } catch (e) {
      console.error("Failed to simulate call turn", e);
    } finally {
      setLoadingSimulation(false);
    }
  };

  const audioUrl = activeCallData?.audio_url || aiCallData?.audio_url;
  const transcript = activeCallData?.transcript || aiCallData?.transcript || [];
  const lang = (orderData.preferred_language || 'en').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Celebration Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-black">Order Placed Successfully!</h2>
          <p className="text-xs text-teal-100 mt-1 max-w-md mx-auto">
            Order <strong className="text-white font-mono">{orderData.order_number}</strong> is now verified.
          </p>
          <div className="inline-flex items-center space-x-1.5 mt-2 bg-black/20 text-white text-[11px] font-bold px-3 py-1 rounded-full">
            <Package className="w-3.5 h-3.5" />
            <span>Assigned to BlueDart Express for Priority Delivery</span>
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Voice Call Live Softphone Studio */}
        <div className="p-6 space-y-4">
          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Autonomous AI Voice Call Initiated</h4>
                  <p className="text-[10px] text-blue-200">
                    Language: <span className="font-bold text-emerald-400">{lang}</span> • Microsoft Edge Neural Voice
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {activeCallData?.status || 'CONNECTED'}
                </span>
              </div>
            </div>

            {/* Audio Waveform & Player */}
            {audioUrl && (
              <div className="bg-white/10 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <button
                  onClick={handleToggleAudio}
                  className="flex items-center space-x-2 px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause AI Voice' : 'Listen AI Voice Response'}</span>
                </button>

                <div className="flex items-center space-x-1">
                  <div className={`w-1 h-4 bg-emerald-400 rounded-full ${isPlaying ? 'animate-bounce' : 'opacity-40'}`} style={{ animationDelay: '0ms' }} />
                  <div className={`w-1 h-6 bg-emerald-400 rounded-full ${isPlaying ? 'animate-bounce' : 'opacity-40'}`} style={{ animationDelay: '100ms' }} />
                  <div className={`w-1 h-3 bg-emerald-400 rounded-full ${isPlaying ? 'animate-bounce' : 'opacity-40'}`} style={{ animationDelay: '200ms' }} />
                  <div className={`w-1 h-5 bg-emerald-400 rounded-full ${isPlaying ? 'animate-bounce' : 'opacity-40'}`} style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Live Conversation Transcript */}
            <div className="bg-black/30 p-3 rounded-xl max-h-44 overflow-y-auto space-y-2 text-xs divide-y divide-white/5">
              {transcript.map((msg: any, idx: number) => (
                <div key={idx} className="pt-2 first:pt-0">
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-300">
                    <span className={msg.speaker === 'ai' ? 'text-sky-400' : 'text-emerald-400'}>
                      {msg.speaker === 'ai' ? '🤖 AI Order Assistant' : '👤 Customer'}
                    </span>
                    <span className="text-slate-400 font-normal">({msg.language?.toUpperCase()})</span>
                  </div>
                  <p className="text-slate-100 text-xs mt-0.5 leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Interactive Multi-Turn Scenario Tester */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-2">
                Simulate Customer Responses During Call:
              </p>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <button
                  onClick={() => handleSimulateTurn('CONFIRMED')}
                  disabled={loadingSimulation}
                  className={`p-2 rounded-lg border font-bold text-center cursor-pointer transition-all ${
                    selectedScenario === 'CONFIRMED'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  ✓ Confirm Order
                </button>
                <button
                  onClick={() => handleSimulateTurn('DELIVERY_INQUIRY')}
                  disabled={loadingSimulation}
                  className={`p-2 rounded-lg border font-bold text-center cursor-pointer transition-all ${
                    selectedScenario === 'DELIVERY_INQUIRY'
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  🚚 Inquire Delivery
                </button>
                <button
                  onClick={() => handleSimulateTurn('CANCEL_REQUESTED')}
                  disabled={loadingSimulation}
                  className={`p-2 rounded-lg border font-bold text-center cursor-pointer transition-all ${
                    selectedScenario === 'CANCEL_REQUESTED'
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  ✕ Request Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                onClose();
                onViewOrders();
              }}
              className="text-xs text-blue-600 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>View In My Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Done Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

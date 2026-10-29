import React from 'react';

interface NexoraAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isSpeaking?: boolean;
}

export const NexoraAvatar: React.FC<NexoraAvatarProps> = ({ size = 'md', isSpeaking = false }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 shadow-md p-1 ${sizeMap[size]}`}>
      {/* Friendly Robot Avatar SVG */}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full text-white ${isSpeaking ? 'animate-bounce' : ''}`}
      >
        {/* Antennas */}
        <line x1="32" y1="10" x2="32" y2="4" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="4" r="3" fill="#38BDF8" />
        {/* Head */}
        <rect x="14" y="12" width="36" height="28" rx="10" fill="white" />
        {/* Face Display Screen */}
        <rect x="18" y="16" width="28" height="20" rx="6" fill="#0F172A" />
        {/* Glowing Robot Eyes */}
        <circle cx="26" cy="24" r="3.5" fill="#38BDF8" className={isSpeaking ? 'animate-pulse' : ''} />
        <circle cx="38" cy="24" r="3.5" fill="#38BDF8" className={isSpeaking ? 'animate-pulse' : ''} />
        {/* Cheerful Robot Smile */}
        <path d="M26 30 Q32 34 38 30" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" fill="none" />
        {/* Neck */}
        <rect x="28" y="40" width="8" height="4" fill="#E2E8F0" rx="1" />
        {/* Shoulders */}
        <path d="M12 56 C12 48 20 44 32 44 C44 44 52 48 52 56" fill="white" />
        <circle cx="32" cy="50" r="2.5" fill="#0284C7" />
      </svg>
      {/* Speaking Voice Glow Indicator */}
      {isSpeaking && (
        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
        </span>
      )}
    </div>
  );
};


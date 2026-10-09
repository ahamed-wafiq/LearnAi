import React from 'react';

interface TerminalWindowProps {
  title?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  screenColor?: 'dark' | 'green' | 'blue';
  showControls?: boolean;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  title = 'TERMINAL // LEARN-AI-OS',
  badge = 'SYS.ONLINE',
  children,
  className = '',
  screenColor = 'dark',
  showControls = true,
}) => {
  const screenBg =
    screenColor === 'green'
      ? 'bg-[#051A0E] text-[#39FF14]'
      : screenColor === 'blue'
      ? 'bg-[#071324] text-[#00E5FF]'
      : 'bg-[#080C14] text-[#E2E8F0]';

  return (
    <div
      className={`relative rounded-none border-2 sm:border-3 border-[#0C1220] bg-[#121829] shadow-[5px_5px_0px_#0C1220] flex flex-col overflow-hidden ${className}`}
    >
      {/* Terminal Title Bar */}
      <div className="bg-[#1A2338] px-3 sm:px-4 py-2 border-b-2 border-[#0C1220] flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2">
          {showControls && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-2.5 h-2.5 bg-[#FF4742] border border-[#0C1220]" />
              <span className="w-2.5 h-2.5 bg-[#F8C02F] border border-[#0C1220]" />
              <span className="w-2.5 h-2.5 bg-[#00E5FF] border border-[#0C1220]" />
            </div>
          )}
          <span className="font-arcade text-[10px] text-[#FBF5E6] tracking-wider truncate">
            {title}
          </span>
        </div>

        {badge && (
          <span className="font-arcade text-[9px] text-[#00E5FF] bg-[#0A0E1A] px-2 py-0.5 border border-[#00E5FF]/40 tracking-wider">
            {badge}
          </span>
        )}
      </div>

      {/* CRT Screen with Scanlines */}
      <div className={`relative p-4 sm:p-5 flex-1 font-mono text-xs crt-scanlines ${screenBg}`}>
        {children}
      </div>
    </div>
  );
};

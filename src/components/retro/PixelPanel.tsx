import React from 'react';

interface PixelPanelProps {
  children: React.ReactNode;
  title?: string;
  badge?: string;
  badgeColor?: 'coral' | 'cyan' | 'yellow' | 'green';
  variant?: 'paper' | 'dark';
  actions?: React.ReactNode;
  className?: string;
}

export const PixelPanel: React.FC<PixelPanelProps> = ({
  children,
  title,
  badge,
  badgeColor = 'cyan',
  variant = 'paper',
  actions,
  className = '',
}) => {
  const isPaper = variant === 'paper';

  return (
    <div
      className={`relative flex flex-col border-2 border-[#0C1220] ${
        isPaper
          ? 'bg-[#FBF5E6] text-[#0C1220] shadow-[3px_3px_0px_#0C1220]'
          : 'bg-[#121829] text-[#FBF5E6] shadow-[3px_3px_0px_#000]'
      } ${className}`}
    >
      {/* Title bar / Window header */}
      {title && (
        <div
          className={`px-4 py-2.5 border-b-2 border-[#0C1220] flex items-center justify-between gap-3 ${
            isPaper ? 'bg-[#EDE4CE]' : 'bg-[#1A2338]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#FF4742] border border-[#0C1220] block" />
            <span className="w-2.5 h-2.5 bg-[#F8C02F] border border-[#0C1220] block" />
            <span className="w-2.5 h-2.5 bg-[#00E5FF] border border-[#0C1220] block" />
            <span className="font-pixel text-xs font-bold uppercase tracking-wide ml-1">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {badge && (
              <span
                className={`text-[9px] font-arcade px-2 py-0.5 border border-[#0C1220] font-bold uppercase ${
                  badgeColor === 'coral'
                    ? 'bg-[#FF4742] text-white'
                    : badgeColor === 'yellow'
                    ? 'bg-[#F8C02F] text-[#0C1220]'
                    : badgeColor === 'green'
                    ? 'bg-[#2ECC71] text-[#0C1220]'
                    : 'bg-[#00E5FF] text-[#0C1220]'
                }`}
              >
                {badge}
              </span>
            )}
            {actions}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1">{children}</div>
    </div>
  );
};

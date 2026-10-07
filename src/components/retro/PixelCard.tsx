import React from 'react';

export interface PixelCardProps {
  children: React.ReactNode;
  variant?: 'paper' | 'dark' | 'paper-card';
  hazardHeader?: boolean;
  hazardColor?: 'coral' | 'cyan';
  tag?: string;
  tagColor?: 'coral' | 'cyan' | 'yellow';
  title?: string;
  subtitle?: string;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const PixelCard: React.FC<PixelCardProps> = ({
  children,
  variant = 'paper',
  hazardHeader = false,
  hazardColor = 'coral',
  tag,
  tagColor = 'coral',
  title,
  subtitle,
  className = '',
  hoverEffect = true,
  onClick,
}) => {
  const isPaper = variant === 'paper' || variant === 'paper-card';

  const baseStyles = isPaper
    ? 'bg-[#FFFDF7] text-[#0C1220] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220]'
    : 'bg-[#121829] text-[#FBF5E6] border-2 border-[#1E293B] shadow-[3px_3px_0px_#000]';

  const hoverStyles = hoverEffect
    ? isPaper
      ? 'pixel-hover'
      : 'transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[#00E5FF] hover:shadow-[4px_4px_0px_#00E5FF]'
    : '';

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden flex flex-col ${baseStyles} ${hoverStyles} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Optional Top Hazard Striped Bar (Reference aesthetic) */}
      {hazardHeader && (
        <div
          className={`h-2.5 w-full border-b-2 border-[#0C1220] ${
            hazardColor === 'coral' ? 'retro-hazard-stripes' : 'retro-hazard-stripes-cyan'
          }`}
        />
      )}

      {/* Header if tag/title exists */}
      {(tag || title) && (
        <div className={`p-4 pb-2 border-b-2 ${isPaper ? 'border-[#0C1220]/15' : 'border-white/10'}`}>
          <div className="flex items-center justify-between gap-2 mb-1">
            {tag && (
              <span
                className={`text-[9px] font-arcade font-bold px-2 py-0.5 uppercase border ${
                  tagColor === 'coral'
                    ? 'bg-[#FF4742] text-white border-[#0C1220]'
                    : tagColor === 'cyan'
                    ? 'bg-[#00E5FF] text-[#0C1220] border-[#0C1220]'
                    : 'bg-[#F8C02F] text-[#0C1220] border-[#0C1220]'
                }`}
              >
                {tag}
              </span>
            )}
          </div>
          {title && (
            <h3
              className={`font-pixel font-bold text-sm tracking-wide ${
                isPaper ? 'text-[#0C1220]' : 'text-white'
              }`}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p className={`text-xs mt-0.5 ${isPaper ? 'text-[#53627C]' : 'text-slate-400'}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Body Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">{children}</div>
    </div>
  );
};

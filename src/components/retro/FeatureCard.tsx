import React from 'react';
import { PixelIcon, PixelIconName } from './PixelIcon';

interface FeatureCardProps {
  iconName: PixelIconName;
  iconColor?: 'coral' | 'cyan' | 'yellow';
  tag?: string;
  title: string;
  description: string;
  variant?: 'paper' | 'dark';
  hazardHeader?: boolean;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  iconName,
  iconColor = 'coral',
  tag,
  title,
  description,
  variant = 'paper',
  hazardHeader = true,
  className = '',
}) => {
  const isPaper = variant === 'paper';

  const iconColorCode =
    iconColor === 'coral' ? '#FF4742' : iconColor === 'cyan' ? '#00E5FF' : '#F8C02F';

  return (
    <div
      className={`relative overflow-hidden flex flex-col border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] pixel-hover ${
        isPaper ? 'bg-[#FFFDF7] text-[#0C1220]' : 'bg-[#121829] text-white'
      } ${className}`}
    >
      {/* Hazard Striped Top Accent Bar */}
      {hazardHeader && (
        <div
          className={`h-2.5 w-full border-b-2 border-[#0C1220] ${
            iconColor === 'cyan' ? 'retro-hazard-stripes-cyan' : 'retro-hazard-stripes'
          }`}
        />
      )}

      <div className="p-5 flex-1 flex flex-col">
        {/* Top Icon & Tag */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="p-2 border-2 border-[#0C1220] bg-[#0A0E1A] shadow-[2px_2px_0px_#0C1220]">
            <PixelIcon name={iconName} size={24} color={iconColorCode} />
          </div>

          {tag && (
            <span
              className={`text-[9px] font-arcade font-bold px-2 py-0.5 uppercase border border-[#0C1220] ${
                iconColor === 'coral'
                  ? 'bg-[#FF4742] text-white'
                  : iconColor === 'cyan'
                  ? 'bg-[#00E5FF] text-[#0C1220]'
                  : 'bg-[#F8C02F] text-[#0C1220]'
              }`}
            >
              {tag}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-pixel font-bold text-sm tracking-wide mb-2 uppercase">
          {title}
        </h4>

        {/* Description */}
        <p
          className={`text-xs leading-relaxed flex-1 ${
            isPaper ? 'text-[#53627C]' : 'text-slate-300'
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

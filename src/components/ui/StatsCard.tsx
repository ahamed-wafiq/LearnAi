import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  colorVariant?: 'violet' | 'blue' | 'cyan' | 'emerald' | 'amber';
  badge?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  colorVariant = 'violet',
  badge,
  className
}) => {
  const colorMap = {
    violet: {
      accent: '#FF4742',
      hazard: 'retro-hazard-stripes',
      iconBg: 'bg-[#FF4742] text-white',
    },
    blue: {
      accent: '#00E5FF',
      hazard: 'retro-hazard-stripes-cyan',
      iconBg: 'bg-[#00E5FF] text-[#0C1220]',
    },
    cyan: {
      accent: '#00E5FF',
      hazard: 'retro-hazard-stripes-cyan',
      iconBg: 'bg-[#00E5FF] text-[#0C1220]',
    },
    emerald: {
      accent: '#2ECC71',
      hazard: 'retro-hazard-stripes-cyan',
      iconBg: 'bg-[#2ECC71] text-[#0C1220]',
    },
    amber: {
      accent: '#F8C02F',
      hazard: 'retro-hazard-stripes',
      iconBg: 'bg-[#F8C02F] text-[#0C1220]',
    }
  };

  const theme = colorMap[colorVariant];

  return (
    <div
      className={cn(
        'relative bg-[#FFFDF7] text-[#0C1220] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] overflow-hidden flex flex-col justify-between pixel-hover',
        className
      )}
    >
      {/* Top Hazard Striped Accent Bar */}
      <div className={cn('h-2 w-full border-b border-[#0C1220]', theme.hazard)} />

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-arcade text-[9px] text-[#53627C] uppercase tracking-wider">{title}</p>
              {badge && (
                <span className="font-arcade text-[8px] px-1.5 py-0.2 bg-[#FF4742] text-white border border-[#0C1220]">
                  {badge}
                </span>
              )}
            </div>
            <p className="font-pixel text-2xl lg:text-3xl font-bold text-[#0C1220] mt-1.5 tracking-tight">
              {value}
            </p>
          </div>

          <div className={cn('p-2.5 border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220]', theme.iconBg)}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#0C1220]/15 font-mono text-[11px]">
            {trend && (
              <span
                className={cn(
                  'font-bold px-1.5 py-0.5 border border-[#0C1220]',
                  trend.isPositive
                    ? 'bg-[#2ECC71] text-[#0C1220]'
                    : 'bg-[#FF4742] text-white'
                )}
              >
                {trend.value}
              </span>
            )}
            {subtitle && <span className="text-[#53627C] truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

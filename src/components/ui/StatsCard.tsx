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
      border: 'hover:border-primary-500/40',
      iconBg: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
      glow: 'shadow-glow-primary'
    },
    blue: {
      border: 'hover:border-accent-blue/40',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      glow: 'shadow-glow-blue'
    },
    cyan: {
      border: 'hover:border-accent-cyan/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      glow: 'shadow-glow-cyan'
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: ''
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      glow: ''
    }
  };

  const theme = colorMap[colorVariant];

  return (
    <div
      className={cn(
        'relative rounded-2xl glass-card p-5 transition-all duration-200 border border-surface-border overflow-hidden',
        theme.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
            {badge && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300">
                {badge}
              </span>
            )}
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-slate-100 mt-2 tracking-tight">{value}</p>
        </div>

        <div className={cn('p-3 rounded-xl border', theme.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-border/60 text-xs">
          {trend && (
            <span
              className={cn(
                'font-semibold px-1.5 py-0.5 rounded-md',
                trend.isPositive
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

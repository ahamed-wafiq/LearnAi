import React from 'react';

export type RetroBadgeVariant = 'coral' | 'cyan' | 'yellow' | 'paper' | 'dark' | 'green';
export type RetroBadgeSize = 'sm' | 'md' | 'lg';

interface RetroBadgeProps {
  children: React.ReactNode;
  variant?: RetroBadgeVariant;
  size?: RetroBadgeSize;
  className?: string;
  dot?: boolean;
}

export const RetroBadge: React.FC<RetroBadgeProps> = ({
  children,
  variant = 'coral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles: Record<RetroBadgeVariant, string> = {
    coral: 'bg-[#FF4742] text-white border-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
    cyan: 'bg-[#00E5FF] text-[#0C1220] border-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
    yellow: 'bg-[#F8C02F] text-[#0C1220] border-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
    paper: 'bg-[#FBF5E6] text-[#0C1220] border-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
    dark: 'bg-[#121829] text-[#FBF5E6] border-[#00E5FF]/40 shadow-[2px_2px_0px_#000]',
    green: 'bg-[#2ECC71] text-[#0C1220] border-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
  };

  const dotColors: Record<RetroBadgeVariant, string> = {
    coral: 'bg-white',
    cyan: 'bg-[#0C1220]',
    yellow: 'bg-[#0C1220]',
    paper: 'bg-[#FF4742]',
    dark: 'bg-[#00E5FF]',
    green: 'bg-[#0C1220]',
  };

  const sizeStyles: Record<RetroBadgeSize, string> = {
    sm: 'text-[9px] px-2 py-0.5 tracking-wider font-arcade',
    md: 'text-[10px] px-2.5 py-1 tracking-wider font-arcade',
    lg: 'text-xs px-3 py-1.5 tracking-wide font-pixel',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 uppercase font-bold border-2 leading-none select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-none ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'cyan' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    primary: 'bg-[#FF4742] text-white border-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
    cyan: 'bg-[#00E5FF] text-[#0C1220] border-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
    success: 'bg-[#2ECC71] text-[#0C1220] border-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
    warning: 'bg-[#F8C02F] text-[#0C1220] border-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
    danger: 'bg-[#DC2626] text-white border-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
    neutral: 'bg-[#FFFDF7] text-[#0C1220] border-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
    outline: 'bg-transparent text-[#0C1220] border-[#0C1220]',
  };

  const sizes = {
    sm: 'text-[9px] px-2 py-0.5 font-arcade tracking-wider uppercase',
    md: 'text-[10px] px-2.5 py-1 font-arcade tracking-wider uppercase',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border-2 rounded-none font-bold select-none leading-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

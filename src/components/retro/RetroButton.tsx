import React from 'react';
import { Link } from 'react-router-dom';

export type RetroButtonVariant = 'primary' | 'cyan' | 'paper' | 'dark' | 'yellow' | 'danger';
export type RetroButtonSize = 'sm' | 'md' | 'lg';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: RetroButtonVariant;
  size?: RetroButtonSize;
  to?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const RetroButton: React.FC<RetroButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  to,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles: Record<RetroButtonVariant, string> = {
    primary:
      'bg-[#FF4742] hover:bg-[#FF5F5B] text-white border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] hover:shadow-[4px_4px_0px_#0C1220]',
    cyan:
      'bg-[#00E5FF] hover:bg-[#33ECFF] text-[#0C1220] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] hover:shadow-[4px_4px_0px_#0C1220]',
    yellow:
      'bg-[#F8C02F] hover:bg-[#FFD166] text-[#0C1220] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] hover:shadow-[4px_4px_0px_#0C1220]',
    paper:
      'bg-[#FBF5E6] hover:bg-[#FFFDF7] text-[#0C1220] border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220] hover:shadow-[4px_4px_0px_#0C1220]',
    dark:
      'bg-[#121829] hover:bg-[#1A233A] text-[#FBF5E6] border-2 border-[#00E5FF] shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#00E5FF]',
    danger:
      'bg-[#DC2626] hover:bg-[#EF4444] text-white border-2 border-[#0C1220] shadow-[3px_3px_0px_#0C1220]',
  };

  const sizeStyles: Record<RetroButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 font-arcade tracking-wider',
    md: 'text-xs sm:text-sm px-4 py-2 font-pixel tracking-wide',
    lg: 'text-sm sm:text-base px-6 py-3 font-pixel tracking-wider',
  };

  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed shadow-none active:translate-x-0 active:translate-y-0'
    : 'cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#0C1220] transition-all';

  const combinedClasses = `inline-flex items-center justify-center gap-2 font-bold uppercase select-none ${
    fullWidth ? 'w-full' : ''
  } ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedClasses}>
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} disabled={disabled} {...props}>
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

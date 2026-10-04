import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

    const variants = {
      primary: 'bg-[#7E79D8] hover:bg-[#6D67CF] text-white shadow-sm border border-[#7E79D8]/30 hover:shadow-md',
      secondary: 'bg-white hover:bg-slate-50 text-[#1E222A] border border-[#1E222A]/10 hover:border-[#7E79D8]/50 shadow-sm',
      outline: 'bg-transparent border border-slate-300 hover:border-[#7E79D8] text-slate-700 hover:text-[#1E222A] hover:bg-[#7E79D8]/10',
      ghost: 'bg-transparent text-slate-600 hover:text-[#1E222A] hover:bg-slate-100',
      danger: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
      glow: 'bg-gradient-to-r from-[#7E79D8] to-[#9333EA] hover:from-[#6D67CF] hover:to-[#7E79D8] text-white shadow-md border border-white/20'
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3 gap-2.5',
      icon: 'p-2.5'
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

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
      primary: 'bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-900/30 border border-primary-500/30 hover:shadow-glow-primary',
      secondary: 'bg-surface-light hover:bg-surface-hover text-slate-200 border border-surface-border hover:border-slate-600',
      outline: 'bg-transparent border border-slate-700 hover:border-primary-500 text-slate-300 hover:text-white hover:bg-primary-500/10',
      ghost: 'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-surface-light',
      danger: 'bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 hover:text-white',
      glow: 'bg-gradient-to-r from-primary-600 to-accent-blue hover:from-primary-500 hover:to-accent-blue/90 text-white shadow-glow-primary border border-white/20'
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

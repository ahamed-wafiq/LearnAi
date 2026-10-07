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
    const baseStyles =
      'inline-flex items-center justify-center font-bold border-2 border-[#0C1220] uppercase select-none transition-all duration-100 disabled:opacity-50 disabled:pointer-events-none active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-arcade';

    const variants = {
      primary:
        'bg-[#FF4742] hover:bg-[#FF5F5B] text-white shadow-[2px_2px_0px_#0C1220]',
      secondary:
        'bg-[#FFFDF7] hover:bg-white text-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
      outline:
        'bg-transparent hover:bg-[#00E5FF]/10 text-[#0C1220] border-[#0C1220] shadow-[2px_2px_0px_#0C1220]',
      ghost:
        'bg-transparent text-slate-700 hover:text-[#0C1220] hover:bg-black/5 border-transparent shadow-none',
      danger:
        'bg-[#DC2626] hover:bg-[#EF4444] text-white shadow-[2px_2px_0px_#0C1220]',
      glow:
        'bg-[#00E5FF] hover:bg-[#33ECFF] text-[#0C1220] shadow-[2px_2px_0px_#0C1220]'
    };

    const sizes = {
      sm: 'text-[10px] px-2.5 py-1 gap-1.5',
      md: 'text-xs px-3.5 py-2 gap-2',
      lg: 'text-xs sm:text-sm px-5 py-2.5 gap-2.5',
      icon: 'p-2'
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

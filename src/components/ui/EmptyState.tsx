import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl glass-card border border-surface-border ${className || ''}`}>
      <div className="w-16 h-16 rounded-2xl bg-[#7E79D8]/10 border border-[#7E79D8]/20 flex items-center justify-center text-[#7E79D8] mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-[#1E222A] mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

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
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-[#FFFDF7] border-2 border-[#0C1220] shadow-[4px_4px_0px_#0C1220] ${className || ''}`}>
      <div className="w-16 h-16 bg-[#0A0E1A] border-2 border-[#0C1220] flex items-center justify-center text-[#FF4742] mb-4 shadow-[2px_2px_0px_#0C1220]">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="font-pixel text-base font-bold text-[#0C1220] mb-1 uppercase tracking-wide">{title}</h3>
      <p className="text-xs font-mono text-[#53627C] max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

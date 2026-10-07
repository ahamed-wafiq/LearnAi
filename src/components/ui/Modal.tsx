import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Retro Dialog container */}
      <div
        className={cn(
          'relative w-full bg-[#0A0E1A] text-white border-3 border-[#0C1220] shadow-[8px_8px_0px_#0C1220] z-10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150',
          maxWidths[maxWidth],
          className
        )}
      >
        {/* Retro Title Bar */}
        <div className="bg-[#1A2338] px-4 py-2.5 border-b-2 border-[#0C1220] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FF4742] border border-[#0C1220]" />
            <span className="w-2.5 h-2.5 bg-[#F8C02F] border border-[#0C1220]" />
            <span className="w-2.5 h-2.5 bg-[#00E5FF] border border-[#0C1220]" />
            {title && (
              <span className="font-pixel text-xs text-white uppercase ml-2 tracking-wide">
                {title}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-[#121829] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 bg-[#121829] font-mono text-xs">
          {description && (
            <p className="text-slate-400 text-xs mb-4 pb-3 border-b border-white/10 font-sans">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

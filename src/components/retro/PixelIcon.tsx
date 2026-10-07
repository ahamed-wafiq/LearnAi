import React from 'react';

export type PixelIconName =
  | 'terminal'
  | 'book'
  | 'chip'
  | 'brain'
  | 'planet'
  | 'star'
  | 'radar'
  | 'folder'
  | 'search'
  | 'check'
  | 'zap'
  | 'rocket'
  | 'shield'
  | 'document'
  | 'citation'
  | 'database'
  | 'target';

interface PixelIconProps {
  name: PixelIconName;
  size?: number;
  className?: string;
  color?: string;
}

export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size = 24,
  className = '',
  color = 'currentColor',
}) => {
  const renderIcon = () => {
    switch (name) {
      case 'terminal':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {/* Monitor outline */}
            <rect x="2" y="2" width="20" height="15" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" />
            <rect x="5" y="5" width="14" height="9" fill={color} fillOpacity="0.3" />
            {/* Command prompt > _ */}
            <path d="M7 8L9 10L7 12" stroke={color} strokeWidth="2" strokeLinecap="square" />
            <line x1="11" y1="12" x2="14" y2="12" stroke={color} strokeWidth="2" />
            {/* Stand */}
            <rect x="10" y="17" width="4" height="3" fill={color} />
            <rect x="7" y="20" width="10" height="2" fill={color} />
          </svg>
        );

      case 'book':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="8" height="15" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
            <rect x="13" y="4" width="8" height="15" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
            <line x1="5" y1="8" x2="9" y2="8" stroke={color} strokeWidth="2" />
            <line x1="5" y1="12" x2="9" y2="12" stroke={color} strokeWidth="2" />
            <line x1="15" y1="8" x2="19" y2="8" stroke={color} strokeWidth="2" />
            <line x1="15" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2" />
            <rect x="11" y="4" width="2" height="15" fill={color} />
          </svg>
        );

      case 'chip':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect x="5" y="5" width="14" height="14" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2" />
            <rect x="8" y="8" width="8" height="8" fill={color} />
            {/* Pins */}
            <line x1="2" y1="8" x2="5" y2="8" stroke={color} strokeWidth="2" />
            <line x1="2" y1="12" x2="5" y2="12" stroke={color} strokeWidth="2" />
            <line x1="2" y1="16" x2="5" y2="16" stroke={color} strokeWidth="2" />
            <line x1="19" y1="8" x2="22" y2="8" stroke={color} strokeWidth="2" />
            <line x1="19" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" />
            <line x1="19" y1="16" x2="22" y2="16" stroke={color} strokeWidth="2" />
            <line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="2" />
            <line x1="12" y1="2" x2="12" y2="5" stroke={color} strokeWidth="2" />
            <line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="2" />
            <line x1="8" y1="19" x2="8" y2="22" stroke={color} strokeWidth="2" />
            <line x1="12" y1="19" x2="12" y2="22" stroke={color} strokeWidth="2" />
            <line x1="16" y1="19" x2="16" y2="22" stroke={color} strokeWidth="2" />
          </svg>
        );

      case 'brain':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect x="4" y="6" width="6" height="12" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" />
            <rect x="14" y="6" width="6" height="12" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" />
            <rect x="8" y="4" width="8" height="4" stroke={color} strokeWidth="2" />
            <rect x="8" y="16" width="8" height="4" stroke={color} strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="2" />
          </svg>
        );

      case 'planet':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="7" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2" />
            <ellipse cx="12" cy="12" rx="11" ry="4" stroke={color} strokeWidth="2" />
          </svg>
        );

      case 'star':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <path d="M12 2L14 9L21 12L14 15L12 22L10 15L3 12L10 9L12 2Z" />
          </svg>
        );

      case 'radar':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <circle cx="12" cy="12" r="9" strokeWidth="2" />
            <circle cx="12" cy="12" r="5" strokeWidth="2" strokeDasharray="2 2" />
            <circle cx="12" cy="12" r="2" fill={color} />
            <line x1="12" y1="12" x2="19" y2="7" strokeWidth="2" />
          </svg>
        );

      case 'folder':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M2 5L8 5L10 8L22 8L22 20L2 20Z" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2" />
            <line x1="4" y1="12" x2="14" y2="12" stroke={color} strokeWidth="2" />
          </svg>
        );

      case 'search':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="10" height="10" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2" />
            <line x1="14" y1="14" x2="20" y2="20" stroke={color} strokeWidth="3" />
          </svg>
        );

      case 'check':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" stroke={color} strokeWidth="2" />
            <path d="M7 12L11 16L17 8" stroke={color} strokeWidth="3" />
          </svg>
        );

      case 'zap':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );

      case 'rocket':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8 6 8 13 8 17L12 19L16 17C16 13 16 6 12 2Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="2" />
            <line x1="12" y1="7" x2="12" y2="10" stroke={color} strokeWidth="2" />
            <path d="M8 14L4 17L5 19L8 18" stroke={color} strokeWidth="2" />
            <path d="M16 14L20 17L19 19L16 18" stroke={color} strokeWidth="2" />
          </svg>
        );

      case 'shield':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 5V12C4 17 8 21 12 22C16 21 20 17 20 12V5L12 2Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
            <path d="M9 12L11 14L15 9" stroke={color} strokeWidth="2" />
          </svg>
        );

      case 'document':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M4 2H14L20 8V22H4V2Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
            <polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="2" />
            <line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" />
            <line x1="8" y1="16" x2="14" y2="16" stroke={color} strokeWidth="2" />
          </svg>
        );

      case 'citation':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.1" />
            <path d="M7 8H11V12H7V8Z" fill={color} />
            <path d="M13 8H17V12H13V8Z" fill={color} />
            <line x1="7" y1="16" x2="17" y2="16" stroke={color} strokeWidth="2" />
          </svg>
        );

      case 'database':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <ellipse cx="12" cy="5" rx="8" ry="3" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.2" />
            <path d="M4 5V12C4 13.5 7.5 15 12 15C16.5 15 20 13.5 20 12V5" stroke={color} strokeWidth="2" />
            <path d="M4 12V19C4 20.5 7.5 22 12 22C16.5 22 20 20.5 20 19V12" stroke={color} strokeWidth="2" />
          </svg>
        );

      case 'target':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" stroke={color} strokeWidth="2" />
            <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
            <rect x="11" y="11" width="2" height="2" fill={color} />
          </svg>
        );

      default:
        return null;
    }
  };

  return <span className={`inline-flex shrink-0 ${className}`}>{renderIcon()}</span>;
};

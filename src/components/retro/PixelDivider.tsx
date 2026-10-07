import React from 'react';

interface PixelDividerProps {
  /**
   * 'dark-to-paper': transitioning from dark navy space to warm cream paper
   * 'paper-to-dark': transitioning from warm cream paper back to dark navy space
   */
  variant?: 'dark-to-paper' | 'paper-to-dark';
  className?: string;
}

export const PixelDivider: React.FC<PixelDividerProps> = ({
  variant = 'dark-to-paper',
  className = '',
}) => {
  const isDarkToPaper = variant === 'dark-to-paper';

  return (
    <div
      className={`relative w-full overflow-hidden leading-none select-none pointer-events-none z-20 ${className}`}
      aria-hidden="true"
    >
      {/* SVG scalloped wave pattern */}
      <svg
        className="w-full h-6 sm:h-8 block"
        viewBox="0 0 1200 32"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={isDarkToPaper ? 'scallop-dtp' : 'scallop-ptd'}
            x="0"
            y="0"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            {isDarkToPaper ? (
              /* Scallop curves reaching down into the paper */
              <path
                d="M0,0 L32,0 L32,8 C24,24 8,24 0,8 Z"
                fill="#0A0E1A"
              />
            ) : (
              /* Scallop curves reaching down into dark */
              <path
                d="M0,0 L32,0 L32,8 C24,24 8,24 0,8 Z"
                fill="#FBF5E6"
              />
            )}
          </pattern>
        </defs>

        <rect
          x="0"
          y="0"
          width="1200"
          height="32"
          fill={`url(#${isDarkToPaper ? 'scallop-dtp' : 'scallop-ptd'})`}
        />
      </svg>
    </div>
  );
};

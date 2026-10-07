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
      className={`relative w-full overflow-hidden leading-none select-none pointer-events-none z-10 ${
        isDarkToPaper ? 'bg-[#070B14]' : 'bg-[#FBF5E6]'
      } ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-5 sm:h-7 block"
        viewBox="0 0 1200 28"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={isDarkToPaper ? 'scallop-dtp' : 'scallop-ptd'}
            x="0"
            y="0"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            {isDarkToPaper ? (
              /* Scalloped cream paper edge pointing upwards into space */
              <path
                d="M0,28 L0,12 C7,0 21,0 28,12 L28,28 Z"
                fill="#FBF5E6"
              />
            ) : (
              /* Scalloped dark edge pointing upwards into paper */
              <path
                d="M0,28 L0,12 C7,0 21,0 28,12 L28,28 Z"
                fill="#070B14"
              />
            )}
          </pattern>
        </defs>

        <rect
          x="0"
          y="0"
          width="1200"
          height="28"
          fill={`url(#${isDarkToPaper ? 'scallop-dtp' : 'scallop-ptd'})`}
        />
      </svg>
    </div>
  );
};

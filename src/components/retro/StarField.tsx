import React from 'react';

interface StarFieldProps {
  className?: string;
  showMoon?: boolean;
}

export const StarField: React.FC<StarFieldProps> = ({ className = '', showMoon = true }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Crescent Moon (as in reference image top-left) */}
      {showMoon && (
        <div className="absolute top-8 left-8 sm:top-12 sm:left-16 z-10 select-none">
          <div className="relative">
            {/* Soft Warm Yellow Glow */}
            <div className="absolute -inset-4 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />
            <svg
              width="64"
              height="64"
              viewBox="0 0 70 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-[0_0_12px_rgba(248,192,47,0.8)]"
            >
              {/* Crescent Moon silhouette */}
              <path
                d="M 6,6 A 38,38 0 1,1 12.7,69.5 A 34,34 0 0,0 6,6 Z"
                fill="#F8C02F"
              />
              {/* Pixel craters */}
              <rect x="34" y="28" width="4" height="4" fill="#E2A612" />
              <rect x="40" y="40" width="5" height="4" fill="#E2A612" />
              <rect x="32" y="52" width="5" height="4" fill="#E2A612" />
            </svg>
          </div>
        </div>
      )}

      {/* Sparkling 4-Point Retro Stars */}
      {/* Star 1 - Cyan */}
      <div className="absolute top-16 right-24 text-[#00E5FF] star-twinkle">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9L12 0Z" />
        </svg>
      </div>

      {/* Star 2 - Coral */}
      <div className="absolute top-28 left-1/3 text-[#FF4742] star-twinkle-delay-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9L12 0Z" />
        </svg>
      </div>

      {/* Star 3 - Yellow */}
      <div className="absolute top-10 right-1/4 text-[#F8C02F] star-twinkle-delay-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9L12 0Z" />
        </svg>
      </div>

      {/* Star 4 - White */}
      <div className="absolute top-44 right-16 text-white star-twinkle">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9L12 0Z" />
        </svg>
      </div>

      {/* Star 5 - Cyan */}
      <div className="absolute top-36 left-20 text-[#00E5FF] star-twinkle-delay-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9L12 0Z" />
        </svg>
      </div>

      {/* Tiny celestial pixel dots */}
      <span className="absolute top-8 left-1/2 w-1.5 h-1.5 bg-white/70 rounded-none shadow-[0_0_4px_#fff]" />
      <span className="absolute top-24 left-1/4 w-1 h-1 bg-[#00E5FF] rounded-none shadow-[0_0_4px_#00E5FF]" />
      <span className="absolute top-52 left-12 w-1.5 h-1.5 bg-[#FF4742] rounded-none" />
      <span className="absolute top-20 right-1/3 w-1 h-1 bg-[#F8C02F] rounded-none" />
      <span className="absolute top-48 right-1/3 w-1.5 h-1.5 bg-white/80 rounded-none" />
      <span className="absolute top-32 right-12 w-1 h-1 bg-[#00E5FF] rounded-none" />
      <span className="absolute top-64 left-1/3 w-1 h-1 bg-white/50 rounded-none" />
      <span className="absolute top-72 right-1/5 w-1.5 h-1.5 bg-[#FF4742]/80 rounded-none" />
    </div>
  );
};

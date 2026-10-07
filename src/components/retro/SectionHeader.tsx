import React from 'react';

interface SectionHeaderProps {
  tag?: string;
  tagColor?: 'coral' | 'cyan' | 'yellow';
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  variant?: 'paper' | 'dark';
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  tag,
  tagColor = 'coral',
  title,
  subtitle,
  align = 'center',
  variant = 'paper',
  className = '',
}) => {
  const isPaper = variant === 'paper';
  const isCenter = align === 'center';

  return (
    <div
      className={`max-w-3xl ${isCenter ? 'mx-auto text-center' : 'text-left'} ${className}`}
    >
      {tag && (
        <div className={`mb-3 flex ${isCenter ? 'justify-center' : 'justify-start'}`}>
          <span
            className={`text-[10px] font-arcade font-bold px-3 py-1 uppercase border-2 border-[#0C1220] shadow-[2px_2px_0px_#0C1220] ${
              tagColor === 'coral'
                ? 'bg-[#FF4742] text-white'
                : tagColor === 'cyan'
                ? 'bg-[#00E5FF] text-[#0C1220]'
                : 'bg-[#F8C02F] text-[#0C1220]'
            }`}
          >
            {tag}
          </span>
        </div>
      )}

      <h2
        className={`font-pixel font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight uppercase ${
          isPaper ? 'text-[#0C1220]' : 'text-white'
        }`}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className={`mt-3 text-sm sm:text-base font-normal leading-relaxed ${
            isPaper ? 'text-[#53627C]' : 'text-slate-300'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

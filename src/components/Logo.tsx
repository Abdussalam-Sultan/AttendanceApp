import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 64, showText = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <img 
        src="/android-chrome-512x512.png" 
        alt="DoorLog Logo" 
        width={size} 
        height={size}
        className="drop-shadow-sm"
        onError={(e) => {
          // Fallback to SVG if image fails
          e.currentTarget.style.display = 'none';
          const svg = e.currentTarget.nextElementSibling as HTMLElement;
          if (svg) svg.style.display = 'block';
        }}
      />
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm hidden"
      >
        <defs>
          <linearGradient id="doorlog-gradient-new" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="60%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>
        {/* Modern Wave 'D' Shape */}
        <path 
          d="M30 20C22 20 18 26 18 35V65C18 74 24 80 35 80H55C75 80 85 65 85 50C85 35 75 20 55 20H30Z" 
          fill="url(#doorlog-gradient-new)"
        />
        <path 
          d="M35 20C55 20 85 35 85 50C85 65 75 80 55 80C55 80 45 70 45 50C45 30 55 20 55 20Z" 
          fill="white" 
          fillOpacity="0.1" 
        />
        <path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M58 35C50 35 43 42 43 50C43 58 50 65 58 65C66 65 73 58 73 50C73 42 66 35 58 35ZM58 58C54 58 51 55 51 51C51 47 54 44 58 44C62 44 65 47 65 51C65 55 62 58 58 58Z" 
          fill="white" 
          className="dark:fill-slate-900"
        />
        <path 
          d="M18 50C18 35 25 22 35 22L40 25C32 30 28 40 28 50C28 60 32 70 40 75L35 78C25 78 18 65 18 50Z" 
          fill="white" 
          fillOpacity="0.15"
        />
      </svg>
      {showText && (
        <div className="mt-4 flex flex-col items-center">
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            doorlog
          </span>
          <span className="text-[7px] font-black uppercase tracking-[0.4em] text-blue-600 dark:text-blue-400">
            Attendance • Access • Accountability
          </span>
        </div>
      )}
    </div>
  );
};

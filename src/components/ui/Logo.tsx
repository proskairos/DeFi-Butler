'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizes = {
    sm: { container: 'h-6 w-6', text: 'text-lg' },
    md: { container: 'h-8 w-8', text: 'text-xl' },
    lg: { container: 'h-12 w-12', text: 'text-2xl' },
  };

  const { container, text } = sizes[size];

  return (
    <div className="flex items-center gap-2">
      {/* Logo Icon - Butler/Tuxedo with DeFi elements */}
      <div className={`${container} relative`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          {/* Background circle */}
          <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" />
          
          {/* Butler bow tie */}
          <path d="M35 45 L50 50 L65 45 L65 55 L50 50 L35 55 Z" fill="white" />
          
          {/* Ethereum diamond in center */}
          <path d="M50 25 L65 45 L50 55 L35 45 Z" fill="white" opacity="0.9" />
          <path d="M50 55 L65 45 L50 75 L35 45 Z" fill="white" opacity="0.6" />
          
          {/* Cross-chain arrows */}
          <path d="M20 50 L10 50 M15 45 L10 50 L15 55" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <path d="M80 50 L90 50 M85 45 L90 50 L85 55" stroke="white" strokeWidth="3" strokeLinecap="round" />
          
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {showText && (
        <span className={`${text} font-bold bg-gradient-to-r from-primary-600 to-ens-600 bg-clip-text text-transparent`}>
          DeFi Butler
        </span>
      )}
    </div>
  );
};

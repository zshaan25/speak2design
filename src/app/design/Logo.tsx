import React from 'react';

/**
 * Speak2Design brand mark — a microphone (voice) framed by sound-wave bars,
 * with an AI sparkle, on a gradient tile. Works on both light and dark themes.
 */
export const Logo: React.FC<{ className?: string; animated?: boolean }> = ({ className = 'w-9 h-9', animated = false }) => (
  <svg viewBox="0 0 48 48" className={`${className} ${animated ? 'anim-gradient' : ''}`} role="img" aria-label="Speak2Design">
    <defs>
      <linearGradient id="s2d-logo-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6366f1" />
        <stop offset="0.5" stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="13" fill="url(#s2d-logo-grad)" />
    {/* voice-wave bars */}
    <rect x="9"  y="20" width="2.4" height="8"  rx="1.2" fill="#fff" opacity="0.65" />
    <rect x="13" y="16" width="2.4" height="16" rx="1.2" fill="#fff" opacity="0.45" />
    {/* mic capsule */}
    <rect x="20" y="11" width="8" height="15" rx="4" fill="#fff" />
    {/* mic cradle + stand */}
    <path d="M16 22.5a8 8 0 0 0 16 0" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    <line x1="24" y1="30.5" x2="24" y2="35" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    <line x1="20" y1="36"   x2="28" y2="36" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    {/* AI sparkle */}
    <path d="M37 8l1.3 3L41 12.3 38.3 13.6 37 16.6 35.7 13.6 33 12.3 35.7 11z" fill="#fff" />
  </svg>
);

/** Full lock-up: mark + wordmark (text colour adapts to theme via currentColor). */
export const LogoWordmark: React.FC<{ className?: string; size?: string }> = ({ className = '', size = 'text-xl' }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <Logo className="w-9 h-9" />
    <span className={`font-display font-bold tracking-tight ${size}`}>Speak2Design</span>
  </div>
);

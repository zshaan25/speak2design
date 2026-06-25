import React from 'react';

/** Gradient/neon display text. */
export const NeonText: React.FC<{ children: React.ReactNode; className?: string; as?: any }> = ({
  children, className = '', as: Tag = 'span',
}) => <Tag className={`text-gradient font-display ${className}`}>{children}</Tag>;

/** Small glassy pill badge with a glowing dot — used for "AI Powered", tags, etc. */
export const GlowBadge: React.FC<{ children: React.ReactNode; className?: string; dot?: boolean }> = ({
  children, className = '', dot = true,
}) => (
  <span className={`inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-bold text-white/80 ${className}`}>
    {dot && (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-cyan opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-cyan" />
      </span>
    )}
    {children}
  </span>
);

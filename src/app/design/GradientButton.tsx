import React from 'react';
import { motion } from 'motion/react';

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'ghost';
  /** Colour tone for the primary variant. */
  tone?: 'brand' | 'green';
  full?: boolean;
}

const TONE_GRADIENT: Record<string, string> = {
  brand: 'linear-gradient(120deg,#6366f1,#8b5cf6,#06b6d4,#8b5cf6)',
  green: 'linear-gradient(120deg,#10b981,#14b8a6,#06b6d4,#14b8a6)',
};
const TONE_SHADOW: Record<string, string> = {
  brand: 'shadow-[0_10px_40px_-12px_rgba(99,102,241,.7)]',
  green: 'shadow-[0_10px_40px_-12px_rgba(16,185,129,.7)]',
};

/** Primary CTA: gradient fill, animated sheen, glow, hover expand. */
export const GradientButton: React.FC<GradientButtonProps> = ({
  children, onClick, type = 'button', disabled, className = '', variant = 'primary', tone = 'brand', full,
}) => {
  if (variant === 'ghost') {
    return (
      <motion.button
        type={type} onClick={onClick} disabled={disabled}
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-sm glass text-white/90 hover:text-white hover:border-white/25 transition-colors disabled:opacity-50 ${full ? 'w-full' : ''} ${className}`}
      >
        {children}
      </motion.button>
    );
  }
  return (
    <motion.button
      type={type} onClick={onClick} disabled={disabled}
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3 font-bold text-sm text-white ${TONE_SHADOW[tone]} disabled:opacity-50 disabled:shadow-none ${full ? 'w-full' : ''} ${className}`}
    >
      <span className="absolute inset-0 anim-gradient"
        style={{ background: TONE_GRADIENT[tone] }} />
      {/* sheen */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
        style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,.35) 50%, transparent 60%)' }} />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
};

import React from 'react';
import { motion } from 'motion/react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;          // lift + glow on hover
  gradientBorder?: boolean; // animated-ish gradient hairline border
  onClick?: () => void;
}

/** Frosted glass panel — the core surface of the redesign. */
export const GlassCard: React.FC<GlassCardProps> = ({
  children, className = '', hover = false, gradientBorder = true, onClick,
}) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -6 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={[
        'relative rounded-2xl glass',
        gradientBorder ? 'gradient-border' : '',
        hover ? 'transition-shadow duration-300 hover:glow-indigo cursor-pointer' : '',
        onClick ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
    >
      {/* inner top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent rounded-t-2xl" />
      {children}
    </motion.div>
  );
};

import React from 'react';
import { motion } from 'motion/react';

interface VoiceWaveProps {
  active?: boolean;
  bars?: number;
  className?: string;
  color?: string; // tailwind bg-* class
  height?: number; // max bar height px
}

/** Animated audio-visualizer bars. Idle = short static; active = lively bounce. */
export const VoiceWave: React.FC<VoiceWaveProps> = ({
  active = true, bars = 16, className = '', color = 'bg-gradient-to-t from-brand-cyan to-brand-violet', height = 36,
}) => {
  return (
    <div className={`flex items-center justify-center gap-[3px] ${className}`} style={{ height }} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const peak = [0.35, 0.7, 0.5, 1, 0.6, 0.85, 0.45][i % 7];
        return (
          <motion.span
            key={i}
            className={`w-[3px] rounded-full ${color}`}
            initial={{ height: height * 0.18 }}
            animate={active ? { height: [height * 0.18, height * peak, height * 0.3, height * peak * 0.8, height * 0.18] } : { height: height * 0.18 }}
            transition={active ? { duration: 1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.06 } : { duration: 0.3 }}
          />
        );
      })}
    </div>
  );
};

import React from 'react';

/**
 * Global atmosphere: deep-space base + animated aurora orbs + faint grid + grain.
 * GPU-friendly (CSS transforms/filters only). Mount once at app root, behind everything.
 */
export const AuroraBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`aurora-bg fixed inset-0 -z-10 overflow-hidden bg-[#020617] grain ${className}`} aria-hidden>
      {/* Aurora orbs */}
      <div className="aurora-orb absolute -top-1/3 -left-1/4 w-[55vw] h-[55vw] rounded-full blur-[120px] opacity-60 anim-aurora"
        style={{ background: 'radial-gradient(circle at 30% 30%, #6366f1 0%, transparent 60%)' }} />
      <div className="aurora-orb absolute top-1/4 -right-1/4 w-[50vw] h-[50vw] rounded-full blur-[130px] opacity-50 anim-aurora"
        style={{ background: 'radial-gradient(circle at 60% 40%, #8b5cf6 0%, transparent 60%)', animationDelay: '-8s' }} />
      <div className="aurora-orb absolute -bottom-1/3 left-1/3 w-[45vw] h-[45vw] rounded-full blur-[120px] opacity-40 anim-aurora"
        style={{ background: 'radial-gradient(circle at 50% 50%, #06b6d4 0%, transparent 60%)', animationDelay: '-15s' }} />

      {/* Grid overlay, faded toward edges */}
      <div className="aurora-grid absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.12) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'radial-gradient(ellipse at center, #000 35%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, #000 35%, transparent 78%)'
        }} />

      {/* Subtle vignette for depth */}
      <div className="aurora-vignette absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, transparent 50%, rgba(2,6,23,.7) 100%)' }} />
    </div>
  );
};

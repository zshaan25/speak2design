import React from 'react';
import { motion } from 'motion/react';
import {
  Mic, Sparkles, ArrowRight, MousePointer2, Store, Wand2, Languages, Globe, Check,
} from 'lucide-react';
import { GradientButton } from '../design/GradientButton';
import { GlassCard } from '../design/GlassCard';
import { VoiceWave } from '../design/VoiceWave';
import { NeonText, GlowBadge } from '../design/NeonText';

interface LandingProps {
  onGetStarted: () => void;
  onExplore: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

const FEATURES = [
  { icon: Mic, title: 'Speak it into being', desc: 'Describe any section in English or Urdu — the AI builds it live on your canvas.', tint: 'from-brand-indigo to-brand-violet' },
  { icon: Wand2, title: 'AI UI generation', desc: 'Production-ready HTML + Tailwind components, generated in seconds.', tint: 'from-brand-violet to-brand-pink' },
  { icon: MousePointer2, title: 'Drag & refine', desc: 'Reorder, resize and restyle on a Figma-like canvas. Full control.', tint: 'from-brand-cyan to-brand-teal' },
  { icon: Store, title: 'Template marketplace', desc: 'Buy and sell stunning templates. Publish your own voice-built designs.', tint: 'from-brand-amber to-brand-pink' },
];

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onExplore }) => {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-white">
      {/* Nav */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl anim-gradient"
            style={{ background: 'linear-gradient(120deg,#6366f1,#8b5cf6,#06b6d4)' }}>
            <Mic className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">Speak2Design</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onGetStarted} className="hidden rounded-xl px-4 py-2 text-sm font-bold text-white/70 transition-colors hover:text-white sm:block">
            Sign in
          </button>
          <GradientButton onClick={onGetStarted} className="!px-5 !py-2.5">
            Get Started <ArrowRight className="h-4 w-4" />
          </GradientButton>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-24 text-center">
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show" className="flex justify-center">
          <GlowBadge><Sparkles className="h-3.5 w-3.5 text-brand-amber" /> AI-Powered Voice → Website Builder</GlowBadge>
        </motion.div>

        <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="show"
          className="font-display mx-auto mt-7 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
          Design Websites <br />
          With <NeonText>Your Voice</NeonText>
        </motion.h1>

        <motion.p variants={fadeUp} custom={2} initial="hidden" animate="show"
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Generate beautiful websites using AI, voice commands, templates, and drag-and-drop editing.
          From spoken idea to live UI — in seconds.
        </motion.p>

        <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show"
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <GradientButton onClick={onGetStarted} className="!px-7 !py-3.5 text-base">
            <Mic className="h-5 w-5" /> Start Designing
          </GradientButton>
          <GradientButton variant="ghost" onClick={onExplore} className="!px-7 !py-3.5 text-base">
            <Globe className="h-5 w-5" /> Explore Templates
          </GradientButton>
        </motion.div>

        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show"
          className="mx-auto mt-6 flex items-center justify-center gap-3 text-xs font-semibold text-white/40">
          <span className="inline-flex items-center gap-1.5"><Languages className="h-4 w-4" /> English & اردو</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-teal" /> No code required</span>
        </motion.div>

        {/* Floating product mockup */}
        <motion.div initial={{ opacity: 0, y: 60, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 max-w-4xl">
          {/* floating chips */}
          <div className="anim-float absolute -left-6 top-10 z-20 hidden sm:block" style={{ animationDelay: '-1s' }}>
            <GlassCard className="px-4 py-3"><div className="flex items-center gap-2 text-sm font-bold"><Wand2 className="h-4 w-4 text-brand-violet" /> "Add a dark hero"</div></GlassCard>
          </div>
          <div className="anim-float absolute -right-4 top-1/3 z-20 hidden sm:block" style={{ animationDelay: '-3s' }}>
            <GlassCard className="px-4 py-3"><div className="flex items-center gap-2 text-sm font-bold"><Check className="h-4 w-4 text-brand-teal" /> Hero generated</div></GlassCard>
          </div>

          <GlassCard gradientBorder className="overflow-hidden p-2 glow-indigo">
            <div className="rounded-xl bg-[#0b1120]/80">
              {/* browser chrome */}
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400/80" /><span className="h-3 w-3 rounded-full bg-amber-400/80" /><span className="h-3 w-3 rounded-full bg-green-400/80" />
                <div className="ml-3 h-6 flex-1 rounded-md bg-white/5" />
              </div>
              {/* fake generated UI */}
              <div className="space-y-4 p-6">
                <div className="h-28 rounded-xl bg-gradient-to-br from-brand-indigo/40 via-brand-violet/30 to-brand-cyan/20 anim-gradient" />
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-white/5 ring-1 ring-white/10" />)}
                </div>
                <div className="h-16 rounded-xl bg-white/5 ring-1 ring-white/10" />
              </div>
            </div>
          </GlassCard>

          {/* live mic pill */}
          <div className="absolute -bottom-7 left-1/2 z-30 -translate-x-1/2">
            <GlassCard className="flex items-center gap-3 px-5 py-3 glow-cyan">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(120deg,#06b6d4,#8b5cf6)' }}>
                <Mic className="h-4 w-4 text-white" />
              </span>
              <VoiceWave active bars={14} height={26} />
              <span className="text-xs font-bold text-white/70">Listening…</span>
            </GlassCard>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <GlassCard hover className="h-full p-6">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.tint}`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{f.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* CTA band */}
        <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-8">
          <GlassCard gradientBorder className="relative overflow-hidden p-10 text-center">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-violet/30 blur-[100px]" />
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Build your first site with your voice</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/55">Join the future of design. No templates to fight, no code to write — just speak.</p>
            <div className="mt-7 flex justify-center">
              <GradientButton onClick={onGetStarted} className="!px-8 !py-3.5 text-base"><Mic className="h-5 w-5" /> Start Designing Free</GradientButton>
            </div>
          </GlassCard>
        </motion.div>

        <p className="mt-12 text-center text-xs font-semibold text-white/30">
          Speak2Design · Final Year Project · Transform Your Voice Into Stunning Websites
        </p>
      </section>
    </div>
  );
};

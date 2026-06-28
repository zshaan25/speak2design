// ─── Template Library ─────────────────────────────────────────────────────────
// 30 pre-built section templates across 7 categories.
// Each template's `sections` matches the CanvasComponent shape used in Workspace.

export type TemplateCategory =
  | 'Landing Pages'
  | 'Authentication'
  | 'Dashboard'
  | 'Business'
  | 'Educational'
  | 'Portfolio'
  | 'Blog';

export interface TemplateSection {
  id: string;
  type: string;
  name: string;
  styles: { width: string; align: string; spacing: string };
  htmlContent: string;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  accent: string;   // Tailwind gradient classes for card preview
  sections: TemplateSection[];
}

// ─── Helper: stamp unique IDs on sections at insert-time ─────────────────────
export const stampIds = (sections: TemplateSection[]): TemplateSection[] =>
  sections.map(s => ({ ...s, id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }));

// ═════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═════════════════════════════════════════════════════════════════════════════

const AUTH_LOGIN: Template = {
  id: 'auth-login', name: 'Login Page', category: 'Authentication',
  description: 'Clean centered login card with Google OAuth button.',
  accent: 'from-blue-600 to-indigo-700',
  sections: [{
    id: 'al1', type: 'auth', name: 'Login Form', styles: { width: 'full', align: 'center', spacing: 'normal' },
    htmlContent: `<section class="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8"><span class="text-3xl font-black text-white">Speak2Design</span><p class="text-slate-400 mt-1">Sign in to continue</p></div>
    <div class="bg-white rounded-3xl shadow-2xl p-8">
      <div class="space-y-4">
        <div><label class="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label><input type="email" placeholder="you@example.com" class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"/></div>
        <div><label class="block text-sm font-semibold text-gray-700 mb-1.5">Password</label><input type="password" placeholder="••••••••" class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"/></div>
        <div class="flex items-center justify-between text-sm"><label class="flex items-center gap-2 text-gray-600 cursor-pointer"><input type="checkbox" class="rounded border-gray-300"/>Remember me</label><a href="#" class="text-blue-600 font-semibold hover:underline">Forgot password?</a></div>
        <button class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-base">Sign In →</button>
        <div class="relative flex items-center gap-3"><div class="flex-1 border-t border-gray-200"></div><span class="text-xs text-gray-400 font-medium">OR</span><div class="flex-1 border-t border-gray-200"></div></div>
        <button class="w-full py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3 transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </div>
      <p class="text-center text-sm text-gray-500 mt-6">No account? <a href="#" class="text-blue-600 font-semibold hover:underline">Sign up free</a></p>
    </div>
  </div>
</section>`
  }]
};

const AUTH_REGISTER: Template = {
  id: 'auth-register', name: 'Register Page', category: 'Authentication',
  description: 'Sign-up form with name, email, password, and terms checkbox.',
  accent: 'from-violet-600 to-purple-700',
  sections: [{
    id: 'ar1', type: 'auth', name: 'Register Form', styles: { width: 'full', align: 'center', spacing: 'normal' },
    htmlContent: `<section class="min-h-screen bg-gradient-to-br from-violet-900 to-purple-950 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8"><span class="text-3xl font-black text-white">Get Started</span><p class="text-violet-300 mt-1">Create your free account today</p></div>
    <div class="bg-white rounded-3xl shadow-2xl p-8">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block text-sm font-semibold text-gray-700 mb-1.5">First name</label><input type="text" placeholder="John" class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"/></div>
          <div><label class="block text-sm font-semibold text-gray-700 mb-1.5">Last name</label><input type="text" placeholder="Doe" class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"/></div>
        </div>
        <div><label class="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label><input type="email" placeholder="you@example.com" class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"/></div>
        <div><label class="block text-sm font-semibold text-gray-700 mb-1.5">Password</label><input type="password" placeholder="Min. 8 characters" class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"/></div>
        <label class="flex items-start gap-3 cursor-pointer text-sm text-gray-600"><input type="checkbox" class="mt-0.5 rounded border-gray-300"/><span>I agree to the <a href="#" class="text-violet-600 font-semibold">Terms of Service</a> and <a href="#" class="text-violet-600 font-semibold">Privacy Policy</a></span></label>
        <button class="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors text-base">Create Account →</button>
      </div>
      <p class="text-center text-sm text-gray-500 mt-6">Already have an account? <a href="#" class="text-violet-600 font-semibold hover:underline">Sign in</a></p>
    </div>
  </div>
</section>`
  }]
};

const AUTH_FORGOT: Template = {
  id: 'auth-forgot', name: 'Forgot Password', category: 'Authentication',
  description: 'Clean password reset request screen.',
  accent: 'from-orange-500 to-pink-600',
  sections: [{
    id: 'af1', type: 'auth', name: 'Forgot Password', styles: { width: 'full', align: 'center', spacing: 'normal' },
    htmlContent: `<section class="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
  <div class="w-full max-w-sm">
    <div class="bg-white rounded-3xl shadow-xl p-8 text-center">
      <div class="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
      </div>
      <h2 class="text-2xl font-black text-gray-900 mb-2">Forgot your password?</h2>
      <p class="text-gray-500 text-sm mb-8">Enter your email and we'll send you a reset link instantly.</p>
      <div class="space-y-4 text-left">
        <div><label class="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label><input type="email" placeholder="you@example.com" class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-400"/></div>
        <button class="w-full py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl transition-opacity hover:opacity-90">Send Reset Link</button>
      </div>
      <a href="#" class="inline-block mt-6 text-sm text-gray-500 hover:text-gray-800 transition-colors">← Back to sign in</a>
    </div>
  </div>
</section>`
  }]
};

const AUTH_2FA: Template = {
  id: 'auth-2fa', name: 'Two-Factor Auth', category: 'Authentication',
  description: 'OTP code entry screen for 2-step verification.',
  accent: 'from-teal-500 to-cyan-600',
  sections: [{
    id: 'a2f1', type: 'auth', name: '2FA Screen', styles: { width: 'full', align: 'center', spacing: 'normal' },
    htmlContent: `<section class="min-h-screen bg-gradient-to-br from-teal-900 to-cyan-950 flex items-center justify-center p-4">
  <div class="w-full max-w-sm">
    <div class="bg-white rounded-3xl shadow-2xl p-8 text-center">
      <div class="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg class="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
      </div>
      <h2 class="text-2xl font-black text-gray-900 mb-2">Verify your identity</h2>
      <p class="text-gray-500 text-sm mb-8">Enter the 6-digit code sent to <span class="font-semibold text-gray-700">j***@gmail.com</span></p>
      <div class="flex gap-2 justify-center mb-8">
        <input maxlength="1" class="w-12 h-14 text-2xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"/>
        <input maxlength="1" class="w-12 h-14 text-2xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"/>
        <input maxlength="1" class="w-12 h-14 text-2xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"/>
        <input maxlength="1" class="w-12 h-14 text-2xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"/>
        <input maxlength="1" class="w-12 h-14 text-2xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"/>
        <input maxlength="1" class="w-12 h-14 text-2xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none"/>
      </div>
      <button class="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors">Verify Code</button>
      <p class="text-sm text-gray-500 mt-4">Didn't receive it? <a href="#" class="text-teal-600 font-semibold hover:underline">Resend in 0:45</a></p>
    </div>
  </div>
</section>`
  }]
};

// ═════════════════════════════════════════════════════════════════════════════
// LANDING PAGES
// ═════════════════════════════════════════════════════════════════════════════

const LANDING_SAAS_HERO: Template = {
  id: 'landing-saas-hero', name: 'SaaS Hero', category: 'Landing Pages',
  description: 'Gradient hero with headline, CTA, and social proof bar.',
  accent: 'from-blue-500 to-violet-600',
  sections: [
    { id: 'lsh1', type: 'navbar', name: 'Navbar', styles: { width: 'full', align: 'center', spacing: 'normal' },
      htmlContent: `<nav class="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 sticky top-0 z-50"><div class="max-w-7xl mx-auto flex items-center justify-between"><a href="#" class="text-2xl font-black text-blue-600">Brand<span class="text-gray-900">.</span></a><div class="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600"><a href="#" class="hover:text-blue-600">Product</a><a href="#" class="hover:text-blue-600">Pricing</a><a href="#" class="hover:text-blue-600">Docs</a><a href="#" class="hover:text-blue-600">Blog</a></div><div class="flex items-center gap-3"><a href="#" class="text-sm font-semibold text-gray-600 hover:text-blue-600">Sign in</a><a href="#" class="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">Get started free →</a></div></div></nav>` },
    { id: 'lsh2', type: 'hero', name: 'Hero Section', styles: { width: 'full', align: 'center', spacing: 'normal' },
      htmlContent: `<section class="relative bg-gradient-to-br from-blue-600 via-blue-700 to-violet-800 text-white overflow-hidden"><div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 xmlns=http://www.w3.org/2000/svg%3E%3Cdefs%3E%3Cpattern id=grid patternUnits=userSpaceOnUse width=60 height=60%3E%3Cpath d=M 60 0 L 0 0 0 60 fill=none stroke=white stroke-width=0.5 stroke-opacity=0.1/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=100%25 height=100%25 fill=url(%23grid)/%3E%3C/svg%3E')]"></div><div class="relative max-w-5xl mx-auto px-6 py-28 text-center"><span class="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm">✨ Just launched — v2.0 with AI features</span><h1 class="text-5xl md:text-7xl font-black leading-tight mb-6">Design at the<br/><span class="text-blue-200">speed of thought</span></h1><p class="text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">The AI-powered platform that turns your ideas into production-ready UI in seconds. No design skills required.</p><div class="flex flex-col sm:flex-row gap-4 justify-center"><a href="#" class="px-8 py-4 bg-white text-blue-700 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl">Start building free</a><a href="#" class="px-8 py-4 bg-white/10 border border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">Watch 2-min demo →</a></div><div class="mt-12 pt-12 border-t border-white/20 grid grid-cols-3 gap-8 max-w-lg mx-auto text-center"><div><p class="text-3xl font-black">50K+</p><p class="text-blue-200 text-sm mt-1">Active users</p></div><div><p class="text-3xl font-black">2M+</p><p class="text-blue-200 text-sm mt-1">UIs generated</p></div><div><p class="text-3xl font-black">4.9★</p><p class="text-blue-200 text-sm mt-1">Average rating</p></div></div></div></section>` },
    { id: 'lsh3', type: 'features', name: 'Features Grid', styles: { width: 'full', align: 'center', spacing: 'normal' },
      htmlContent: `<section class="py-24 bg-gray-50"><div class="max-w-7xl mx-auto px-6"><div class="text-center mb-16"><h2 class="text-4xl font-black text-gray-900 mb-4">Everything you need to ship faster</h2><p class="text-xl text-gray-500 max-w-2xl mx-auto">From idea to production in minutes, not months.</p></div><div class="grid grid-cols-1 md:grid-cols-3 gap-8">${[['🎙️','Voice-to-UI','Speak your design idea and watch it appear on the canvas instantly.'],['🤖','AI Generation','Groq AI generates production-quality Tailwind components on demand.'],['📦','Export Ready','Download clean HTML, Tailwind CSS, or a full React project in one click.'],['🎨','Template Library','30+ pre-built page templates to jump-start any project.'],['🔗','Multi-Page','Build complete multi-page websites with navigation and routing.'],['⚡','Instant Preview','See your website in desktop, tablet, and mobile viewports live.']].map(([icon,title,desc])=>`<div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"><div class="text-4xl mb-4">${icon}</div><h3 class="text-lg font-bold text-gray-900 mb-2">${title}</h3><p class="text-gray-500 text-sm leading-relaxed">${desc}</p></div>`).join('')}</div></div></section>` }
  ]
};

const LANDING_MINIMAL: Template = {
  id: 'landing-minimal', name: 'Minimal Hero', category: 'Landing Pages',
  description: 'Clean typographic hero with email capture.',
  accent: 'from-gray-800 to-gray-900',
  sections: [{
    id: 'lm1', type: 'hero', name: 'Minimal Hero', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="min-h-screen bg-white flex items-center"><div class="max-w-4xl mx-auto px-6 py-24 text-center"><div class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600 uppercase tracking-widest mb-8">New · Now in Beta</div><h1 class="text-6xl md:text-8xl font-black text-gray-900 leading-none tracking-tighter mb-8">The future<br/><span class="text-gray-400">is minimal.</span></h1><p class="text-xl text-gray-500 max-w-xl mx-auto mb-12 leading-relaxed">Less noise, more signal. Build beautifully simple products your users will actually love.</p><div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"><input type="email" placeholder="Enter your email" class="flex-1 px-5 py-3.5 border-2 border-gray-200 rounded-xl outline-none focus:border-gray-900 text-gray-900 font-medium"/><button class="px-6 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors whitespace-nowrap">Get early access</button></div><p class="text-xs text-gray-400 mt-4">Join 12,000+ designers on the waitlist · No spam, ever.</p></div></section>`
  }]
};

const LANDING_STARTUP: Template = {
  id: 'landing-startup', name: 'Startup Landing', category: 'Landing Pages',
  description: 'Dark hero + two-column features + gradient CTA banner.',
  accent: 'from-emerald-500 to-teal-600',
  sections: [
    { id: 'ls1', type: 'hero', name: 'Dark Hero', styles: { width: 'full', align: 'center', spacing: 'normal' },
      htmlContent: `<section class="bg-gray-950 text-white py-28 px-6"><div class="max-w-5xl mx-auto text-center"><span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8">🚀 YC S25 Batch</span><h1 class="text-5xl md:text-6xl font-black leading-tight mb-6">Build. Ship.<br/><span class="text-emerald-400">Repeat.</span></h1><p class="text-gray-400 text-xl max-w-2xl mx-auto mb-10">The developer platform that removes all the boring parts so you can focus on what matters — building great products.</p><div class="flex gap-4 justify-center"><a href="#" class="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl transition-colors">Start for free</a><a href="#" class="px-8 py-4 bg-white/5 border border-white/10 text-gray-300 font-bold rounded-2xl hover:bg-white/10 transition-colors">Read docs</a></div></div></section>` },
    { id: 'ls2', type: 'cta', name: 'CTA Banner', styles: { width: 'full', align: 'center', spacing: 'normal' },
      htmlContent: `<section class="bg-gradient-to-r from-emerald-600 to-teal-600 py-20 px-6"><div class="max-w-3xl mx-auto text-center text-white"><h2 class="text-4xl font-black mb-4">Ready to ship your idea?</h2><p class="text-emerald-100 text-lg mb-8">Join thousands of founders building the next generation of products.</p><div class="flex flex-col sm:flex-row gap-3 justify-center"><a href="#" class="px-8 py-4 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition-colors shadow-xl">Get started — it's free</a><a href="#" class="px-8 py-4 bg-white/10 border border-white/30 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors">Talk to sales</a></div></div></section>` }
  ]
};

const LANDING_PRICING: Template = {
  id: 'landing-pricing', name: 'Pricing Page', category: 'Landing Pages',
  description: 'Three-column pricing cards with highlighted Pro tier.',
  accent: 'from-blue-500 to-cyan-500',
  sections: [{
    id: 'lp1', type: 'pricing', name: 'Pricing Cards', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="py-24 bg-gray-50"><div class="max-w-6xl mx-auto px-6"><div class="text-center mb-16"><h2 class="text-4xl font-black text-gray-900 mb-4">Simple, transparent pricing</h2><p class="text-gray-500 text-lg">Start free, scale as you grow. No hidden fees.</p></div><div class="grid grid-cols-1 md:grid-cols-3 gap-8"><div class="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm"><div class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Free</div><div class="text-5xl font-black text-gray-900 mb-1">$0<span class="text-xl text-gray-400 font-normal">/mo</span></div><p class="text-gray-500 text-sm mb-8">Perfect for personal projects and exploration.</p><ul class="space-y-3 mb-8 text-sm text-gray-600">${['10 AI commands/month','1 active project','HTML export','Community support'].map(f=>`<li class="flex items-center gap-2"><span class="text-green-500 font-bold">✓</span>${f}</li>`).join('')}</ul><a href="#" class="block text-center py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-gray-400 transition-colors">Get started free</a></div><div class="bg-blue-600 rounded-3xl p-8 shadow-2xl shadow-blue-500/30 relative"><div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wide">Most Popular</div><div class="text-sm font-bold text-blue-200 uppercase tracking-widest mb-4">Pro</div><div class="text-5xl font-black text-white mb-1">$19<span class="text-xl text-blue-300 font-normal">/mo</span></div><p class="text-blue-200 text-sm mb-8">For professionals who ship regularly.</p><ul class="space-y-3 mb-8 text-sm text-blue-100">${['Unlimited AI commands','Unlimited projects','HTML + React export','Multi-page websites','Priority support'].map(f=>`<li class="flex items-center gap-2"><span class="text-green-300 font-bold">✓</span>${f}</li>`).join('')}</ul><a href="#" class="block text-center py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">Start Pro trial</a></div><div class="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm"><div class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Enterprise</div><div class="text-5xl font-black text-gray-900 mb-1">$99<span class="text-xl text-gray-400 font-normal">/mo</span></div><p class="text-gray-500 text-sm mb-8">For teams and organizations at scale.</p><ul class="space-y-3 mb-8 text-sm text-gray-600">${['Everything in Pro','Team collaboration','Custom AI training','Dedicated support','SLA guarantee'].map(f=>`<li class="flex items-center gap-2"><span class="text-green-500 font-bold">✓</span>${f}</li>`).join('')}</ul><a href="#" class="block text-center py-3 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-gray-400 transition-colors">Contact sales</a></div></div></div></section>`
  }]
};

const LANDING_FOOTER: Template = {
  id: 'landing-footer', name: 'Footer', category: 'Landing Pages',
  description: 'Multi-column footer with logo, links, and social icons.',
  accent: 'from-gray-700 to-gray-900',
  sections: [{
    id: 'lf1', type: 'footer', name: 'Footer', styles: { width: 'full', align: 'center', spacing: 'normal' },
    htmlContent: `<footer class="bg-gray-950 text-gray-400 py-16 px-6"><div class="max-w-7xl mx-auto"><div class="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12"><div class="col-span-2"><a href="#" class="text-2xl font-black text-white">Brand<span class="text-blue-500">.</span></a><p class="text-sm mt-3 max-w-xs leading-relaxed">The AI-powered design platform. Build beautiful websites in minutes.</p><div class="flex gap-4 mt-6">${['M20 2h-16C2.9 2 2 2.9 2 4v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 14H9v-2h6v2zm3-4H6v-2h12v2zm0-4H6V6h12v2z','M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z','M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z'].map(p=>`<a href="#" class="text-gray-500 hover:text-white transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${p}"/></svg></a>`).join('')}</div></div>${[['Product',['Features','Pricing','Changelog','Roadmap']],['Company',['About','Blog','Careers','Press']],['Support',['Docs','Help Center','Status','Contact']]].map(([title,links])=>`<div><h4 class="text-white font-bold text-sm mb-4">${title}</h4><ul class="space-y-2.5">${links.map(l=>`<li><a href="#" class="text-sm hover:text-white transition-colors">${l}</a></li>`).join('')}</ul></div>`).join('')}</div><div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm"><p>© 2025 Brand Inc. All rights reserved.</p><div class="flex gap-6"><a href="#" class="hover:text-white transition-colors">Privacy</a><a href="#" class="hover:text-white transition-colors">Terms</a><a href="#" class="hover:text-white transition-colors">Cookies</a></div></div></div></footer>`
  }]
};

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════

const DASHBOARD_STATS: Template = {
  id: 'dashboard-stats', name: 'Stats Overview', category: 'Dashboard',
  description: 'Four KPI cards + recent activity table for admin dashboards.',
  accent: 'from-slate-600 to-slate-800',
  sections: [
    { id: 'ds1', type: 'navbar', name: 'Dashboard Header', styles: { width: 'full', align: 'center', spacing: 'normal' },
      htmlContent: `<header class="bg-white border-b border-gray-200 px-6 py-4"><div class="max-w-7xl mx-auto flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span class="text-white font-black text-sm">S</span></div><span class="font-bold text-gray-900">Admin Panel</span></div><div class="flex items-center gap-4"><button class="relative p-2 text-gray-400 hover:text-gray-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg><span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span></button><div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">JD</div></div></div></header>` },
    { id: 'ds2', type: 'cards', name: 'KPI Cards', styles: { width: 'full', align: 'center', spacing: 'normal' },
      htmlContent: `<div class="bg-gray-50 px-6 py-8"><div class="max-w-7xl mx-auto"><h1 class="text-2xl font-black text-gray-900 mb-8">Good morning, John 👋</h1><div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">${[['Total Revenue','$48,295','+12.5%','text-green-600','💰'],['Active Users','3,482','+8.2%','text-green-600','👥'],['New Orders','284','-2.1%','text-red-500','📦'],['Conversion','3.6%','+0.8%','text-green-600','📈']].map(([label,val,change,color,icon])=>`<div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"><div class="flex items-center justify-between mb-3"><span class="text-2xl">${icon}</span><span class="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-50 ${color}">${change}</span></div><p class="text-2xl font-black text-gray-900">${val}</p><p class="text-sm text-gray-500 mt-1">${label}</p></div>`).join('')}</div></div></div>` },
    { id: 'ds3', type: 'table', name: 'Recent Orders', styles: { width: 'full', align: 'center', spacing: 'normal' },
      htmlContent: `<div class="bg-gray-50 px-6 pb-8"><div class="max-w-7xl mx-auto"><div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"><div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"><h2 class="font-bold text-gray-900">Recent Orders</h2><button class="text-sm text-blue-600 font-semibold hover:underline">View all →</button></div><table class="w-full"><thead class="bg-gray-50"><tr>${['Order ID','Customer','Product','Amount','Status','Date'].map(h=>`<th class="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">${h}</th>`).join('')}</tr></thead><tbody class="divide-y divide-gray-50">${[['#1234','Alice Johnson','Pro Plan','$19.00','Paid','Jan 12'],['#1233','Bob Smith','Enterprise','$99.00','Paid','Jan 11'],['#1232','Carol White','Pro Plan','$19.00','Pending','Jan 11'],['#1231','David Lee','Free Plan','$0.00','Active','Jan 10'],['#1230','Eve Davis','Pro Plan','$19.00','Paid','Jan 10']].map(([id,name,prod,amt,status,date])=>`<tr class="hover:bg-gray-50 transition-colors"><td class="px-6 py-4 text-sm font-mono text-blue-600 font-semibold">${id}</td><td class="px-6 py-4 text-sm font-medium text-gray-900">${name}</td><td class="px-6 py-4 text-sm text-gray-600">${prod}</td><td class="px-6 py-4 text-sm font-bold text-gray-900">${amt}</td><td class="px-6 py-4"><span class="px-2.5 py-1 text-xs font-bold rounded-full ${status==='Paid'?'bg-green-100 text-green-700':status==='Pending'?'bg-yellow-100 text-yellow-700':'bg-blue-100 text-blue-700'}">${status}</span></td><td class="px-6 py-4 text-sm text-gray-500">${date}</td></tr>`).join('')}</tbody></table></div></div></div>`
    }
  ]
};

const DASHBOARD_ANALYTICS: Template = {
  id: 'dashboard-analytics', name: 'Analytics Dashboard', category: 'Dashboard',
  description: 'Traffic metrics and top pages report.',
  accent: 'from-violet-600 to-purple-700',
  sections: [{
    id: 'da1', type: 'cards', name: 'Analytics Overview', styles: { width: 'full', align: 'center', spacing: 'normal' },
    htmlContent: `<div class="bg-gray-50 min-h-screen p-8"><div class="max-w-7xl mx-auto"><div class="flex items-center justify-between mb-8"><div><h1 class="text-2xl font-black text-gray-900">Analytics</h1><p class="text-gray-500 text-sm mt-1">Last 30 days · Updated 5 min ago</p></div><select class="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none"><option>Last 30 days</option><option>Last 7 days</option><option>Last 90 days</option></select></div><div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">${[['Page Views','128,405','+24%'],['Unique Visitors','42,108','+18%'],['Avg. Session','2m 34s','+5%'],['Bounce Rate','38.2%','-3%']].map(([label,val,chg])=>`<div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"><p class="text-sm text-gray-500 mb-2">${label}</p><p class="text-3xl font-black text-gray-900 mb-1">${val}</p><p class="text-xs font-bold text-green-600">${chg} vs last period</p></div>`).join('')}</div><div class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"><h3 class="font-bold text-gray-900 mb-6">Top Pages</h3><div class="space-y-4">${[['/','Home','42,104','33%'],['/#features','Features','28,940','23%'],['/#pricing','Pricing','19,250','15%'],['/blog','Blog','14,830','12%'],['/docs','Docs','10,940','9%']].map(([path,name,views,pct])=>`<div class="flex items-center gap-3"><div class="flex-1 min-w-0"><div class="flex items-center justify-between text-sm mb-1"><span class="font-medium text-gray-700">${name}<span class="text-gray-400 font-mono ml-2 text-xs">${path}</span></span><span class="text-gray-600 font-semibold">${views}</span></div><div class="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-violet-500 rounded-full" style="width:${pct}"></div></div></div></div>`).join('')}</div></div><div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"><h3 class="font-bold text-gray-900 mb-6">Traffic Sources</h3><div class="space-y-4">${[['Organic Search','54,200','43%','blue'],['Direct','32,100','25%','violet'],['Social Media','20,400','16%','pink'],['Referral','15,808','12%','emerald']].map(([src,visits,pct,color])=>`<div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-3 h-3 rounded-full bg-${color}-500"></div><span class="text-sm text-gray-700">${src}</span></div><div class="text-right"><p class="text-sm font-bold text-gray-900">${visits}</p><p class="text-xs text-gray-400">${pct}</p></div></div>`).join('')}</div></div></div></div></div>`
  }]
};

const DASHBOARD_PROFILE: Template = {
  id: 'dashboard-profile', name: 'User Profile', category: 'Dashboard',
  description: 'User profile card with stats and edit form.',
  accent: 'from-pink-500 to-rose-600',
  sections: [{
    id: 'dp1', type: 'cards', name: 'Profile Card', styles: { width: 'full', align: 'center', spacing: 'normal' },
    htmlContent: `<div class="bg-gray-50 min-h-screen p-8"><div class="max-w-4xl mx-auto"><div class="bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl p-8 mb-6 text-white"><div class="flex items-center gap-6"><div class="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-black border-2 border-white/30">JD</div><div><h1 class="text-2xl font-black">John Doe</h1><p class="text-pink-100 mt-1">Product Designer · San Francisco, CA</p><div class="flex gap-6 mt-4">${[['Designs','142'],['Templates','28'],['Downloads','1.2K']].map(([l,v])=>`<div><p class="text-xl font-black">${v}</p><p class="text-pink-200 text-xs">${l}</p></div>`).join('')}</div></div></div></div><div class="grid grid-cols-1 md:grid-cols-3 gap-6"><div class="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"><h2 class="font-bold text-gray-900 mb-6">Edit Profile</h2><div class="grid grid-cols-2 gap-4"><div class="col-span-2 md:col-span-1"><label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">First Name</label><input value="John" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-400"/></div><div class="col-span-2 md:col-span-1"><label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Last Name</label><input value="Doe" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-400"/></div><div class="col-span-2"><label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label><input value="john@example.com" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-400"/></div><div class="col-span-2"><label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bio</label><textarea rows="3" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-400 resize-none">Product designer passionate about clean, user-centered experiences.</textarea></div></div><button class="mt-6 px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-colors text-sm">Save Changes</button></div><div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"><h2 class="font-bold text-gray-900 mb-4">Account Plan</h2><div class="p-4 bg-gradient-to-br from-blue-50 to-violet-50 rounded-2xl border border-blue-100 mb-4"><p class="text-sm font-bold text-blue-700 mb-1">Premium Plan</p><p class="text-xs text-blue-600">Renews Jan 15, 2026</p></div><div class="space-y-3 text-sm">${['Unlimited projects','Unlimited AI commands','All export formats','Priority support'].map(f=>`<div class="flex items-center gap-2 text-gray-600"><span class="text-green-500 font-bold">✓</span>${f}</div>`).join('')}</div></div></div></div></div>`
  }]
};

// ═════════════════════════════════════════════════════════════════════════════
// BUSINESS
// ═════════════════════════════════════════════════════════════════════════════

const BUSINESS_TESTIMONIALS: Template = {
  id: 'business-testimonials', name: 'Testimonials', category: 'Business',
  description: 'Three customer testimonial cards with avatars and ratings.',
  accent: 'from-yellow-400 to-orange-500',
  sections: [{
    id: 'bt1', type: 'testimonials', name: 'Testimonials', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="py-24 bg-white"><div class="max-w-7xl mx-auto px-6"><div class="text-center mb-16"><h2 class="text-4xl font-black text-gray-900 mb-4">Loved by designers worldwide</h2><p class="text-gray-500 text-lg">Join thousands of teams already building with us.</p></div><div class="grid grid-cols-1 md:grid-cols-3 gap-8">${[['Sarah K.','Lead Designer at Airbnb','⭐⭐⭐⭐⭐','Speak2Design cut our design-to-dev handoff time by 70%. The AI generation is genuinely impressive — it understands context like a senior designer.','SK','from-pink-500 to-rose-500'],['James M.','CTO at TechFlow','⭐⭐⭐⭐⭐','We shipped our MVP landing page in 2 hours instead of 2 weeks. The multi-page export with routing is a game-changer for rapid prototyping.','JM','from-blue-500 to-indigo-600'],['Priya S.','Freelance Developer','⭐⭐⭐⭐⭐','As someone who can\'t design but needs to ship fast, this is my secret weapon. The template library alone is worth the subscription.','PS','from-violet-500 to-purple-600']].map(([name,role,stars,quote,initials,grad])=>`<div class="bg-gray-50 rounded-3xl p-8 hover:shadow-lg transition-shadow"><div class="text-xl mb-4">${stars}</div><p class="text-gray-700 leading-relaxed mb-8 italic">"${quote}"</p><div class="flex items-center gap-3"><div class="w-10 h-10 bg-gradient-to-br ${grad} rounded-full flex items-center justify-center text-white text-sm font-black">${initials}</div><div><p class="font-bold text-gray-900 text-sm">${name}</p><p class="text-gray-500 text-xs">${role}</p></div></div></div>`).join('')}</div></div></section>`
  }]
};

const BUSINESS_SERVICES: Template = {
  id: 'business-services', name: 'Services Grid', category: 'Business',
  description: 'Four-column services overview with icons.',
  accent: 'from-cyan-500 to-blue-600',
  sections: [{
    id: 'bsv1', type: 'features', name: 'Services', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="py-24 bg-gradient-to-b from-gray-50 to-white"><div class="max-w-7xl mx-auto px-6"><div class="text-center mb-16"><p class="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">What we offer</p><h2 class="text-4xl font-black text-gray-900 mb-4">Services built for modern teams</h2><p class="text-gray-500 text-lg max-w-2xl mx-auto">Everything you need to design, build, and launch — all in one place.</p></div><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">${[['🎨','UI Design','Create stunning interfaces with AI-powered design tools and a library of 30+ templates.'],['⚡','Rapid Prototyping','Go from idea to clickable prototype in minutes, not weeks.'],['💻','Code Export','Get production-ready HTML, CSS, or React components with a single click.'],['🚀','Deployment','Push your designs live instantly with our integrated deployment pipeline.'],['📊','Analytics','Track how users interact with your designs with built-in heatmaps and metrics.'],['🔒','Security','Enterprise-grade security with SSO, audit logs, and role-based permissions.'],['🌐','Multi-Language','Build for global audiences with built-in RTL support and i18n tools.'],['🤝','Collaboration','Real-time collaboration so your whole team can design together.']].map(([icon,title,desc])=>`<div class="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"><div class="text-3xl mb-4">${icon}</div><h3 class="font-bold text-gray-900 mb-2">${title}</h3><p class="text-sm text-gray-500 leading-relaxed">${desc}</p></div>`).join('')}</div></div></section>`
  }]
};

const BUSINESS_FAQ: Template = {
  id: 'business-faq', name: 'FAQ Section', category: 'Business',
  description: 'Frequently asked questions in a clean two-column layout.',
  accent: 'from-indigo-500 to-blue-600',
  sections: [{
    id: 'bfaq1', type: 'faq', name: 'FAQ', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="py-24 bg-white"><div class="max-w-6xl mx-auto px-6"><div class="text-center mb-16"><h2 class="text-4xl font-black text-gray-900 mb-4">Frequently asked questions</h2><p class="text-gray-500 text-lg">Can't find what you're looking for? <a href="#" class="text-blue-600 font-semibold hover:underline">Chat with us</a></p></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6">${[['How does AI generation work?','Our Groq AI analyzes your voice or text command and generates production-ready Tailwind HTML components that match your intent.'],['Can I use the generated code in production?','Absolutely. All generated code is clean, semantic HTML with Tailwind CSS — ready to drop into any project.'],['What export formats are available?','Premium users can export as HTML files, React/TSX components, or a full ZIP package with routing.'],['Is there a free plan?','Yes! The free plan includes 10 AI commands per month, 1 project, and HTML preview.'],['Do you support multi-page websites?','Yes! You can create unlimited pages per project, each with its own canvas and URL slug.'],['Can I publish templates to the marketplace?','Premium users can publish their designs as marketplace templates and earn from downloads.']].map(([q,a])=>`<div class="p-6 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors"><h3 class="font-bold text-gray-900 mb-2">${q}</h3><p class="text-gray-600 text-sm leading-relaxed">${a}</p></div>`).join('')}</div></div></section>`
  }]
};

const BUSINESS_CONTACT: Template = {
  id: 'business-contact', name: 'Contact Page', category: 'Business',
  description: 'Contact form with info cards on the side.',
  accent: 'from-teal-500 to-emerald-600',
  sections: [{
    id: 'bc1', type: 'form', name: 'Contact Form', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="py-24 bg-white"><div class="max-w-6xl mx-auto px-6"><div class="text-center mb-16"><h2 class="text-4xl font-black text-gray-900 mb-4">Get in touch</h2><p class="text-gray-500 text-lg">We'd love to hear from you. Send us a message and we'll respond within 24 hours.</p></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-12"><div class="lg:col-span-2 bg-gray-50 rounded-3xl p-8"><div class="grid grid-cols-2 gap-4 mb-4"><div><label class="block text-sm font-semibold text-gray-700 mb-1.5">First name</label><input type="text" placeholder="John" class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-400"/></div><div><label class="block text-sm font-semibold text-gray-700 mb-1.5">Last name</label><input type="text" placeholder="Doe" class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-400"/></div></div><div class="mb-4"><label class="block text-sm font-semibold text-gray-700 mb-1.5">Email</label><input type="email" placeholder="you@example.com" class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-400"/></div><div class="mb-4"><label class="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label><select class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-400 text-gray-700"><option>General inquiry</option><option>Technical support</option><option>Billing</option><option>Enterprise plan</option></select></div><div class="mb-6"><label class="block text-sm font-semibold text-gray-700 mb-1.5">Message</label><textarea rows="5" placeholder="Tell us how we can help..." class="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-400 resize-none"></textarea></div><button class="px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors">Send Message →</button></div><div class="space-y-6">${[['📧','Email us','hello@brand.com','We usually reply within 24 hours.'],['💬','Live chat','Available 9am–6pm','Mon–Fri, GMT+5'],['📞','Call us','+1 (555) 123-4567','For enterprise inquiries']].map(([icon,title,val,note])=>`<div class="p-6 bg-gray-50 rounded-2xl"><div class="text-2xl mb-3">${icon}</div><h3 class="font-bold text-gray-900 mb-1">${title}</h3><p class="text-teal-600 font-semibold text-sm">${val}</p><p class="text-gray-500 text-xs mt-1">${note}</p></div>`).join('')}</div></div></div></section>`
  }]
};

const BUSINESS_TEAM: Template = {
  id: 'business-team', name: 'Team Grid', category: 'Business',
  description: 'Team member cards with role and social links.',
  accent: 'from-pink-500 to-violet-600',
  sections: [{
    id: 'bteam1', type: 'cards', name: 'Team Members', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="py-24 bg-gray-50"><div class="max-w-7xl mx-auto px-6"><div class="text-center mb-16"><h2 class="text-4xl font-black text-gray-900 mb-4">Meet the team</h2><p class="text-gray-500 text-lg">The people behind Speak2Design.</p></div><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">${[['Alex Chen','Founder & CEO','Prev. Google, Meta. CS PhD Stanford.','from-blue-500 to-indigo-600','AC'],['Maria Rodriguez','Head of Design','10+ yrs UX. Prev. Figma, Adobe.','from-pink-500 to-rose-500','MR'],['Omar Hassan','Lead Engineer','Full-stack wizard. Prev. Stripe, Vercel.','from-emerald-500 to-teal-600','OH'],['Sana Ali','Growth & Marketing','0→$1M ARR specialist.','from-violet-500 to-purple-600','SA']].map(([name,role,bio,grad,initials])=>`<div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-shadow group"><div class="h-40 bg-gradient-to-br ${grad} flex items-center justify-center"><div class="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-black border-2 border-white/30">${initials}</div></div><div class="p-6"><h3 class="font-black text-gray-900">${name}</h3><p class="text-blue-600 text-sm font-semibold mb-2">${role}</p><p class="text-gray-500 text-xs leading-relaxed">${bio}</p></div></div>`).join('')}</div></div></section>`
  }]
};

// ═════════════════════════════════════════════════════════════════════════════
// EDUCATIONAL
// ═════════════════════════════════════════════════════════════════════════════

const EDU_COURSE_HERO: Template = {
  id: 'edu-course-hero', name: 'Course Hero', category: 'Educational',
  description: 'Course landing page hero with enroll CTA and instructor info.',
  accent: 'from-yellow-500 to-orange-500',
  sections: [{
    id: 'ech1', type: 'hero', name: 'Course Hero', styles: { width: 'full', align: 'center', spacing: 'normal' },
    htmlContent: `<section class="bg-gradient-to-br from-gray-900 to-yellow-950 text-white py-20 px-6"><div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"><div><span class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold rounded-full uppercase tracking-widest mb-6">🏆 Best Seller · 12,000+ students</span><h1 class="text-4xl font-black leading-tight mb-4">Master Modern Web Design <span class="text-yellow-400">from Scratch</span></h1><p class="text-gray-400 text-lg mb-6 leading-relaxed">Learn UI/UX design, Tailwind CSS, and AI-powered tools. Build 10 real projects and land your first design job.</p><div class="flex items-center gap-3 mb-8"><div class="flex items-center gap-1 text-yellow-400">★★★★★</div><span class="text-gray-300 text-sm font-semibold">4.9 (2,840 reviews)</span></div><div class="flex gap-4"><a href="#" class="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-black rounded-2xl transition-colors shadow-xl">Enroll Now — $49</a><a href="#" class="px-8 py-4 bg-white/5 border border-white/10 text-gray-300 font-bold rounded-2xl hover:bg-white/10 transition-colors">Preview course</a></div><p class="mt-4 text-gray-500 text-sm">30-day money-back guarantee · Lifetime access · Certificate of completion</p></div><div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8"><div class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Course Includes</div><div class="grid grid-cols-2 gap-4 text-sm">${[['📹','42 hours of video'],['📄','30+ downloadable files'],['📱','Access on mobile & desktop'],['🏅','Certificate of completion'],['💬','Community Discord'],['🔄','Lifetime access & updates']].map(([icon,text])=>`<div class="flex items-center gap-2 text-gray-300"><span>${icon}</span><span>${text}</span></div>`).join('')}</div></div></div></div></section>`
  }]
};

const EDU_CURRICULUM: Template = {
  id: 'edu-curriculum', name: 'Curriculum List', category: 'Educational',
  description: 'Expandable course curriculum with lessons and durations.',
  accent: 'from-green-500 to-emerald-600',
  sections: [{
    id: 'ecur1', type: 'cards', name: 'Curriculum', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="py-24 bg-white"><div class="max-w-4xl mx-auto px-6"><h2 class="text-4xl font-black text-gray-900 mb-4">Course Curriculum</h2><p class="text-gray-500 mb-10">42 lessons · 14 hours of content · 6 hands-on projects</p><div class="space-y-4">${[['Module 1: Design Fundamentals',['Color theory & typography (45 min)','Layout principles & grids (52 min)','UI components deep-dive (1h 12min)']],['Module 2: Tailwind CSS Mastery',['Utility-first fundamentals (38 min)','Responsive design patterns (55 min)','Dark mode & theming (42 min)']],['Module 3: AI-Powered Design',['Introduction to Speak2Design (25 min)','Voice-to-UI workflow (40 min)','Template customization (35 min)']],['Module 4: Build Real Projects',['Project 1: SaaS Landing Page (2h)','Project 2: Dashboard UI (1h 45min)','Project 3: E-commerce Store (2h 20min)']]].map(([module,lessons],i)=>`<div class="border border-gray-200 rounded-2xl overflow-hidden"><div class="px-6 py-4 bg-gray-50 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-sm font-black">${i+1}</div><h3 class="font-bold text-gray-900">${module}</h3></div><span class="text-sm text-gray-500">${lessons.length} lessons</span></div><div class="divide-y divide-gray-100">${lessons.map(l=>`<div class="px-6 py-3 flex items-center justify-between hover:bg-gray-50"><div class="flex items-center gap-3 text-sm"><span class="text-gray-400">▶</span><span class="text-gray-700">${l.split('(')[0].trim()}</span></div><span class="text-xs text-gray-400 font-medium">${l.match(/\(([^)]+)\)/)?.[1]||''}</span></div>`).join('')}</div></div>`).join('')}</div></div></section>`
  }]
};

const EDU_INSTRUCTOR: Template = {
  id: 'edu-instructor', name: 'Instructor Bio', category: 'Educational',
  description: 'Instructor profile with credentials and course stats.',
  accent: 'from-blue-500 to-indigo-600',
  sections: [{
    id: 'einst1', type: 'cards', name: 'Instructor', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="py-20 bg-gray-50"><div class="max-w-4xl mx-auto px-6"><h2 class="text-3xl font-black text-gray-900 mb-10">Your Instructor</h2><div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex gap-8 items-start"><div class="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black flex-shrink-0">AK</div><div><h3 class="text-2xl font-black text-gray-900 mb-1">Ahmed Khalil</h3><p class="text-blue-600 font-semibold mb-3">Senior Product Designer · 10+ Years Experience</p><p class="text-gray-600 leading-relaxed mb-6">Former design lead at Uber and Atlassian. I've shipped products used by millions of people and now teach everything I know about modern UI/UX design and AI-powered workflows.</p><div class="grid grid-cols-2 sm:grid-cols-4 gap-4">${[['4.9★','Rating'],['12K+','Students'],['8','Courses'],['98%','Completion rate']].map(([v,l])=>`<div class="text-center p-3 bg-gray-50 rounded-xl"><p class="text-xl font-black text-gray-900">${v}</p><p class="text-xs text-gray-500 mt-0.5">${l}</p></div>`).join('')}</div></div></div></div></section>`
  }]
};

const EDU_CTA: Template = {
  id: 'edu-cta', name: 'Enrollment CTA', category: 'Educational',
  description: 'Urgency-driven enrollment CTA with limited time offer.',
  accent: 'from-orange-500 to-red-600',
  sections: [{
    id: 'ecta1', type: 'cta', name: 'Enroll CTA', styles: { width: 'full', align: 'center', spacing: 'normal' },
    htmlContent: `<section class="py-20 bg-gradient-to-r from-orange-500 to-red-500 text-white"><div class="max-w-3xl mx-auto px-6 text-center"><div class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-bold mb-8">⏰ Limited offer ends Sunday</div><h2 class="text-5xl font-black mb-4">Ready to start your<br/>design journey?</h2><p class="text-orange-100 text-xl mb-2">Get lifetime access to all 42 lessons, 6 projects, and future updates.</p><div class="flex items-center justify-center gap-4 mb-8"><span class="text-5xl font-black">$49</span><span class="text-2xl text-orange-200 line-through">$199</span><span class="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">75% OFF</span></div><a href="#" class="inline-block px-12 py-5 bg-white text-orange-600 font-black text-xl rounded-2xl hover:bg-orange-50 transition-colors shadow-2xl">Enroll Now for $49 →</a><p class="mt-6 text-orange-200 text-sm">30-day money-back guarantee · Instant access · No subscription</p></div></section>`
  }]
};

// ═════════════════════════════════════════════════════════════════════════════
// PORTFOLIO
// ═════════════════════════════════════════════════════════════════════════════

const PORTFOLIO_HERO: Template = {
  id: 'portfolio-hero', name: 'Portfolio Hero', category: 'Portfolio',
  description: 'Bold dark portfolio hero with role and contact CTA.',
  accent: 'from-gray-900 to-black',
  sections: [{
    id: 'ph1', type: 'hero', name: 'Portfolio Hero', styles: { width: 'full', align: 'center', spacing: 'normal' },
    htmlContent: `<section class="min-h-screen bg-gray-950 text-white flex items-center px-6"><div class="max-w-5xl mx-auto"><div class="flex flex-col lg:flex-row items-center gap-16"><div class="flex-1"><div class="flex items-center gap-3 mb-8"><div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div><span class="text-green-400 text-sm font-semibold">Available for work</span></div><h1 class="text-6xl md:text-8xl font-black leading-none tracking-tighter mb-6">Hi, I'm<br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">Zara Ahmed</span></h1><p class="text-gray-400 text-xl leading-relaxed mb-10 max-w-lg">UI/UX Designer & Frontend Developer. I craft beautiful digital experiences that users actually love.</p><div class="flex gap-4"><a href="#work" class="px-8 py-4 bg-white text-gray-900 font-black rounded-2xl hover:bg-gray-100 transition-colors">View my work</a><a href="mailto:hello@zara.dev" class="px-8 py-4 border border-gray-700 text-gray-300 font-bold rounded-2xl hover:border-gray-400 hover:text-white transition-colors">Get in touch</a></div></div><div class="flex-shrink-0 w-72 h-72 bg-gradient-to-br from-blue-600 to-violet-600 rounded-3xl flex items-center justify-center text-8xl font-black text-white/30">ZA</div></div></div></section>`
  }]
};

const PORTFOLIO_PROJECTS: Template = {
  id: 'portfolio-projects', name: 'Projects Grid', category: 'Portfolio',
  description: 'Masonry-style project cards with tags and links.',
  accent: 'from-blue-500 to-violet-500',
  sections: [{
    id: 'pp1', type: 'gallery', name: 'Projects', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="py-24 bg-gray-950 text-white"><div class="max-w-7xl mx-auto px-6"><div class="flex items-end justify-between mb-16"><div><p class="text-blue-400 text-sm font-bold uppercase tracking-widest mb-3">Selected work</p><h2 class="text-5xl font-black">Projects</h2></div><a href="#" class="text-gray-400 hover:text-white transition-colors font-semibold text-sm">All projects →</a></div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${[['Speak2Design','AI-powered UI builder used by 50K+ designers','blue','#0052CC','React · TypeScript · Groq AI'],['DataFlow Dashboard','Real-time analytics platform for enterprise clients','violet','#7C3AED','Next.js · D3.js · PostgreSQL'],['ShopQuick','E-commerce mobile app with 4.9★ App Store rating','green','#059669','React Native · Node.js · Stripe'],['MindMap AI','AI brainstorming tool that structures your ideas','orange','#EA580C','Vue.js · OpenAI · MongoDB'],['TaskFlow','Team project management with AI prioritization','pink','#DB2777','SvelteKit · Supabase · WebSockets'],['HealthTrack','Personal wellness dashboard for daily habit tracking','teal','#0D9488','React · Chart.js · Firebase']].map(([title,desc,color,hex,stack])=>`<div class="group bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden hover:border-gray-600 transition-all hover:-translate-y-1 cursor-pointer"><div class="h-48 flex items-center justify-center" style="background:${hex}20"><span class="text-6xl font-black" style="color:${hex}40">${title[0]}</span></div><div class="p-6"><h3 class="font-black text-lg mb-2">${title}</h3><p class="text-gray-400 text-sm mb-4">${desc}</p><p class="text-xs text-gray-600 font-mono">${stack}</p></div></div>`).join('')}</div></div></section>`
  }]
};

const PORTFOLIO_SKILLS: Template = {
  id: 'portfolio-skills', name: 'Skills Section', category: 'Portfolio',
  description: 'Skills grid with proficiency bars and tech icons.',
  accent: 'from-emerald-500 to-green-600',
  sections: [{
    id: 'psk1', type: 'cards', name: 'Skills', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="py-24 bg-white"><div class="max-w-6xl mx-auto px-6"><div class="text-center mb-16"><h2 class="text-4xl font-black text-gray-900 mb-4">Skills & Expertise</h2><p class="text-gray-500 text-lg">5+ years of professional experience</p></div><div class="grid grid-cols-1 md:grid-cols-2 gap-12"><div><h3 class="text-xl font-black text-gray-900 mb-6">Technical Skills</h3><div class="space-y-5">${[['React / Next.js','95%'],['TypeScript','88%'],['Node.js / Express','82%'],['Tailwind CSS','97%'],['MongoDB / PostgreSQL','80%']].map(([skill,pct])=>`<div><div class="flex justify-between text-sm mb-2"><span class="font-semibold text-gray-700">${skill}</span><span class="text-gray-500">${pct}</span></div><div class="h-2 bg-gray-100 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all" style="width:${pct}"></div></div></div>`).join('')}</div></div><div><h3 class="text-xl font-black text-gray-900 mb-6">Design Tools</h3><div class="grid grid-cols-2 gap-4">${[['🎨','Figma','Expert'],['✏️','Adobe XD','Advanced'],['🖼️','Illustrator','Intermediate'],['🎬','After Effects','Intermediate'],['🤖','Midjourney','Advanced'],['⚡','Speak2Design','Expert']].map(([icon,tool,level])=>`<div class="p-4 bg-gray-50 rounded-2xl flex items-center gap-3"><span class="text-2xl">${icon}</span><div><p class="font-bold text-gray-900 text-sm">${tool}</p><p class="text-xs text-gray-500">${level}</p></div></div>`).join('')}</div></div></div></div></section>`
  }]
};

// ═════════════════════════════════════════════════════════════════════════════
// BLOG
// ═════════════════════════════════════════════════════════════════════════════

const BLOG_HERO: Template = {
  id: 'blog-hero', name: 'Blog Featured', category: 'Blog',
  description: 'Featured blog post card + 3 recent posts grid.',
  accent: 'from-rose-500 to-pink-600',
  sections: [{
    id: 'bh1', type: 'hero', name: 'Blog Header', styles: { width: 'full', align: 'center', spacing: 'normal' },
    htmlContent: `<section class="py-16 bg-white"><div class="max-w-7xl mx-auto px-6"><div class="flex items-end justify-between mb-12"><div><p class="text-rose-600 text-sm font-bold uppercase tracking-widest mb-2">The Blog</p><h1 class="text-5xl font-black text-gray-900">Ideas, insights &amp; updates</h1></div><a href="#" class="text-gray-500 hover:text-gray-900 font-semibold text-sm transition-colors">All articles →</a></div><div class="grid grid-cols-1 lg:grid-cols-5 gap-8"><div class="lg:col-span-3 group cursor-pointer"><div class="h-72 bg-gradient-to-br from-rose-500 to-pink-500 rounded-3xl mb-6 flex items-end p-6"><span class="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full">Featured</span></div><p class="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">AI & Design · 8 min read</p><h2 class="text-2xl font-black text-gray-900 mb-3 group-hover:text-rose-600 transition-colors leading-tight">How AI is completely transforming the way we design digital products in 2025</h2><p class="text-gray-500 leading-relaxed mb-4">A deep dive into the tools, workflows, and mindset shifts that are reshaping product design...</p><div class="flex items-center gap-3"><div class="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-black">AK</div><span class="text-sm font-semibold text-gray-700">Ahmed Khalil</span><span class="text-gray-300">·</span><span class="text-sm text-gray-500">Jan 15, 2025</span></div></div><div class="lg:col-span-2 flex flex-col gap-6">${[['Design Systems at Scale: Lessons from 5 Years','Design · 5 min','Dec 28, 2024'],['The Complete Guide to Tailwind CSS v4','Tailwind · 12 min','Dec 20, 2024'],['Building Accessible UIs: A Practical Checklist','A11y · 7 min','Dec 10, 2024']].map(([title,tag,date])=>`<div class="group cursor-pointer flex gap-4"><div class="w-24 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex-shrink-0"></div><div><p class="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">${tag}</p><h3 class="font-bold text-gray-900 text-sm leading-tight group-hover:text-rose-600 transition-colors mb-2">${title}</h3><p class="text-xs text-gray-400">${date}</p></div></div>`).join('')}</div></div></div></section>`
  }]
};

const BLOG_CARDS: Template = {
  id: 'blog-cards', name: 'Blog Grid', category: 'Blog',
  description: 'Three-column article card grid with tags and read time.',
  accent: 'from-indigo-500 to-blue-600',
  sections: [{
    id: 'bgc1', type: 'cards', name: 'Article Cards', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="py-16 bg-gray-50"><div class="max-w-7xl mx-auto px-6"><div class="flex items-center gap-3 mb-10 overflow-x-auto"><button class="px-4 py-1.5 bg-gray-900 text-white text-sm font-bold rounded-full whitespace-nowrap">All Posts</button>${['Design','AI Tools','Tutorials','React','CSS'].map(t=>`<button class="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-full hover:border-gray-400 transition-colors whitespace-nowrap">${t}</button>`).join('')}</div><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">${[['Mastering Flexbox and Grid in 2025','CSS · 6 min read','Jan 12','from-blue-500 to-cyan-500'],['10 Figma Plugins Every Designer Needs','Tools · 4 min read','Jan 9','from-pink-500 to-rose-500'],['Building a REST API with Node.js and MongoDB','Backend · 15 min read','Jan 6','from-green-500 to-emerald-500'],['Introduction to AI-Powered UI Generation','AI · 8 min read','Jan 3','from-violet-500 to-purple-500'],['The Psychology of Color in UI Design','Design · 7 min read','Dec 28','from-orange-500 to-yellow-500'],['TypeScript Best Practices for React Projects','React · 10 min read','Dec 22','from-teal-500 to-cyan-500']].map(([title,meta,date,grad])=>`<article class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow group cursor-pointer"><div class="h-48 bg-gradient-to-br ${grad} flex items-center justify-center"><span class="text-white/20 text-7xl font-black">${title[0]}</span></div><div class="p-6"><div class="flex items-center justify-between mb-3"><span class="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">${meta.split('·')[0].trim()}</span><span class="text-xs text-gray-400">${meta.split('·')[1]?.trim()}</span></div><h3 class="font-black text-gray-900 text-lg mb-2 leading-tight group-hover:text-blue-600 transition-colors">${title}</h3><p class="text-xs text-gray-400 mt-4">${date}</p></div></article>`).join('')}</div></div></section>`
  }]
};

const BLOG_NEWSLETTER: Template = {
  id: 'blog-newsletter', name: 'Newsletter Signup', category: 'Blog',
  description: 'Email newsletter subscription section with social proof.',
  accent: 'from-violet-600 to-indigo-700',
  sections: [{
    id: 'bns1', type: 'cta', name: 'Newsletter', styles: { width: 'full', align: 'center', spacing: 'spacious' },
    htmlContent: `<section class="py-24 bg-gradient-to-br from-violet-900 to-indigo-950 text-white"><div class="max-w-3xl mx-auto px-6 text-center"><div class="text-5xl mb-6">✉️</div><h2 class="text-4xl font-black mb-4">Stay in the loop</h2><p class="text-violet-200 text-xl mb-10 leading-relaxed">Get weekly insights on design, AI tools, and frontend development. No spam, ever. Unsubscribe anytime.</p><form class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8"><input type="email" placeholder="your@email.com" class="flex-1 px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-violet-300 outline-none focus:border-white/40 backdrop-blur-sm"/><button type="submit" class="px-8 py-4 bg-white text-violet-700 font-black rounded-2xl hover:bg-violet-50 transition-colors whitespace-nowrap shadow-xl">Subscribe →</button></form><div class="flex items-center justify-center gap-6 text-sm text-violet-300"><span>📧 Weekly digest</span><span>🔒 Zero spam</span><span>👥 12,000+ readers</span></div></div></section>`
  }]
};

// ═════════════════════════════════════════════════════════════════════════════
// MASTER EXPORT
// ═════════════════════════════════════════════════════════════════════════════

export const ALL_TEMPLATES: Template[] = [
  // Authentication
  AUTH_LOGIN, AUTH_REGISTER, AUTH_FORGOT, AUTH_2FA,
  // Landing Pages
  LANDING_SAAS_HERO, LANDING_MINIMAL, LANDING_STARTUP, LANDING_PRICING, LANDING_FOOTER,
  // Dashboard
  DASHBOARD_STATS, DASHBOARD_ANALYTICS, DASHBOARD_PROFILE,
  // Business
  BUSINESS_TESTIMONIALS, BUSINESS_SERVICES, BUSINESS_FAQ, BUSINESS_CONTACT, BUSINESS_TEAM,
  // Educational
  EDU_COURSE_HERO, EDU_CURRICULUM, EDU_INSTRUCTOR, EDU_CTA,
  // Portfolio
  PORTFOLIO_HERO, PORTFOLIO_PROJECTS, PORTFOLIO_SKILLS,
  // Blog
  BLOG_HERO, BLOG_CARDS, BLOG_NEWSLETTER,
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Landing Pages', 'Authentication', 'Dashboard', 'Business', 'Educational', 'Portfolio', 'Blog'
];

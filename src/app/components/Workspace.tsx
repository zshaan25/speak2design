import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic, ChevronLeft, Undo2, Redo2, Code2, Settings2, X, Save,
  Volume2, VolumeX, GripVertical, Loader2, Zap, Download,
  Copy, Check, AlertCircle, RefreshCw, ArrowUp, ArrowDown, LayoutTemplate, Eye,
  ZoomIn, ZoomOut, Maximize2, Keyboard, Palette, Search, Sparkles, CloudOff,
  Share2, BookMarked, History, Type, Link, Globe, Lock, ChevronDown, ChevronUp,
  Mail, Github, UserPlus,Crown
} from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { PageManager, type PageDoc } from './PageManager';
import { TemplateLibrary } from './TemplateLibrary';
import type { Template } from '../data/templates';
import { WebsitePreview } from './WebsitePreview';
import { downloadWebsiteZip } from '../utils/zipExport';

// ─── API Base URL ─────────────────────────────────────────────────────────────
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';

// ─── Types ────────────────────────────────────────────────────────────────────
interface WorkspaceProps {
  onBack: () => void;
  projectId?: string | null;
  initialPrompt?: string | null;
  /** Auto-open the template library on mount (Dashboard "Templates" shortcut). */
  openTemplates?: boolean;
}

interface CanvasComponent {
  id: string;
  type: string;
  name: string;
  styles: Record<string, string>;
  htmlContent: string;
}

const FREE_TIER_LIMIT = 10;

// ─── Component Library (#7) — drag/click-to-insert building blocks ─────────────
// Each preset is a ready-made Tailwind block. Clicking appends it to the canvas;
// it can also be dragged onto the canvas. Inserted blocks are fully editable.
interface LibraryItem { type: string; name: string; icon: string; html: string; }
const COMPONENT_LIBRARY: LibraryItem[] = [
  { type: 'navbar', name: 'Navbar', icon: '▤', html: `<nav class="bg-slate-900 text-white px-6 py-4 flex items-center justify-between"><span class="font-extrabold text-lg">Brand</span><div class="flex gap-6 text-sm font-semibold"><a href="#" class="hover:text-cyan-400">Home</a><a href="#" class="hover:text-cyan-400">About</a><a href="#" class="hover:text-cyan-400">Contact</a></div></nav>` },
  { type: 'hero', name: 'Hero', icon: '★', html: `<section class="bg-gradient-to-br from-indigo-600 to-violet-700 text-white text-center py-24 px-6"><h1 class="text-5xl font-black mb-4">Build something great</h1><p class="text-lg text-white/80 mb-8 max-w-xl mx-auto">A bold hero section to introduce your product or idea.</p><button class="bg-white text-indigo-700 font-bold px-8 py-3 rounded-full">Get Started</button></section>` },
  { type: 'button', name: 'Button', icon: '⬚', html: `<div class="p-6 text-center"><button class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-colors">Click Me</button></div>` },
  { type: 'cards', name: 'Card Grid', icon: '▦', html: `<section class="py-16 px-6 bg-gray-50"><div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">${[1,2,3].map(()=>`<div class="bg-white rounded-2xl shadow-md p-6"><div class="w-12 h-12 rounded-xl bg-indigo-100 mb-4"></div><h3 class="font-bold text-lg text-gray-900 mb-2">Feature</h3><p class="text-gray-500 text-sm">Describe the value this feature brings to your users.</p></div>`).join('')}</div></section>` },
  { type: 'form', name: 'Form', icon: '✎', html: `<section class="py-16 px-6 bg-white"><form class="max-w-md mx-auto space-y-4"><h2 class="text-2xl font-bold text-gray-900 text-center mb-2">Contact Us</h2><input class="w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="Your name" /><input class="w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="Email address" /><textarea class="w-full border border-gray-300 rounded-xl px-4 py-3" rows="4" placeholder="Message"></textarea><button class="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">Send</button></form></section>` },
  { type: 'gallery', name: 'Image', icon: '▢', html: `<div class="p-6"><div class="aspect-video w-full max-w-2xl mx-auto rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">Image Placeholder</div></div>` },
  { type: 'pricing', name: 'Pricing', icon: '$', html: `<section class="py-16 px-6 bg-gray-50"><div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">${['Free','Pro','Team'].map((p,i)=>`<div class="bg-white rounded-2xl shadow-md p-8 text-center ${i===1?'ring-2 ring-indigo-500':''}"><h3 class="font-bold text-xl text-gray-900">${p}</h3><p class="text-4xl font-black text-gray-900 my-4">$${i*15}</p><button class="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl mt-4">Choose</button></div>`).join('')}</div></section>` },
  { type: 'testimonials', name: 'Testimonial', icon: '❝', html: `<section class="py-16 px-6 bg-white text-center"><p class="text-2xl font-medium text-gray-800 max-w-2xl mx-auto italic">"This product completely transformed how our team works."</p><p class="mt-4 font-bold text-gray-900">— Alex Rivera, CEO</p></section>` },
  { type: 'footer', name: 'Footer', icon: '▬', html: `<footer class="bg-slate-900 text-white/70 py-10 px-6 text-center"><p class="font-bold text-white mb-2">Brand</p><div class="flex justify-center gap-6 text-sm mb-4"><a href="#" class="hover:text-white">Privacy</a><a href="#" class="hover:text-white">Terms</a><a href="#" class="hover:text-white">Contact</a></div><p class="text-xs">© 2026 Brand. All rights reserved.</p></footer>` },
];

// ─── Sanitize HTML — DOMPurify, defense-in-depth before dangerouslySetInnerHTML ─
// Server already sanitizes AI output; this re-sanitizes on render in case stale or
// tampered canvas state reaches the DOM.
const sanitizeHTML = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base'],
    ALLOW_DATA_ATTR: false,
  });
};

// ─── Share Modal ──────────────────────────────────────────────────────────────
const ShareModal: React.FC<{
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}> = ({ projectId, projectTitle, onClose }) => {
  const [isPublic, setIsPublic] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [initialised, setInitialised] = useState(false);
  // Collaborator invite (#4)
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'view' | 'edit' | 'owner'>('view');

  // Fetch current share state on mount
  useEffect(() => {
    const token = localStorage.getItem('speak2design_token');
    fetch(`${API_BASE}/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => {
      if (d.success) {
        setIsPublic(d.project.isPublic || false);
        setShareToken(d.project.shareToken || null);
      }
    }).catch(() => {}).finally(() => setInitialised(true));
  }, [projectId]);

  const toggle = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isPublic: !isPublic })
      });
      const d = await res.json();
      if (d.success) {
        setIsPublic(d.isPublic);
        setShareToken(d.shareToken);
        toast.success(d.isPublic ? 'Project is now public!' : 'Project set to private.');
      }
    } catch { toast.error('Share toggle failed.'); }
    finally { setLoading(false); }
  };

  const regenerateLink = async () => {
    if (!window.confirm('This will invalidate the current share link. Anyone with the old URL will lose access. Continue?')) return;
    setRegenerating(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/share/regenerate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (d.success) {
        setIsPublic(d.isPublic);
        setShareToken(d.shareToken);
        setCopied(false);
        toast.success('Share link regenerated — old link is now invalid.');
      } else {
        toast.error('Failed to regenerate link.');
      }
    } catch { toast.error('Failed to regenerate link.'); }
    finally { setRegenerating(false); }
  };

  const shareURL = shareToken
    ? `${window.location.origin}/view/${shareToken}`
    : null;

  const handleCopy = async () => {
    if (!shareURL) return;
    await navigator.clipboard.writeText(shareURL);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Share via the user's email client
  const shareViaEmail = () => {
    if (!shareURL) return;
    const subject = encodeURIComponent(`Check out my Speak2Design project: ${projectTitle}`);
    const body = encodeURIComponent(`I built this with Speak2Design — take a look:\n\n${shareURL}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Copy the link and open GitHub Gist so the user can publish/embed it
  const shareToGitHub = async () => {
    if (shareURL) await navigator.clipboard.writeText(shareURL);
    window.open('https://gist.github.com/', '_blank', 'noopener');
    toast.success('Link copied — paste it into a new GitHub gist.');
  };

  // Draft a collaborator invite with the chosen permission level
  const sendInvite = () => {
    if (!inviteEmail.trim()) { toast.error('Enter an email address to invite.'); return; }
    const roleLabel = { view: 'View only', edit: 'Can edit', owner: 'Owner' }[inviteRole];
    const subject = encodeURIComponent(`You're invited to collaborate on "${projectTitle}"`);
    const body = encodeURIComponent(
      `You've been invited as "${roleLabel}" on the Speak2Design project "${projectTitle}".\n\nOpen it here:\n${shareURL ?? '(make the project public first to generate a link)'}`
    );
    window.open(`mailto:${encodeURIComponent(inviteEmail.trim())}?subject=${subject}&body=${body}`);
    toast.success(`Invite drafted for ${inviteEmail.trim()} (${roleLabel})`);
    setInviteEmail('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
              <Share2 className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Share Project</h2>
              <p className="text-xs text-gray-500">{projectTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {!initialised ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Toggle row */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPublic ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {isPublic ? <Globe className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{isPublic ? 'Public' : 'Private'}</p>
                    <p className="text-[11px] text-gray-500">
                      {isPublic ? 'Anyone with the link can view' : 'Only you can access this project'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggle}
                  disabled={loading}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    isPublic ? 'bg-green-500' : 'bg-gray-300'
                  } disabled:opacity-60`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Share URL */}
              {isPublic && shareURL && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Share Link</p>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                      <Link className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate font-mono">{shareURL}</span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex-shrink-0 ${
                        copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Recipients see a read-only view of the current published state.
                  </p>

                  {/* Quick share channels (#4) */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button onClick={shareViaEmail}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors">
                      <Mail className="w-4 h-4 text-blue-500" /> Email
                    </button>
                    <button onClick={shareToGitHub}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors">
                      <Github className="w-4 h-4 text-gray-900" /> GitHub
                    </button>
                  </div>

                  {/* Invite collaborators with permission levels (#4) */}
                  <div className="pt-3 mt-1 border-t border-gray-100 space-y-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" /> Invite Collaborators
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="teammate@email.com"
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400/40"
                      />
                      <button onClick={sendInvite}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-xl font-bold text-sm transition-colors flex-shrink-0">
                        Invite
                      </button>
                    </div>
                    {/* Permission levels */}
                    <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
                      {([
                        { id: 'view',  label: 'View Only' },
                        { id: 'edit',  label: 'Can Edit' },
                        { id: 'owner', label: 'Owner' },
                      ] as const).map(r => (
                        <button key={r.id} onClick={() => setInviteRole(r.id)}
                          className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                            inviteRole === r.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Sends an email invite for the selected role. Edit/Owner access activates once the collaborator signs in.
                    </p>
                  </div>

                  <button
                    onClick={regenerateLink}
                    disabled={regenerating}
                    className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 mt-1"
                  >
                    {regenerating
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <RefreshCw className="w-3 h-3" />}
                    {regenerating ? 'Regenerating…' : 'Regenerate link (invalidates old URL)'}
                  </button>
                </div>
              )}

              {!isPublic && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Toggle the switch above to generate a shareable link. The project will be viewable by anyone who has the URL.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors">
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Export Code Modal ────────────────────────────────────────────────────────
const ExportModal: React.FC<{
  canvas: CanvasComponent[];
  projectTitle: string;
  onClose: () => void;
  userTier: 'free' | 'premium';
  onUpgrade: () => void;
  isUpgrading: boolean;
  /** All pages (for ZIP export) */
  allPages: PageDoc[];
  /** In-memory canvas cache — includes unsaved edits */
  canvasCache: Record<string, CanvasComponent[]>;
  /** Active canvas font family */
  canvasFont?: string;
}> = ({ canvas, projectTitle, onClose, userTier, onUpgrade, isUpgrading, allPages, canvasCache, canvasFont = 'Inter' }) => {
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const isPremium = userTier === 'premium';

  // Mirror the canvas FR_05 layout (width / align / spacing) into the exported HTML
  // so the downloaded file matches what the user sees on the canvas.
  const exportWrapperStyle = (styles: Record<string, string> = {}): string => {
    const widthPct: Record<string, string> = { sm: '40%', md: '60%', lg: '80%', full: '100%' };
    const spacingPad: Record<string, string> = { compact: '0.25rem 0', normal: '0.75rem 0', spacious: '2.5rem 0' };
    const width = widthPct[styles.width] || '100%';
    const align = styles.align || 'center';
    // Default to flush (0) when spacing is unset — matches the canvas, where
    // sections stack seamlessly. Each AI section already has its own padding.
    const parts = [`width:${width}`, `padding:${spacingPad[styles.spacing] || '0'}`];
    if (width !== '100%') {
      if (align === 'center') parts.push('margin-left:auto', 'margin-right:auto');
      else if (align === 'right') parts.push('margin-left:auto');
      else parts.push('margin-right:auto');
    }
    return parts.join(';');
  };

  // Build Google Fonts link for the active font
  const gfontsLink = canvasFont !== 'Inter'
    ? `\n  <link rel="preconnect" href="https://fonts.googleapis.com" />\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(canvasFont).replace(/%20/g, '+')}:wght@400;600;700&display=swap" rel="stylesheet" />`
    : '';
  const fontBodyStyle = canvasFont !== 'Inter' ? ` style="font-family:'${canvasFont}',sans-serif"` : '';

  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${projectTitle}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>${gfontsLink}
  <style>*{box-sizing:border-box;}body{margin:0;}</style>
</head>
<body${fontBodyStyle}>
${canvas.map(c => `  <!-- ${c.name} -->\n  <div style="${exportWrapperStyle(c.styles)}">\n    ${c.htmlContent.trim()}\n  </div>`).join('\n\n')}
</body>
</html>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullHTML);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, '-').toLowerCase() || 'speak2design'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML file downloaded!');
  };

  const handleDownloadCSS = () => {
    const cssContent = `/* Generated by Speak2Design — https://speak2design.vercel.app */
/* This project uses Tailwind CSS utility classes. */
/* Add the Tailwind CDN or install via npm for production use. */

body {
  margin: 0;
  font-family: 'Inter', -apple-system, sans-serif;
}
`;
    const blob = new Blob([cssContent], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'styles.css';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSS file downloaded!');
  };

  const handleDownloadZip = async () => {
    if (allPages.length === 0) { toast.error('No pages to export.'); return; }
    setIsZipping(true);
    try {
      // Merge in-memory cache so unsaved edits are included
      const resolvedPages = allPages.map(p => ({
        ...p,
        canvasState: (canvasCache[p._id] ?? p.canvasState ?? []) as CanvasComponent[],
      }));
      await downloadWebsiteZip(resolvedPages, projectTitle, canvasFont);
      toast.success('Website ZIP downloaded!');
    } catch (err: any) {
      toast.error(err?.message ?? 'ZIP export failed.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-xl text-gray-900">Export Code</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {canvas.length} component{canvas.length !== 1 ? 's' : ''} · Production-ready HTML + Tailwind CSS
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-[#0d1117] m-4 rounded-xl relative">
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-[10px] text-white/60 font-mono">
            index.html
          </div>
          <pre className="text-green-400 font-mono text-xs p-6 overflow-auto leading-relaxed whitespace-pre-wrap">
            {fullHTML}
          </pre>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-3 items-center">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          {isPremium ? (
            <>
              <button
                onClick={handleDownloadHTML}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0052CC] hover:bg-[#0047b3] text-white rounded-xl font-bold text-sm transition-all"
              >
                <Download className="w-4 h-4" /> Download HTML
              </button>
              <button
                onClick={handleDownloadCSS}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
              >
                <Download className="w-4 h-4" /> Download CSS
              </button>
              <button
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-60"
              >
                {isZipping
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Zipping…</>
                  : <><Download className="w-4 h-4" /> Download ZIP ({allPages.length} page{allPages.length !== 1 ? 's' : ''})</>
                }
              </button>
              <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                <Check className="w-3.5 h-3.5 text-green-500" />
                Tailwind CDN included
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                File downloads (HTML/CSS/ZIP) are a Premium feature. Free plan can copy code.
              </div>
              <button
                onClick={onUpgrade}
                disabled={isUpgrading}
                className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60"
              >
                {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                {isUpgrading ? 'Upgrading…' : 'Upgrade to Download'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Workspace Component ───────────────────────────────────────────────────────
export const Workspace: React.FC<WorkspaceProps> = ({ onBack, projectId, initialPrompt, openTemplates }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [language, setLanguage] = useState<'English' | 'Urdu'>('English');
  const [textCommand, setTextCommand] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [usageCount, setUsageCount] = useState(0);
  const [dailyRemaining, setDailyRemaining] = useState<number | 'unlimited' | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'premium'>('free');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(!!openTemplates);
  const [showPreview, setShowPreview] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [clarificationMessage, setClarificationMessage] = useState<string | null>(null);

  const [canvasState, setCanvasState] = useState<CanvasComponent[]>([]);
  const [historyStack, setHistoryStack] = useState<CanvasComponent[][]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('Untitled Project');

  // ── Multi-page state ─────────────────────────────────────────────────────────
  const [pages, setPages] = useState<PageDoc[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  // In-memory canvas cache: saves each page's canvas so switching is instant
  const pageCanvasCache = useRef<Record<string, CanvasComponent[]>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const dragItemRef = useRef<string | null>(null);

  // ── Load user tier + usageCount from DB (not stale client state) ────────────
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const token = localStorage.getItem('speak2design_token');
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUsageCount(data.user.usageCount || 0);
          setUserTier(data.user.tier || 'free');
        }
      } catch (err) {
        console.error('Profile load error:', err);
      }
    };
    loadUserProfile();
  }, []);

  // ── Load project ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    const loadProject = async () => {
      try {
        const token = localStorage.getItem('speak2design_token');
        const res = await fetch(`${API_BASE}/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.project) {
          const proj = data.project;
          setProjectTitle(proj.title || 'Untitled Project');
          if (proj.language) setLanguage(proj.language);
          if (proj.canvasState?.length > 0) {
            setCanvasState(proj.canvasState);
            setHistoryStack([proj.canvasState]);
            setHistoryPointer(0);
          }
        }
      } catch (err) {
        console.error('Project load error:', err);
      }
    };
    loadProject();
  }, [projectId]);

  // ── Load pages (runs after project load) ────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    const loadPages = async () => {
      try {
        const token = localStorage.getItem('speak2design_token');
        const res = await fetch(`${API_BASE}/api/projects/${projectId}/pages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.pages?.length > 0) {
          setPages(data.pages);
          const firstPage = data.pages[0];
          // Seed cache from fetched data
          data.pages.forEach((p: PageDoc) => {
            pageCanvasCache.current[p._id] = p.canvasState || [];
          });
          // Activate first page — its canvas might already be set by project load
          setActivePageId(firstPage._id);
          // Only overwrite canvas if the page has its own content
          if ((firstPage.canvasState?.length ?? 0) > 0) {
            setCanvasState(firstPage.canvasState);
            setHistoryStack([firstPage.canvasState]);
            setHistoryPointer(0);
          }
        }
      } catch (err) {
        console.error('Pages load error:', err);
      }
    };
    loadPages();
  }, [projectId]);

  // ── Switch active page ───────────────────────────────────────────────────────
  const switchPage = useCallback((targetPageId: string) => {
    if (targetPageId === activePageId) return;

    // Save current canvas into the in-memory cache before switching
    if (activePageId) {
      pageCanvasCache.current[activePageId] = canvasState;
      // Also sync into the pages array so the cache and pages stay aligned
      setPages(prev => prev.map(p =>
        p._id === activePageId ? { ...p, canvasState } : p
      ));
    }

    // Load target page canvas from cache (already populated on mount)
    const targetCanvas = pageCanvasCache.current[targetPageId] ?? [];
    setActivePageId(targetPageId);
    setCanvasState(targetCanvas);
    setHistoryStack([targetCanvas]);
    setHistoryPointer(0);
    setSelectedComponentId(null);
  }, [activePageId, canvasState]);

  // ── Page CRUD helpers ─────────────────────────────────────────────────────────
  const addPage = async () => {
    if (!projectId) return;
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: `Page ${pages.length + 1}` })
      });
      const data = await res.json();
      if (data.success) {
        pageCanvasCache.current[data.page._id] = [];
        setPages(prev => [...prev, data.page]);
        switchPage(data.page._id);
        toast.success(`"${data.page.name}" created.`);
      }
    } catch { toast.error('Failed to create page.'); }
  };

  const renamePage = async (pageId: string, name: string) => {
    if (!projectId) return;
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        setPages(prev => prev.map(p => p._id === pageId ? { ...p, name } : p));
      }
    } catch { toast.error('Rename failed.'); }
  };

  const duplicatePageAction = async (pageId: string) => {
    if (!projectId) return;
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/pages/${pageId}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        pageCanvasCache.current[data.page._id] = data.page.canvasState || [];
        setPages(prev => [...prev, data.page]);
        switchPage(data.page._id);
        toast.success(`"${data.page.name}" duplicated.`);
      }
    } catch { toast.error('Duplicate failed.'); }
  };

  const deletePageAction = async (pageId: string) => {
    if (!projectId) return;
    if (pages.length <= 1) { toast.error('Cannot delete the last page.'); return; }
    if (!confirm('Delete this page? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/pages/${pageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        delete pageCanvasCache.current[pageId];
        const remaining = pages.filter(p => p._id !== pageId);
        setPages(remaining);
        if (activePageId === pageId && remaining.length > 0) {
          switchPage(remaining[0]._id);
        }
        toast.success('Page deleted.');
      } else {
        toast.error(data.message || 'Delete failed.');
      }
    } catch { toast.error('Delete failed.'); }
  };

  // ── TTS ──────────────────────────────────────────────────────────────────────
  const speakTTS = useCallback((text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'Urdu' ? 'ur-PK' : 'en-US';
    // Prefer a matching installed voice when available
    const match = window.speechSynthesis.getVoices().find(v => v.lang === utterance.lang);
    if (match) utterance.voice = match;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled, language]);

  // ── History ──────────────────────────────────────────────────────────────────
  const pushNewStateToHistory = (nextState: CanvasComponent[]) => {
    const updated = historyStack.slice(0, historyPointer + 1);
    updated.push(nextState);
    setHistoryStack(updated);
    setHistoryPointer(updated.length - 1);
    setCanvasState(nextState);
  };

  const handleUndoAction = () => {
    if (historyPointer > 0) {
      const p = historyPointer - 1;
      setHistoryPointer(p);
      setCanvasState(historyStack[p]);
      setSelectedComponentId(null);
      toast.info('Undo applied.');
      speakTTS('Undo applied.');
    }
  };

  const handleRedoAction = () => {
    if (historyPointer < historyStack.length - 1) {
      const p = historyPointer + 1;
      setHistoryPointer(p);
      setCanvasState(historyStack[p]);
      setSelectedComponentId(null);
      toast.info('Redo applied.');
      speakTTS('Redo applied.');
    }
  };

  // Effective project id — auto-creates a project the first time Save runs without
  // one (e.g. Workspace opened from the sidebar with no project selected) (#2).
  const createdProjectIdRef = useRef<string | null>(null);
  // Reactive mirror of the auto-created id so the UI (Share/ShareModal) updates
  // once a brand-new project is persisted.
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const ensureProjectId = useCallback(async (): Promise<string | null> => {
    if (projectId) return projectId;
    if (createdProjectIdRef.current) return createdProjectIdRef.current;
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: projectTitle || 'Untitled Project', language })
      });
      const data = await res.json();
      if (data.success && data.project?._id) {
        createdProjectIdRef.current = data.project._id;
        setCreatedProjectId(data.project._id);
        return data.project._id;
      }
    } catch { /* fall through */ }
    return null;
  }, [projectId, projectTitle, language]);

  // Use this everywhere the UI needs "the project id, if one exists yet".
  const activeProjectId = projectId ?? createdProjectId;

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSaveProject = async () => {
    // Don't create an empty project from a blank canvas (avoids junk "drafts").
    if (canvasState.length === 0 && !projectId && !createdProjectIdRef.current) {
      toast.error('Canvas is empty — add a component before saving.');
      return;
    }
    setIsSaving(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const pid = await ensureProjectId();
      if (!pid) { toast.error('Could not create a project to save into. Check your connection.'); return; }

      // 1. Save project metadata + legacy canvasState (backwards compat)
      const projRes = await fetch(`${API_BASE}/api/projects/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ canvasState, title: projectTitle, language, notify: true })
      });
      const projData = await projRes.json();
      if (!projData.success) {
        toast.error('Save failed: ' + projData.message);
        return;
      }

      // 2. Save the active page's canvas to its own Page document
      if (activePageId) {
        await fetch(`${API_BASE}/api/projects/${projectId}/pages/${activePageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ canvasState })
        });
        // Update cache and pages array to reflect saved state
        pageCanvasCache.current[activePageId] = canvasState;
        setPages(prev => prev.map(p =>
          p._id === activePageId ? { ...p, canvasState } : p
        ));
      }

      toast.success('Project saved!');
      speakTTS('Project saved successfully.');
    } catch {
      toast.error('Could not reach server.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── FR_09: upgrade to Premium (unlocks export downloads + publishing) ──────
  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const token = localStorage.getItem('speak2design_token');
      const co = await fetch(`${API_BASE}/api/auth/upgrade/checkout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const coData = await co.json();
      if (coData.url) { window.location.href = coData.url; return; }
      if (coData.alreadyPremium) { setUserTier('premium'); return; }
      const res = await fetch(`${API_BASE}/api/auth/upgrade`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setUserTier('premium');
        toast.success('Upgraded to Premium! Downloads and publishing unlocked.');
        speakTTS('You are now a Premium user.');
      } else {
        toast.error(data.message || 'Upgrade failed.');
      }
    } catch {
      toast.error('Connection error during upgrade.');
    } finally {
      setIsUpgrading(false);
    }
  };

  // ── Handle API response (shared between voice and text) ───────────────────
  const handleAPIResponse = (data: any, logCtx?: { type: 'voice' | 'text'; command: string }) => {
    // Sync usage stats from authoritative server response
    if (typeof data.usageCount === 'number') setUsageCount(data.usageCount);
    if (data.tier) setUserTier(data.tier);
    if (data.commandsRemaining !== undefined) setDailyRemaining(data.commandsRemaining);

    if (data.clarification_needed) {
      setClarificationMessage(data.message);
      toast.info(data.message, { duration: 6000 });
      if (data.ttsConfirmation) speakTTS(data.ttsConfirmation);
      return;
    }

    setClarificationMessage(null);

    if (data.updatedCanvas && Array.isArray(data.updatedCanvas) && data.updatedCanvas.length > 0) {
      pushNewStateToHistory(data.updatedCanvas);
      // Log to command history
      if (logCtx) {
        addCommandLog(logCtx.type, logCtx.command, data.updatedCanvas.length);
      }
      // Scroll canvas to top so user sees the rendered output
      canvasAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      // FR_06: notify when the latest command overrode an existing component.
      if (data.overrideNotice) {
        toast.warning(data.overrideNotice, { duration: 5000 });
        speakTTS(data.overrideNotice);
      } else {
        toast.success(`Canvas updated — ${data.updatedCanvas.length} component${data.updatedCanvas.length > 1 ? 's' : ''} rendered. Check the preview below!`, { duration: 4000 });
        if (data.ttsConfirmation) speakTTS(data.ttsConfirmation);
      }
    } else if (data.updatedCanvas && Array.isArray(data.updatedCanvas) && data.updatedCanvas.length === 0) {
      pushNewStateToHistory([]);
      toast.info('Canvas cleared.');
    }
  };

  // ── Voice recording ───────────────────────────────────────────────────────
  const activateAudioCaptureStream = async () => {
    if (userTier === 'free' && usageCount >= FREE_TIER_LIMIT) {
      toast.error(`Free tier limit reached (${FREE_TIER_LIMIT} commands). Upgrade to Premium.`, { duration: 5000 });
      speakTTS('Free tier limit reached. Please upgrade to Premium.');
      return;
    }
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg;codecs=opus';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(t => t.stop());
        if (blob.size < 1000) {
          toast.error('Recording too short — click the mic and speak a little longer.');
          setIsListening(false);
          return;
        }
        await processAudioPayload(blob);
      };
      recorder.start(250);
      setIsListening(true);
      setTranscription('Listening… speak your layout command.');
      setClarificationMessage(null);

      // ── Auto-stop on silence (#3) ──────────────────────────────────────────
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const source   = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const SILENCE = 0.012;     // RMS threshold
        const SILENCE_MS = 1600;   // stop after this much trailing silence
        const MAX_MS = 15000;      // hard cap
        let lastLoud = Date.now();
        let spoke = false;
        const startedAt = Date.now();

        const poll = window.setInterval(() => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
          const rms = Math.sqrt(sum / data.length);
          const now = Date.now();
          if (rms > SILENCE) { lastLoud = now; spoke = true; }
          // Stop when: user spoke then went quiet, OR hit the hard cap.
          if ((spoke && now - lastLoud > SILENCE_MS) || now - startedAt > MAX_MS) {
            terminateAudioCaptureStream();
          }
        }, 150);

        silenceCleanupRef.current = () => {
          clearInterval(poll);
          try { source.disconnect(); audioCtx.close(); } catch { /* ignore */ }
        };
      } catch { /* analyser unsupported — recording still works, click again to stop */ }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Microphone access denied. Click the 🔒 icon in your browser address bar and allow microphone access, then refresh.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('No microphone detected. Plug in a mic or use the text command box below instead.', { duration: 6000 });
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        toast.error('Microphone is in use by another application. Close other apps using the mic and try again.');
      } else if (err.name === 'OverconstrainedError') {
        toast.error('Microphone does not meet requirements. Try a different audio input device.');
      } else {
        toast.error('Could not access microphone: ' + (err.message || err.name));
      }
      setIsListening(false);
    }
  };

  // Tears down the silence-detection audio graph (set up in activate).
  const silenceCleanupRef = useRef<(() => void) | null>(null);

  const terminateAudioCaptureStream = () => {
    if (silenceCleanupRef.current) { silenceCleanupRef.current(); silenceCleanupRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  // #3: one click toggles recording. Click to start → speak → auto-stops on
  // silence (or click again to stop). No hold required.
  const toggleVoiceCapture = () => {
    if (isProcessingAI) return;
    if (isListening) terminateAudioCaptureStream();
    else activateAudioCaptureStream();
  };

  const processAudioPayload = async (audioBlob: Blob) => {
    setIsProcessingAI(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'prompt_capture.webm');
    formData.append('language', language);
    formData.append('currentCanvas', JSON.stringify(canvasState));
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/voice/transcribe-and-generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();

      if (data.transcription) setTranscription(data.transcription);

      if (res.status === 403 && data.limitReached) {
        if (typeof data.usageCount === 'number') setUsageCount(data.usageCount);
        if (data.tier) setUserTier(data.tier);
        toast.error(data.message, { duration: 5000 });
        speakTTS('Free tier limit reached. Please upgrade to Premium.');
        return;
      }
      if (res.status === 429) { toast.error(data.message || 'Too many requests. Wait a moment.'); return; }
      if (res.ok && data.success) {
        handleAPIResponse(data, { type: 'voice', command: data.transcription || '(voice command)' });
      } else {
        toast.error(data.message || 'AI processing failed.');
        speakTTS('Sorry, I could not process that command. Please try again.');
      }
    } catch {
      toast.error('Network error — could not reach the AI pipeline.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // ── Text command ─────────────────────────────────────────────────────────────
  // Runs a command string through the AI pipeline (used by the form + #17 auto-run).
  const runTextCommand = async (command: string) => {
    if (!command.trim()) return;
    if (userTier === 'free' && usageCount >= FREE_TIER_LIMIT) {
      toast.error(`Free tier limit (${FREE_TIER_LIMIT} commands) reached. Upgrade to Premium.`);
      return;
    }
    setIsProcessingAI(true);
    setClarificationMessage(null);
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/voice/process-text-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ command, currentCanvas: canvasState, language })
      });
      const data = await res.json();

      if (res.status === 403 && data.limitReached) {
        if (typeof data.usageCount === 'number') setUsageCount(data.usageCount);
        if (data.tier) setUserTier(data.tier);
        toast.error(data.message, { duration: 5000 });
        return;
      }
      if (res.status === 429) { toast.error(data.message || 'Too many requests. Wait a moment.'); return; }
      if (res.ok && data.success) {
        handleAPIResponse(data, { type: 'text', command });
        setTextCommand('');
      } else {
        toast.error(data.message || 'Command failed.');
      }
    } catch {
      toast.error('Connection error.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const dispatchTextCommand = (e: React.FormEvent) => { e.preventDefault(); runTextCommand(textCommand); };

  // #17: auto-generate from the onboarding prompt once, after the project loads.
  const initialPromptRanRef = useRef(false);
  useEffect(() => {
    if (!initialPrompt || initialPromptRanRef.current) return;
    initialPromptRanRef.current = true;
    const t = setTimeout(() => {
      toast.info('Generating your website from your description…');
      runTextCommand(initialPrompt);
    }, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  // ── Remove component ─────────────────────────────────────────────────────────
  const removeComponent = (id: string) => {
    const updated = canvasState.filter(c => c.id !== id);
    pushNewStateToHistory(updated);
    setSelectedComponentId(null);
    toast.info('Component removed.');
    speakTTS('Component removed from canvas.');
  };

  // ── Duplicate component ───────────────────────────────────────────────────────
  const duplicateComponent = (id: string) => {
    const idx = canvasState.findIndex(c => c.id === id);
    if (idx === -1) return;
    const original = canvasState[idx];
    const clone = {
      ...original,
      id: `${original.id}_copy_${Date.now()}`,
      name: `${original.name} (copy)`,
    };
    const updated = [...canvasState];
    updated.splice(idx + 1, 0, clone);
    pushNewStateToHistory(updated);
    setSelectedComponentId(clone.id);
    toast.success(`"${original.name}" duplicated.`);
  };

  // ── FR_05: Move component up / down in the canvas stack ─────────────────────
  const moveComponent = (id: string, direction: 'up' | 'down') => {
    const updated = [...canvasState];
    const idx = updated.findIndex(c => c.id === id);
    if (direction === 'up' && idx > 0) {
      [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    } else if (direction === 'down' && idx < updated.length - 1) {
      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    } else return; // already at edge — do nothing
    pushNewStateToHistory(updated);
  };

  // ── Template Library: insert sections / new page ─────────────────────────────
  // #7: insert a library building block (click or drag-drop) into the canvas
  const insertLibraryComponent = (item: LibraryItem) => {
    const comp: CanvasComponent = {
      id: `lib_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: item.type,
      name: item.name,
      styles: {},
      htmlContent: item.html,
    };
    pushNewStateToHistory([...canvasState, comp]);
    setSelectedComponentId(comp.id);
    toast.success(`${item.name} added to canvas`);
  };

  const handleInsertTemplateSections = (sections: Template['sections']) => {
    const asComponents: CanvasComponent[] = sections.map(s => ({
      id: s.id,
      type: s.type,
      name: s.name,
      styles: s.styles as Record<string, string>,
      htmlContent: s.htmlContent,
    }));
    pushNewStateToHistory([...canvasState, ...asComponents]);
    toast.success(`${sections.length} section${sections.length > 1 ? 's' : ''} inserted!`);
  };

  const handleNewPageFromTemplate = async (name: string, sections: Template['sections']) => {
    if (!projectId) { toast.error('Save your project first before adding pages.'); return; }
    try {
      const token = localStorage.getItem('speak2design_token');
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!data.success) { toast.error('Could not create page.'); return; }
      const newPage: PageDoc = data.page;
      const asComponents: CanvasComponent[] = sections.map(s => ({
        id: s.id,
        type: s.type,
        name: s.name,
        styles: s.styles as Record<string, string>,
        htmlContent: s.htmlContent,
      }));
      // Pre-populate cache before switching so switchPage loads immediately
      pageCanvasCache.current[newPage._id] = asComponents;
      setPages(prev => [...prev, { ...newPage, canvasState: asComponents as any[] }]);
      switchPage(newPage._id);
      // Push sections into the new page's canvas history
      pushNewStateToHistory(asComponents);
      toast.success(`"${name}" page created with ${sections.length} section${sections.length > 1 ? 's' : ''}!`);
    } catch { toast.error('Failed to create page from template.'); }
  };

  // ── Drag & drop reorder ──────────────────────────────────────────────────────
  const handleDragStart = (id: string) => { dragItemRef.current = id; };
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const dragId = dragItemRef.current;
    if (!dragId || dragId === targetId) { setDragOverId(null); return; }
    const updated = [...canvasState];
    const fromIdx = updated.findIndex(c => c.id === dragId);
    const toIdx = updated.findIndex(c => c.id === targetId);
    const [item] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, item);
    pushNewStateToHistory(updated);
    setDragOverId(null);
    dragItemRef.current = null;
    toast.info('Layer reordered.');
  };
  const handleDragEnd = () => { setDragOverId(null); dragItemRef.current = null; };

  // ── FR_05: per-component resize / alignment / spacing ───────────────────────
  const WIDTH_PCT: Record<string, string> = { sm: '40%', md: '60%', lg: '80%', full: '100%' };
  const SPACING_CLASS: Record<string, string> = { compact: 'py-1', normal: 'py-3', spacious: 'py-10' };

  const layoutWrapperStyle = (styles: Record<string, string> = {}): React.CSSProperties => {
    const width = WIDTH_PCT[styles.width] || '100%';
    const align = styles.align || 'center';
    const style: React.CSSProperties = { width };
    if (width !== '100%') {
      if (align === 'center') { style.marginLeft = 'auto'; style.marginRight = 'auto'; }
      else if (align === 'right') { style.marginLeft = 'auto'; }
      else { style.marginRight = 'auto'; }
    }
    return style;
  };

  const updateComponentStyle = (id: string, key: string, value: string) => {
    const updated = canvasState.map(c =>
      c.id === id ? { ...c, styles: { ...(c.styles || {}), [key]: value } } : c
    );
    pushNewStateToHistory(updated);
  };

  const activeComponent = canvasState.find(c => c.id === selectedComponentId);

  // ── Inspector tabs ────────────────────────────────────────────────────────────
  const [inspectorTab, setInspectorTab] = useState<'properties' | 'code'>('properties');
  // Inline HTML editor — tracks the textarea value while editing
  const [editingHTML, setEditingHTML] = useState<string>('');
  const [editingName, setEditingName] = useState<string>('');
  const [htmlDirty, setHtmlDirty] = useState(false);
  const [nameDirty, setNameDirty] = useState(false);

  // Sync editor state when selection changes
  useEffect(() => {
    if (activeComponent) {
      setEditingHTML(activeComponent.htmlContent);
      setEditingName(activeComponent.name);
      setHtmlDirty(false);
      setNameDirty(false);
      setRegenPrompt(''); // clear regen prompt on selection change
    }
  }, [selectedComponentId, activeComponent?.htmlContent]);

  const applyHTMLEdit = () => {
    if (!activeComponent) return;
    const updated = canvasState.map(c =>
      c.id === activeComponent.id ? { ...c, htmlContent: editingHTML } : c
    );
    pushNewStateToHistory(updated);
    setHtmlDirty(false);
    toast.success('HTML updated on canvas.');
  };

  const applyNameEdit = () => {
    if (!activeComponent || !editingName.trim()) return;
    const updated = canvasState.map(c =>
      c.id === activeComponent.id ? { ...c, name: editingName.trim() } : c
    );
    pushNewStateToHistory(updated);
    setNameDirty(false);
  };

  // ── Canvas zoom ───────────────────────────────────────────────────────────────
  const [canvasZoom, setCanvasZoom] = useState(1);
  const ZOOM_STEPS = [0.5, 0.6, 0.75, 0.9, 1, 1.1, 1.25, 1.5];
  const zoomIn  = () => setCanvasZoom(z => { const i = ZOOM_STEPS.indexOf(z); return ZOOM_STEPS[Math.min(i + 1, ZOOM_STEPS.length - 1)]; });
  const zoomOut = () => setCanvasZoom(z => { const i = ZOOM_STEPS.indexOf(z); return ZOOM_STEPS[Math.max(i - 1, 0)]; });
  const zoomReset = () => setCanvasZoom(1);

  // Ctrl+Scroll to zoom
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) zoomIn();
        else zoomOut();
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasZoom]);

  // ── Auto-save ─────────────────────────────────────────────────────────────────
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Silent save — no toast, just API call
  const silentSave = useCallback(async () => {
    // Autosave only updates an existing project (never auto-creates).
    const pid = projectId || createdProjectIdRef.current;
    if (!pid || canvasState.length === 0) return;
    setAutoSaveStatus('saving');
    try {
      const token = localStorage.getItem('speak2design_token');
      await fetch(`${API_BASE}/api/projects/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ canvasState, title: projectTitle, language })
      });
      if (activePageId) {
        await fetch(`${API_BASE}/api/projects/${pid}/pages/${activePageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ canvasState })
        });
        pageCanvasCache.current[activePageId] = canvasState;
      }
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 4000);
    }
  }, [projectId, canvasState, projectTitle, language, activePageId]);

  useEffect(() => {
    const pid = projectId || createdProjectIdRef.current;
    if (!pid || historyPointer < 0) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(silentSave, 8000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasState]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
      // Escape — deselect
      if (e.key === 'Escape') { setSelectedComponentId(null); return; }
      // Ctrl/Cmd combos
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            if (!e.shiftKey) { e.preventDefault(); handleUndoAction(); }
            else { e.preventDefault(); handleRedoAction(); }
            break;
          case 'y': e.preventDefault(); handleRedoAction(); break;
          case 's': e.preventDefault(); handleSaveProject(); break;
          case 'd':
            e.preventDefault();
            if (selectedComponentId) duplicateComponent(selectedComponentId);
            break;
          case '=': case '+': e.preventDefault(); zoomIn(); break;
          case '-': e.preventDefault(); zoomOut(); break;
          case '0': e.preventDefault(); zoomReset(); break;
        }
      }
      // Delete/Backspace — remove selected (not when focused in input)
      if (!isInput && selectedComponentId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        removeComponent(selectedComponentId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComponentId, historyPointer, historyStack.length, canvasZoom]);

  // ── Color Theme ───────────────────────────────────────────────────────────────
  type ColorTheme = 'default' | 'forest' | 'sunset' | 'galaxy' | 'noir';
  const [showThemePicker, setShowThemePicker] = useState(false);

  const THEMES: { id: ColorTheme; label: string; dot: string; swap: [string, string][] }[] = [
    { id: 'default', label: 'Default',  dot: 'bg-blue-500',   swap: [] },
    { id: 'forest',  label: 'Forest',   dot: 'bg-green-500',  swap: [['blue','green'],['indigo','emerald'],['cyan','teal'],['violet','lime']] },
    { id: 'sunset',  label: 'Sunset',   dot: 'bg-orange-500', swap: [['blue','orange'],['indigo','rose'],['cyan','amber'],['violet','pink']] },
    { id: 'galaxy',  label: 'Galaxy',   dot: 'bg-violet-500', swap: [['blue','violet'],['indigo','purple'],['cyan','fuchsia'],['green','teal']] },
    { id: 'noir',    label: 'Noir',     dot: 'bg-slate-600',  swap: [['blue','slate'],['indigo','gray'],['cyan','zinc'],['violet','stone'],['green','gray']] },
  ];

  // Per-component snapshot of the ORIGINAL html, captured the first time a theme
  // is applied. Every theme switch transforms from this snapshot (not the already
  // recoloured html), so themes are repeatable and "Default" restores the original.
  const themeOriginRef = useRef<Record<string, string>>({});

  // Recolour ONLY Tailwind colour tokens inside class names — e.g. bg-blue-500,
  // hover:text-blue-700, from-blue-600 — never free text, so markup can't break.
  const swapColorTokens = (html: string, swaps: [string, string][]) => {
    let out = html;
    for (const [from, to] of swaps) {
      // matches `<prefix->blue<-shade>` where prefix is a utility like bg/text/border/from/to/via/ring(+variant)
      out = out.replace(new RegExp(`([-:])${from}(-\\d{2,3})`, 'g'), `$1${to}$2`);
    }
    return out;
  };

  const applyColorTheme = (themeId: ColorTheme) => {
    setShowThemePicker(false);
    if (canvasState.length === 0) { toast.info('Add a component first — themes recolour the canvas.'); return; }
    const theme = THEMES.find(t => t.id === themeId)!;
    const updated = canvasState.map(comp => {
      // Capture the pristine html once so re-theming always starts from it.
      if (!(comp.id in themeOriginRef.current)) themeOriginRef.current[comp.id] = comp.htmlContent;
      const original = themeOriginRef.current[comp.id];
      const html = themeId === 'default' ? original : swapColorTokens(original, theme.swap);
      return { ...comp, htmlContent: html };
    });
    pushNewStateToHistory(updated);
    toast.success(themeId === 'default'
      ? 'Reverted to original colours.'
      : `"${theme.label}" theme applied. Press Ctrl+Z to undo.`);
  };

  // ── Layer Search ──────────────────────────────────────────────────────────────
  const [layerSearch, setLayerSearch] = useState('');
  // #7: component library panel + drag state
  const [showComponentLib, setShowComponentLib] = useState(true);
  const [isLibDragging, setIsLibDragging] = useState(false);

  // ── Phase 6: Share Modal ──────────────────────────────────────────────────────
  const [showShareModal, setShowShareModal] = useState(false);

  // ── Phase 6: Command History Log ──────────────────────────────────────────────
  type CommandEntry = { id: string; type: 'voice' | 'text'; command: string; timestamp: Date; count: number };
  const [commandLog, setCommandLog] = useState<CommandEntry[]>([]);
  const [showCommandLog, setShowCommandLog] = useState(false);

  const addCommandLog = useCallback((type: 'voice' | 'text', command: string, count: number) => {
    const entry: CommandEntry = {
      id: `log_${Date.now()}`,
      type,
      command: command.length > 80 ? command.slice(0, 80) + '…' : command,
      timestamp: new Date(),
      count,
    };
    setCommandLog(prev => [entry, ...prev].slice(0, 20)); // keep last 20
  }, []);

  // ── Phase 6: Font Picker (persisted #5) ───────────────────────────────────────
  const [canvasFont, setCanvasFont] = useState(() => {
    try { return localStorage.getItem('speak2design_canvas_font') || 'Inter'; } catch { return 'Inter'; }
  });
  const [showFontPicker, setShowFontPicker] = useState(false);
  useEffect(() => {
    try { localStorage.setItem('speak2design_canvas_font', canvasFont); } catch { /* ignore */ }
  }, [canvasFont]);

  const FONTS = [
    { name: 'Inter',            url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap' },
    { name: 'Poppins',          url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap' },
    { name: 'Roboto',           url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap' },
    { name: 'Montserrat',       url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap' },
    { name: 'Playfair Display', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap' },
    { name: 'Nunito',           url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap' },
    { name: 'Lato',             url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap' },
    { name: 'Oswald',           url: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;600&display=swap' },
  ];

  // Inject Google Fonts link into <head> when font changes
  useEffect(() => {
    const font = FONTS.find(f => f.name === canvasFont);
    if (!font) return;
    const existingId = 'gfont-s2d';
    let link = document.getElementById(existingId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = existingId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = font.url;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasFont]);

  // ── Smart Regenerate ──────────────────────────────────────────────────────────
  const [regenPrompt, setRegenPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!activeComponent || !regenPrompt.trim()) return;
    setIsRegenerating(true);
    try {
      // Auto-create the project if it doesn't exist yet, so Regenerate works
      // on brand-new (unsaved) projects too.
      const pid = await ensureProjectId();
      if (!pid) { toast.error('Could not prepare the project. Check your connection.'); setIsRegenerating(false); return; }
      const token = localStorage.getItem('speak2design_token');
      const command = `Generate a single ${activeComponent.type} section: ${regenPrompt.trim()}. Return only one component.`;
      const res = await fetch(`${API_BASE}/api/projects/${pid}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ command, language })
      });
      const data = await res.json();
      if (data.components?.length > 0) {
        const newHTML = data.components[0].htmlContent ?? data.components[0].html ?? '';
        const updated = canvasState.map(c =>
          c.id === activeComponent.id ? { ...c, htmlContent: newHTML } : c
        );
        pushNewStateToHistory(updated);
        setEditingHTML(newHTML);
        toast.success(`"${activeComponent.name}" regenerated!`);
        if (typeof data.usageCount === 'number') setUsageCount(data.usageCount);
      } else {
        toast.error(data.message || 'AI returned no components.');
      }
    } catch {
      toast.error('Regenerate failed — check connection.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="h-screen bg-[#0b1120] flex flex-col pt-16 overflow-hidden">

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <ExportModal
            canvas={canvasState}
            projectTitle={projectTitle}
            onClose={() => setShowExportModal(false)}
            userTier={userTier}
            onUpgrade={handleUpgrade}
            isUpgrading={isUpgrading}
            allPages={pages}
            canvasCache={pageCanvasCache.current}
            canvasFont={canvasFont}
          />
        )}
      </AnimatePresence>

      {/* Template Library Modal */}
      <AnimatePresence>
        {showTemplateLibrary && (
          <TemplateLibrary
            onClose={() => setShowTemplateLibrary(false)}
            onInsertSections={handleInsertTemplateSections}
            onNewPageFromTemplate={handleNewPageFromTemplate}
          />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && activeProjectId && (
          <ShareModal
            projectId={activeProjectId}
            projectTitle={projectTitle}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Website Preview Modal — falls back to the live canvas when the project
          has no Page docs yet (e.g. a brand-new project), so preview always works. */}
      <AnimatePresence>
        {showPreview && (() => {
          const hasPages = pages.length > 0;
          const previewPages = hasPages
            ? pages
            : [{ _id: 'current', name: projectTitle || 'Page', slug: 'index', canvasState } as any];
          const previewCache = hasPages
            ? pageCanvasCache.current
            : { current: canvasState };
          const previewActiveId = hasPages ? activePageId : 'current';
          return (
            <WebsitePreview
              pages={previewPages}
              canvasCache={previewCache}
              activePageId={previewActiveId}
              projectTitle={projectTitle}
              onClose={() => setShowPreview(false)}
              canvasFont={canvasFont}
            />
          );
        })()}
      </AnimatePresence>

      {/* ── Toolbar ── overflow-visible so Theme/Font dropdowns (absolute top-full) aren't clipped */}
      <div className="h-14 glass border-b border-white/10 px-4 flex items-center justify-between gap-3 z-20 shrink-0 relative">
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-white/10" />
          <input
            value={projectTitle}
            onChange={e => setProjectTitle(e.target.value)}
            size={1}
            className="font-bold text-white bg-transparent border-none outline-none hover:bg-white/5 focus:bg-white/5 px-2 py-1 rounded-lg transition-colors text-sm w-32 sm:w-40 shrink-0"
          />
          {/* Active page breadcrumb */}
          {activePageId && pages.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-white/35">
              <span>/</span>
              <span className="font-medium text-white/55">
                {pages.find(p => p._id === activePageId)?.name ?? 'Page'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {userTier === 'free' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
              usageCount >= FREE_TIER_LIMIT
                ? 'bg-rose-500/15 border-rose-400/30 text-rose-300'
                : 'bg-amber-500/15 border-amber-400/30 text-amber-300'
            }`}>
              <Zap className="w-3.5 h-3.5" />
              {usageCount}/{FREE_TIER_LIMIT} commands
            </div>
          )}
          {/* Daily voice quota — shown after first voice command response */}
          {userTier === 'free' && dailyRemaining !== null && dailyRemaining !== 'unlimited' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${
              (dailyRemaining as number) === 0
                ? 'bg-rose-500/15 border-rose-400/30 text-rose-300'
                : 'glass text-white/60'
            }`} title="Daily voice commands remaining">
              <Zap className="w-3.5 h-3.5" />
              {dailyRemaining as number}/day left
            </div>
          )}
          {/* #2: Premium status lives only beside the profile avatar in TopNavbar —
              the duplicate badge here was removed to declutter the editor toolbar. */}
          <button onClick={handleUndoAction} disabled={historyPointer <= 0}
            className="p-2 hover:bg-white/10 disabled:opacity-30 rounded-lg text-white/60" title="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={handleRedoAction} disabled={historyPointer >= historyStack.length - 1}
            className="p-2 hover:bg-white/10 disabled:opacity-30 rounded-lg text-white/60" title="Redo">
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Zoom controls (top toolbar — Figma/Canva style) */}
          <div className="flex items-center gap-0.5 glass rounded-lg px-1 py-0.5">
            <button onClick={zoomOut} disabled={canvasZoom <= ZOOM_STEPS[0]} title="Zoom out (Ctrl -)"
              className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 rounded-md hover:bg-white/10 transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={zoomReset} title="Reset to 100% (Ctrl 0)"
              className="px-1 text-xs font-bold text-white/80 hover:text-white transition-colors min-w-[40px] text-center">
              {Math.round(canvasZoom * 100)}%
            </button>
            <button onClick={zoomIn} disabled={canvasZoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} title="Zoom in (Ctrl +)"
              className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 rounded-md hover:bg-white/10 transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          {/* #9: quick voice toggle (full panel lives in the left sidebar) */}
          <button
            onClick={toggleVoiceCapture}
            disabled={isProcessingAI}
            aria-pressed={isListening}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${isListening ? 'text-brand-pink bg-brand-pink/15 animate-pulse' : 'text-white/40 hover:bg-white/10'}`}
            title="Generate UI using voice commands."
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTtsEnabled(p => !p)}
            className={`p-2 rounded-lg transition-colors ${ttsEnabled ? 'text-brand-cyan bg-brand-cyan/10' : 'text-white/40 hover:bg-white/10'}`}
            title={ttsEnabled ? 'Disable Voice Feedback' : 'Enable Voice Feedback'}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Auto-save status indicator */}
          {autoSaveStatus !== 'idle' && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              autoSaveStatus === 'saving' ? 'text-brand-cyan bg-brand-cyan/10' :
              autoSaveStatus === 'saved'  ? 'text-emerald-300 bg-emerald-500/10' :
              'text-rose-300 bg-rose-500/10'
            }`}>
              {autoSaveStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
              {autoSaveStatus === 'saved'  && <Check className="w-3 h-3" />}
              {autoSaveStatus === 'error'  && <CloudOff className="w-3 h-3" />}
              {autoSaveStatus === 'saving' ? 'Auto-saving…' : autoSaveStatus === 'saved' ? 'Auto-saved' : 'Save failed'}
            </div>
          )}

          {/* Color theme picker */}
          <div className="relative">
            <button
              onClick={() => setShowThemePicker(p => !p)}
              title="Apply color theme"
              className="flex items-center gap-1.5 px-2.5 py-1.5 glass text-brand-pink rounded-lg text-xs font-bold hover:border-white/25 transition-colors"
            >
              <Palette className="w-4 h-4" />
              Theme
            </button>
            {showThemePicker && (
              <div className="absolute right-0 top-full mt-2 glass-strong border border-white/10 rounded-2xl shadow-xl p-3 z-50 w-40">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Color Themes</p>
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => applyColorTheme(t.id)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/10 text-left transition-colors">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${t.dot}`} />
                    <span className="text-sm font-semibold text-white/80">{t.label}</span>
                  </button>
                ))}
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-[10px] text-white/40 px-1 leading-relaxed">Swaps primary colors. Ctrl+Z to undo.</p>
                </div>
              </div>
            )}
          </div>

          {/* Font Picker */}
          <div className="relative">
            <button
              onClick={() => { setShowFontPicker(p => !p); setShowThemePicker(false); }}
              title="Change canvas font"
              className="flex items-center gap-1.5 px-2.5 py-1.5 glass text-brand-cyan rounded-lg text-xs font-bold hover:border-white/25 transition-colors"
            >
              <Type className="w-4 h-4" />
              {canvasFont === 'Inter' ? 'Font' : canvasFont.split(' ')[0]}
            </button>
            {showFontPicker && (
              <div className="absolute right-0 top-full mt-2 glass-strong border border-white/10 rounded-2xl shadow-xl p-3 z-50 w-52">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Canvas Font</p>
                {FONTS.map(f => (
                  <button
                    key={f.name}
                    onClick={() => { setCanvasFont(f.name); setShowFontPicker(false); toast.success(`Font set to ${f.name}`); }}
                    className={`w-full flex items-center justify-between px-2 py-2 rounded-xl transition-colors text-left ${
                      canvasFont === f.name ? 'bg-brand-cyan/10 text-brand-cyan' : 'hover:bg-white/10 text-white/75'
                    }`}
                  >
                    <span className="text-sm font-semibold">{f.name}</span>
                    {canvasFont === f.name && <Check className="w-3.5 h-3.5 text-brand-cyan" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* #9: Templates → Preview → Share (consistent order, equal sizing) */}
          <button
            onClick={() => setShowTemplateLibrary(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 glass text-brand-violet rounded-lg text-xs font-bold hover:border-white/25 transition-colors"
            title="Start quickly using professionally designed templates."
          >
            <LayoutTemplate className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => {
              // Preview the live canvas; pages are optional (new projects have none yet).
              if (pages.length === 0 && canvasState.length === 0) {
                toast.error('Add components to the canvas first.'); return;
              }
              setShowPreview(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 glass text-emerald-400 rounded-lg text-xs font-bold hover:border-white/25 transition-colors"
            title="Preview your website exactly as users will see it."
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={async () => {
              // Don't spin up an empty project just to share nothing.
              if (canvasState.length === 0 && !activeProjectId) {
                toast.error('Add a component before sharing.');
                return;
              }
              // Auto-create the project if it doesn't exist yet, then share.
              const pid = await ensureProjectId();
              if (!pid) { toast.error('Could not create a project to share. Check your connection.'); return; }
              setShowShareModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 glass text-brand-amber rounded-lg text-xs font-bold hover:border-white/25 transition-colors"
            title="Generate a shareable project link and collaborate with others."
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <div className="h-6 w-px bg-white/10 mx-1" />
          <button onClick={handleSaveProject} disabled={isSaving}
            title="Save your project to the cloud"
            className="flex items-center gap-1.5 px-2.5 py-1.5 glass text-white rounded-lg text-xs font-bold hover:border-white/25 disabled:opacity-50 transition-colors">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
          {/* #5/#10: Export sized to match every other toolbar button (px-3 py-2, gap-1.5). */}
          <button
            onClick={() => {
              if (canvasState.length === 0) { toast.error('Canvas is empty — add components first.'); return; }
              setShowExportModal(true);
            }}
            title="Download your completed website as code"
            className="group relative flex items-center gap-1.5 overflow-hidden text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-[0_0_22px_-10px_rgba(16,185,129,.8)]"
          >
            <span className="absolute inset-0 anim-gradient" style={{ background: 'linear-gradient(120deg,#10b981,#14b8a6,#06b6d4)' }} />
            <span className="relative z-10 flex items-center gap-1.5"><Code2 className="w-4 h-4" /> Export</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Panel ── */}
        <div className="w-64 glass border-r border-white/10 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 flex-1 overflow-y-auto space-y-5">

            {/* Language Toggle */}
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Voice Language</p>
              <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl">
                {(['English', 'Urdu'] as const).map(lang => (
                  <button key={lang} onClick={() => setLanguage(lang)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      language === lang ? 'bg-white/15 text-brand-cyan shadow-sm' : 'text-white/45'
                    }`}>
                    {lang === 'Urdu' ? 'اردو (Urdu)' : 'English'}
                  </button>
                ))}
              </div>
              {language === 'Urdu' && (
                <p className="text-[10px] text-brand-cyan mt-1.5 ml-1">
                  🎙 Groq Whisper will transcribe your Urdu speech.
                </p>
              )}
            </div>

            {/* #1: Voice Command — permanent sidebar control (never scrolls with canvas) */}
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Voice Command</p>
              <button
                type="button"
                aria-label={isListening ? 'Stop recording and generate' : 'Click to speak a voice command'}
                aria-pressed={isListening}
                onClick={toggleVoiceCapture}
                disabled={isProcessingAI}
                title="Generate UI using voice commands."
                className={`group relative w-full flex items-center justify-center gap-2.5 overflow-hidden text-white px-4 py-3 rounded-2xl font-bold shadow-lg transition-transform active:scale-[0.98] disabled:opacity-70 ${
                  isListening ? 'shadow-[0_0_35px_-8px_rgba(236,72,153,.8)]' : 'shadow-[0_0_30px_-12px_rgba(16,185,129,.8)]'
                }`}
              >
                <span className="absolute inset-0 anim-gradient" style={{
                  background: isListening
                    ? 'linear-gradient(120deg,#ec4899,#8b5cf6,#ef4444)'
                    : 'linear-gradient(120deg,#10b981,#14b8a6,#06b6d4)'
                }} />
                {/* Pulsing ring while listening */}
                {isListening && (
                  <span className="pointer-events-none absolute inset-0 rounded-2xl animate-pulse"
                    style={{ boxShadow: '0 0 0 3px rgba(236,72,153,.35)' }} />
                )}
                <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  {isProcessingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                </span>
                <span className="relative z-10 text-sm">
                  {isListening ? 'Listening… click to stop' : isProcessingAI ? 'AI is thinking…' : 'Click to Speak'}
                </span>
              </button>

              {/* Live capture waveform + transcription */}
              <AnimatePresence>
                {isListening && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-2 glass-strong gradient-border p-3 rounded-2xl text-center overflow-hidden">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-pink opacity-70" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-pink" />
                      </span>
                      <span className="text-[9px] text-white/50 font-bold uppercase tracking-wider">
                        Capturing — {language}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 h-6 mb-2">
                      {[1,2,3,4,5,6,7,8,9,10].map(i => (
                        <motion.div key={i}
                          animate={{ height: [6, 20, 10, 24, 8][i % 5] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08 }}
                          className="w-1 rounded-full bg-gradient-to-t from-brand-cyan to-brand-violet"
                        />
                      ))}
                    </div>
                    {transcription && <p className="text-xs font-medium text-brand-cyan min-h-[16px] break-words">{transcription}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clarification Alert */}
            {clarificationMessage && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-400/30 rounded-xl text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">Clarification Needed</p>
                  <p>{clarificationMessage}</p>
                </div>
              </div>
            )}

            {/* Text Command */}
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Text Command</p>
              <form onSubmit={dispatchTextCommand}>
                <textarea
                  id="s2d-command-textarea"
                  value={textCommand}
                  onChange={e => setTextCommand(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); dispatchTextCommand(e as any); }
                  }}
                  rows={3}
                  placeholder={
                    language === 'Urdu'
                      ? 'مثلاً: ایک ہیرو سیکشن شامل کریں...'
                      : 'e.g., add a hero section with blue gradient...'
                  }
                  dir={language === 'Urdu' ? 'rtl' : 'ltr'}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-brand-violet/60 resize-none"
                />
                <button type="submit" disabled={isProcessingAI || !textCommand.trim()}
                  className="group relative mt-2 w-full overflow-hidden text-white py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_22px_-8px_rgba(16,185,129,.8)]">
                  <span className="absolute inset-0 anim-gradient" style={{ background: 'linear-gradient(120deg,#10b981,#14b8a6,#06b6d4)' }} />
                  <span className="relative z-10 inline-flex items-center gap-2">
                    {isProcessingAI
                      ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing…</>
                      : 'Generate →'}
                  </span>
                </button>
              </form>
            </div>

            {/* #7: Component Library — click or drag a block onto the canvas */}
            <div>
              <button
                onClick={() => setShowComponentLib(p => !p)}
                className="w-full flex items-center justify-between mb-2 ml-1"
              >
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <LayoutTemplate className="w-3 h-3" /> Components
                </p>
                {showComponentLib ? <ChevronUp className="w-3 h-3 text-white/40" /> : <ChevronDown className="w-3 h-3 text-white/40" />}
              </button>
              {showComponentLib && (
                <>
                  <p className="text-[10px] text-white/30 mb-2 ml-1 leading-snug">Click to add, or drag onto the canvas.</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {COMPONENT_LIBRARY.map(item => (
                      <button
                        key={item.name}
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('application/x-s2d-library', item.name);
                          e.dataTransfer.effectAllowed = 'copy';
                          setIsLibDragging(true);
                        }}
                        onDragEnd={() => setIsLibDragging(false)}
                        onClick={() => insertLibraryComponent(item)}
                        title={`Add ${item.name}`}
                        className="flex flex-col items-center gap-1 p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-brand-violet/40 transition-all cursor-grab active:cursor-grabbing group"
                      >
                        <span className="text-base text-white/60 group-hover:text-brand-cyan transition-colors">{item.icon}</span>
                        <span className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Command History Log */}
            {commandLog.length > 0 && (
              <div>
                <button
                  onClick={() => setShowCommandLog(p => !p)}
                  className="w-full flex items-center justify-between mb-2 ml-1"
                >
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <History className="w-3 h-3" /> History ({commandLog.length})
                  </p>
                  {showCommandLog ? <ChevronUp className="w-3 h-3 text-white/40" /> : <ChevronDown className="w-3 h-3 text-white/40" />}
                </button>
                {showCommandLog && (
                  <div className="space-y-1.5">
                    {commandLog.slice(0, 10).map(entry => (
                      <div key={entry.id}
                        className="p-2 bg-white/5 border border-white/10 rounded-xl flex items-start gap-2 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all"
                        onClick={() => setTextCommand(entry.command.endsWith('…') ? entry.command.slice(0, -1) : entry.command)}
                        title="Click to reuse this command"
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          entry.type === 'voice' ? 'bg-brand-pink/20' : 'bg-brand-indigo/20'
                        }`}>
                          {entry.type === 'voice'
                            ? <Mic className="w-2.5 h-2.5 text-brand-pink" />
                            : <Type className="w-2.5 h-2.5 text-brand-cyan" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-white/70 leading-snug break-words line-clamp-2">{entry.command}</p>
                          <p className="text-[10px] text-white/35 mt-0.5">
                            {entry.count} component{entry.count !== 1 ? 's' : ''} · {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setCommandLog([])}
                      className="w-full text-[10px] text-white/40 hover:text-rose-400 py-1 transition-colors"
                    >
                      Clear history
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pages */}
            {pages.length > 0 && (
              <div>
                <PageManager
                  pages={pages}
                  activePageId={activePageId}
                  onSwitch={switchPage}
                  onAdd={addPage}
                  onRename={renamePage}
                  onDuplicate={duplicatePageAction}
                  onDelete={deletePageAction}
                />
              </div>
            )}

            {/* Layers */}
            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Layers ({canvasState.length})
                </p>
              </div>
              {/* Layer search */}
              {canvasState.length > 2 && (
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                  <input
                    type="text"
                    value={layerSearch}
                    onChange={e => setLayerSearch(e.target.value)}
                    placeholder="Search layers…"
                    className="w-full pl-7 pr-6 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-brand-violet/60"
                  />
                  {layerSearch && (
                    <button onClick={() => setLayerSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              {canvasState.length === 0 ? (
                <p className="text-xs text-white/35 italic p-2">No layers yet.</p>
              ) : (
                <div className="space-y-1">
                  {canvasState.filter(c =>
                    !layerSearch || c.name.toLowerCase().includes(layerSearch.toLowerCase())
                  ).map(comp => (
                    <div
                      key={comp.id}
                      draggable
                      onDragStart={() => handleDragStart(comp.id)}
                      onDragOver={e => handleDragOver(e, comp.id)}
                      onDrop={e => handleDrop(e, comp.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedComponentId(comp.id)}
                      className={`group w-full flex items-center gap-1 p-2 rounded-xl text-sm transition-all cursor-pointer ${
                        dragOverId === comp.id
                          ? 'bg-brand-violet/20 border-2 border-brand-violet/50'
                          : selectedComponentId === comp.id
                          ? 'bg-brand-indigo/15 border border-brand-violet/30 text-white font-medium'
                          : 'hover:bg-white/5 text-white/65 border border-transparent'
                      }`}
                    >
                      <GripVertical className="w-3.5 h-3.5 text-white/25 flex-shrink-0 cursor-grab" />
                      <span className="truncate text-xs flex-1 min-w-0">{comp.name}</span>
                      {/* Duplicate */}
                      <button
                        onClick={e => { e.stopPropagation(); duplicateComponent(comp.id); }}
                        title="Duplicate"
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-brand-cyan rounded transition-all flex-shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={e => { e.stopPropagation(); removeComponent(comp.id); }}
                        title="Delete"
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-rose-400 rounded transition-all flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Canvas */}
            {canvasState.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all components from canvas? This cannot be undone after save.')) {
                    pushNewStateToHistory([]);
                    setSelectedComponentId(null);
                    toast.info('Canvas cleared.');
                    speakTTS('Canvas cleared.');
                  }
                }}
                className="w-full py-2 text-xs font-bold text-rose-400 border border-rose-400/30 rounded-xl hover:bg-rose-500/10 transition-colors"
              >
                Clear Canvas
              </button>
            )}
          </div>
        </div>

        {/* ── Canvas Area ── */}
        <div
          ref={canvasAreaRef}
          onDragOver={e => {
            // Accept library-block drops (#7). Reorder drags carry no library type.
            if (e.dataTransfer.types.includes('application/x-s2d-library')) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }
          }}
          onDrop={e => {
            const name = e.dataTransfer.getData('application/x-s2d-library');
            if (name) {
              e.preventDefault();
              const item = COMPONENT_LIBRARY.find(i => i.name === name);
              if (item) insertLibraryComponent(item);
              setIsLibDragging(false);
            }
          }}
          className="flex-1 relative bg-[#0f172a] overflow-auto flex flex-col p-6 items-center"
        >
          {isProcessingAI && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 z-30">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating UI…
            </div>
          )}
          {/* #7: visual drop indicator while dragging a library block */}
          {isLibDragging && (
            <div className="absolute inset-3 z-30 pointer-events-none rounded-3xl border-2 border-dashed border-brand-cyan/60 bg-brand-cyan/5 flex items-center justify-center">
              <span className="px-4 py-2 rounded-full bg-brand-cyan/20 text-brand-cyan text-sm font-bold">Drop to add component</span>
            </div>
          )}

          {/* Live Preview label — sits in the dark area ABOVE the canvas card so it
              never covers generated content. */}
          {canvasState.length > 0 && (
            <div className="w-full flex justify-end mb-2">
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-green-200 rounded-full px-3 py-1 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] font-bold text-green-700">Live Preview</span>
              </div>
            </div>
          )}

          {/* Zoom wrapper */}
          <div style={{
            transform: `scale(${canvasZoom})`,
            transformOrigin: 'top center',
            width: '100%',
            transition: 'transform 0.15s ease',
            fontFamily: canvasFont === 'Inter' ? undefined : `'${canvasFont}', sans-serif`,
          }}>
          <div className="w-full min-h-[600px] bg-white rounded-2xl shadow-2xl relative border border-gray-800 flex flex-col">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {canvasState.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12">
                <p className="text-gray-600 font-bold text-xl mb-2 text-center">Start building your page</p>
                <p className="text-gray-400 text-sm text-center mb-10">
                  Pick any method below — or combine them all.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                  {/* Voice */}
                  <button
                    onClick={toggleVoiceCapture}
                    disabled={isProcessingAI}
                    className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all text-center ${
                      isListening
                        ? 'border-red-400 bg-red-50'
                        : 'border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isListening ? 'bg-red-100' : 'bg-blue-100 group-hover:bg-blue-200'} transition-colors`}>
                      <Mic className={`w-6 h-6 ${isListening ? 'text-red-500' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{isListening ? 'Listening… (click to stop)' : 'Click to Speak'}</p>
                      <p className="text-gray-400 text-xs mt-0.5">Describe a UI component</p>
                    </div>
                  </button>

                  {/* Text */}
                  <button
                    onClick={() => { document.getElementById('s2d-command-textarea')?.focus(); }}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-violet-400 hover:bg-violet-50 bg-gray-50 transition-all text-center cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-violet-100 group-hover:bg-violet-200 rounded-2xl flex items-center justify-center transition-colors">
                      <Keyboard className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Type a Command</p>
                      <p className="text-gray-400 text-xs mt-0.5">Use the text box on the left</p>
                    </div>
                  </button>

                  {/* Templates */}
                  <button
                    onClick={() => setShowTemplateLibrary(true)}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 bg-gray-50 transition-all text-center cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-emerald-100 group-hover:bg-emerald-200 rounded-2xl flex items-center justify-center transition-colors">
                      <LayoutTemplate className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">Use a Template</p>
                      <p className="text-gray-400 text-xs mt-0.5">30+ ready-made sections</p>
                    </div>
                  </button>
                </div>
                {language === 'Urdu' && (
                  <p className="text-gray-400 text-xs mt-8 text-center">
                    اردو آواز کمانڈ کے لیے بائیں پینل میں "Urdu" منتخب کریں
                  </p>
                )}
              </div>
            ) : (
              <div className="flex-1 w-full flex flex-col">
                {canvasState.map(comp => (
                  <div
                    key={comp.id}
                    draggable
                    onDragStart={() => handleDragStart(comp.id)}
                    onDragOver={e => handleDragOver(e, comp.id)}
                    onDrop={e => handleDrop(e, comp.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedComponentId(comp.id)}
                    className={`relative group border-2 transition-all cursor-default ${
                      SPACING_CLASS[comp.styles?.spacing] || ''
                    } ${
                      dragOverId === comp.id
                        ? 'border-blue-400 border-dashed bg-blue-500/5'
                        : selectedComponentId === comp.id
                        ? 'border-blue-500'
                        : 'border-transparent hover:border-blue-200'
                    }`}
                  >
                    {/* FR_05: Canvas drag handle — shown on hover so user knows they can drag */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
                      <div className="bg-white/95 border border-gray-200 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-md text-[11px] text-gray-600 font-semibold backdrop-blur-sm whitespace-nowrap">
                        <GripVertical className="w-3 h-3 text-gray-400" />
                        {comp.name} · drag to reorder
                      </div>
                    </div>
                    <div
                      style={layoutWrapperStyle(comp.styles)}
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(comp.htmlContent) }}
                    />
                  </div>
                ))}
              </div>
            )}

          </div>
          </div> {/* /zoom wrapper */}
          {/* #1: Voice control relocated to the fixed left sidebar so it never
              scrolls away with the generated UI. The canvas now holds only content. */}
        </div>

        {/* ── Right Inspector ── #3: hidden below lg so canvas fits laptops/tablets without horizontal scroll */}
        <div className="w-72 glass border-l border-white/10 hidden lg:flex flex-col overflow-y-auto p-5 shrink-0">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <h3 className="font-bold text-white uppercase text-xs tracking-widest">Inspector</h3>
            <Settings2 className="w-4 h-4 text-white/40" />
          </div>

          {activeComponent ? (
            <div className="space-y-4">
              {/* Inspector tab switcher */}
              <div className="flex bg-white/5 rounded-xl p-0.5">
                {(['properties', 'code'] as const).map(tab => (
                  <button key={tab} onClick={() => setInspectorTab(tab)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                      inspectorTab === tab ? 'bg-white/15 text-white shadow-sm' : 'text-white/50 hover:text-white'
                    }`}>
                    {tab === 'code' ? '< / > HTML' : '⚙ Properties'}
                  </button>
                ))}
              </div>

              {inspectorTab === 'properties' ? (<>
              {/* Editable component name */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Name</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={editingName}
onChange={e => { setEditingName(e.target.value); setNameDirty(true); }}
                    onBlur={nameDirty ? applyNameEdit : undefined}
                    onKeyDown={e => { if (e.key === 'Enter') applyNameEdit(); }}
                    className="flex-1 p-2 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-brand-violet/60 focus:border-transparent"
                  />
                  {nameDirty && (
                    <button onClick={applyNameEdit}
                      className="px-2 py-1.5 bg-brand-indigo text-white rounded-lg text-xs font-bold hover:bg-brand-violet transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Type</label>
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 font-mono">
                  {activeComponent.type}
                </div>
              </div>

              {/* Layout & Size */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Layout & Size</label>
                <div>
                  <p className="text-[10px] font-semibold text-white/50 mb-1">Width</p>
                  <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-lg">
                    {([['sm','S'],['md','M'],['lg','L'],['full','Full']] as const).map(([val, lbl]) => (
                      <button key={val}
                        onClick={() => updateComponentStyle(activeComponent.id, 'width', val)}
                        className={`py-1.5 text-[11px] font-bold rounded-md transition-all ${
                          (activeComponent.styles?.width || 'full') === val ? 'bg-white/15 text-brand-cyan shadow-sm' : 'text-white/45'
                        }`}>{lbl}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-white/50 mb-1">Alignment</p>
                  <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-lg">
                    {([['left','Left'],['center','Center'],['right','Right']] as const).map(([val, lbl]) => (
                      <button key={val}
                        onClick={() => updateComponentStyle(activeComponent.id, 'align', val)}
                        className={`py-1.5 text-[11px] font-bold rounded-md transition-all ${
                          (activeComponent.styles?.align || 'center') === val ? 'bg-white/15 text-brand-cyan shadow-sm' : 'text-white/45'
                        }`}>{lbl}</button>
                    ))}
                  </div>
                  <p className="text-[9px] text-white/35 mt-1">Alignment applies when width is below Full.</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-white/50 mb-1">Spacing</p>
                  <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-lg">
                    {([['compact','Compact'],['normal','Normal'],['spacious','Spacious']] as const).map(([val, lbl]) => (
                      <button key={val}
                        onClick={() => updateComponentStyle(activeComponent.id, 'spacing', val)}
                        className={`py-1.5 text-[11px] font-bold rounded-md transition-all ${
                          (activeComponent.styles?.spacing || 'normal') === val ? 'bg-white/15 text-brand-cyan shadow-sm' : 'text-white/45'
                        }`}>{lbl}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Style Actions */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Quick Style Actions</label>
                <div className="space-y-1.5">
                  {[
                    `Make the ${activeComponent.name} dark themed`,
                    `Change ${activeComponent.name} background to blue`,
                    `Add shadow and padding to ${activeComponent.name}`,
                    `Make ${activeComponent.name} text larger`,
                    `Make ${activeComponent.name} more colorful`,
                  ].map(suggestion => (
                    <button key={suggestion}
                      onClick={() => { setTextCommand(suggestion); toast.info('Command added to text box. Click Generate to apply.'); }}
                      className="w-full text-left text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-brand-indigo/15 hover:border-brand-violet/30 hover:text-white transition-all text-white/60">
                      {suggestion}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-white/35 mt-2 italic">Click to populate text box, then hit Generate.</p>
              </div>

              {/* Smart Regenerate */}
              <div className="border-t border-white/10 pt-4">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-brand-amber" /> AI Regenerate
                </label>
                <p className="text-[11px] text-white/50 mb-2 leading-relaxed">
                  Describe how to remake this component.
                </p>
                <textarea
                  value={regenPrompt}
                  onChange={e => setRegenPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRegenerate(); } }}
                  placeholder={`e.g. "make it dark with a gradient background"`}
                  rows={2}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 resize-none outline-none focus:ring-2 focus:ring-brand-amber/50 focus:border-transparent"
                />
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || !regenPrompt.trim()}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold py-2 rounded-xl text-xs transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegenerating
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Regenerating…</>
                    : <><Sparkles className="w-3.5 h-3.5" /> Regenerate</>
                  }
                </button>
              </div>

              {/* Actions */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Actions</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button onClick={() => duplicateComponent(activeComponent.id)}
                    className="flex items-center justify-center gap-1.5 bg-brand-indigo/15 hover:bg-brand-indigo/25 text-brand-cyan border border-brand-violet/30 font-bold py-2 rounded-xl text-xs transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button
                    onClick={() => {
                      const raw = localStorage.getItem('s2d_library');
                      const lib: CanvasComponent[] = raw ? JSON.parse(raw) : [];
                      if (lib.length >= 20) { toast.error('Library full (20 max). Remove a saved component first.'); return; }
                      const entry = { ...activeComponent, id: `lib_${Date.now()}` };
                      lib.unshift(entry);
                      localStorage.setItem('s2d_library', JSON.stringify(lib));
                      toast.success(`"${activeComponent.name}" saved to My Library!`);
                    }}
                    className="flex items-center justify-center gap-1.5 bg-brand-violet/15 hover:bg-brand-violet/25 text-brand-violet border border-brand-violet/30 font-bold py-2 rounded-xl text-xs transition-colors"
                    title="Save to My Library"
                  >
                    <BookMarked className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button onClick={() => moveComponent(activeComponent.id, 'up')}
                    disabled={canvasState.findIndex(c => c.id === activeComponent.id) === 0}
                    className="flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 font-bold py-2 rounded-xl text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <ArrowUp className="w-3.5 h-3.5" /> Move Up
                  </button>
                  <button onClick={() => moveComponent(activeComponent.id, 'down')}
                    disabled={canvasState.findIndex(c => c.id === activeComponent.id) === canvasState.length - 1}
                    className="flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 font-bold py-2 rounded-xl text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <ArrowDown className="w-3.5 h-3.5" /> Move Down
                  </button>
                </div>
                <button onClick={() => removeComponent(activeComponent.id)}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-400/30 font-bold py-2.5 rounded-xl text-xs transition-colors">
                  Delete Component
                </button>
              </div>
              </>) : (
              /* HTML Editor tab */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">HTML Editor</label>
                  <span className="text-[10px] text-white/40 font-mono">{editingHTML.length.toLocaleString()} chars</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Edit raw Tailwind HTML. Hit "Apply" to update the canvas.
                </p>
                <textarea
                  value={editingHTML}
                  onChange={e => { setEditingHTML(e.target.value); setHtmlDirty(true); }}
                  spellCheck={false}
                  className="w-full h-72 p-3 bg-[#0b1120] text-emerald-300 text-[11px] font-mono leading-relaxed rounded-xl resize-none outline-none focus:ring-2 focus:ring-brand-violet/60 border border-white/10"
                />
                <div className="flex gap-2">
                  <button onClick={applyHTMLEdit} disabled={!htmlDirty}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-brand-indigo hover:bg-brand-violet text-white font-bold py-2.5 rounded-xl text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <Check className="w-3.5 h-3.5" /> Apply Changes
                  </button>
                  <button onClick={() => { setEditingHTML(activeComponent.htmlContent); setHtmlDirty(false); }}
                    disabled={!htmlDirty}
                    className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 font-bold rounded-xl text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Revert
                  </button>
                </div>
                {htmlDirty && <p className="text-[10px] text-brand-amber">⚠ Unsaved HTML changes</p>}
                <div className="border-t border-white/10 pt-3 space-y-1 text-[10px] text-white/50">
                  <p className="font-bold text-white/40 uppercase tracking-widest mb-1">Tips</p>
                  <p>All Tailwind utilities work via CDN.</p>
                  <p><kbd className="bg-white/10 px-1 py-0.5 rounded font-mono">Ctrl+Z</kbd> undoes typing.</p>
                </div>
              </div>
              )}

            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-6 text-white/40 text-xs italic">
                Click a component on the canvas to inspect it.
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Quick Commands</p>
                <div className="space-y-1.5">
                  {[
                    { cmd: 'Add a navbar', desc: 'Navigation bar' },
                    { cmd: 'Add a hero section', desc: 'Hero banner' },
                    { cmd: 'Add a features grid', desc: '3-column features' },
                    { cmd: 'Add a cards row', desc: 'Card components' },
                    { cmd: 'Add a contact form', desc: 'Contact section' },
                    { cmd: 'Add a footer', desc: 'Page footer' },
                  ].map(tip => (
                    <button key={tip.cmd} onClick={() => setTextCommand(tip.cmd)}
                      className="w-full text-left p-2 rounded-lg border border-white/10 hover:bg-brand-indigo/15 hover:border-brand-violet/30 transition-all group">
                      <p className="text-xs font-bold text-white/70 group-hover:text-white">"{tip.cmd}"</p>
                      <p className="text-[10px] text-white/35">{tip.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

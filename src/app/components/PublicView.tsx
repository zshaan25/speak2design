import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Monitor, Tablet, Smartphone, ExternalLink, Lock, AlertCircle, Loader2 } from 'lucide-react';

// ─── API base ─────────────────────────────────────────────────────────────────
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CanvasComponent {
  id: string;
  type: string;
  name: string;
  styles: Record<string, string>;
  htmlContent: string;
}

interface PublicViewProps {
  /** 32-char hex share token extracted from the URL */
  shareToken: string;
  /** Navigate back to the landing / sign-up page */
  onBack: () => void;
}

// ─── Device definitions ───────────────────────────────────────────────────────
type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICES: { id: Device; label: string; icon: React.ReactNode; width: number | string }[] = [
  { id: 'desktop', label: 'Desktop',  icon: <Monitor    className="w-4 h-4" />, width: '100%' },
  { id: 'tablet',  label: 'Tablet',   icon: <Tablet     className="w-4 h-4" />, width: 768   },
  { id: 'mobile',  label: 'Mobile',   icon: <Smartphone className="w-4 h-4" />, width: 375   },
];

// ─── Minimal HTML builder (matches WebsitePreview/zipExport output) ───────────
const WIDTH_PCT: Record<string, string> = { sm: '40%', md: '60%', lg: '80%', full: '100%' };
const SPACING_PAD: Record<string, string> = {
  compact: '0.25rem 0',
  normal: '0.75rem 0',
  spacious: '2.5rem 0',
};

const wrapperStyle = (styles: Record<string, string> = {}): string => {
  const w = WIDTH_PCT[styles.width] || '100%';
  const parts = [`width:${w}`, `padding:${SPACING_PAD[styles.spacing] || '0.75rem 0'}`];
  if (w !== '100%') {
    const align = styles.align || 'center';
    if (align === 'center') parts.push('margin-left:auto', 'margin-right:auto');
    else if (align === 'right') parts.push('margin-left:auto');
    else parts.push('margin-right:auto');
  }
  return parts.join(';');
};

const buildHTML = (components: CanvasComponent[], title: string): string => {
  const sections = components
    .map(c => `  <!-- ${c.name} -->\n  <div style="${wrapperStyle(c.styles)}">\n    ${c.htmlContent.trim()}\n  </div>`)
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>*{box-sizing:border-box;}body{margin:0;font-family:'Inter',-apple-system,sans-serif;}</style>
</head>
<body>
${sections || '<p style="font-family:sans-serif;padding:2rem;color:#64748b;">This project has no content yet.</p>'}
</body>
</html>`;
};

// ─── Component ────────────────────────────────────────────────────────────────
export const PublicView: React.FC<PublicViewProps> = ({ shareToken, onBack }) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading');
  const [projectTitle, setProjectTitle] = useState('');
  const [canvasState, setCanvasState] = useState<CanvasComponent[]>([]);
  const [device, setDevice] = useState<Device>('desktop');

  // ── Fetch public project on mount ──
  useEffect(() => {
    if (!shareToken) { setStatus('not_found'); return; }

    fetch(`${API_BASE}/api/projects/public/${shareToken}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.project) {
          setProjectTitle(d.project.title || 'Shared Project');
          setCanvasState(Array.isArray(d.project.canvasState) ? d.project.canvasState : []);
          setStatus('ready');
        } else {
          setStatus('not_found');
        }
      })
      .catch(() => setStatus('error'));
  }, [shareToken]);

  const previewHTML = useMemo(
    () => (status === 'ready' ? buildHTML(canvasState, projectTitle) : ''),
    [status, canvasState, projectTitle],
  );

  const openInNewTab = () => {
    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const deviceConfig = DEVICES.find(d => d.id === device)!;

  // ── Loading ──
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        <p className="text-gray-400 text-sm font-semibold">Loading shared project…</p>
      </div>
    );
  }

  // ── Not found / private ──
  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center">
          <Lock className="w-8 h-8 text-gray-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white mb-2">Project not found</h1>
          <p className="text-gray-400 text-sm max-w-xs">
            This link may have expired, been revoked, or the project is no longer public.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors"
        >
          Go to Speak2Design
        </button>
      </div>
    );
  }

  // ── Error ──
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="w-16 h-16 bg-red-900/30 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 text-sm max-w-xs">
            Could not load the shared project. Check your connection and try again.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors"
        >
          Go to Speak2Design
        </button>
      </div>
    );
  }

  // ── Ready ──
  return (
    <AnimatePresence>
      <motion.div
        key="public-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gray-950 flex flex-col"
      >
        {/* Top bar */}
        <div className="flex-shrink-0 h-14 bg-gray-900 border-b border-gray-800 flex items-center gap-4 px-4">
          {/* Brand */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white font-black text-sm hover:text-blue-400 transition-colors flex-shrink-0"
          >
            <span className="text-blue-400">S2D</span>
            <span className="text-gray-600 font-normal">·</span>
            <span className="text-gray-300 font-semibold truncate max-w-[160px]">{projectTitle}</span>
          </button>

          {/* Read-only badge */}
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0">
            <Lock className="w-2.5 h-2.5" /> Read-only
          </span>

          {/* Device switcher — centre */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-xl p-1 mx-auto">
            {DEVICES.map(d => (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                title={d.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  device === d.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {d.icon}
                <span className="hidden sm:inline">{d.label}</span>
              </button>
            ))}
          </div>

          {/* Open in new tab */}
          <button
            onClick={openInNewTab}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition-colors flex-shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open
          </button>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto flex items-start justify-center bg-gray-950 p-6">
          {canvasState.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center mt-24 gap-4">
              <span className="text-5xl">📄</span>
              <p className="text-gray-400 font-semibold">This project has no content yet.</p>
            </div>
          ) : (
            <motion.div
              key={device}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex-shrink-0"
              style={{
                width: typeof deviceConfig.width === 'number' ? `${deviceConfig.width}px` : deviceConfig.width,
                minHeight: '100%',
              }}
            >
              {device !== 'desktop' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-gray-700 rounded-full z-10" />
              )}
              <iframe
                srcDoc={previewHTML}
                title={`${projectTitle} — public view`}
                sandbox="allow-scripts"
                className={`w-full bg-white shadow-2xl ${
                  device !== 'desktop' ? 'rounded-2xl border-4 border-gray-700' : 'rounded-xl'
                }`}
                style={{ minHeight: 'calc(100vh - 120px)', border: 'none' }}
              />
            </motion.div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex-shrink-0 h-8 bg-gray-900 border-t border-gray-800 flex items-center gap-4 px-4 text-[10px] text-gray-600 font-mono">
          <span>{projectTitle}</span>
          <span>·</span>
          <span>{canvasState.length} section{canvasState.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{typeof deviceConfig.width === 'number' ? `${deviceConfig.width}px` : 'Full width'}</span>
          <span className="ml-auto">Powered by Speak2Design</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

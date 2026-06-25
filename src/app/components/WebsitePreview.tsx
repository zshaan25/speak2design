import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Monitor, Tablet, Smartphone, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

// ─── Types (mirrors Workspace) ────────────────────────────────────────────────
interface CanvasComponent {
  id: string;
  type: string;
  name: string;
  styles: Record<string, string>;
  htmlContent: string;
}

interface PreviewPage {
  _id: string;
  name: string;
  slug: string;
  canvasState: CanvasComponent[];
}

interface WebsitePreviewProps {
  pages: PreviewPage[];
  /** In-memory canvas cache so preview sees unsaved edits */
  canvasCache: Record<string, CanvasComponent[]>;
  activePageId: string | null;
  projectTitle: string;
  onClose: () => void;
  /** Google Font name selected in the toolbar (default 'Inter') */
  canvasFont?: string;
}

// ─── Device definitions ───────────────────────────────────────────────────────
type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICES: { id: Device; label: string; icon: React.ReactNode; width: number | string; scale?: number }[] = [
  { id: 'desktop', label: 'Desktop',  icon: <Monitor   className="w-4 h-4" />, width: '100%'  },
  { id: 'tablet',  label: 'Tablet',   icon: <Tablet    className="w-4 h-4" />, width: 768  },
  { id: 'mobile',  label: 'Mobile',   icon: <Smartphone className="w-4 h-4" />, width: 375  },
];

// ─── HTML builder — wraps canvas sections into a complete page ────────────────
const buildPageHTML = (
  components: CanvasComponent[],
  title: string,
  navLinks: { name: string; filename: string }[],
  canvasFont = 'Inter',
): string => {
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

  const navHTML =
    navLinks.length > 1
      ? `<nav style="position:sticky;top:0;z-index:999;background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);border-bottom:1px solid #e5e7eb;padding:0.75rem 1.5rem;display:flex;align-items:center;gap:1.5rem;">
  <span style="font-weight:900;font-size:1rem;color:#1e293b;">${title}</span>
  ${navLinks.map(l => `<a href="${l.filename}" style="font-size:0.875rem;font-weight:600;color:#374151;text-decoration:none;">${l.name}</a>`).join('')}
</nav>`
      : '';

  const sections = components
    .map(c => `  <!-- ${c.name} -->\n  <div style="${wrapperStyle(c.styles)}">\n    ${c.htmlContent.trim()}\n  </div>`)
    .join('\n\n');

  const gfontsLink = canvasFont !== 'Inter'
    ? `\n  <link rel="preconnect" href="https://fonts.googleapis.com" />\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(canvasFont)}:wght@400;600;700&display=swap" rel="stylesheet" />`
    : '';
  const fontFamily = canvasFont !== 'Inter'
    ? `'${canvasFont}',`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>${gfontsLink}
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>*{box-sizing:border-box;}body{margin:0;font-family:${fontFamily}'Inter',-apple-system,sans-serif;}</style>
</head>
<body>
${navHTML}
${sections}
</body>
</html>`;
};

// ─── Component ────────────────────────────────────────────────────────────────
export const WebsitePreview: React.FC<WebsitePreviewProps> = ({
  pages,
  canvasCache,
  activePageId,
  projectTitle,
  onClose,
  canvasFont = 'Inter',
}) => {
  const [device, setDevice] = useState<Device>('desktop');
  const [previewPageIndex, setPreviewPageIndex] = useState(() => {
    const idx = pages.findIndex(p => p._id === activePageId);
    return idx >= 0 ? idx : 0;
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentPage = pages[previewPageIndex];

  // Resolve canvas: prefer in-memory cache (captures unsaved edits), fall back to page data
  const resolveCanvas = (page: PreviewPage): CanvasComponent[] =>
    canvasCache[page._id] ?? page.canvasState ?? [];

  // Nav links: point to `index.html` for first page, `page-2.html` etc. for the rest
  const navLinks = pages.map((p, i) => ({
    name: p.name,
    filename: i === 0 ? 'index.html' : `page-${i + 1}.html`,
  }));

  const currentHTML = useMemo(() => {
    if (!currentPage) return '<html><body><p style="font-family:sans-serif;padding:2rem;color:#64748b;">This page has no content yet.</p></body></html>';
    return buildPageHTML(resolveCanvas(currentPage), projectTitle, navLinks, canvasFont);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, canvasCache, projectTitle, pages, canvasFont]);

  // Open in new tab
  const openInNewTab = () => {
    const blob = new Blob([currentHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const deviceConfig = DEVICES.find(d => d.id === device)!;
  const iframeWidth = deviceConfig.width;

  return (
    <AnimatePresence>
      <motion.div
        key="preview-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 bg-gray-950 flex flex-col"
      >
        {/* ── Top bar ── */}
        <div className="flex-shrink-0 h-14 bg-gray-900 border-b border-gray-800 flex items-center gap-4 px-4">
          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-gray-700" />

          {/* Project name */}
          <span className="text-white font-bold text-sm truncate max-w-[180px]">{projectTitle}</span>

          {/* Device switcher */}
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

        {/* ── Page tabs (if multiple pages) ── */}
        {pages.length > 1 && (
          <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 flex items-center gap-1 px-4 py-2 overflow-x-auto">
            <button
              onClick={() => setPreviewPageIndex(i => Math.max(0, i - 1))}
              disabled={previewPageIndex === 0}
              className="p-1 text-gray-500 hover:text-gray-200 disabled:opacity-30 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {pages.map((p, i) => (
              <button
                key={p._id}
                onClick={() => setPreviewPageIndex(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                  i === previewPageIndex
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {p.name}
              </button>
            ))}

            <button
              onClick={() => setPreviewPageIndex(i => Math.min(pages.length - 1, i + 1))}
              disabled={previewPageIndex === pages.length - 1}
              className="p-1 text-gray-500 hover:text-gray-200 disabled:opacity-30 transition-colors flex-shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="ml-auto text-xs text-gray-600 flex-shrink-0">
              {previewPageIndex + 1} / {pages.length}
            </span>
          </div>
        )}

        {/* ── Preview area ── */}
        <div className="flex-1 overflow-auto flex items-start justify-center bg-gray-950 p-6">
          {resolveCanvas(currentPage).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-5xl mb-4">📄</span>
              <p className="text-gray-400 font-semibold">This page has no content yet.</p>
              <p className="text-gray-600 text-sm mt-2">Add components from the canvas first.</p>
            </div>
          ) : (
            <motion.div
              key={`${device}-${previewPageIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex-shrink-0"
              style={{
                width: typeof iframeWidth === 'number' ? `${iframeWidth}px` : iframeWidth,
                minHeight: '100%',
              }}
            >
              {/* Device chrome for tablet/mobile */}
              {device !== 'desktop' && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-gray-700 rounded-full z-10`} />
              )}

              <iframe
                ref={iframeRef}
                srcDoc={currentHTML}
                title={`Preview — ${currentPage?.name ?? 'Page'}`}
                sandbox="allow-scripts"
                className={`w-full bg-white shadow-2xl ${
                  device !== 'desktop' ? 'rounded-2xl border-4 border-gray-700' : 'rounded-xl'
                }`}
                style={{ minHeight: 'calc(100vh - 160px)', border: 'none' }}
              />
            </motion.div>
          )}
        </div>

        {/* ── Status bar ── */}
        <div className="flex-shrink-0 h-8 bg-gray-900 border-t border-gray-800 flex items-center gap-4 px-4 text-[10px] text-gray-600 font-mono">
          <span>{currentPage?.name ?? 'Page'}</span>
          <span>·</span>
          <span>{resolveCanvas(currentPage).length} section{resolveCanvas(currentPage).length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{typeof iframeWidth === 'number' ? `${iframeWidth}px` : 'Full width'}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Re-export the HTML builder for ZIP export ────────────────────────────────
export { buildPageHTML };

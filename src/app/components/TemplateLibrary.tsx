import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, LayoutTemplate, ChevronRight, BookMarked, Trash2 } from 'lucide-react';
import {
  ALL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  stampIds,
  type Template,
  type TemplateCategory,
} from '../data/templates';

// ─── Props ────────────────────────────────────────────────────────────────────
interface TemplateLibraryProps {
  onClose: () => void;
  onInsertSections: (sections: Template['sections']) => void;
  onNewPageFromTemplate: (name: string, sections: Template['sections']) => void;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
const TemplateCard: React.FC<{
  tpl: Template;
  onInsert: () => void;
  onNewPage: () => void;
}> = ({ tpl, onInsert, onNewPage }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.18 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* Gradient preview */}
      <div className={`h-36 bg-gradient-to-br ${tpl.accent} relative flex items-center justify-center`}>
        <span className="text-white/20 text-7xl font-black select-none">
          {tpl.name[0]}
        </span>
        {/* Section count badge */}
        <span className="absolute top-3 right-3 px-2 py-0.5 bg-black/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
          {tpl.sections.length} section{tpl.sections.length > 1 ? 's' : ''}
        </span>

        {/* Hover overlay with action buttons */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 p-3"
            >
              <button
                onClick={(e) => { e.stopPropagation(); onInsert(); }}
                className="w-full py-2 bg-white text-gray-900 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Insert into page
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onNewPage(); }}
                className="w-full py-2 bg-white/10 border border-white/30 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                New page
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">{tpl.name}</h3>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{tpl.description}</p>
      </div>
    </motion.div>
  );
};

// ─── Component type (mirrors Workspace's CanvasComponent) ─────────────────────
interface SavedComponent {
  id: string;
  type: string;
  name: string;
  styles: Record<string, string>;
  htmlContent: string;
}

const LIB_KEY = 's2d_library';

const readLibrary = (): SavedComponent[] => {
  try { return JSON.parse(localStorage.getItem(LIB_KEY) || '[]'); }
  catch { return []; }
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onClose,
  onInsertSections,
  onNewPageFromTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'library'>('templates');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'All'>('All');
  const [search, setSearch] = useState('');
  const [library, setLibrary] = useState<SavedComponent[]>(readLibrary);

  const removeFromLibrary = useCallback((id: string) => {
    const updated = library.filter(c => c.id !== id);
    setLibrary(updated);
    localStorage.setItem(LIB_KEY, JSON.stringify(updated));
  }, [library]);

  const filtered = useMemo(() => {
    let list = ALL_TEMPLATES;
    if (activeCategory !== 'All') {
      list = list.filter(t => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, search]);

  // Count per category
  const counts = useMemo(() => {
    const map: Record<string, number> = { All: ALL_TEMPLATES.length };
    for (const cat of TEMPLATE_CATEGORIES) {
      map[cat] = ALL_TEMPLATES.filter(t => t.category === cat).length;
    }
    return map;
  }, []);

  return (
    /* Full-screen backdrop */
    <AnimatePresence>
      <motion.div
        key="tpl-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-stretch justify-center"
        onClick={onClose}
      >
        {/* Modal panel */}
        <motion.div
          key="tpl-panel"
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
          className="relative bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 m-6 flex overflow-hidden w-full max-w-6xl"
          style={{ maxHeight: 'calc(100vh - 48px)' }}
        >
          {/* ── Left Sidebar ── */}
          <div className="w-52 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
            {/* Header */}
            <div className="px-4 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <LayoutTemplate className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-black text-gray-900">Library</h2>
              </div>
              {/* Tab switcher */}
              <div className="flex bg-gray-100 rounded-xl p-0.5">
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    activeTab === 'templates' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Templates
                </button>
                <button
                  onClick={() => setActiveTab('library')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'library' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <BookMarked className="w-2.5 h-2.5" />
                  My Lib {library.length > 0 && `(${library.length})`}
                </button>
              </div>
            </div>

            {/* Category nav — only shown on templates tab */}
            <nav className={`flex-1 overflow-y-auto p-3 space-y-0.5 ${activeTab === 'library' ? 'hidden' : ''}`}>
              {/* All */}
              <button
                onClick={() => setActiveCategory('All')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeCategory === 'All'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>All Templates</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategory === 'All' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  {counts['All']}
                </span>
              </button>

              <div className="my-2 h-px bg-gray-100" />

              {TEMPLATE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    activeCategory === cat
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate text-left">{cat}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1 ${activeCategory === cat ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {counts[cat]}
                  </span>
                </button>
              ))}
            </nav>

            {/* Footer hint */}
            <div className="p-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Hover a card to insert sections or create a new page.
              </p>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top bar */}
            <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
                {activeTab === 'library' ? (
                  <div className="flex items-center gap-1.5">
                    <BookMarked className="w-3.5 h-3.5 text-violet-600" />
                    <span className="font-semibold text-gray-800">My Component Library</span>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">Templates</span>
                    {activeCategory !== 'All' && (
                      <>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-semibold text-gray-800 truncate">{activeCategory}</span>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Search — only for templates tab */}
              {activeTab === 'templates' && (
                <div className="flex-1 max-w-xs relative ml-auto">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search templates…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              )}

              {/* Close */}
              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors ml-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'library' ? (
                /* ── My Library ── */
                library.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <BookMarked className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="text-gray-500 font-semibold mb-1">No saved components yet</p>
                    <p className="text-xs text-gray-400">
                      Select a component on the canvas, then click "Save" in the Inspector.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                    {library.map(comp => (
                      <div key={comp.id}
                        className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
                        {/* Preview */}
                        <div className="h-28 bg-gradient-to-br from-violet-100 to-indigo-50 flex items-center justify-center relative overflow-hidden">
                          <span className="text-violet-300 text-5xl font-black select-none">{comp.name[0]}</span>
                          <span className="absolute top-2 right-2 px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-full capitalize">
                            {comp.type}
                          </span>
                        </div>
                        {/* Info + actions */}
                        <div className="p-3">
                          <p className="font-bold text-gray-800 text-sm truncate mb-2">{comp.name}</p>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                const asSection = [{
                                  id: `ins_${Date.now()}`,
                                  type: comp.type,
                                  name: comp.name,
                                  styles: comp.styles,
                                  htmlContent: comp.htmlContent,
                                }] as any;
                                onInsertSections(asSection);
                                onClose();
                              }}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Insert
                            </button>
                            <button
                              onClick={() => removeFromLibrary(comp.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                              title="Remove from library"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* ── Templates Grid ── */
                filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <span className="text-5xl mb-4">🔍</span>
                    <p className="text-gray-500 font-semibold">No templates match "{search}"</p>
                    <button
                      onClick={() => { setSearch(''); setActiveCategory('All'); }}
                      className="mt-3 text-sm text-blue-600 hover:underline font-medium"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <motion.div layout className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                      {filtered.map(tpl => (
                        <TemplateCard
                          key={tpl.id}
                          tpl={tpl}
                          onInsert={() => {
                            onInsertSections(stampIds(tpl.sections));
                            onClose();
                          }}
                          onNewPage={() => {
                            onNewPageFromTemplate(tpl.name, stampIds(tpl.sections));
                            onClose();
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

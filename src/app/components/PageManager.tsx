import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Copy, Trash2, ChevronRight, FileText, MoreHorizontal } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PageDoc {
  _id: string;
  name: string;
  slug: string;
  order: number;
  canvasState: any[];
}

interface PageManagerProps {
  pages: PageDoc[];
  activePageId: string | null;
  onSwitch:    (pageId: string) => void;
  onAdd:       () => void;
  onRename:    (pageId: string, name: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete:    (pageId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
export const PageManager: React.FC<PageManagerProps> = ({
  pages,
  activePageId,
  onSwitch,
  onAdd,
  onRename,
  onDuplicate,
  onDelete
}) => {
  // Which page's context menu is open
  const [menuPageId, setMenuPageId]     = useState<string | null>(null);
  // Which page is being inline-renamed
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Open rename editor
  const startRename = (page: PageDoc) => {
    setMenuPageId(null);
    setEditingPageId(page._id);
    setEditingName(page.name);
    // Focus after paint
    setTimeout(() => inputRef.current?.select(), 30);
  };

  const commitRename = () => {
    if (editingPageId && editingName.trim()) {
      onRename(editingPageId, editingName.trim());
    }
    setEditingPageId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setEditingPageId(null);
  };

  // Close context menu when clicking outside
  const handleBlurMenu = () => {
    setTimeout(() => setMenuPageId(null), 120);
  };

  return (
    <div className="select-none">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2 ml-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Pages ({pages.length})
        </p>
        <button
          onClick={onAdd}
          title="Add new page"
          className="w-5 h-5 rounded-md bg-gray-100 hover:bg-blue-100 hover:text-blue-600 text-gray-500 flex items-center justify-center transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Page list */}
      <div className="space-y-0.5">
        <AnimatePresence initial={false}>
          {pages.map(page => {
            const isActive   = page._id === activePageId;
            const isEditing  = page._id === editingPageId;
            const isMenuOpen = page._id === menuPageId;

            return (
              <motion.div
                key={page._id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className={`group relative flex items-center gap-1.5 rounded-xl pr-1 pl-2 py-1.5 cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-50 border border-blue-200 text-blue-900'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => {
                  if (!isEditing) onSwitch(page._id);
                }}
              >
                {/* Page icon */}
                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />

                {/* Name or rename input */}
                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={handleKeyDown}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 min-w-0 text-xs bg-white border border-blue-400 rounded-md px-1 py-0.5 outline-none text-gray-900 font-medium"
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 min-w-0 text-xs font-medium truncate"
                    onDoubleClick={e => { e.stopPropagation(); startRename(page); }}
                  >
                    {page.name}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && !isEditing && (
                  <ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" />
                )}

                {/* Context menu trigger — only visible on hover */}
                {!isEditing && (
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setMenuPageId(isMenuOpen ? null : page._id);
                      }}
                      onBlur={handleBlurMenu}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        isMenuOpen
                          ? 'bg-gray-200 text-gray-700'
                          : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-500'
                      }`}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </button>

                    {/* Dropdown menu */}
                    <AnimatePresence>
                      {isMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.92, y: -4 }}
                          animate={{ opacity: 1, scale: 1,    y: 0  }}
                          exit={{ opacity: 0, scale: 0.92, y: -4 }}
                          transition={{ duration: 0.1 }}
                          className="absolute right-0 top-6 z-50 w-36 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                          onMouseDown={e => e.preventDefault()} // prevent blur from firing before click
                        >
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={e => { e.stopPropagation(); startRename(page); }}
                          >
                            <FileText className="w-3.5 h-3.5 text-gray-400" /> Rename
                          </button>
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={e => { e.stopPropagation(); setMenuPageId(null); onDuplicate(page._id); }}
                          >
                            <Copy className="w-3.5 h-3.5 text-gray-400" /> Duplicate
                          </button>
                          <div className="h-px bg-gray-100 mx-2" />
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                            onClick={e => { e.stopPropagation(); setMenuPageId(null); onDelete(page._id); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* "Add page" ghost row when empty */}
      {pages.length === 0 && (
        <button
          onClick={onAdd}
          className="w-full mt-1 py-2 text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          + Add first page
        </button>
      )}
    </div>
  );
};

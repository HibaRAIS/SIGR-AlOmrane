// components/catalogue/CatalogueSelects.tsx

import React, {
  useState, useMemo, useEffect, useLayoutEffect, useCallback, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Search, ChevronDown, ChevronRight, Check, ChevronsUpDown, X, MapPin, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product } from '@/types/catalogue';

/* ========================================================================== */
/*  Positionnement (inchangé)                                                 */
/* ========================================================================== */

export function computeFixedPosition(
  triggerEl: HTMLElement,
  dropdownWidth: number
): React.CSSProperties {
  const rect = triggerEl.getBoundingClientRect();
  let left = rect.left;
  if (rect.left + dropdownWidth > window.innerWidth) {
    left = Math.max(8, rect.right - dropdownWidth);
  }
  const spaceBelow = window.innerHeight - rect.bottom;
  const dropdownMaxHeight = 320;
  const openUpward = spaceBelow < dropdownMaxHeight && rect.top > dropdownMaxHeight;
  return {
    position: 'fixed',
    ...(openUpward
      ? { bottom: window.innerHeight - rect.top + 4 }
      : { top: rect.bottom + 4 }),
    left,
    width: Math.max(rect.width, dropdownWidth),
    zIndex: 99999,
    pointerEvents: 'auto',
  };
}

export function usePortalPosition(
  open: boolean,
  triggerRef: React.RefObject<HTMLElement>,
  dropdownWidth: number
): React.CSSProperties | null {
  const [style, setStyle] = useState<React.CSSProperties | null>(null);
  const update = useCallback(() => {
    if (triggerRef.current) setStyle(computeFixedPosition(triggerRef.current, dropdownWidth));
  }, [triggerRef, dropdownWidth]);

  useLayoutEffect(() => { if (!open) setStyle(null); else update(); }, [open, update]);
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', update, { capture: true, passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
    };
  }, [open, update]);

  return style;
}

/* ========================================================================== */
/*  Palette de couleurs (identique au fichier principal)                      */
/* ========================================================================== */

const CATEGORY_COLORS: Record<string, string> = {
  'Fournitures bureau': '#1a4731',
  'Informatique':        '#2563eb',
  'Mobilier':            '#7c3aed',
  'Outillage':           '#d97706',
  'Consommables':        '#0891b2',
  'Nettoyage':           '#16a34a',
};

/** Retourne une couleur pour une catégorie (couleur racine si connue, sinon gris) */
function getCategoryColor(categoryPath: string): string {
  // On extrait la première partie du chemin (catégorie racine)
  const root = categoryPath.split(' > ')[0]?.trim();
  return CATEGORY_COLORS[root] ?? '#9ca3af';
}

/* ========================================================================== */
/*  Construction de l’arbre hiérarchique                                      */
/* ========================================================================== */

function buildCategoryFilterTree(
  nodes: any[],
  productCounts: Record<string, number>,
  prefix = '',
  depth = 0
): any[] {
  return nodes.map((node) => {
    const rawLabel = node.label ?? '';
    const path = prefix ? `${prefix} > ${rawLabel}` : rawLabel;
    const children = node.children
      ? buildCategoryFilterTree(node.children, productCounts, path, depth + 1)
      : [];
    // Normalisation pour compter (insensible à la casse et espaces)
    const normalized = path.trim().toLowerCase();
    const selfCount = productCounts[normalized] ?? 0;
    const childCount = children.reduce((s: number, c: any) => s + c.count, 0);
    return {
      path,
      label: rawLabel,
      depth,
      isLeaf: !node.children || node.children.length === 0,
      count: selfCount + childCount,
      children,
    };
  });
}

/* ========================================================================== */
/*  Sélecteur de catégorie (formulaire) – avec couleurs                       */
/* ========================================================================== */

export function CategoryFormSelect({
  value,
  onChange,
  categoriesTree = [],
}: {
  value: string;
  onChange: (val: string) => void;
  categoriesTree?: any[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const portalStyle = usePortalPosition(open, triggerRef as React.RefObject<HTMLElement>, 340);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current?.contains(e.target as Node) === false && triggerRef.current?.contains(e.target as Node) === false) {
        setOpen(false); setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  // Arbre sans compteur
  const filterTree = useMemo(() => buildCategoryFilterTree(categoriesTree, {}), [categoriesTree]);

  // Aplatir pour la recherche rapide
  const flatCategories = useMemo(() => {
    const flatten = (nodes: any[], prefix = ''): any[] => {
      let result: any[] = [];
      for (const node of nodes) {
        const path = prefix ? `${prefix} > ${node.label}` : node.label;
        result.push({ path, label: node.label, depth: prefix ? prefix.split(' > ').length : 0, isLeaf: !node.children || node.children.length === 0 });
        if (node.children) result = result.concat(flatten(node.children, path));
      }
      return result;
    };
    return flatten(categoriesTree);
  }, [categoriesTree]);

  const flatFiltered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return flatCategories.filter(item => item.path.toLowerCase().includes(q) || item.label.toLowerCase().includes(q));
  }, [query, flatCategories]);

  const toggleExpand = (path: string) => {
    setExpanded(prev => { const s = new Set(prev); if (s.has(path)) s.delete(path); else s.add(path); return s; });
  };

  const selectedLabel = value ? value.split(' > ').pop() ?? value : 'Sélectionner une catégorie…';

  const renderTreeNode = (node: any): React.ReactNode => {
    const isExpanded = expanded.has(node.path);
    const isSelected = value === node.path;
    const hasChildren = node.children && node.children.length > 0;
    const indent = node.depth * 18;
    const color = getCategoryColor(node.path);

    return (
      <div key={node.path}>
        <div
          style={{ paddingLeft: `${10 + indent}px` }}
          className={cn(
            'flex items-center gap-1.5 pr-2 py-2 hover:bg-[#E8F5E9] transition-colors cursor-pointer rounded-md',
            isSelected && 'bg-[#F1F8E9]'
          )}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.path); }}
              className="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 flex-shrink-0"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
              <span className={cn('w-2 h-2 rounded-full', isSelected ? 'bg-[#1a4731]' : 'bg-zinc-300')} />
            </span>
          )}

          {/* Pastille colorée */}
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: color }}
          />

          <button
            type="button"
            onClick={() => { onChange(node.path); setOpen(false); setQuery(''); }}
            className={cn(
              'flex-1 text-left text-sm flex items-center gap-1.5 min-w-0',
              node.depth === 0 ? 'font-bold text-zinc-900' : node.depth === 1 ? 'font-semibold text-zinc-700' : 'font-medium text-zinc-500',
              isSelected && 'text-[#1a4731]'
            )}
          >
            <span className="truncate">{node.label}</span>
          </button>

          {isSelected && <Check className="w-4 h-4 text-[#1a4731] flex-shrink-0" />}
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children.map((child: any) => renderTreeNode(child))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen(o => !o); if (!open) setExpanded(new Set()); }}
        className={cn(
          'w-full flex items-center justify-between h-10 px-4 rounded-xl border text-sm font-medium bg-white transition-all outline-none',
          'border-zinc-200 hover:border-[#1a4731] focus:border-[#1a4731]',
          value ? 'text-zinc-900' : 'text-zinc-400'
        )}
      >
        <span className="truncate flex-1 text-left">{selectedLabel}</span>
        <ChevronsUpDown className="w-4 h-4 text-zinc-400 flex-shrink-0 ml-2" />
      </button>
      {open && portalStyle && createPortal(
        <div ref={dropdownRef} style={portalStyle} className="bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col my-portal-dropdown">
          <div className="p-2 border-b border-zinc-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-2 w-4 h-4 text-zinc-400" />
              <input
                ref={inputRef}
                placeholder="Rechercher catégorie…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
                className="w-full h-9 pl-8 pr-2 text-sm border border-zinc-200 rounded-lg bg-zinc-50 outline-none focus:border-[#1a4731]"
              />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
              className="w-full px-4 py-2.5 text-left text-sm text-zinc-400 italic hover:bg-zinc-50 transition-colors border-b border-zinc-50"
            >
              Aucune catégorie
            </button>
            {query.trim() ? (
              flatFiltered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-zinc-400 italic text-center">Aucun résultat</p>
              ) : (
                flatFiltered.map((item, idx) => {
                  const isSelected = value === item.path;
                  const color = getCategoryColor(item.path);
                  return (
                    <button
                      key={`flat-${item.path}-${idx}`}
                      type="button"
                      onClick={() => { onChange(item.path); setOpen(false); setQuery(''); }}
                      style={{ paddingLeft: `${12 + item.depth * 18}px` }}
                      className={cn(
                        'w-full pr-4 py-2 text-left text-sm flex items-center gap-1.5 hover:bg-[#E8F5E9] transition-colors',
                        isSelected && 'bg-[#F1F8E9] text-[#1a4731]',
                        item.depth === 0 ? 'font-bold text-zinc-900' : item.depth === 1 ? 'font-semibold text-zinc-700' : 'font-medium text-zinc-500'
                      )}
                    >
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#1a4731] flex-shrink-0" />}
                    </button>
                  );
                })
              )
            ) : (
              filterTree.length === 0 ? (
                <p className="px-4 py-3 text-sm text-zinc-400 italic text-center">Aucune catégorie disponible</p>
              ) : (
                filterTree.map((node: any) => renderTreeNode(node))
              )
            )}
          </div>
        </div>, document.body
      )}
    </div>
  );
}

/* ========================================================================== */
/*  Sélecteur hiérarchique pour les filtres (avec compteurs + couleurs)       */
/* ========================================================================== */

export function CategoryHierarchyFilterSelect({
  value,
  onChange,
  products,
  categoriesTree = [],
}: {
  value: string;
  onChange: (val: string) => void;
  products: Product[];
  categoriesTree?: any[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const portalStyle = usePortalPosition(open, triggerRef as React.RefObject<HTMLElement>, 280);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (dropdownRef.current?.contains(e.target as Node) === false && triggerRef.current?.contains(e.target as Node) === false) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const catPath = p.subcategory ? `${p.category} > ${p.subcategory}` : p.category;
      const norm = catPath.trim().toLowerCase();
      counts[norm] = (counts[norm] ?? 0) + 1;
    });
    return counts;
  }, [products]);

  const filterTree = useMemo(
    () => buildCategoryFilterTree(categoriesTree, productCounts).filter(n => n.count > 0 || (n.children && n.children.length > 0)),
    [categoriesTree, productCounts]
  );

  const flatCategories = useMemo(() => {
    const flatten = (nodes: any[], prefix = ''): any[] => {
      let result: any[] = [];
      for (const node of nodes) {
        const path = prefix ? `${prefix} > ${node.label}` : node.label;
        result.push({ path, label: node.label, depth: prefix ? prefix.split(' > ').length : 0, isLeaf: !node.children || node.children.length === 0 });
        if (node.children) result = result.concat(flatten(node.children, path));
      }
      return result;
    };
    return flatten(categoriesTree);
  }, [categoriesTree]);

  const flatFiltered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return flatCategories.filter(item => item.path.toLowerCase().includes(q) || item.label.toLowerCase().includes(q));
  }, [query, flatCategories]);

  const toggleExpand = (path: string) => { setExpanded(prev => { const s = new Set(prev); if (s.has(path)) s.delete(path); else s.add(path); return s; }); };
  const totalCount = products.length;
  const selectedLabel = value === 'all' ? 'Catégories' : value ? value.split(' > ').pop() ?? value : 'Catégories';
  const isFiltered = value !== 'all' && value !== '';

  const renderTreeNode = (node: any): React.ReactNode => {
    const isExpanded = expanded.has(node.path);
    const isSelected = value === node.path;
    const hasChildren = node.children && node.children.length > 0;
    const indent = node.depth * 18;
    const color = getCategoryColor(node.path);

    return (
      <div key={node.path}>
        <div
          style={{ paddingLeft: `${10 + indent}px` }}
          className={cn(
            'flex items-center gap-1.5 pr-2 py-2 hover:bg-[#E8F5E9] transition-colors',
            isSelected && 'bg-[#F1F8E9]'
          )}
        >
          {hasChildren ? (
            <button type="button" onClick={e => { e.stopPropagation(); toggleExpand(node.path); }} className="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 flex-shrink-0">
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
              <span className={cn('w-2 h-2 rounded-full', isSelected ? 'bg-[#1a4731]' : 'bg-zinc-300')} />
            </span>
          )}

          {/* Pastille colorée */}
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: color }}
          />

          <button
            type="button"
            onClick={() => { onChange(node.path); setOpen(false); setQuery(''); }}
            className={cn(
              'flex-1 text-left text-sm flex items-center gap-1.5 min-w-0',
              node.depth === 0 ? 'font-bold text-zinc-900' : node.depth === 1 ? 'font-semibold text-zinc-700' : 'font-medium text-zinc-500',
              isSelected && 'text-[#1a4731]'
            )}
          >
            <span className="truncate">{node.label}</span>
          </button>

          {/* ✅ Suppression du compteur ici */}
          {isSelected && !hasChildren && <Check className="w-4 h-4 text-[#1a4731] flex-shrink-0" />}
        </div>
        {hasChildren && isExpanded && <div>{node.children.map((child: any) => renderTreeNode(child))}</div>}
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen(o => !o); if (!open) setExpanded(new Set()); }}
        className={cn(
          'flex items-center justify-between rounded-lg border font-medium bg-white transition-all outline-none whitespace-nowrap h-9 px-3 text-sm gap-1.5',
          isFiltered ? 'border-[#1a4731] bg-[#E8F5E9] text-[#1a4731]' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
        )}
      >
        <span className="truncate max-w-[140px]">{selectedLabel}</span>
        <ChevronsUpDown className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" />
      </button>
      {open && portalStyle && createPortal(
        <div ref={dropdownRef} style={portalStyle} className="bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col my-portal-dropdown">
          <div className="p-2 border-b border-zinc-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-2 w-4 h-4 text-zinc-400" />
              <input
                ref={inputRef}
                placeholder="Rechercher catégorie…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
                className="w-full h-9 pl-8 pr-2 text-sm border border-zinc-200 rounded-lg bg-zinc-50 outline-none focus:border-[#1a4731]"
              />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange('all'); setOpen(false); setQuery(''); }}
              className={cn('w-full px-4 py-2.5 text-left text-sm flex items-center justify-between border-b border-zinc-50 hover:bg-[#E8F5E9] transition-colors', value === 'all' && 'bg-[#F1F8E9] text-[#1a4731] font-bold')}
            >
              <span className={cn('font-semibold', value === 'all' ? 'text-[#1a4731]' : 'text-zinc-700')}>Toutes catégories</span>
              {/* Le total est conservé ici */}
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold', value === 'all' ? 'bg-[#1a4731] text-white' : 'bg-zinc-100 text-zinc-500')}>{totalCount}</span>
            </button>
            {query.trim() ? (
              flatFiltered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-zinc-400 italic text-center">Aucun résultat</p>
              ) : (
                flatFiltered.map((item, idx) => {
                  const isSelected = value === item.path;
                  const color = getCategoryColor(item.path);
                  return (
                    <button
                      key={`flat-${item.path}-${idx}`}
                      type="button"
                      onClick={() => { onChange(item.path); setOpen(false); setQuery(''); }}
                      style={{ paddingLeft: `${12 + item.depth * 18}px` }}
                      className={cn('w-full pr-4 py-2 text-left text-sm flex items-center gap-1.5 hover:bg-[#E8F5E9] transition-colors', isSelected && 'bg-[#F1F8E9] text-[#1a4731]', item.depth === 0 ? 'font-bold text-zinc-900' : item.depth === 1 ? 'font-semibold text-zinc-700' : 'font-medium text-zinc-500')}
                    >
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#1a4731] flex-shrink-0" />}
                    </button>
                  );
                })
              )
            ) : (
              filterTree.length === 0 ? (
                <p className="px-4 py-3 text-sm text-zinc-400 italic text-center">Aucune catégorie disponible</p>
              ) : (
                filterTree.map((node: any) => renderTreeNode(node))
              )
            )}
          </div>
          {isFiltered && (
            <div className="border-t border-zinc-100 p-2 flex-shrink-0">
              <button type="button" onClick={() => { onChange('all'); setOpen(false); }} className="w-full flex items-center justify-center gap-1.5 h-8 text-xs font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" /> Effacer la sélection
              </button>
            </div>
          )}
        </div>, document.body
      )}
    </div>
  );
}

/* ========================================================================== */
/*  Sélecteur générique (filtres)                                             */
/* ========================================================================== */

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner…',
  searchPlaceholder = 'Rechercher…',
  dropdownWidth = 240,
  compact = false,
  className,
}: any) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const portalStyle = usePortalPosition(open, triggerRef as React.RefObject<HTMLElement>, dropdownWidth);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (dropdownRef.current?.contains(e.target as Node) === false && triggerRef.current?.contains(e.target as Node) === false) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const filtered = useMemo(() => options.filter((o: any) => o.label.toLowerCase().includes(query.toLowerCase())), [options, query]);
  const selectedLabel = options.find((o: any) => o.value === value)?.label ?? placeholder;
  const isFiltered = value !== '' && value !== 'all';

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center justify-between rounded-lg border font-medium bg-white transition-all outline-none whitespace-nowrap',
          compact ? 'h-9 px-3 text-sm gap-1.5' : 'h-10 px-4 text-sm gap-2',
          isFiltered ? 'border-[#1a4731] bg-[#E8F5E9] text-[#1a4731]' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
        )}
      >
        <span className="truncate max-w-[150px]">{selectedLabel}</span>
        <ChevronsUpDown className={cn('flex-shrink-0 text-zinc-400', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      </button>
      {open && portalStyle && createPortal(
        <div ref={dropdownRef} style={portalStyle} className="bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col my-portal-dropdown">
          <div className="p-2 border-b border-zinc-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-2 w-4 h-4 text-zinc-400" />
              <input
                ref={inputRef}
                placeholder={searchPlaceholder}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
                className="w-full h-9 pl-8 pr-2 text-sm border border-zinc-200 rounded-lg bg-zinc-50 outline-none focus:border-[#1a4731]"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && <p className="px-4 py-3 text-sm text-zinc-400 italic text-center">Aucun résultat</p>}
            {filtered.map((opt: any) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                  className={cn('w-full text-left text-sm flex items-center gap-2 px-4 py-2.5 hover:bg-[#F1F8E9] transition-colors', isSelected && 'text-[#1a4731] bg-[#E8F5E9] font-bold')}
                >
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.badge && <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0', opt.badgeColor ?? 'bg-zinc-100 text-zinc-500')}>{opt.badge}</span>}
                  {isSelected && <Check className="w-4 h-4 text-[#1a4731] flex-shrink-0 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>, document.body
      )}
    </div>
  );
}

/* ========================================================================== */
/*  Sélecteur d'emplacement (avec ajout dynamique)                            */
/* ========================================================================== */

export function LocationSelect({
  value,
  onChange,
  locations = [],
}: {
  value: string;
  onChange: (v: string) => void;
  locations?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const portalStyle = usePortalPosition(open, triggerRef as React.RefObject<HTMLElement>, 260);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (dropdownRef.current?.contains(e.target as Node) === false && triggerRef.current?.contains(e.target as Node) === false) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const filtered = useMemo(() => {
    if (!query) return locations;
    return locations.filter(l => l.toLowerCase().includes(query.toLowerCase()));
  }, [query, locations]);

  const canAddNew = query.trim().length > 0 && !locations.some(l => l.toLowerCase() === query.toLowerCase());

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between h-10 px-4 rounded-xl border text-sm font-medium bg-white transition-all outline-none',
          'border-zinc-200 hover:border-[#1a4731] focus:border-[#1a4731]',
          value ? 'text-zinc-900' : 'text-zinc-400'
        )}
      >
        <span className="truncate flex-1 text-left">{value || 'Sélectionner un emplacement…'}</span>
        <ChevronsUpDown className="w-4 h-4 text-zinc-400 flex-shrink-0 ml-2" />
      </button>
      {open && portalStyle && createPortal(
        <div ref={dropdownRef} style={portalStyle} className="bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col my-portal-dropdown">
          <div className="p-2 border-b border-zinc-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-2 w-4 h-4 text-zinc-400" />
              <input
                ref={inputRef}
                placeholder="Rechercher ou créer un emplacement…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); if (canAddNew) { onChange(query); setOpen(false); setQuery(''); } } if (e.key === 'Escape') e.stopPropagation(); }}
                className="w-full h-9 pl-8 pr-2 text-sm border border-zinc-200 rounded-lg bg-zinc-50 outline-none focus:border-[#1a4731]"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button type="button" onClick={() => { onChange(''); setOpen(false); setQuery(''); }} className="w-full px-4 py-2.5 text-left text-sm text-zinc-400 italic hover:bg-zinc-50 transition-colors">Non défini</button>
            {filtered.length === 0 && !canAddNew && <p className="px-4 py-3 text-sm text-zinc-400 italic text-center">Aucun résultat</p>}
            {filtered.map(loc => (
              <button key={loc} type="button" onClick={() => { onChange(loc); setOpen(false); setQuery(''); }} className={cn('w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[#F1F8E9] transition-colors', value === loc ? 'font-bold text-[#1a4731] bg-[#E8F5E9]' : 'text-zinc-700')}>
                <MapPin className="w-4 h-4 flex-shrink-0 text-zinc-400" /><span className="flex-1 truncate">{loc}</span>{value === loc && <Check className="w-4 h-4 text-[#1a4731] flex-shrink-0" />}
              </button>
            ))}
            {canAddNew && <button type="button" onClick={() => { onChange(query); setOpen(false); setQuery(''); }} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[#1a4731]/10 text-[#1a4731] font-medium border-t border-zinc-100 transition-colors"><Plus className="w-4 h-4" /> Ajouter «&nbsp;{query}&nbsp;»</button>}
          </div>
        </div>, document.body
      )}
    </div>
  );
}

/* ========================================================================== */
/*  Sélecteur de fournisseur                                                  */
/* ========================================================================== */

export function SupplierSelect({
  value,
  onChange,
  suppliers = [],
}: {
  value: string;
  onChange: (v: string) => void;
  suppliers?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const portalStyle = usePortalPosition(open, triggerRef as React.RefObject<HTMLElement>, 300);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (dropdownRef.current?.contains(e.target as Node) === false && triggerRef.current?.contains(e.target as Node) === false) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const filtered = useMemo(() => {
    if (!query) return suppliers;
    return suppliers.filter(s => s.toLowerCase().includes(query.toLowerCase()));
  }, [query, suppliers]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between h-10 px-4 rounded-xl border text-sm font-medium bg-white transition-all outline-none',
          'border-zinc-200 hover:border-[#1a4731] focus:border-[#1a4731]',
          value ? 'text-zinc-900' : 'text-zinc-400'
        )}
      >
        <span className="truncate flex-1 text-left">{value || 'Sélectionner un fournisseur…'}</span>
        <ChevronsUpDown className="w-4 h-4 text-zinc-400 flex-shrink-0 ml-2" />
      </button>
      {open && portalStyle && createPortal(
        <div ref={dropdownRef} style={portalStyle} className="bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col my-portal-dropdown">
          <div className="p-2 border-b border-zinc-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-2 w-4 h-4 text-zinc-400" />
              <input
                ref={inputRef}
                placeholder="Rechercher un fournisseur…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); const match = filtered[0]; if (match) { onChange(match); setOpen(false); setQuery(''); } } }}
                className="w-full h-9 pl-8 pr-2 text-sm border border-zinc-200 rounded-lg bg-zinc-50 outline-none focus:border-[#1a4731]"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button type="button" onClick={() => { onChange(''); setOpen(false); setQuery(''); }} className="w-full px-4 py-2.5 text-left text-sm text-zinc-400 italic hover:bg-zinc-50 transition-colors">Non défini</button>
            {filtered.length === 0 && <p className="px-4 py-3 text-sm text-zinc-400 italic text-center">Aucun résultat</p>}
            {filtered.map(s => (
              <button key={s} type="button" onClick={() => { onChange(s); setOpen(false); setQuery(''); }} className={cn('w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[#F1F8E9] transition-colors', value === s ? 'font-bold text-[#1a4731] bg-[#E8F5E9]' : 'font-medium text-zinc-700')}>
                <span className="flex-1 truncate">{s}</span>{value === s && <Check className="w-4 h-4 text-[#1a4731] flex-shrink-0 ml-auto" />}
              </button>
            ))}
          </div>
        </div>, document.body
      )}
    </div>
  );
}
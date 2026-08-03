import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { StockStatus } from '@/types/catalogue';
import { toYMD } from '@/lib/catalogue/utils';
import {
  Download, ChevronDown, FileDown, FileSpreadsheet,
  FileText, RefreshCw, Calendar, ChevronsUpDown, Check, X,
} from 'lucide-react';
import { usePortalPosition } from './CatalogueSelects';

/**
 * Pastille colorée indiquant le statut du stock.
 */
export function StatusPill({ status, size = 'default' }: { status: StockStatus; size?: 'sm' | 'default' }) {
  const isSm = size === 'sm';
  const base = cn(
    'inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide',
    isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
  );

  if (status === 'critique') {
    return (
      <span className={cn(base, 'bg-red-50 text-red-600 border border-red-100')}>
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        Rupture
      </span>
    );
  }
  if (status === 'faible') {
    return (
      <span className={cn(base, 'bg-amber-50 text-amber-600 border border-amber-100')}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Faible
      </span>
    );
  }
  return (
    <span className={cn(base, 'bg-emerald-50 text-emerald-600 border border-emerald-100')}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Normal
    </span>
  );
}

/**
 * Barre de progression du stock (relative au seuil).
 */
export function StockBar({ current, min }: { current: number; min: number }) {
  const max = Math.max(min * 5, current * 1.2, 1);
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = current <= 0 ? '#ef4444' : current <= min ? '#f59e0b' : '#10b981';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span
        className={cn(
          'text-xs font-semibold tabular-nums min-w-[24px] text-right',
          current <= 0 ? 'text-red-500' : current <= min ? 'text-amber-500' : 'text-zinc-600'
        )}
      >
        {current < 0 ? `(${current})` : current}
      </span>
    </div>
  );
}

/**
 * Carte KPI cliquable (utilisée pour les filtres rapides et l'onglet analyse).
 */
export function KpiCard({ icon: Icon, label, value, sub, colorBg, colorText, isActive, onClick, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group bg-white rounded-2xl border-2 p-4 hover:shadow-lg transition-all duration-200 text-left w-full relative',
        isActive
          ? 'border-[#1a4731] ring-2 ring-[#1a4731]/20 shadow-md'
          : 'border-zinc-100 hover:border-zinc-200'
      )}
    >
      {badge > 0 && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            'w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105',
            colorBg
          )}
        >
          <Icon className={cn('w-5 h-5', colorText)} />
        </div>
        {isActive && (
          <div className="w-4 h-4 rounded-full bg-[#1a4731] flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-zinc-900 mb-0.5">{value}</div>
      <div className="text-[11px] font-medium text-zinc-500">{label}</div>
      {sub && <div className="text-[9px] text-zinc-400 mt-0.5 font-mono">{sub}</div>}
    </button>
  );
}

/**
 * Menu d'export (CSV, Excel, PDF) avec gestion du chargement PDF.
 */
export function ExportMenu({ onExcel, onPDF, onCSV, disabled }: any) {
  const [open, setOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'h-8 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-zinc-50 hover:border-zinc-300',
          disabled && 'opacity-40 cursor-not-allowed'
        )}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Exporter</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && !disabled && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden">
          <button
            onClick={() => { onCSV(); setOpen(false); }}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-zinc-50 transition-colors text-zinc-700 font-medium"
          >
            <FileDown className="w-4 h-4 text-emerald-600" /> CSV (UTF-8)
          </button>
          <button
            onClick={() => { onExcel(); setOpen(false); }}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-zinc-50 transition-colors text-zinc-700 font-medium"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> Excel (.xlsx)
          </button>
          <button
            disabled={pdfLoading}
            onClick={async () => {
              setPdfLoading(true);
              try {
                await onPDF();
              } finally {
                setPdfLoading(false);
                setOpen(false);
              }
            }}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-zinc-50 transition-colors text-zinc-700 font-medium disabled:opacity-50"
          >
            {pdfLoading ? (
              <RefreshCw className="w-4 h-4 text-red-600 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 text-red-600" />
            )}
            {pdfLoading ? 'Génération…' : 'Rapport PDF'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Sélecteur de période avec préréglages (ce mois, cette année, année dernière).
 * Utilise un portail pour éviter les problèmes de z-index.
 */
export function DateRangePicker({ dateDebut, dateFin, onDebutChange, onFinChange }: any) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalStyle = usePortalPosition(open, triggerRef as React.RefObject<HTMLElement>, 300);
  const hasFilter = !!(dateDebut || dateFin);

  // Fermeture au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) === false &&
        triggerRef.current?.contains(e.target as Node) === false
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /** Applique un préréglage de période. */
  const applyPreset = (preset: string) => {
    const now = new Date();
    let start = '', end = '';
    switch (preset) {
      case 'thisMonth':
        start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        end = toYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        break;
      case 'thisYear':
        start = `${now.getFullYear()}-01-01`;
        end = toYMD(now);
        break;
      case 'lastYear':
        start = `${now.getFullYear() - 1}-01-01`;
        end = `${now.getFullYear() - 1}-12-31`;
        break;
    }
    onDebutChange(start);
    onFinChange(end);
  };

  const label = useMemo(() => {
    if (!dateDebut && !dateFin) return 'Période';
    if (dateDebut && dateFin) return `${dateDebut} → ${dateFin}`;
    if (dateDebut) return `Depuis ${dateDebut}`;
    return `Jusqu'au ${dateFin}`;
  }, [dateDebut, dateFin]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-all whitespace-nowrap outline-none',
          hasFilter
            ? 'border-[#1a4731] bg-[#E8F5E9] text-[#1a4731]'
            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
        )}
      >
        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="max-w-[120px] truncate">{label}</span>
        <ChevronsUpDown className="w-3 h-3 text-zinc-400 flex-shrink-0" />
      </button>
      {open && portalStyle &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ ...portalStyle, width: 300 }}
            className="bg-white border border-zinc-200 rounded-xl shadow-2xl p-3 space-y-3 my-portal-dropdown"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Filtrer par date
            </p>
            <div className="flex flex-wrap gap-1.5">
              {([
                ['Ce mois', 'thisMonth'],
                ['Cette année', 'thisYear'],
                ['Année dernière', 'lastYear'],
              ] as const).map(([lbl, key]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 text-[10px] font-medium text-zinc-600 hover:bg-[#E8F5E9] hover:border-[#1a4731]/40 hover:text-[#1a4731] transition-colors"
                >
                  {lbl}
                </button>
              ))}
            </div>
            <div className="space-y-2 border-t border-zinc-100 pt-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-500">Date début</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => onDebutChange(e.target.value)}
                  className="w-full h-8 px-2 text-xs border border-zinc-200 rounded-lg outline-none focus:border-[#1a4731]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-500">Date fin</label>
                <input
                  type="date"
                  value={dateFin}
                  min={dateDebut}
                  onChange={(e) => onFinChange(e.target.value)}
                  className="w-full h-8 px-2 text-xs border border-zinc-200 rounded-lg outline-none focus:border-[#1a4731]"
                />
              </div>
            </div>
            {hasFilter && (
              <button
                type="button"
                onClick={() => {
                  onDebutChange('');
                  onFinChange('');
                  setOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 h-7 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
              >
                <X className="w-3 h-3" /> Effacer la période
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
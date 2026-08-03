'use client';

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
} from 'react';
import {
  Download,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Eye,
  ArrowUp,
  ArrowDown,
  Calendar,
  ChevronDown,
  Building2,
  FileSpreadsheet,
  FileDown,
  Info,
  ChevronsUpDown,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mouvementService, type MouvementResponse } from '@/services/mouvement.service';
import type { MovementType } from '@/types/mouvement';

const TYPE_CONFIG: Record<MovementType, {
  label: string; icon: React.ElementType;
  textColor: string; bgColor: string; borderColor: string; dotColor: string;
}> = {
  ENTREE:     { label: 'Entrée',      icon: ArrowUpCircle,   textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', dotColor: 'bg-emerald-500' },
  SORTIE:     { label: 'Sortie',      icon: ArrowDownCircle, textColor: 'text-orange-700',  bgColor: 'bg-orange-50',  borderColor: 'border-orange-200',  dotColor: 'bg-orange-500'  },
  AJUSTEMENT: { label: 'Ajustement',  icon: RefreshCw,       textColor: 'text-violet-700',  bgColor: 'bg-violet-50',  borderColor: 'border-violet-200',  dotColor: 'bg-violet-500'  },
};

type SortField = 'date' | 'valeurFlux' | 'quantite' | 'pmpSnapshot' | 'stockApres' | 'stockInitial';

const fmtNumber = (n: number, decimals = 2) =>
  new Intl.NumberFormat('fr-MA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

const fmtDate = (d: string) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = (d: string) => {
  if (!d) return '—';
  if (d.includes('T')) {
    const timePart = d.split('T')[1]?.substring(0, 5);
    if (timePart) return timePart;
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  if (!d.includes('T') && date.getHours() === 0 && date.getMinutes() === 0) return '—';
  return date.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });
};

const getStockAvant = (m: MouvementResponse) => m.stockAvant;

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

interface SearchableSelectProps {
  placeholder: string;
  icon?: React.ElementType;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

function SearchableSelect({ placeholder, icon: Icon, options, value, onChange }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => { setOpen(false); setQuery(''); });

  const filtered = useMemo(
    () => options.filter(o => o.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs transition-all whitespace-nowrap',
          value
            ? 'border-[#1D6F42] bg-[#E8F5E9] text-[#1D6F42] font-semibold'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        )}
      >
        {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
        <span className="max-w-[90px] truncate">{value || placeholder}</span>
        <ChevronsUpDown className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 w-3 h-3 text-gray-400" />
              <input
                autoFocus
                placeholder="Rechercher..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-7 pl-7 pr-2 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-[#1D6F42] focus:ring-1 focus:ring-[#1D6F42]/20"
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            <button
              onClick={() => handleSelect('')}
              className={cn(
                'w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors',
                !value ? 'font-bold text-[#1D6F42]' : 'text-gray-600'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
              Tous
            </button>
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400 italic text-center">Aucun résultat</p>
            )}
            {filtered.map(opt => (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className={cn(
                  'w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-[#E8F5E9] transition-colors',
                  value === opt ? 'font-bold text-[#1D6F42] bg-[#F1F8E9]' : 'text-gray-700'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', value === opt ? 'bg-[#1D6F42]' : 'bg-gray-300')} />
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DateRangePickerProps {
  dateDebut: string;
  dateFin: string;
  onDateDebutChange: (v: string) => void;
  onDateFinChange: (v: string) => void;
}

function DateRangePicker({ dateDebut, dateFin, onDateDebutChange, onDateFinChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const hasFilter = !!(dateDebut || dateFin);

  const toYYYYMMDD = (d: Date) => d.toISOString().split('T')[0];

  const applyPreset = (preset: string) => {
    const now = new Date();
    let start = '';
    let end = '';
    switch (preset) {
      case 'today':
        start = toYYYYMMDD(now);
        end = start;
        break;
      case 'thisWeek':
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        start = toYYYYMMDD(monday);
        end = toYYYYMMDD(sunday);
        break;
      case 'thisMonth':
        start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        end = toYYYYMMDD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        break;
      case 'lastMonth':
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`;
        end = toYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 0));
        break;
      case 'last6Months':
        const sixAgo = new Date();
        sixAgo.setMonth(sixAgo.getMonth() - 6);
        start = toYYYYMMDD(sixAgo);
        end = toYYYYMMDD(now);
        break;
      case 'thisYear':
        start = `${now.getFullYear()}-01-01`;
        end = toYYYYMMDD(now);
        break;
      case 'lastYear':
        start = `${now.getFullYear() - 1}-01-01`;
        end = `${now.getFullYear() - 1}-12-31`;
        break;
      default: break;
    }
    onDateDebutChange(start);
    onDateFinChange(end);
  };

  const label = useMemo(() => {
    if (!dateDebut && !dateFin) return 'Période';
    if (dateDebut && dateFin) return `${dateDebut} → ${dateFin}`;
    if (dateDebut) return `Depuis ${dateDebut}`;
    return `Jusqu'au ${dateFin}`;
  }, [dateDebut, dateFin]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs transition-all whitespace-nowrap',
          hasFilter
            ? 'border-[#1D6F42] bg-[#E8F5E9] text-[#1D6F42] font-semibold'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        )}
      >
        <Calendar className="w-3 h-3 flex-shrink-0" />
        <span className="max-w-[120px] truncate text-[11px]">{label}</span>
        <ChevronsUpDown className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-3 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Filtrer par période</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ['Aujourd\'hui', 'today'],
              ['Cette semaine', 'thisWeek'],
              ['Ce mois', 'thisMonth'],
              ['Mois dernier', 'lastMonth'],
              ['6 derniers mois', 'last6Months'],
              ['Cette année', 'thisYear'],
              ['Année dernière', 'lastYear'],
            ].map(([label, key]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-[10px] font-medium text-gray-600 hover:bg-[#E8F5E9] hover:border-[#1D6F42]/40 hover:text-[#1D6F42] transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-2 space-y-2">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500">Date de début</label>
              <input
                type="date"
                value={dateDebut}
                onChange={e => onDateDebutChange(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-[#1D6F42]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500">Date de fin</label>
              <input
                type="date"
                value={dateFin}
                min={dateDebut}
                onChange={e => onDateFinChange(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-[#1D6F42]"
              />
            </div>
          </div>
          {hasFilter && (
            <button
              onClick={() => { onDateDebutChange(''); onDateFinChange(''); setOpen(false); }}
              className="w-full flex items-center justify-center gap-1.5 h-7 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
            >
              <X className="w-3 h-3" /> Effacer la période
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface ExportMenuProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportPDF: () => Promise<void>;
  disabled: boolean;
}

function ExportMenu({ onExportCSV, onExportExcel, onExportPDF, disabled }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await onExportPDF(); } finally { setPdfLoading(false); setOpen(false); }
  };

  return (
    <div ref={ref} className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 rounded-xl border-2 text-xs font-medium transition-all',
          disabled
            ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
            : 'border-gray-200 text-gray-700 bg-white hover:border-[#1D6F42] hover:text-[#1D6F42] hover:shadow-sm'
        )}
      >
        <Download className="w-3 h-3" />
        Exporter
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <button
            onClick={() => { onExportCSV(); setOpen(false); }}
            className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700"
          >
            <FileDown className="w-3.5 h-3.5 text-green-600" />
            Exporter CSV
          </button>
          <button
            onClick={() => { onExportExcel(); setOpen(false); }}
            className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            Exporter Excel
          </button>
          <button
            disabled={pdfLoading}
            onClick={handlePDF}
            className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 disabled:opacity-50"
          >
            {pdfLoading ? (
              <RefreshCw className="w-3.5 h-3.5 text-red-600 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-red-600" />
            )}
            {pdfLoading ? 'Génération…' : 'Exporter PDF'}
          </button>
        </div>
      )}
    </div>
  );
}

function TypePill({ type }: { type: MovementType }) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
      cfg.textColor, cfg.bgColor, cfg.borderColor
    )}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function StockIndicator({ stockApres, quantiteMin }: { stockApres: number; quantiteMin: number }) {
  if (stockApres < 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
        {stockApres} <AlertTriangle className="w-3 h-3" />
      </span>
    );
  if (stockApres <= quantiteMin)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-500">
        {stockApres} <AlertTriangle className="w-3 h-3" />
      </span>
    );
  return <span className="text-xs font-semibold text-gray-900">{stockApres}</span>;
}

function KpiCard({
  icon: Icon, label, value, subLabel, colorClass, isActive, onClick,
}: {
  icon: React.ElementType; label: string; value: string | number; subLabel?: string;
  colorClass: string; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group bg-white rounded-2xl border-2 p-4 hover:shadow-lg transition-all duration-200 text-left w-full',
        isActive
          ? 'border-[#1D6F42] ring-2 ring-[#1D6F42]/20 shadow-md'
          : 'border-gray-100 hover:border-gray-200'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn(
          'w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105',
          colorClass
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {isActive && (
          <div className="w-4 h-4 rounded-full bg-[#1D6F42] flex items-center justify-center">
            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-[11px] font-medium text-gray-500">{label}</div>
      {subLabel && <div className="text-[9px] text-gray-400 mt-0.5">{subLabel}</div>}
    </button>
  );
}

function FilterBadge({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200',
        isActive
          ? 'border-[#1D6F42] bg-[#1D6F42] text-white shadow-sm'
          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
      )}
    >
      {label}
    </button>
  );
}

function DetailDialog({ mvt, onClose }: { mvt: MouvementResponse | null; onClose: () => void }) {
  if (!mvt) return null;

  const cfg = TYPE_CONFIG[mvt.type];
  const isEntree = mvt.type === 'ENTREE';
  const isSortie = mvt.type === 'SORTIE';
  const isAjustement = mvt.type === 'AJUSTEMENT';

  const stockAvant = mvt.stockAvant;
  const stockAlert = mvt.stockApres < 0
    ? 'critical'
    : mvt.stockApres <= mvt.quantiteMin
    ? 'warning'
    : 'ok';

  const variationSign = isEntree ? '+' : isSortie ? '-' : (mvt.stockApres > mvt.stockAvant ? '+' : '-');
  const VariationIcon = isEntree ? ArrowUpCircle : isSortie ? ArrowDownCircle : (mvt.stockApres > mvt.stockAvant ? ArrowUpCircle : ArrowDownCircle);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Détails mouvement ${mvt.referenceDocument}`}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-2xl flex items-center justify-center', cfg.bgColor, cfg.borderColor, 'border')}>
              {(() => { const Icon = cfg.icon; return <Icon className={cn('w-4 h-4', cfg.textColor)} />; })()}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Détails du mouvement</h2>
              <p className="text-[11px] text-gray-500 font-mono">{mvt.referenceDocument}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TypePill type={mvt.type} />
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Date & Heure</p>
              <p className="text-xs font-bold text-gray-900">{fmtDate(mvt.date)}</p>
              <p className="text-[10px] text-gray-500">{fmtTime(mvt.date)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Utilisateur</p>
              <p className="text-xs font-bold text-gray-900">{mvt.utilisateur}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Département</p>
              <p className="text-xs font-bold text-gray-900">{mvt.departement}</p>
            </div>
          </div>

          <div className="bg-[#F1F8E9] rounded-xl p-3 border border-[#1D6F42]/20">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#1D6F42] mb-1">Produit</p>
            <p className="text-sm font-bold text-gray-900">{mvt.designation}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="font-mono text-[10px] text-gray-500 bg-white border border-gray-200 rounded-md px-2 py-0.5">{mvt.codeArticle}</span>
              <span className="text-[10px] text-gray-500">Unité : <strong>{mvt.uniteMesure}</strong></span>
              <span className="text-[10px] text-gray-500">Seuil min. : <strong>{mvt.quantiteMin}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl p-3 border text-center bg-white border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Quantité</p>
              <p className={cn('text-lg font-black', isEntree ? 'text-emerald-600' : isSortie ? 'text-orange-500' : 'text-violet-600')}>
                {variationSign}{Math.abs(mvt.quantite)}
              </p>
              <p className="text-[10px] text-gray-400">{mvt.uniteMesure}</p>
            </div>
            <div className="rounded-xl p-3 border text-center bg-white border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Stock avant</p>
              <p className="text-lg font-black text-gray-700">{stockAvant}</p>
              <p className="text-[10px] text-gray-400">{mvt.uniteMesure}</p>
            </div>
            <div className="rounded-xl p-3 border text-center bg-white border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Stock après</p>
              <p className={cn('text-lg font-black', stockAlert === 'critical' ? 'text-red-600' : stockAlert === 'warning' ? 'text-orange-500' : 'text-gray-900')}>
                {mvt.stockApres}
              </p>
              {stockAlert !== 'ok' && (
                <p className={cn('text-[8px] font-bold flex items-center justify-center gap-0.5', stockAlert === 'critical' ? 'text-red-500' : 'text-orange-500')}>
                  <AlertTriangle className="w-2 h-2" />
                  {stockAlert === 'critical' ? 'Rupture' : 'Alerte seuil'}
                </p>
              )}
            </div>
            <div className="rounded-xl p-3 border text-center bg-white border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">PMP unitaire</p>
              <p className="text-lg font-black text-gray-900">{fmtNumber(mvt.pmpSnapshot)}</p>
              <p className="text-[10px] text-gray-400">MAD</p>
            </div>
            <div className={cn('rounded-xl p-3 border text-center', mvt.valeurFlux >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200', 'sm:col-span-2 lg:col-span-1')}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Valeur flux</p>
              <p className={cn('text-lg font-black', mvt.valeurFlux >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                {mvt.valeurFlux >= 0 ? '+' : ''}{fmtNumber(mvt.valeurFlux)}
              </p>
              <p className="text-[10px] text-gray-400">MAD HT</p>
            </div>
          </div>

          {mvt.motif && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
              <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-700 mb-0.5">Motif / Note</p>
                <p className="text-xs text-amber-900 whitespace-pre-wrap">{mvt.motif}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function buildCSVContent(data: MouvementResponse[]): string {
  const headers = [
    'Date', 'Heure', 'Type', 'Réf. Document',
    'Code Article', 'Désignation', 'Département', 'Unité',
    'Quantité', 'Stock avant', 'Stock après', 'PMP (MAD)', 'Valeur flux (MAD)',
    'Utilisateur', 'Motif',
  ];

  const escape = (v: unknown): string => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };

  const rows = data.map(m => {
    const sign = m.type === 'ENTREE' ? '+' : m.type === 'SORTIE' ? '-' : (m.stockApres > m.stockAvant ? '+' : '-');
    return [
      fmtDate(m.date),
      fmtTime(m.date),
      m.type,
      m.referenceDocument,
      m.codeArticle,
      m.designation,
      m.departement,
      m.uniteMesure,
      `${sign}${Math.abs(m.quantite)}`,
      m.stockAvant,
      m.stockApres,
      m.pmpSnapshot.toFixed(2),
      m.valeurFlux.toFixed(2),
      m.utilisateur,
      m.motif ?? '',
    ].map(escape).join(',');
  });

  return [headers.map(escape).join(','), ...rows].join('\r\n');
}

function downloadBlob(content: string, filename: string, mime: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function JournalPage() {
  const [journal, setJournal] = useState<MouvementResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // --- État de vérification d'intégrité globale ---
  const [integriteChecking, setIntegriteChecking] = useState(false);
  const [integriteResult, setIntegriteResult] = useState<boolean | null>(null);

  // --- État pour la popup de hachage / vérification individuelle ---
  const [hashPopupMvt, setHashPopupMvt] = useState<MouvementResponse | null>(null);
  const [hashPopupData, setHashPopupData] = useState<any>(null);
  const [hashPopupLoading, setHashPopupLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pageData = await mouvementService.getAll({ page: 0, size: 9999 });
        setJournal(pageData.content);
      } catch (error) {
        console.error("Erreur lors du chargement des mouvements", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [search, setSearch]                       = useState('');
  const [filterType, setFilterType]               = useState<'' | MovementType>('');
  const [filterProduit, setFilterProduit]         = useState('');
  const [filterDepartement, setFilterDepartement] = useState('');
  const [dateDebut, setDateDebut]                 = useState('');
  const [dateFin, setDateFin]                     = useState('');
  const [kpiFilter, setKpiFilter]                 = useState<'' | 'entrees' | 'sorties' | 'ajustements'>('');
  const [page, setPage]                           = useState(1);
  const [sortField, setSortField]                 = useState<SortField>('date');
  const [sortDir, setSortDir]                     = useState<'asc' | 'desc'>('desc');
  const [detailMvt, setDetailMvt]                 = useState<MouvementResponse | null>(null);

  const perPage = 10;

  const produitOptions = useMemo(() =>
    [...new Set(journal.map(j => j.designation).filter(Boolean))].sort(),
  [journal]);

  const departementOptions = useMemo(() =>
    [...new Set(journal.map(j => j.departement).filter(Boolean))].sort(),
  [journal]);

  const totalEntrees     = useMemo(() => journal.filter(j => j.type === 'ENTREE').reduce((s, j) => s + j.valeurFlux, 0), [journal]);
  const totalSorties     = useMemo(() => journal.filter(j => j.type === 'SORTIE').reduce((s, j) => s + Math.abs(j.valeurFlux), 0), [journal]);
  const totalAjustements = useMemo(() => journal.filter(j => j.type === 'AJUSTEMENT').length, [journal]);

  const filtered = useMemo(() => {
    const searchLow = search.toLowerCase();
    const effectiveType: MovementType | '' = filterType
      || (kpiFilter === 'entrees' ? 'ENTREE' : kpiFilter === 'sorties' ? 'SORTIE' : kpiFilter === 'ajustements' ? 'AJUSTEMENT' : '');

    const debutTs = dateDebut ? new Date(`${dateDebut}T00:00:00`).getTime() : null;
    const finTs   = dateFin   ? new Date(`${dateFin}T23:59:59`).getTime()   : null;

    const result = journal.filter(j => {
      if (searchLow) {
        const hay = [
          j.referenceDocument,
          j.designation,
          j.codeArticle,
          j.departement,
          j.utilisateur,
          j.codeUnique,
        ].join(' ').toLowerCase();
        if (!hay.includes(searchLow)) return false;
      }
      if (effectiveType && j.type !== effectiveType) return false;
      if (filterProduit && j.designation !== filterProduit) return false;
      if (filterDepartement && j.departement !== filterDepartement) return false;
      if (debutTs && new Date(j.date).getTime() < debutTs) return false;
      if (finTs   && new Date(j.date).getTime() > finTs)   return false;
      return true;
    });

    return result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':         cmp = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case 'valeurFlux':   cmp = a.valeurFlux  - b.valeurFlux;        break;
        case 'quantite':     cmp = a.quantite     - b.quantite;          break;
        case 'pmpSnapshot':  cmp = a.pmpSnapshot  - b.pmpSnapshot;       break;
        case 'stockApres':   cmp = a.stockApres   - b.stockApres;        break;
        case 'stockInitial': cmp = a.stockInitial - b.stockInitial;      break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [journal, search, filterType, kpiFilter, filterProduit, filterDepartement, dateDebut, dateFin, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSort = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else setSortDir('desc');
      return field;
    });
    setPage(1);
  }, []);

  const handleKpiClick = useCallback((key: typeof kpiFilter) => {
    setKpiFilter(prev => prev === key ? '' : key);
    setFilterType('');
    setPage(1);
  }, []);

  const handleFilterType = useCallback((t: '' | MovementType) => {
    setFilterType(prev => prev === t ? '' : t);
    setKpiFilter('');
    setPage(1);
  }, []);

  const handleProduitChange = useCallback((v: string) => { setFilterProduit(v); setPage(1); }, []);
  const handleDeptChange    = useCallback((v: string) => { setFilterDepartement(v); setPage(1); }, []);
  const handleDateDebut     = useCallback((v: string) => { setDateDebut(v); setPage(1); }, []);
  const handleDateFin       = useCallback((v: string) => { setDateFin(v); setPage(1); }, []);

  const resetFilters = useCallback(() => {
    setSearch(''); setFilterType(''); setKpiFilter('');
    setFilterProduit(''); setFilterDepartement('');
    setDateDebut(''); setDateFin('');
    setPage(1);
  }, []);

  const filtersActifs = !!(search || filterType || kpiFilter || filterProduit || filterDepartement || dateDebut || dateFin);

  const paginationRange = useCallback((): (number | '...')[] => {
    const delta = 1;
    const range: (number | '...')[] = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i);
    if (range[0] !== 1) { range.unshift('...'); range.unshift(1); }
    if (range[range.length - 1] !== totalPages) { range.push('...'); range.push(totalPages); }
    return range;
  }, [page, totalPages]);

  const handleExportCSV = useCallback(() => {
    if (filtered.length === 0) return;
    const content  = buildCSVContent(filtered);
    const filename = `journal_mouvements_${new Date().toISOString().split('T')[0]}.csv`;
    downloadBlob(content, filename, 'text/csv');
  }, [filtered]);

  const handleExportExcel = useCallback(async () => {
    if (filtered.length === 0) return;
    try {
      const XLSX = await import('xlsx');
      const rows = filtered.map(m => ({
        'Date':                 fmtDate(m.date),
        'Heure':                fmtTime(m.date),
        'Type':                 m.type,
        'Réf. Document':        m.referenceDocument,
        'Code Article':         m.codeArticle,
        'Désignation':          m.designation,
        'Département':          m.departement,
        'Unité':                m.uniteMesure,
        'Quantité':             m.type === 'ENTREE' ? `+${m.quantite}` : m.type === 'SORTIE' ? `-${m.quantite}` : (m.stockApres > m.stockAvant ? `+${m.quantite}` : `-${m.quantite}`),
        'Stock avant':          m.stockAvant,
        'Stock après':          m.stockApres,
        'PMP (MAD)':            m.pmpSnapshot,
        'Valeur flux (MAD)':    m.valeurFlux,
        'Utilisateur':          m.utilisateur,
        'Motif':                m.motif ?? '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const colWidths = Object.keys(rows[0] || {}).map(k => ({
        wch: Math.max(k.length, ...rows.map(r => String((r as Record<string,unknown>)[k] ?? '').length)) + 2,
      }));
      ws['!cols'] = colWidths;
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Journal');
      XLSX.writeFile(wb, `journal_mouvements_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('[Export Excel]', err);
    }
  }, [filtered]);

  const handleExportPDF = useCallback(async (): Promise<void> => {
    if (filtered.length === 0) return;
    try {
      const { default: jsPDF }    = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc       = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin    = 12;
      const logoUrl   = '/images/alomrane-logo.png';

      let logoDataUrl = '';
      try {
        const img = new Image();
        img.src   = logoUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload  = () => resolve();
          img.onerror = () => reject();
        });
        const canvas = document.createElement('canvas');
        canvas.width  = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        logoDataUrl = canvas.toDataURL('image/png');
      } catch { /* logo optionnel */ }

      const addHeaderFooter = (currentPage: number, totalPages: number) => {
        if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', margin, 1, 35, 35);

        doc.setFontSize(16);
        doc.setTextColor(29, 111, 66);
        doc.setFont('helvetica', 'bold');
        doc.text('GROUPE AL OMRANE', logoDataUrl ? margin + 40 : margin, 15);

        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'normal');
        doc.text('Journal des Mouvements de Stock', logoDataUrl ? margin + 40 : margin, 22);

        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} — ${filtered.length} mouvement(s)`,
          logoDataUrl ? margin + 40 : margin,
          28
        );

        doc.setDrawColor(29, 111, 66);
        doc.line(margin, 31, pageWidth - margin, 31);

        const footerY = doc.internal.pageSize.getHeight() - 8;
        doc.setFontSize(6);
        doc.setTextColor(140, 140, 140);
        doc.text(`Document confidentiel — Page ${currentPage} / ${totalPages}`, margin, footerY);
        doc.text('Al Omrane — Tous droits réservés', pageWidth - margin - 30, footerY, { align: 'right' });
      };

      const headers = [
        'Date', 'Heure', 'Type', 'Réf. Document',
        'Code', 'Désignation', 'Département',
        'Qté', 'Stock avant', 'Stock après', 'PMP (MAD)', 'Valeur (MAD)',
        'Utilisateur',
      ];

      const rows = filtered.map(m => {
        const sign = m.type === 'ENTREE' ? '+' : m.type === 'SORTIE' ? '-' : (m.stockApres > m.stockAvant ? '+' : '-');
        return [
          fmtDate(m.date),
          fmtTime(m.date),
          m.type,
          m.referenceDocument,
          m.codeArticle,
          m.designation,
          m.departement,
          `${sign}${Math.abs(m.quantite)}`,
          m.stockAvant,
          m.stockApres,
          m.pmpSnapshot.toFixed(2),
          m.valeurFlux.toFixed(2),
          m.utilisateur,
        ];
      });

      autoTable(doc, {
        head:    [headers],
        body:    rows,
        startY:  36,
        margin:  { top: 36, left: margin, right: margin, bottom: 15 },
        styles: {
          fontSize:    6,
          cellPadding: 2,
          valign:      'middle',
          halign:      'left',
          textColor:   [40, 40, 40],
          lineColor:   [210, 210, 210],
          lineWidth:   0.08,
        },
        headStyles: {
          fillColor:  [29, 111, 66],
          textColor:  [255, 255, 255],
          fontStyle:  'bold',
          halign:     'center',
          fontSize:   6,
        },
        alternateRowStyles: { fillColor: [240, 248, 245] },
        columnStyles: {
          2:  { halign: 'center' },
          7:  { halign: 'center' },
          8:  { halign: 'center' },
          9:  { halign: 'center' },
          10: { halign: 'right'  },
          11: { halign: 'right'  },
        },
        didDrawPage: (data) => addHeaderFooter(data.pageNumber, doc.getNumberOfPages()),
      });

      doc.save(`journal_mouvements_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('[Export PDF]', err);
    }
  }, [filtered]);

  // --- Vérification d'intégrité globale ---
  const handleVerifierIntegrite = async () => {
    setIntegriteChecking(true);
    setIntegriteResult(null);
    try {
      const result = await mouvementService.verifierIntegrite();
      setIntegriteResult(result.integrite);
    } catch (err) {
      console.error('Erreur vérification intégrité', err);
      setIntegriteResult(false);
    } finally {
      setIntegriteChecking(false);
    }
  };

  // --- Ouvrir la popup de hash/vérification pour un mouvement ---
  const handleOpenHashPopup = async (mvt: MouvementResponse) => {
    setHashPopupMvt(mvt);
    setHashPopupLoading(true);
    setHashPopupData(null);
    try {
      const res = await mouvementService.verifierMouvement(mvt.id);
      setHashPopupData(res);
    } catch {
      setHashPopupData({ integrite: false });
    } finally {
      setHashPopupLoading(false);
    }
  };

  const handleCloseHashPopup = () => {
    setHashPopupMvt(null);
    setHashPopupData(null);
    setHashPopupLoading(false);
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className={cn('ml-0.5 inline-flex opacity-20 transition-opacity', sortField === field && 'opacity-100 text-[#1D6F42]')}>
      {sortField === field && sortDir === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
    </span>
  );

  const columns = [
    { label: 'Date',          field: 'date' as SortField,       sortable: true,  class: 'w-[80px]'  },
    { label: 'Type',                                            sortable: false, class: 'w-[70px]'  },
    { label: 'Code',                                            sortable: false, class: 'w-[100px]' },
    { label: 'Réf.',                                            sortable: false, class: 'w-[90px]'  },
    { label: 'Produit',                                         sortable: false, class: ''          },
    { label: 'Qté',           field: 'quantite' as SortField,   sortable: true,  class: 'w-[60px]'  },
    { label: 'Stock',         field: 'stockApres' as SortField, sortable: true,  class: 'w-[65px]'  },
    { label: 'PMP',           field: 'pmpSnapshot' as SortField,sortable: true,  class: 'w-[70px]'  },
    { label: 'Valeur',        field: 'valeurFlux' as SortField, sortable: true,  class: 'w-[80px]'  },
    { label: 'Département',                                     sortable: false, class: 'w-[110px]' },
    { label: 'Utilisateur',                                     sortable: false, class: 'w-[100px]' },
    { label: 'Détails',                                         sortable: false, class: 'w-[50px]'  },
    { label: 'Vérif.',                                          sortable: false, class: 'w-[50px]'  },
  ];

  return (
    <div className="min-h-screen bg-gray-50/30 space-y-4 p-4 md:p-6">

      {detailMvt && <DetailDialog mvt={detailMvt} onClose={() => setDetailMvt(null)} />}
      {hashPopupMvt && (
        <HashIntegriteDialog
          mvt={hashPopupMvt}
          data={hashPopupData}
          loading={hashPopupLoading}
          onClose={handleCloseHashPopup}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Journal des Mouvements
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Traçabilité complète de tous les flux de stock — entrées, sorties et ajustements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filtersActifs && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-1.5 transition-all"
            >
              <X className="w-3 h-3" /> Réinitialiser
            </button>
          )}
          <button
            onClick={handleVerifierIntegrite}
            disabled={integriteChecking || journal.length === 0}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 rounded-xl border-2 text-xs font-medium transition-all',
              journal.length === 0 ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50' :
              'border-gray-200 text-gray-700 bg-white hover:border-[#1D6F42] hover:text-[#1D6F42] hover:shadow-sm'
            )}
            title="Vérifier l'intégrité de la chaîne de mouvements"
          >
            {integriteChecking ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : integriteResult === true ? (
              <ShieldCheck className="w-3 h-3 text-green-600" />
            ) : integriteResult === false ? (
              <ShieldAlert className="w-3 h-3 text-red-600" />
            ) : (
              <ShieldCheck className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">
              {integriteChecking ? 'Vérification...' : integriteResult === true ? 'Intégrité OK' : integriteResult === false ? 'Intégrité rompue' : 'Vérifier intégrité'}
            </span>
          </button>
          {integriteResult !== null && !integriteChecking && (
            <span className={cn(
              'text-[10px] font-medium',
              integriteResult ? 'text-green-700' : 'text-red-700'
            )}>
              {integriteResult ? '✓' : '✗'}
            </span>
          )}
          <ExportMenu
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            disabled={filtered.length === 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={BarChart3}
          label="Total mouvements"
          value={journal.length}
          subLabel="Tous types confondus"
          colorClass="bg-[#E3F2FD] text-[#0d3b66]"
          isActive={kpiFilter === '' && !filterType}
          onClick={() => handleKpiClick('')}
        />
        <KpiCard
          icon={TrendingUp}
          label="Entrées (valeur HT)"
          value={`${(totalEntrees / 1000).toFixed(1)}k MAD`}
          subLabel={`${journal.filter(j => j.type === 'ENTREE').length} bon(s)`}
          colorClass="bg-emerald-50 text-emerald-700"
          isActive={kpiFilter === 'entrees'}
          onClick={() => handleKpiClick('entrees')}
        />
        <KpiCard
          icon={TrendingDown}
          label="Sorties (valeur HT)"
          value={`${(totalSorties / 1000).toFixed(1)}k MAD`}
          subLabel={`${journal.filter(j => j.type === 'SORTIE').length} sortie(s)`}
          colorClass="bg-orange-50 text-orange-700"
          isActive={kpiFilter === 'sorties'}
          onClick={() => handleKpiClick('sorties')}
        />
        <KpiCard
          icon={RefreshCw}
          label="Ajustements"
          value={totalAjustements}
          subLabel="Corrections d'inventaire"
          colorClass="bg-violet-50 text-violet-700"
          isActive={kpiFilter === 'ajustements'}
          onClick={() => handleKpiClick('ajustements')}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="px-4 py-3 border-b border-gray-100 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-[#1D6F42] flex-shrink-0" />
            <span className="font-bold text-gray-900 text-xs mr-1">Filtres</span>

            <div className="relative flex-1 min-w-[160px] max-w-[220px]">
              <Search className="absolute left-2.5 top-2 w-3 h-3 text-gray-400" />
              <input
                placeholder="Réf, produit, code…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full h-7 pl-7 pr-6 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none placeholder-gray-400 focus:border-[#1D6F42] focus:ring-1 focus:ring-[#1D6F42]/20"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <SearchableSelect
              placeholder="Produit"
              icon={Package}
              options={produitOptions}
              value={filterProduit}
              onChange={handleProduitChange}
            />

            <SearchableSelect
              placeholder="Département"
              icon={Building2}
              options={departementOptions}
              value={filterDepartement}
              onChange={handleDeptChange}
            />

            <DateRangePicker
              dateDebut={dateDebut}
              dateFin={dateFin}
              onDateDebutChange={handleDateDebut}
              onDateFinChange={handleDateFin}
            />

            {filtered.length > 0 && (
              <span className="ml-auto text-[9px] font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {(['', 'ENTREE', 'SORTIE', 'AJUSTEMENT'] as const).map(t => (
              <FilterBadge
                key={t}
                label={t === '' ? 'Tous types' : TYPE_CONFIG[t].label}
                isActive={filterType === t && kpiFilter === ''}
                onClick={() => handleFilterType(t)}
              />
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {columns.map(col => (
                  <th
                    key={col.label}
                    onClick={col.sortable && col.field ? () => handleSort(col.field!) : undefined}
                    className={cn(
                      'px-2 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap',
                      col.class,
                      col.sortable && 'cursor-pointer hover:text-gray-600 select-none transition-colors'
                    )}
                  >
                    <span className="inline-flex items-center">
                      {col.label}
                      {col.sortable && col.field && <SortIcon field={col.field} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-[#1D6F42] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-400">Chargement des mouvements...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-400">Aucun mouvement trouvé</p>
                      <p className="text-xs text-gray-300">Modifiez vos critères de recherche ou de filtre.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(mvt => {
                  const cfg      = TYPE_CONFIG[mvt.type];
                  const isEntree = mvt.type === 'ENTREE';
                  const isSortie = mvt.type === 'SORTIE';

                  const sign = isEntree ? '+' : isSortie ? '-' : (mvt.stockApres > mvt.stockAvant ? '+' : '-');
                  const SignIcon = isEntree ? ArrowUp : isSortie ? ArrowDown : (mvt.stockApres > mvt.stockAvant ? ArrowUp : ArrowDown);

                  return (
                    <tr
                      key={mvt.id}
                      className="hover:bg-[#F1F8E9]/30 transition-colors group"
                    >
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <div className={cn('w-1 h-6 rounded-full flex-shrink-0', cfg.dotColor)} />
                          <div>
                            <div className="text-[11px] font-semibold text-gray-900 whitespace-nowrap">
                              {fmtDate(mvt.date)}
                            </div>
                            <div className="text-[9px] text-gray-400 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {fmtTime(mvt.date)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-2 py-2">
                        <TypePill type={mvt.type} />
                      </td>

                      <td className="px-2 py-2">
                        <span className="text-[10px] font-mono font-semibold text-[#0d3b66] whitespace-nowrap">
                          {mvt.codeUnique}
                        </span>
                      </td>

                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono font-semibold text-[#0d3b66] whitespace-nowrap">
                            {mvt.referenceDocument}
                          </span>
                          {mvt.motif && (
                            <span title={mvt.motif} className="cursor-help">
                              <Info className="w-3 h-3 text-amber-500 hover:text-amber-700" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-2 py-2 max-w-[180px]">
                        <div className="text-[10px] font-semibold text-gray-900 truncate">{mvt.designation}</div>
                        <div className="text-[9px] text-gray-400 font-mono mt-0.5">{mvt.codeArticle}</div>
                      </td>

                      <td className="px-2 py-2">
                        <div className={cn(
                          'inline-flex items-center gap-0.5 text-xs font-black whitespace-nowrap',
                          isEntree ? 'text-emerald-600' : isSortie ? 'text-orange-500' : 'text-violet-600'
                        )}>
                          <SignIcon className="w-3 h-3" />
                          {sign}{Math.abs(mvt.quantite)}
                        </div>
                      </td>

                      <td className="px-2 py-2">
                        <StockIndicator stockApres={mvt.stockApres} quantiteMin={mvt.quantiteMin} />
                      </td>

                      <td className="px-2 py-2 whitespace-nowrap text-right">
                        <span className="text-[10px] font-mono font-semibold text-gray-700">
                          {fmtNumber(mvt.pmpSnapshot)}
                        </span>
                      </td>

                      <td className="px-2 py-2 whitespace-nowrap text-right">
                        <span className={cn(
                          'text-[10px] font-black font-mono',
                          mvt.valeurFlux >= 0 ? 'text-emerald-600' : 'text-red-500'
                        )}>
                          {mvt.valeurFlux >= 0 ? '+' : ''}
                          {mvt.valeurFlux.toLocaleString('fr-MA', { maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="px-2 py-2">
                        <div className="text-[9px] text-gray-600 truncate max-w-[100px]">
                          {mvt.departement}
                        </div>
                      </td>

                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-[#E8F5E9] border border-[#1D6F42]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[7px] font-black text-[#1D6F42]">
                              {mvt.utilisateur.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-600 truncate max-w-[90px]">
                            {mvt.utilisateur}
                          </span>
                        </div>
                      </td>

                      {/* Bouton Détails (œil) */}
                      <td className="px-2 py-2">
                        <button
                          onClick={() => setDetailMvt(mvt)}
                          title="Voir les détails"
                          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1D6F42] hover:bg-[#E8F5E9] transition-colors border border-transparent hover:border-[#1D6F42]/20"
                          aria-label={`Détails ${mvt.referenceDocument}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* Bouton Vérification / Hash */}
                      <td className="px-2 py-2">
                        <button
                          onClick={() => handleOpenHashPopup(mvt)}
                          title="Vérifier l'intégrité et voir le hash"
                          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1D6F42] hover:bg-[#E8F5E9] transition-colors border border-transparent hover:border-[#1D6F42]/20"
                          aria-label={`Vérifier ${mvt.codeUnique}`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/40">
          <span className="text-[10px] text-gray-400">
            {filtered.length > 0
              ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)} sur ${filtered.length}`
              : '0 mouvement'}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Précédent"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {paginationRange().map((item, i) =>
              item === '...' ? (
                <span key={`ell-${i}`} className="w-6 h-6 flex items-center justify-center text-[9px] text-gray-400">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item as number)}
                  className={cn(
                    'w-6 h-6 rounded-md text-[10px] font-semibold transition-all',
                    page === item ? 'bg-[#1D6F42] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                  )}
                  aria-label={`Page ${item}`}
                  aria-current={page === item ? 'page' : undefined}
                >
                  {item}
                </button>
              )
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Suivant"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Composant Popup Hash + Vérification                               */
/* ------------------------------------------------------------------ */
function HashIntegriteDialog({
  mvt,
  data,
  loading,
  onClose,
}: {
  mvt: MouvementResponse;
  data: any;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#1D6F42]" />
            Empreinte & Intégrité
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mouvement</p>
            <p className="text-sm font-semibold text-gray-900">{mvt.codeUnique}</p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hash SHA‑256</p>
            <p className="text-xs font-mono text-gray-700 bg-gray-50 p-2 rounded-lg border break-all">
              {mvt.hashChaine || 'Indisponible'}
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Vérification en cours…
            </div>
          )}

          {data && !loading && (
            <div className={cn(
              'rounded-lg p-3 border',
              data.integrite ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {data.integrite ? (
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                )}
                <span className={cn(
                  'text-sm font-bold',
                  data.integrite ? 'text-green-700' : 'text-red-700'
                )}>
                  {data.integrite ? 'Mouvement intègre' : 'Mouvement altéré'}
                </span>
              </div>
              {!data.integrite && (
                <div className="space-y-1 text-xs">
                  <p className="text-gray-600">
                    <span className="font-semibold">Hash stocké :</span>{' '}
                    <span className="font-mono break-all">{data.hashStocke}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Hash recalculé :</span>{' '}
                    <span className="font-mono break-all">{data.hashCalcule}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Plus, Search, Eye, Edit, X, Download, FileSpreadsheet,
  FileText, RefreshCw, AlertTriangle, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, UploadCloud, Check, Info, Briefcase,
  Calendar, Clock, FileCheck, Package,
  XOctagon, BarChart3,
  Truck, Paperclip, FileDown, Eye as EyeIcon,
  CheckCircle2, FileInput,
  ChevronsUpDown, BookOpen,
} from 'lucide-react';
import {
  achatService,
  CommandeAchatResponse,
  CommandeAchatRequest,
  StatsCommandesResponse,
} from '@/services/achat.service';
import { catalogueService } from '@/services/catalogue.service';
import { fournisseurService } from '@/services/fournisseur.service';
import { tvaService } from '@/services/tva.service';
import type { Product } from '@/types/catalogue';
import type { Fournisseur } from '@/types/fournisseur';
import type { Tva } from '@/types/tva';

// ──────────────────────────── TYPES LOCAUX ────────────────────────────

type MethodeCommande = 'Marché Public' | 'Bon de Commande';
type StatutCommande = 'En cours' | 'Reçue' | 'Annulé';

interface LigneFormulaire {
  id: string;
  designation: string;
  codeArticle?: string;
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: number;
}

interface DocumentLocal {
  id: string;
  nom: string;
  type: 'BON_COMMANDE' | 'FACTURE' | 'BON_LIVRAISON' | 'AUTRE';
  dataUrl: string;
  dateAjout: string;
}

interface ProduitCatalogue {
  codeArticle: string;
  designation: string;
  prixUnitaireHT: number;
  tauxTVA: number;
  unite: string;
}

// ──────────────────────────── HELPERS ─────────────────────────

const calcLigneHT  = (l: LigneFormulaire) => l.quantite * l.prixUnitaireHT;
const calcLigneTTC = (l: LigneFormulaire) => calcLigneHT(l) * (1 + l.tauxTVA / 100);

const fmtNumber = (n: number) =>
  new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('fr-FR') : '—';

const toYMD = (d: Date) => d.toISOString().split('T')[0];

// ──────────────────── OUTILS EXPERTS (RADIX BYPASS) ────────────────────

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, cb]);
}

function getSmartPosition(triggerEl: HTMLElement, dropdownWidth: number) {
  const rect = triggerEl.getBoundingClientRect();
  const dialog = triggerEl.closest('[role="dialog"]');

  if (dialog) {
    const dRect = dialog.getBoundingClientRect();
    let left = rect.left - dRect.left;
    if (rect.left + dropdownWidth > window.innerWidth) {
      left -= ((rect.left + dropdownWidth) - window.innerWidth + 16);
    }
    return {
      target: dialog,
      style: { position: 'absolute' as const, top: rect.bottom - dRect.top + 4, left, width: rect.width }
    };
  } else {
    let left = rect.left;
    if (rect.left + dropdownWidth > window.innerWidth) {
      left -= ((rect.left + dropdownWidth) - window.innerWidth + 16);
    }
    return {
      target: document.body,
      style: { position: 'fixed' as const, top: rect.bottom + 4, left, width: rect.width }
    };
  }
}

// ── CustomSelect (Générique, avec Smart Portal) ───────────
function CustomSelect({
  value, onChange, options, placeholder = "Sélectionner...", className, buttonClassName, error
}: {
  value: string | number;
  onChange: (val: any) => void;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  className?: string; 
  buttonClassName?: string;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [portalConfig, setPortalConfig] = useState<{ target: Element, style: any } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const openDropdown = () => {
    if (triggerRef.current) {
      setPortalConfig(getSmartPosition(triggerRef.current, 150));
      setOpen(true);
    }
  };

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || placeholder;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        className={cn(
          'w-full flex items-center justify-between px-3 rounded-xl border font-medium bg-white transition-colors outline-none',
          error ? 'border-red-500' : 'border-gray-200 hover:border-[#1D6F42] focus:border-[#1D6F42]',
          value !== undefined && value !== '' ? 'text-gray-900' : 'text-gray-400',
          buttonClassName || 'h-9 text-sm'
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {open && portalConfig && createPortal(
        <div
          ref={dropdownRef}
          style={{ ...portalConfig.style, width: Math.max(portalConfig.style.width, 150), zIndex: 99999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto"
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                'w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-[#E8F5E9] transition-colors',
                String(value) === String(opt.value) ? 'font-bold text-[#1D6F42] bg-[#F1F8E9]' : 'text-gray-700'
              )}
            >
              <span className="truncate">{opt.label}</span>
              {String(value) === String(opt.value) && <Check className="w-3.5 h-3.5 text-[#1D6F42] flex-shrink-0" />}
            </button>
          ))}
        </div>,
        portalConfig.target
      )}
    </div>
  );
}

// ── FournisseurSelect (Réel, avec chargement asynchrone) ──────────────────────────────────
function FournisseurSelect({
  value, onChange, fournisseurs, error,
}: {
  value: string;
  onChange: (v: string) => void;
  fournisseurs: string[];
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [portalConfig, setPortalConfig] = useState<{ target: Element, style: any } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const openDropdown = () => {
    if (triggerRef.current) {
      setPortalConfig(getSmartPosition(triggerRef.current, 250));
      setOpen(true);
    }
  };

  const filtered = useMemo(
    () => fournisseurs.filter(f => f.toLowerCase().includes(query.toLowerCase())),
    [fournisseurs, query],
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        className={cn(
          'w-full flex items-center justify-between h-9 px-3 rounded-xl border text-sm font-medium bg-white transition-colors outline-none',
          error ? 'border-red-500' : 'border-gray-200 hover:border-[#1D6F42] focus:border-[#1D6F42]',
          value ? 'text-gray-900' : 'text-gray-400',
        )}
      >
        <span className="truncate">{value || 'Sélectionner un fournisseur…'}</span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
      </button>
      {error && <p className="text-xs text-red-500 font-bold mt-1">{error}</p>}

      {open && portalConfig && createPortal(
        <div
          ref={dropdownRef}
          style={{ ...portalConfig.style, width: Math.max(portalConfig.style.width, 250), zIndex: 99999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="p-2 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                placeholder="Rechercher un fournisseur…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full h-8 pl-7 pr-2 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-[#1D6F42]"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-gray-400 italic text-center">Aucun résultat</p>
            )}
            {filtered.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => { onChange(f); setOpen(false); setQuery(''); }}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-[#E8F5E9] transition-colors',
                  value === f ? 'font-bold text-[#1D6F42] bg-[#F1F8E9]' : 'text-gray-700',
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', value === f ? 'bg-[#1D6F42]' : 'bg-gray-300')} />
                {f}
              </button>
            ))}
          </div>
        </div>,
        portalConfig.target
      )}
    </div>
  );
}

// ── CataloguePickerRow (Données réelles) ───────────────────────────
function CataloguePickerRow({
  index,
  ligne,
  onUpdate,
  onRemove,
  canRemove,
  formErrors,
  produitsCatalogue,
  tvaOptions,
}: {
  index: number;
  ligne: LigneFormulaire;
  onUpdate: (field: keyof LigneFormulaire, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
  formErrors: Record<string, string>;
  produitsCatalogue: ProduitCatalogue[];
  tvaOptions: { value: number; label: string }[];
}) {
  const [catOpen, setCatOpen] = useState(false);
  const [catQuery, setCatQuery] = useState('');
  const [portalConfig, setPortalConfig] = useState<{ target: Element, style: any } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!catOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setCatOpen(false);
        setCatQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [catOpen]);

  const openDropdown = () => {
    if (triggerRef.current) {
      setPortalConfig(getSmartPosition(triggerRef.current, 320));
      setCatOpen(true);
    }
  };

  const filteredCat = useMemo(
    () => produitsCatalogue.filter(
      p =>
        p.designation.toLowerCase().includes(catQuery.toLowerCase()) ||
        p.codeArticle.toLowerCase().includes(catQuery.toLowerCase()),
    ),
    [catQuery, produitsCatalogue],
  );

  const totalHT  = calcLigneHT(ligne);
  const totalTTC = calcLigneTTC(ligne);

  const selectFromCatalog = (p: ProduitCatalogue) => {
    onUpdate('designation', p.designation);
    onUpdate('codeArticle', p.codeArticle);
    onUpdate('prixUnitaireHT', p.prixUnitaireHT);
    onUpdate('tauxTVA', p.tauxTVA);
    setCatOpen(false);
    setCatQuery('');
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50">
      <td className="px-3 py-2 min-w-[200px]">
        <div className="relative">
          <div className="flex gap-1">
            <input
              value={ligne.designation}
              onChange={e => onUpdate('designation', e.target.value)}
              placeholder="Désignation…"
              className={cn(
                'flex-1 h-8 px-2 text-xs border rounded-lg outline-none focus:border-[#1D6F42]',
                formErrors[`ligne-${index}-designation`] ? 'border-red-500' : 'border-gray-200',
              )}
            />
            <button
              ref={triggerRef}
              type="button"
              title="Choisir depuis le catalogue"
              onClick={openDropdown}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#E8F5E9] text-[#1D6F42] hover:bg-[#1D6F42] hover:text-white transition-colors border border-[#1D6F42]/30 flex-shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
          </div>
          {ligne.codeArticle && (
            <div className="text-[9px] text-gray-400 font-mono mt-0.5 pl-1">{ligne.codeArticle}</div>
          )}
          {formErrors[`ligne-${index}-designation`] && (
            <p className="text-[10px] text-red-500 mt-0.5">{formErrors[`ligne-${index}-designation`]}</p>
          )}
        </div>

        {catOpen && portalConfig && createPortal(
          <div
            ref={dropdownRef}
            style={{ ...portalConfig.style, width: 320, zIndex: 99999 }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-2 border-b border-gray-100 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  autoFocus
                  placeholder="Rechercher un produit du catalogue…"
                  value={catQuery}
                  onChange={e => setCatQuery(e.target.value)}
                  className="w-full h-8 pl-7 pr-2 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-[#1D6F42]"
                />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filteredCat.length === 0 && (
                <p className="px-3 py-3 text-xs text-gray-400 italic text-center">Aucun produit trouvé</p>
              )}
              {filteredCat.map(p => (
                <button
                  key={p.codeArticle}
                  type="button"
                  onClick={() => selectFromCatalog(p)}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-[#E8F5E9] transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-900">{p.designation}</div>
                      <div className="text-gray-400 font-mono text-[10px]">{p.codeArticle} · {p.unite}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-[#1D6F42]">{fmtNumber(p.prixUnitaireHT)}</div>
                      <div className="text-[9px] text-gray-400">TVA {p.tauxTVA}%</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>,
          portalConfig.target
        )}
      </td>

      <td className="px-2 py-2 w-20">
        <input
          type="number"
          min="0"
          value={ligne.quantite}
          onChange={e => onUpdate('quantite', Number(e.target.value))}
          className={cn(
            'w-full h-8 px-2 text-xs text-center border rounded-lg outline-none focus:border-[#1D6F42]',
            formErrors[`ligne-${index}-quantite`] ? 'border-red-500' : 'border-gray-200',
          )}
        />
      </td>

      <td className="px-2 py-2 w-32">
        <input
          type="number"
          min="0"
          step="any"
          value={ligne.prixUnitaireHT}
          onChange={e => onUpdate('prixUnitaireHT', Number(e.target.value))}
          className={cn(
            'w-full h-8 px-2 text-xs text-right font-mono border rounded-lg outline-none focus:border-[#1D6F42]',
            formErrors[`ligne-${index}-prix`] ? 'border-red-500' : 'border-gray-200',
          )}
        />
      </td>

      <td className="px-2 py-2 w-[85px]">
        <CustomSelect
          value={ligne.tauxTVA}
          onChange={(v) => onUpdate('tauxTVA', Number(v))}
          options={tvaOptions}
          buttonClassName="h-8 text-xs px-2"
        />
      </td>

      <td className="px-2 py-2 w-28 text-right">
        <span className="text-xs font-mono font-bold text-gray-700">{fmtNumber(totalHT)}</span>
      </td>

      <td className="px-2 py-2 w-28 text-right">
        <span className="text-xs font-mono font-bold text-[#1D6F42]">{fmtNumber(totalTTC)}</span>
      </td>

      <td className="px-2 py-2 w-10 text-center">
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
}

// ── DateRangePicker (Smart Portal) ────────────────────────────────────
function DateRangePicker({
  dateDebut, dateFin, onDebutChange, onFinChange,
}: {
  dateDebut: string;
  dateFin: string;
  onDebutChange: (v: string) => void;
  onFinChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [portalConfig, setPortalConfig] = useState<{ target: Element, style: any } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const hasFilter = !!(dateDebut || dateFin);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const openDropdown = () => {
    if (triggerRef.current) {
      setPortalConfig(getSmartPosition(triggerRef.current, 300));
      setOpen(true);
    }
  };

  const applyPreset = (preset: string) => {
    const now = new Date();
    let start = '';
    let end = '';
    switch (preset) {
      case 'thisWeek': {
        const dow = now.getDay();
        const mon = new Date(now); mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        start = toYMD(mon); end = toYMD(sun); break;
      }
      case 'thisMonth':
        start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        end = toYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0)); break;
      case 'thisYear':
        start = `${now.getFullYear()}-01-01`; end = toYMD(now); break;
      case 'lastYear':
        start = `${now.getFullYear() - 1}-01-01`; end = `${now.getFullYear() - 1}-12-31`; break;
      default: break;
    }
    onDebutChange(start); onFinChange(end);
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
        onClick={() => open ? setOpen(false) : openDropdown()}
        className={cn(
          'flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-medium transition-all whitespace-nowrap outline-none',
          hasFilter
            ? 'border-[#1D6F42] bg-[#E8F5E9] text-[#1D6F42]'
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
        )}
      >
        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="max-w-[130px] truncate">{label}</span>
        <ChevronsUpDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
      </button>

      {open && portalConfig && createPortal(
        <div
          ref={dropdownRef}
          style={{ ...portalConfig.style, width: 300, zIndex: 99999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl p-3 space-y-3"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Filtrer par période</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ['Cette semaine', 'thisWeek'],
              ['Ce mois', 'thisMonth'],
              ['Cette année', 'thisYear'],
              ['Année dernière', 'lastYear'],
            ].map(([lbl, key]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className="px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-[10px] font-medium text-gray-600 hover:bg-[#E8F5E9] hover:border-[#1D6F42]/40 hover:text-[#1D6F42] transition-colors"
              >
                {lbl}
              </button>
            ))}
          </div>
          <div className="space-y-2 border-t border-gray-100 pt-2">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500">Date début</label>
              <input type="date" value={dateDebut} onChange={e => onDebutChange(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#1D6F42]" />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500">Date fin</label>
              <input type="date" value={dateFin} min={dateDebut} onChange={e => onFinChange(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#1D6F42]" />
            </div>
          </div>
          {hasFilter && (
            <button
              type="button"
              onClick={() => { onDebutChange(''); onFinChange(''); setOpen(false); }}
              className="w-full flex items-center justify-center gap-1.5 h-7 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
            >
              <X className="w-3 h-3" /> Effacer la période
            </button>
          )}
        </div>,
        portalConfig.target
      )}
    </div>
  );
}

// ── ExportMenu ─────────────────────────────────────────────────────────────────
function ExportMenu({
  onCSV, onExcel, onPDF, onCSVSynth, onExcelSynth, onPDFSynth, disabled,
}: {
  onCSV: () => void;
  onExcel: () => void;
  onPDF: () => Promise<void>;
  onCSVSynth: () => void;
  onExcelSynth: () => void;
  onPDFSynth: () => Promise<void>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfSynthLoading, setPdfSynthLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await onPDF(); } finally { setPdfLoading(false); setOpen(false); }
  };

  const handlePDFSynth = async () => {
    setPdfSynthLoading(true);
    try { await onPDFSynth(); } finally { setPdfSynthLoading(false); setOpen(false); }
  };

  return (
    <div ref={ref} className="relative">
      <Button
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        variant="outline"
        className="h-9 gap-2 rounded-xl border-2 border-gray-200 font-bold text-sm bg-white text-gray-700 hover:bg-[#E8F5E9] hover:border-[#1D6F42] hover:text-[#1D6F42]"
      >
        <Download className="w-4 h-4" /> Exporter
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </Button>
      {open && !disabled && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">Détaillé</div>
          <button onClick={() => { onCSV(); setOpen(false); }}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 font-medium">
            <FileDown className="w-4 h-4 text-green-600" /> CSV détaillé
          </button>
          <button onClick={() => { onExcel(); setOpen(false); }}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 font-medium">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> Excel détaillé
          </button>
          <button disabled={pdfLoading} onClick={handlePDF}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 font-medium disabled:opacity-50">
            {pdfLoading ? <RefreshCw className="w-4 h-4 text-red-600 animate-spin" /> : <FileText className="w-4 h-4 text-red-600" />}
            {pdfLoading ? 'Génération…' : 'PDF détaillé'}
          </button>
          <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-gray-400 border-t border-gray-100 border-b border-gray-100">Synthétique</div>
          <button onClick={() => { onCSVSynth(); setOpen(false); }}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 font-medium">
            <FileDown className="w-4 h-4 text-green-600" /> CSV synthétique
          </button>
          <button onClick={() => { onExcelSynth(); setOpen(false); }}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 font-medium">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> Excel synthétique
          </button>
          <button disabled={pdfSynthLoading} onClick={handlePDFSynth}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 font-medium disabled:opacity-50">
            {pdfSynthLoading ? <RefreshCw className="w-4 h-4 text-red-600 animate-spin" /> : <FileText className="w-4 h-4 text-red-600" />}
            {pdfSynthLoading ? 'Génération…' : 'PDF synthétique'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Badges visuels ──────────────────────────────────────────────────────────
const getStatutBadge = (statut: string) => {
  if (statut === 'RECUE' || statut === 'Reçue') return <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-emerald-50 border-emerald-200 text-emerald-700"><Truck className="w-3 h-3"/>Reçue</span>;
  if (statut === 'EN_COURS' || statut === 'En cours') return <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-amber-50 border-amber-200 text-amber-700"><Clock className="w-3 h-3"/>En cours</span>;
  if (statut === 'ANNULEE' || statut === 'Annulé') return <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-gray-100 border-gray-200 text-gray-500"><XOctagon className="w-3 h-3"/>Annulé</span>;
  return null;
};

const getMethodeBadge = (methode: string) => {
  if (methode === 'MARCHE_PUBLIC' || methode === 'Marché Public')
    return <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-violet-50 border-violet-200 text-violet-700"><FileCheck className="w-3 h-3"/>Marché public</span>;
  return <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-sky-50 border-sky-200 text-sky-700"><FileText className="w-3 h-3"/>Bon de commande</span>;
};

// ─── KpiCard ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, colorBg, colorText, isActive, onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  colorBg: string;
  colorText: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group bg-white rounded-2xl border-2 p-4 hover:shadow-lg transition-all duration-200 text-left w-full',
        isActive
          ? 'border-[#1D6F42] ring-2 ring-[#1D6F42]/20 shadow-md'
          : 'border-gray-100 hover:border-gray-200',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105', colorBg)}>
          <Icon className={cn('w-5 h-5', colorText)} />
        </div>
        {isActive && (
          <div className="w-4 h-4 rounded-full bg-[#1D6F42] flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-[11px] font-medium text-gray-500">{label}</div>
      {sub && <div className="text-[9px] text-gray-400 mt-0.5 font-mono">{sub}</div>}
    </button>
  );
}

// ─── DocumentsJointsSection ───────────────────────────────────────────────────
const DOC_TYPE_LABELS: Record<string, string> = {
  BON_COMMANDE: 'Bon de commande',
  FACTURE: 'Facture',
  BON_LIVRAISON: 'Bon de livraison',
  AUTRE: 'Autre',
};
const DOC_TYPE_COLORS: Record<string, string> = {
  BON_COMMANDE: 'bg-violet-50 text-violet-700 border-violet-200',
  FACTURE: 'bg-amber-50 text-amber-700 border-amber-200',
  BON_LIVRAISON: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  AUTRE: 'bg-gray-100 text-gray-600 border-gray-200',
};

function DocumentsJointsSection({
  documents,
  onChange,
  readonly = false,
}: {
  documents: DocumentLocal[];
  onChange?: (docs: DocumentLocal[]) => void;
  readonly?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingType, setPendingType] = useState<string>('BON_COMMANDE');
  const [viewDoc, setViewDoc] = useState<DocumentLocal | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onChange) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const newDoc: DocumentLocal = {
        id: `doc-${Date.now()}`,
        nom: file.name,
        type: pendingType as DocumentLocal['type'],
        dataUrl: ev.target?.result as string,
        dateAjout: new Date().toISOString(),
      };
      onChange([...documents, newDoc]);
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeDoc = (id: string) => onChange && onChange(documents.filter(d => d.id !== id));

  return (
    <div className="space-y-3">
      {!readonly && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-40">
            <CustomSelect
              value={pendingType}
              onChange={(v) => setPendingType(v as string)}
              options={Object.keys(DOC_TYPE_LABELS).map(t => ({ value: t, label: DOC_TYPE_LABELS[t] }))}
              buttonClassName="h-8 text-xs px-2"
            />
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#E8F5E9] text-[#1D6F42] text-xs font-bold border border-[#1D6F42]/30 hover:bg-[#1D6F42] hover:text-white transition-colors"
          >
            <Paperclip className="w-3.5 h-3.5" /> Joindre un fichier
          </button>
          <input ref={fileRef} type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFile} />
          <span className="text-[10px] text-gray-400">PDF, image — max 10 Mo</span>
        </div>
      )}

      {documents.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-2">Aucun document joint.</p>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{doc.nom}</div>
                  <div className="text-[10px] text-gray-400">{new Date(doc.dateAjout).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', DOC_TYPE_COLORS[doc.type] || 'bg-gray-100 text-gray-600 border-gray-200')}>
                  {DOC_TYPE_LABELS[doc.type] || doc.type}
                </span>
                <button
                  type="button"
                  onClick={() => setViewDoc(doc)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#E8F5E9] text-gray-400 hover:text-[#1D6F42] transition-colors"
                  title="Consulter"
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                </button>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeDoc(doc.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setViewDoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-bold text-gray-800 truncate">{viewDoc.nom}</span>
              <button onClick={() => setViewDoc(null)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-800 min-h-[400px]">
              {viewDoc.dataUrl.startsWith('data:application/pdf') ? (
                <iframe src={viewDoc.dataUrl} className="w-full h-[500px] rounded-lg border border-gray-300" />
              ) : (
                <img src={viewDoc.dataUrl} alt={viewDoc.nom} className="max-w-full max-h-[500px] object-contain rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Annulation dialog ───────────────────────────────────────────────────────
function AnnulationDialog({
  open, onClose, onConfirm, reference,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (motif: string) => void;
  reference: string;
}) {
  const [motif, setMotif] = useState('');
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl border-amber-100 [&>button.absolute]:hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Annuler la commande</DialogTitle>
        <DialogHeader>
          <DialogTitle className="text-amber-700 font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Annuler la commande {reference}
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            La commande passera au statut « Annulé » pour traçabilité. Cette action ne peut pas être défaite.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Motif d'annulation (obligatoire)…"
          value={motif}
          onChange={e => setMotif(e.target.value)}
          className="min-h-[90px] rounded-xl border-gray-300 resize-none mt-2"
        />
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Fermer</Button>
          <Button
            disabled={!motif.trim()}
            className="rounded-xl bg-amber-600 text-white hover:bg-amber-700"
            onClick={() => { onConfirm(motif); setMotif(''); }}
          >
            <XOctagon className="w-4 h-4 mr-2" /> Confirmer l'annulation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Confirmation livraison dialog ─────────────
function ConfirmationLivraisonDialog({
  open, onClose, onConfirm, reference,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reference: string;
}) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl border-emerald-100 [&>button.absolute]:hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Confirmer la reception</DialogTitle>
        <DialogHeader>
          <DialogTitle className="text-emerald-700 font-bold flex items-center gap-2">
            <Truck className="w-5 h-5" /> Marquer comme reçue — {reference}
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Cette action modifiera le statut en « Reçue ».
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Annuler</Button>
          <Button className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={onConfirm}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmer la réception
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Import infos dialog ────────────────────────
function ImportInfoDialog({
  open,
  onClose,
  onBack,
  onDownloadDetail,
}: {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onDownloadDetail: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[85vh] flex flex-col p-0 [&>button.absolute]:hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Structure import</DialogTitle>
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Structure du fichier d'import (CSV / Excel) – Format détaillé</h2>
          <p className="text-xs text-gray-500 mt-1">Le fichier doit obligatoirement contenir la colonne <strong>designation_ligne</strong>.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Colonne', 'Nom champ', 'Type', 'Obligatoire', 'Exemple / Note'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-[#E8F5E9]"><td colSpan={5} className="px-3 py-2 font-bold text-[#1D6F42] text-xs">Format Détaillé (une ligne par article) :</td></tr>
                {[
                  ['A', 'description',      'Texte',   'Non', 'Description de la commande'],
                  ['B', 'objet_marche',      'Texte',   'Non', 'Objet du marché public'],
                  ['C', 'fournisseur',       'Texte',   'Oui', 'TechSupply SARL'],
                  ['D', 'methode',           'Texte',   'Oui', 'Marché Public | Bon de Commande'],
                  ['E', 'numero_marche',     'Texte',   'Non', 'AO-14/2026/ME'],
                  ['F', 'montant_marche',    'Nombre',  'Non', '8500000'],
                  ['G', 'date_commande',     'Date',    'Non', 'AAAA-MM-JJ'],
                  ['H', 'statut',            'Texte',   'Non', 'En cours | Reçue | Annulé'],
                  ['I', 'code_article',      'Texte',   'Non', 'USB-001'],
                  ['J', 'designation_ligne', 'Texte',   'Oui', 'Adaptateur USB-C Hub'],
                  ['K', 'quantite',          'Nombre',  'Oui', '20'],
                  ['L', 'prix_unitaire_ht',  'Nombre',  'Oui', '150.00'],
                  ['M', 'taux_tva',          'Nombre',  'Oui', '20'],
                ].map(([col, field, type, req, note]) => (
                  <tr key={col} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-mono font-bold text-[#1D6F42]">{col}</td>
                    <td className="px-3 py-2 font-mono text-gray-700">{field}</td>
                    <td className="px-3 py-2 text-gray-600">{type}</td>
                    <td className="px-3 py-2 text-center">
                      {req === 'Oui' ? <span className="text-red-600 font-bold">Oui</span> : <span className="text-gray-400">Non</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-500 italic">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-2"><Info className="w-4 h-4" /> Règles</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
              <li>Seul le format <strong>détaillé</strong> est accepté. La colonne <strong>designation_ligne</strong> est obligatoire.</li>
              <li>Les commandes sont regroupées par <strong>fournisseur</strong>.</li>
              <li>Encodage <strong>UTF-8 avec BOM</strong> pour CSV.</li>
            </ul>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-between rounded-b-2xl bg-gray-50">
          <Button onClick={onDownloadDetail} variant="outline" className="rounded-xl gap-2">
            <Download className="w-4 h-4" /> Télécharger le modèle
          </Button>
          <div className="flex gap-2">
            <Button onClick={onBack} variant="outline" className="rounded-xl">Retour</Button>
            <Button onClick={onClose} variant="outline" className="rounded-xl">Fermer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function AchatsEtCommandesPage() {
  // Données réelles
  const [commandes, setCommandes] = useState<CommandeAchatResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState<StatsCommandesResponse>({
    total: 0, enCours: 0, recues: 0, annulees: 0,
    nbMarchePublic: 0, nbBonCommande: 0,
    montantEnCours: 0, montantRecues: 0,
  });

  // Données de référence dynamiques
  const [fournisseursList, setFournisseursList] = useState<string[]>([]);
  const [produitsCatalogue, setProduitsCatalogue] = useState<ProduitCatalogue[]>([]);
  const [tvaOptions, setTvaOptions] = useState<{ value: number; label: string }[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Chargement initial des données de référence
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [fournisseursRes, produitsRes, tvasRes] = await Promise.all([
          fournisseurService.getAll(),
          catalogueService.getAll({ page: 0, size: 10000, sort: 'designation', direction: 'asc' }),
          tvaService.getAll(),
        ]);
        // Filtrer les fournisseurs actifs uniquement
        setFournisseursList(
          fournisseursRes
            .filter(f => f.actif)
            .map(f => f.raisonSociale)
            .filter(Boolean)
            .sort()
        );
        setProduitsCatalogue(
          produitsRes.content.map(p => ({
            codeArticle: p.code,
            designation: p.name,
            prixUnitaireHT: p.avgPrice ?? 0,
            tauxTVA: 20, // TVA par défaut, à affiner si dispo dans le produit
            unite: 'Pcs',
          }))
        );
        // Filtrer les TVA actives uniquement
        setTvaOptions(
          tvasRes
            .filter(t => t.actif)
            .map(t => ({ value: t.taux, label: `${t.taux}%` }))
        );
      } catch (err) {
        toast.error('Erreur lors du chargement des référentiels');
      } finally {
        setLoadingRefs(false);
      }
    };
    loadRefs();
  }, []);

  // Filtres
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('all');
  const [methodeFilter, setMethodeFilter] = useState<string>('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [kpiFilter, setKpiFilter] = useState<string>('all');

  // Pagination / tri
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const perPage = 10;

  // Modals
  const [detailCmd, setDetailCmd] = useState<CommandeAchatResponse | null>(null);
  const [editCmd, setEditCmd] = useState<CommandeAchatResponse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [annulationId, setAnnulationId] = useState<number | null>(null);
  const [livraisonId, setLivraisonId] = useState<number | null>(null);
  const [importInfoOpen, setImportInfoOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // Formulaire
  const [form, setForm] = useState<{
    description?: string;
    objetMarche?: string;
    fournisseur: string;
    methode: string;
    numeroMarche?: string;
    montantMarche?: number;
    dateCommande?: string;
    statut?: string;
    lignes: LigneFormulaire[];
    documents: DocumentLocal[];
  }>({
    fournisseur: '',
    methode: 'Bon de Commande',
    lignes: [{ id: `tmp-${Date.now()}`, designation: '', quantite: 1, prixUnitaireHT: 0, tauxTVA: 20 }],
    documents: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ─── Chargement des statistiques globales ──────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const stats = await achatService.getStats();
      setGlobalStats(stats);
    } catch (err) {
      console.error('Erreur chargement stats', err);
    }
  }, []);

  // ─── Chargement de la liste paginée et filtrée ────────────────────
  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: page - 1,
        size: perPage,
        sort: sortKey,
        direction: sortDir,
      };
      if (search) params.search = search;
      if (statutFilter !== 'all') {
        if (statutFilter === 'En cours') params.statut = 'EN_COURS';
        else if (statutFilter === 'Reçue') params.statut = 'RECUE';
        else if (statutFilter === 'Annulé') params.statut = 'ANNULEE';
      }
      if (methodeFilter !== 'all') {
        params.methode = methodeFilter === 'Marché Public' ? 'MARCHE_PUBLIC' : 'BON_COMMANDE';
      }
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;

      const res = await achatService.getAll(params);
      setTotalElements(res.totalElements);
      let data: CommandeAchatResponse[] = res.content;
      if (kpiFilter === 'enCours') data = data.filter(c => c.statut === 'EN_COURS');
      else if (kpiFilter === 'livres') data = data.filter(c => c.statut === 'RECUE');
      else if (kpiFilter === 'marche') data = data.filter(c => c.methode === 'MARCHE_PUBLIC');
      else if (kpiFilter === 'bc') data = data.filter(c => c.methode === 'BON_COMMANDE');
      setCommandes(data);
    } catch (err: any) {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  }, [page, perPage, sortKey, sortDir, search, statutFilter, methodeFilter, dateDebut, dateFin, kpiFilter]);

  useEffect(() => {
    fetchCommandes();
    fetchStats();
  }, [fetchCommandes, fetchStats]);

  useEffect(() => {
    setPage(1);
  }, [search, statutFilter, methodeFilter, kpiFilter, dateDebut, dateFin]);

  const handleSort = (k: string) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
    setPage(1);
  };

  const SortIcon = ({ k }: { k: string }) => (
    <span className="ml-0.5 inline-flex">
      {sortKey === k
        ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[#1D6F42]" /> : <ChevronDown className="w-3 h-3 text-[#1D6F42]" />
        : <ChevronsUpDown className="w-3 h-3 text-gray-300" />}
    </span>
  );

  const newLigne = (): LigneFormulaire => ({
    id: `tmp-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
    designation: '', quantite: 1, prixUnitaireHT: 0, tauxTVA: 20,
  });

  const openForm = (cmd?: CommandeAchatResponse) => {
    setFormErrors({});
    if (cmd) {
      setEditCmd(cmd);
      setForm({
        description: cmd.description,
        objetMarche: cmd.objetMarche,
        fournisseur: cmd.fournisseur,
        methode: cmd.methode === 'MARCHE_PUBLIC' ? 'Marché Public' : 'Bon de Commande',
        numeroMarche: cmd.numeroMarche,
        montantMarche: cmd.montantMarche,
        dateCommande: cmd.dateCommande,
        statut: cmd.statut === 'EN_COURS' ? 'En cours' : cmd.statut === 'RECUE' ? 'Reçue' : undefined,
        lignes: cmd.lignes.map(l => ({
          id: `edit-${l.id}`,
          codeArticle: l.codeArticle,
          designation: l.designation,
          quantite: l.quantite,
          prixUnitaireHT: l.prixUnitaireHT,
          tauxTVA: l.tauxTVA,
        })),
        documents: cmd.documents.map(d => ({
          id: `doc-${d.id}`,
          nom: d.nom,
          type: d.type as DocumentLocal['type'],
          dataUrl: d.dataUrl,
          dateAjout: d.dateAjout,
        })),
      });
    } else {
      setEditCmd(null);
      setForm({
        description: '',
        objetMarche: '',
        fournisseur: '',
        methode: 'Bon de Commande',
        numeroMarche: '',
        montantMarche: undefined,
        lignes: [newLigne()],
        statut: 'En cours',
        documents: [],
      });
    }
    setFormOpen(true);
  };

  const realTimeErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!form.fournisseur?.trim()) errs.fournisseur = 'Fournisseur obligatoire';
    if (form.methode === 'Marché Public' && !form.numeroMarche?.trim())
      errs.numeroMarche = 'N° marché public obligatoire';
    (form.lignes || []).forEach((l, i) => {
      if (!l.designation.trim()) errs[`ligne-${i}-designation`] = 'Requis';
      if (l.quantite <= 0) errs[`ligne-${i}-quantite`] = '> 0';
      if (l.prixUnitaireHT <= 0) errs[`ligne-${i}-prix`] = '> 0';
    });
    if ((form.lignes || []).length === 0) errs.lignes = 'Au moins une ligne';
    return errs;
  }, [form]);

  useEffect(() => {
    setFormErrors(realTimeErrors);
  }, [realTimeErrors]);

  const saveForm = async () => {
    if (Object.keys(realTimeErrors).length > 0) {
      toast.error('Corrigez les erreurs avant d’enregistrer.');
      return;
    }

    const payload: CommandeAchatRequest = {
      description: form.description,
      objetMarche: form.objetMarche,
      fournisseur: form.fournisseur.trim(),
      methode: form.methode === 'Marché Public' ? 'MARCHE_PUBLIC' : 'BON_COMMANDE',
      numeroMarche: form.methode === 'Marché Public' ? form.numeroMarche : undefined,
      montantMarche: form.methode === 'Marché Public' ? form.montantMarche : undefined,
      dateCommande: form.dateCommande || undefined,
      statut: form.statut === 'Reçue' ? 'RECUE' : 'EN_COURS',
      lignes: form.lignes.map(l => ({
        codeArticle: l.codeArticle,
        designation: l.designation.trim(),
        quantite: l.quantite,
        prixUnitaireHT: l.prixUnitaireHT,
        tauxTVA: l.tauxTVA,
      })),
      documents: form.documents.map(d => ({
        nom: d.nom,
        type: d.type,
        dataUrl: d.dataUrl,
      })),
    };

    try {
      if (editCmd) {
        await achatService.update(editCmd.id, payload);
        toast.success('Commande mise à jour.');
      } else {
        await achatService.create(payload);
        toast.success('Commande créée.');
      }
      setFormOpen(false);
      fetchCommandes();
      fetchStats();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur lors de l\'enregistrement';
      toast.error(message);
    }
  };

  const confirmAnnulation = async (motif: string) => {
    if (!annulationId) return;
    try {
      await achatService.annuler(annulationId, motif);
      toast.success('Commande annulée (traçabilité conservée).');
      setAnnulationId(null);
      fetchCommandes();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  };

  const marquerLivre = async () => {
    if (!livraisonId) return;
    try {
      await achatService.recevoir(livraisonId);
      toast.success('Commande marquée comme reçue.');
      setLivraisonId(null);
      fetchCommandes();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la réception');
    }
  };

  const handleImportFile = async (file: File) => {
    setImportLoading(true);
    try {
      await achatService.importFile(file);
      toast.success('Import terminé');
      setShowImportModal(false);
      fetchCommandes();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Erreur d\'import');
    } finally {
      setImportLoading(false);
    }
  };

  // Exports (identiques, utilisant commandes)
  const handleExportCSV = useCallback(() => {
    if (commandes.length === 0) return;
    const BOM = '\uFEFF';
    const escape = (v: unknown) => { const s = String(v ?? '').replace(/"/g, '""'); return /[",\n\r]/.test(s) ? `"${s}"` : s; };
    const headers = ['Réf Cde', 'Description Cde', 'Objet Marché', 'Fournisseur', 'Méthode', 'N° Marché', 'Date Cde', 'Statut', 'Code Article', 'Désignation Article', 'Qté', 'PU HT', 'TVA', 'Total HT ligne', 'Total TTC ligne'];
    const rows: string[] = [];
    commandes.forEach(c =>
      c.lignes.forEach(l => {
        rows.push(
          [c.reference, c.description||'', c.objetMarche||'', c.fournisseur, c.methode === 'MARCHE_PUBLIC' ? 'Marché Public' : 'Bon de Commande',
           c.numeroMarche||'', c.dateCommande||'', c.statut === 'EN_COURS' ? 'En cours' : c.statut === 'RECUE' ? 'Reçue' : 'Annulé',
           l.codeArticle||'', l.designation, l.quantite, l.prixUnitaireHT, l.tauxTVA,
           (l.quantite * l.prixUnitaireHT).toFixed(2), ((l.quantite * l.prixUnitaireHT) * (1 + l.tauxTVA / 100)).toFixed(2),
          ].map(escape).join(',')
        );
      })
    );
    const content = [headers.map(escape).join(','), ...rows].join('\r\n');
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `commandes_detail_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [commandes]);

  const handleExportExcel = useCallback(async () => {
    if (commandes.length === 0) return;
    const XLSX = await import('xlsx');
    const rows: any[] = [];
    commandes.forEach(c =>
      c.lignes.forEach(l => {
        rows.push({
          'Réf Cde': c.reference,
          'Description Cde': c.description || '',
          'Objet Marché': c.objetMarche || '',
          Fournisseur: c.fournisseur,
          Méthode: c.methode === 'MARCHE_PUBLIC' ? 'Marché Public' : 'Bon de Commande',
          'N° Marché': c.numeroMarche || '',
          'Date Cde': c.dateCommande ? fmtDate(c.dateCommande) : '',
          Statut: c.statut === 'EN_COURS' ? 'En cours' : c.statut === 'RECUE' ? 'Reçue' : 'Annulé',
          'Code Article': l.codeArticle || '',
          'Désignation Article': l.designation,
          Qté: l.quantite,
          'PU HT': l.prixUnitaireHT,
          TVA: l.tauxTVA,
          'Total HT ligne': l.quantite * l.prixUnitaireHT,
          'Total TTC ligne': (l.quantite * l.prixUnitaireHT) * (1 + l.tauxTVA / 100),
        });
      })
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commandes détail');
    XLSX.writeFile(wb, `commandes_detail_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [commandes]);

  const handleExportPDF = useCallback(async (): Promise<void> => {
    if (commandes.length === 0) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const logoUrl = '/images/alomrane-logo.png';
    let logoDataUrl = '';
    try {
      const img = new Image(); img.src = logoUrl;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      logoDataUrl = canvas.toDataURL('image/png');
    } catch (e) {}
    const addHeaderFooter = (currentPage: number, totalPages: number) => {
      if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', margin, 5, 18, 14);
      doc.setFontSize(18); doc.setTextColor(27, 94, 32); doc.setFont('helvetica', 'bold');
      doc.text('AL OMRANE - SOUSS MASSA', logoDataUrl ? margin + 22 : margin, 14);
      doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal');
      doc.text('Achats & Commandes — Liste détaillée', logoDataUrl ? margin + 22 : margin, 20);
      doc.setFontSize(8);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, margin, 26);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 30, pageWidth - margin, 30);
      const footerY = doc.internal.pageSize.getHeight() - 10;
      doc.setFontSize(7); doc.setTextColor(150, 150, 150);
      doc.text(`Document confidentiel - Page ${currentPage} / ${totalPages}`, margin, footerY);
      doc.text('Al Omrane - Tous droits réservés', pageWidth - margin - 40, footerY, { align: 'right' });
    };
    const headers = ['Réf Cde', 'Description', 'Fournisseur', 'Code Article', 'Désignation', 'Qté', 'PU HT', 'TVA', 'Total HT', 'Total TTC'];
    const data: any[][] = [];
    commandes.forEach(c =>
      c.lignes.forEach(l => {
        data.push([
          c.reference, c.description || '', c.fournisseur,
          l.codeArticle || '', l.designation, l.quantite,
          fmtNumber(l.prixUnitaireHT), `${l.tauxTVA}%`,
          fmtNumber(l.quantite * l.prixUnitaireHT),
          fmtNumber((l.quantite * l.prixUnitaireHT) * (1 + l.tauxTVA / 100)),
        ]);
      })
    );
    autoTable(doc, {
      head: [headers], body: data, startY: 35,
      margin: { top: 35, left: margin, right: margin, bottom: 20 },
      styles: { fontSize: 7, cellPadding: 2, valign: 'middle', halign: 'left', textColor: [50, 50, 50], lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: [27, 94, 32], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: (data) => addHeaderFooter(data.pageNumber, doc.getNumberOfPages()),
    });
    doc.save(`commandes_detail_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF détaillé exporté');
  }, [commandes]);

  const handleExportCSVSynth = useCallback(() => {
    if (commandes.length === 0) return;
    const BOM = '\uFEFF';
    const escape = (v: unknown) => { const s = String(v ?? '').replace(/"/g, '""'); return /[",\n\r]/.test(s) ? `"${s}"` : s; };
    const headers = ['Réf Cde', 'Description', 'Objet Marché', 'Fournisseur', 'Méthode', 'N° Marché', 'Date Cde', 'Statut', 'Total HT', 'Total TTC'];
    const rows = commandes.map(c =>
      [c.reference, c.description||'', c.objetMarche||'', c.fournisseur, c.methode === 'MARCHE_PUBLIC' ? 'Marché Public' : 'Bon de Commande',
       c.numeroMarche||'', c.dateCommande||'', c.statut === 'EN_COURS' ? 'En cours' : c.statut === 'RECUE' ? 'Reçue' : 'Annulé',
       c.montantHT.toFixed(2), c.montantTTC.toFixed(2),
      ].map(escape).join(',')
    );
    const content = [headers.map(escape).join(','), ...rows].join('\r\n');
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `commandes_synthese_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [commandes]);

  const handleExportExcelSynth = useCallback(async () => {
    if (commandes.length === 0) return;
    const XLSX = await import('xlsx');
    const rows = commandes.map(c => ({
      'Réf Cde': c.reference,
      'Description': c.description || '',
      'Objet Marché': c.objetMarche || '',
      Fournisseur: c.fournisseur,
      Méthode: c.methode === 'MARCHE_PUBLIC' ? 'Marché Public' : 'Bon de Commande',
      'N° Marché': c.numeroMarche || '',
      'Date Cde': c.dateCommande ? fmtDate(c.dateCommande) : '',
      Statut: c.statut === 'EN_COURS' ? 'En cours' : c.statut === 'RECUE' ? 'Reçue' : 'Annulé',
      'Total HT': c.montantHT,
      'Total TTC': c.montantTTC,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Synthèse commandes');
    XLSX.writeFile(wb, `commandes_synthese_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [commandes]);

  const handleExportPDFSynth = useCallback(async (): Promise<void> => {
    if (commandes.length === 0) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const logoUrl = '/images/alomrane-logo.png';
    let logoDataUrl = '';
    try {
      const img = new Image(); img.src = logoUrl;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      logoDataUrl = canvas.toDataURL('image/png');
    } catch (e) {}
    const addHeaderFooter = (currentPage: number, totalPages: number) => {
      if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', margin, 5, 18, 14);
      doc.setFontSize(18); doc.setTextColor(27, 94, 32); doc.setFont('helvetica', 'bold');
      doc.text('AL OMRANE - SOUSS MASSA', logoDataUrl ? margin + 22 : margin, 14);
      doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal');
      doc.text('Achats & Commandes — Synthèse', logoDataUrl ? margin + 22 : margin, 20);
      doc.setFontSize(8);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, margin, 26);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, 30, pageWidth - margin, 30);
      const footerY = doc.internal.pageSize.getHeight() - 10;
      doc.setFontSize(7); doc.setTextColor(150, 150, 150);
      doc.text(`Document confidentiel - Page ${currentPage} / ${totalPages}`, margin, footerY);
      doc.text('Al Omrane - Tous droits réservés', pageWidth - margin - 40, footerY, { align: 'right' });
    };
    const headers = ['Réf Cde', 'Description', 'Fournisseur', 'Méthode', 'N° Marché', 'Date', 'Statut', 'Total HT', 'Total TTC'];
    const data = commandes.map(c => [
      c.reference, c.description || '', c.fournisseur, c.methode === 'MARCHE_PUBLIC' ? 'Marché Public' : 'Bon de Commande',
      c.numeroMarche || '', c.dateCommande ? fmtDate(c.dateCommande) : '', c.statut === 'EN_COURS' ? 'En cours' : c.statut === 'RECUE' ? 'Reçue' : 'Annulé',
      fmtNumber(c.montantHT), fmtNumber(c.montantTTC),
    ]);
    autoTable(doc, {
      head: [headers], body: data, startY: 35,
      margin: { top: 35, left: margin, right: margin, bottom: 20 },
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle', halign: 'left', textColor: [50, 50, 50], lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: [27, 94, 32], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: (data) => addHeaderFooter(data.pageNumber, doc.getNumberOfPages()),
    });
    doc.save(`commandes_synthese_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF synthétique exporté');
  }, [commandes]);

  const downloadDetailModel = useCallback(() => {
    const headers = 'description,objet_marche,fournisseur,methode,numero_marche,montant_marche,date_commande,statut,code_article,designation_ligne,quantite,prix_unitaire_ht,taux_tva';
    const rows = [
      'Matériel info,,TechSupply SARL,Marché Public,AO-14/2026/ME,8500000,2026-06-10,En cours,DLL-LAP,Ordinateur portable Dell,10,15000,20',
      ',TechSupply SARL,Marché Public,AO-14/2026/ME,8500000,2026-06-10,En cours,LCD-24,Écran 24" LCD,20,2500,20',
    ].join('\r\n');
    const blob = new Blob(['\uFEFF' + headers + '\r\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'modele_import_commandes.csv'; a.click();
  }, []);

  const resetFilters = useCallback(() => {
    setSearch(''); setStatutFilter('all'); setMethodeFilter('all');
    setDateDebut(''); setDateFin(''); setKpiFilter('all'); setPage(1);
  }, []);

  const filtersActifs = !!(search || statutFilter !== 'all' || methodeFilter !== 'all' || dateDebut || dateFin || kpiFilter !== 'all');

  // ─── RENDU ──────────────────────────────────────────────────────────
  return (
    <main className="flex-1 space-y-5 p-4 md:p-6 min-h-screen bg-gray-50/30">
      {/* Modals */}
      <AnnulationDialog open={!!annulationId} onClose={() => setAnnulationId(null)} onConfirm={confirmAnnulation} reference={commandes.find(c => c.id === annulationId)?.reference || ''} />
      <ConfirmationLivraisonDialog open={!!livraisonId} onClose={() => setLivraisonId(null)} onConfirm={marquerLivre} reference={commandes.find(c => c.id === livraisonId)?.reference || ''} />
      <ImportInfoDialog open={importInfoOpen} onClose={() => setImportInfoOpen(false)} onBack={() => { setImportInfoOpen(false); setShowImportModal(true); }} onDownloadDetail={downloadDetailModel} />

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Achats &amp; Commandes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion complète des commandes — marchés publics et bons de commande.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filtersActifs && (
            <button onClick={resetFilters} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-1.5 transition-all">
              <X className="w-3 h-3" /> Réinitialiser
            </button>
          )}
          <Button onClick={() => setShowImportModal(true)} variant="outline" className="h-9 rounded-xl border-2 border-gray-200 font-bold gap-2 bg-white text-gray-700 hover:bg-[#E8F5E9] hover:border-[#1D6F42] hover:text-[#1D6F42]">
            <UploadCloud className="w-4 h-4" /> <span className="hidden sm:inline">Importer</span>
          </Button>
          <ExportMenu
            onCSV={handleExportCSV}
            onExcel={handleExportExcel}
            onPDF={handleExportPDF}
            onCSVSynth={handleExportCSVSynth}
            onExcelSynth={handleExportExcelSynth}
            onPDFSynth={handleExportPDFSynth}
            disabled={commandes.length === 0}
          />
          <Button onClick={() => openForm()} className="h-9 rounded-xl bg-[#1D6F42] text-white font-bold hover:bg-[#155430] gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nouvelle commande</span>
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={BarChart3} label="Toutes" value={globalStats.total} sub={`${globalStats.annulees} annulée(s)`} colorBg="bg-[#E3F2FD]" colorText="text-[#1565C0]" isActive={kpiFilter==='all'} onClick={() => setKpiFilter('all')} />
        <KpiCard icon={Clock} label="En cours" value={globalStats.enCours} sub={`${(globalStats.montantEnCours/1000).toFixed(0)}k MAD`} colorBg="bg-amber-50" colorText="text-amber-700" isActive={kpiFilter==='enCours'} onClick={() => setKpiFilter('enCours')} />
        <KpiCard icon={Truck} label="Reçues" value={globalStats.recues} sub={`${(globalStats.montantRecues/1000).toFixed(0)}k MAD`} colorBg="bg-emerald-50" colorText="text-emerald-700" isActive={kpiFilter==='livres'} onClick={() => setKpiFilter('livres')} />
        <KpiCard icon={FileCheck} label="Marchés publics" value={globalStats.nbMarchePublic} sub={`${globalStats.nbBonCommande} BC`} colorBg="bg-violet-50" colorText="text-violet-700" isActive={kpiFilter==='marche'} onClick={() => setKpiFilter('marche')} />
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px] max-w-[240px]">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input placeholder="Réf, description, fournisseur…" value={search} onChange={e => setSearch(e.target.value)} className="w-full h-9 pl-8 pr-7 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none placeholder-gray-400 focus:border-[#1D6F42] focus:ring-1 focus:ring-[#1D6F42]/20" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
            </div>
            
            <div className="w-36">
              <CustomSelect
                value={statutFilter}
                onChange={v => { setStatutFilter(v as string); setPage(1); }}
                options={[
                  { value: 'all', label: 'Tous statuts' },
                  { value: 'En cours', label: 'En cours' },
                  { value: 'Reçue', label: 'Reçue' },
                  { value: 'Annulé', label: 'Annulé' },
                ]}
                buttonClassName="h-9 text-xs"
              />
            </div>
            
            <div className="w-40">
              <CustomSelect
                value={methodeFilter}
                onChange={v => { setMethodeFilter(v as string); setPage(1); }}
                options={[
                  { value: 'all', label: 'Toutes méthodes' },
                  { value: 'Marché Public', label: 'Marché public' },
                  { value: 'Bon de Commande', label: 'Bon de commande' },
                ]}
                buttonClassName="h-9 text-xs"
              />
            </div>

            <DateRangePicker dateDebut={dateDebut} dateFin={dateFin} onDebutChange={v => { setDateDebut(v); setPage(1); }} onFinChange={v => { setDateFin(v); setPage(1); }} />
            {commandes.length > 0 && <span className="ml-auto text-[9px] font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{commandes.length} résultat{commandes.length > 1 ? 's' : ''}</span>}
          </div>
        </div>
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {([
                  ['Référence',   'reference',   'w-[10%]', false],
                  ['Description', 'description', 'w-[18%]', false],
                  ['Fournisseur', 'fournisseur', 'w-[14%]', true],
                  ['Méthode',     null,          'w-[12%]', false],
                  ['N° Marché',   null,          'w-[10%]', false],
                  ['Date',        'dateCommande','w-[8%]', true],
                  ['Statut',      'statut',      'w-[9%]', true],
                  ['HT (MAD)',    'montantHT',   'w-[9%]', true],
                  ['TTC (MAD)',   'montantTTC',  'w-[9%]', true],
                  ['Docs',        null,          'w-[5%]', false],
                  ['',            null,          'w-[6%]', false],
                ] as [string, string|null, string, boolean][]).map(([lbl, sk, cls, sortable]) => (
                  <th key={lbl} className={cn('px-2 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-400', cls, sortable && 'cursor-pointer hover:text-gray-600 select-none')} onClick={sortable && sk ? () => handleSort(sk) : undefined}>
                    <span className="inline-flex items-center gap-0.5">{lbl}{sortable && sk && <SortIcon k={sk} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-16 text-center"><RefreshCw className="w-8 h-8 text-gray-300 mx-auto mb-3 animate-spin" /><p className="text-sm font-semibold text-gray-400">Chargement...</p></td></tr>
              ) : commandes.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-16 text-center"><div className="flex flex-col items-center gap-2"><Package className="w-10 h-10 text-gray-200" /><p className="text-sm font-semibold text-gray-400">Aucune commande trouvée</p><p className="text-xs text-gray-300">Modifiez vos filtres ou ajoutez une commande.</p></div></td></tr>
              ) : commandes.map(cmd => (
                <tr key={cmd.id} className={cn('group transition-colors cursor-pointer hover:bg-[#F1F8E9]/30', cmd.statut === 'ANNULEE' && 'opacity-60')} onClick={() => setDetailCmd(cmd)}>
                  <td className="px-2 py-2.5 truncate"><span className="text-[11px] font-mono font-bold text-[#0d3b66]">{cmd.reference}</span></td>
                  <td className="px-2 py-2.5"><div className="text-[10px] font-semibold text-gray-900 truncate max-w-full" title={cmd.description || cmd.objetMarche}>{cmd.description || cmd.objetMarche || <span className="text-gray-400 italic">—</span>}</div>{cmd.objetMarche && cmd.description && <div className="text-[9px] text-gray-400 truncate">{cmd.objetMarche}</div>}</td>
                  <td className="px-2 py-2.5 truncate"><span className="text-[10px] text-gray-700 font-medium">{cmd.fournisseur}</span></td>
                  <td className="px-2 py-2.5">{getMethodeBadge(cmd.methode)}</td>
                  <td className="px-2 py-2.5 truncate">{cmd.numeroMarche ? <span className="text-[10px] font-mono text-violet-700 font-semibold">{cmd.numeroMarche}</span> : <span className="text-gray-300 text-[10px]">—</span>}</td>
                  <td className="px-2 py-2.5"><span className="text-[10px] text-gray-600">{fmtDate(cmd.dateCommande)}</span></td>
                  <td className="px-2 py-2.5">{getStatutBadge(cmd.statut)}</td>
                  <td className="px-2 py-2.5 text-right"><span className="text-[10px] font-mono font-semibold text-[#1D6F42]">{fmtNumber(cmd.montantHT)}</span></td>
                  <td className="px-2 py-2.5 text-right"><span className="text-[10px] font-mono font-bold text-gray-900">{fmtNumber(cmd.montantTTC)}</span></td>
                  <td className="px-2 py-2.5 text-center">{(cmd.documents || []).length > 0 ? <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#1D6F42] bg-[#E8F5E9] px-1.5 py-0.5 rounded-full"><Paperclip className="w-2.5 h-2.5" />{(cmd.documents || []).length}</span> : <span className="text-gray-300 text-[10px]">—</span>}</td>
                  <td className="px-2 py-2.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setDetailCmd(cmd)} title="Détails" className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1D6F42] hover:bg-[#E8F5E9] transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                      {cmd.statut !== 'ANNULEE' && <button onClick={() => openForm(cmd)} title="Modifier" className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Edit className="w-3.5 h-3.5" /></button>}
                      {cmd.statut === 'EN_COURS' && <button onClick={() => setLivraisonId(cmd.id)} title="Marquer reçue" className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><Truck className="w-3.5 h-3.5" /></button>}
                      {cmd.statut !== 'ANNULEE' && <button onClick={() => setAnnulationId(cmd.id)} title="Annuler" className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><XOctagon className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/40">
          <span className="text-[10px] text-gray-400">{commandes.length > 0 ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, totalElements)} sur ${totalElements}` : '0 commande'}</span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
            {Array.from({ length: Math.min(5, Math.ceil(totalElements / perPage)) }, (_, i) => {
              let p: number;
              const totalP = Math.ceil(totalElements / perPage);
              if (totalP <= 5) p = i + 1;
              else if (page <= 2) p = i + 1;
              else if (page >= totalP - 2) p = totalP - 4 + i;
              else p = page - 2 + i;
              return <button key={p} onClick={() => setPage(p)} className={cn('w-6 h-6 rounded-md text-[10px] font-semibold transition-all', page === p ? 'bg-[#1D6F42] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100')}>{p}</button>;
            })}
            <button onClick={() => setPage(p => Math.min(Math.ceil(totalElements / perPage), p + 1))} disabled={page >= Math.ceil(totalElements / perPage)} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      {/* MODAL DÉTAILS */}
      {detailCmd && (
        <Dialog open onOpenChange={o => !o && setDetailCmd(null)}>
          <DialogContent className="sm:max-w-4xl p-0 rounded-3xl border-0 shadow-2xl max-h-[90vh] flex flex-col [&>button.absolute]:hidden [&>button]:hidden">
            <DialogTitle className="sr-only">Détails commande {detailCmd.reference}</DialogTitle>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-3xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] flex items-center justify-center"><Briefcase className="w-5 h-5 text-[#1565C0]" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">Détails de la commande</h2><p className="text-xs font-mono text-gray-500">{detailCmd.reference}</p></div>
              </div>
              <div className="flex items-center gap-2">
                {getStatutBadge(detailCmd.statut)}{getMethodeBadge(detailCmd.methode)}
                {detailCmd.statut !== 'ANNULEE' && <button onClick={() => openForm(detailCmd)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Edit className="w-4 h-4" /></button>}
                {detailCmd.statut === 'EN_COURS' && <button onClick={() => setLivraisonId(detailCmd.id)} className="h-8 flex items-center gap-1 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"><Truck className="w-3.5 h-3.5" />Marquer reçue</button>}
                {detailCmd.statut !== 'ANNULEE' && <button onClick={() => setAnnulationId(detailCmd.id)} className="h-8 flex items-center gap-1 px-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 border border-red-200"><XOctagon className="w-3.5 h-3.5" /> Annuler</button>}
                <button onClick={() => setDetailCmd(null)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[['Fournisseur', detailCmd.fournisseur], ['Date commande', fmtDate(detailCmd.dateCommande)], ['Statut', detailCmd.statut === 'EN_COURS' ? 'En cours' : detailCmd.statut === 'RECUE' ? 'Reçue' : 'Annulé'], ...(detailCmd.objetMarche ? [['Objet du marché', detailCmd.objetMarche]] : []), ...(detailCmd.description ? [['Description', detailCmd.description]] : []), ...(detailCmd.numeroMarche ? [['N° Marché', detailCmd.numeroMarche]] : []), ...(detailCmd.montantMarche ? [['Budget marché', `${fmtNumber(detailCmd.montantMarche)} MAD`]] : [])].map(([lbl, val]) => (<div key={lbl} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm"><p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{lbl}</p><p className="text-xs font-bold text-gray-900">{val}</p></div>))}
              </div>
              {detailCmd.statut === 'ANNULEE' && detailCmd.motifAnnulation && <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2"><XOctagon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" /><div><p className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-0.5">Motif d'annulation</p><p className="text-xs text-red-900 whitespace-pre-wrap">{detailCmd.motifAnnulation}</p></div></div>}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50"><h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-gray-400"/>Articles de la commande</h3></div>
                <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="bg-gray-50 border-b border-gray-100"><tr>{['Code', 'Désignation', 'Qté', 'P.U. HT (MAD)', 'TVA', 'Total HT', 'Total TTC'].map(h => (<th key={h} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-left">{h}</th>))}</tr></thead><tbody className="divide-y divide-gray-50">{detailCmd.lignes.map(l => (<tr key={l.id} className="hover:bg-gray-50/50"><td className="px-3 py-2 font-mono text-gray-500">{l.codeArticle || '—'}</td><td className="px-3 py-2 font-semibold text-gray-900">{l.designation}</td><td className="px-3 py-2 text-center font-bold">{l.quantite}</td><td className="px-3 py-2 text-right font-mono">{fmtNumber(l.prixUnitaireHT)}</td><td className="px-3 py-2 text-center">{l.tauxTVA}%</td><td className="px-3 py-2 text-right font-mono text-[#1D6F42]">{fmtNumber(l.totalHT)}</td><td className="px-3 py-2 text-right font-bold font-mono">{fmtNumber(l.totalTTC)}</td></tr>))}</tbody><tfoot className="bg-[#E8F5E9] border-t border-[#1D6F42]/30"><tr><td colSpan={5} className="px-3 py-2 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Totaux</td><td className="px-3 py-2 text-right font-bold font-mono text-[#1D6F42]">{fmtNumber(detailCmd.montantHT)} MAD</td><td className="px-3 py-2 text-right font-bold font-mono text-gray-900">{fmtNumber(detailCmd.montantTTC)} MAD</td></tr></tfoot></table></div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"><h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-3"><Paperclip className="w-3.5 h-3.5 text-gray-400"/>Documents joints</h3><DocumentsJointsSection documents={detailCmd.documents.map(d => ({ id: `doc-${d.id}`, nom: d.nom, type: d.type as DocumentLocal['type'], dataUrl: d.dataUrl, dateAjout: d.dateAjout }))} readonly /></div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL FORMULAIRE */}
      <Dialog open={formOpen} onOpenChange={o => !o && setFormOpen(false)}>
        <DialogContent className="sm:max-w-4xl p-0 rounded-3xl border-gray-100 bg-white max-h-[92vh] flex flex-col [&>button.absolute]:hidden [&>button]:hidden">
          <DialogTitle className="sr-only">{editCmd ? 'Modifier' : 'Nouvelle commande'}</DialogTitle>
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl flex-shrink-0 flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-gray-900">{editCmd ? `Modifier — ${editCmd.reference}` : 'Nouvelle commande'}</h2>{!editCmd && <p className="text-xs text-gray-500 mt-0.5">La référence sera générée automatiquement.</p>}</div>
            <button onClick={() => setFormOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Informations générales</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5"><Label className="text-sm font-bold text-gray-700">Description <span className="text-gray-400 font-normal text-xs">(optionnel)</span></Label><Input placeholder="Ex: Achat de matériel de bureau pour les services…" value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]" /></div>
                <div className="sm:col-span-2 space-y-1.5"><Label className="text-sm font-bold text-gray-700">Objet du marché <span className="text-gray-400 font-normal text-xs">(optionnel)</span></Label><Input placeholder="Ex: Fourniture de matériel informatique pour écoles…" value={form.objetMarche || ''} onChange={e => setForm(p => ({ ...p, objetMarche: e.target.value }))} className="rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]" /></div>
                <div className="space-y-1.5"><Label className="text-sm font-bold text-gray-700">Fournisseur <span className="text-red-500">*</span></Label><FournisseurSelect value={form.fournisseur || ''} onChange={v => setForm(p => ({ ...p, fournisseur: v }))} fournisseurs={fournisseursList} error={formErrors.fournisseur} /></div>
                <div className="space-y-1.5"><Label className="text-sm font-bold text-gray-700">Date de commande <span className="text-gray-400 font-normal text-xs">(optionnel)</span></Label><Input type="date" value={form.dateCommande || ''} onChange={e => setForm(p => ({ ...p, dateCommande: e.target.value }))} className="rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]" /></div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-gray-700">Méthode</Label>
                  <CustomSelect
                    value={form.methode || 'Bon de Commande'}
                    onChange={v => setForm(p => ({ ...p, methode: v as string, numeroMarche: '', montantMarche: undefined }))}
                    options={[
                      { value: 'Bon de Commande', label: 'Bon de commande' },
                      { value: 'Marché Public', label: 'Marché public' },
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-bold text-gray-700">Statut</Label>
                  <CustomSelect
                    value={form.statut || 'En cours'}
                    onChange={v => setForm(p => ({ ...p, statut: v as string }))}
                    options={[
                      { value: 'En cours', label: 'En cours' },
                      { value: 'Reçue', label: 'Reçue' },
                    ]}
                  />
                </div>
              </div>
              {form.methode === 'Marché Public' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-violet-50 rounded-xl border border-violet-200"><div className="space-y-1.5"><Label className="text-sm font-bold text-violet-800">N° de marché public <span className="text-red-500">*</span></Label><Input placeholder="Ex: AO-14/2026/ME" value={form.numeroMarche || ''} onChange={e => setForm(p => ({ ...p, numeroMarche: e.target.value }))} className={cn('rounded-xl font-mono', formErrors.numeroMarche ? 'border-red-500' : 'border-violet-300 focus-visible:ring-violet-400')} />{formErrors.numeroMarche && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.numeroMarche}</p>}</div><div className="space-y-1.5"><Label className="text-sm font-bold text-violet-800">Montant du marché (MAD) <span className="text-gray-400 font-normal text-xs">(optionnel)</span></Label><Input type="number" min="0" step="any" placeholder="8 500 000" value={form.montantMarche ?? ''} onChange={e => setForm(p => ({ ...p, montantMarche: e.target.value ? Number(e.target.value) : undefined }))} className="rounded-xl font-mono border-violet-300 focus-visible:ring-violet-400" /></div></div>}
            </section>
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Package className="w-3.5 h-3.5"/>Articles de la commande</h3><Button type="button" variant="outline" size="sm" onClick={() => setForm(p => ({ ...p, lignes: [...(p.lignes || []), newLigne()] }))} className="h-8 rounded-lg text-xs font-bold gap-1 border-[#1D6F42] text-[#1D6F42] hover:bg-[#E8F5E9]"><Plus className="w-3.5 h-3.5" /> Ajouter un article</Button></div>
              {formErrors.lignes && <p className="text-xs text-red-500 font-bold">{formErrors.lignes}</p>}
              <div className="overflow-x-auto rounded-xl border border-gray-100"><table className="w-full min-w-[700px] text-xs"><thead className="bg-gray-50 border-b border-gray-100"><tr><th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-gray-500">Désignation <span className="text-gray-400 text-[9px]">(+ catalogue)</span> *</th><th className="px-2 py-2 text-center text-[10px] font-bold uppercase text-gray-500 w-20">Qté *</th><th className="px-2 py-2 text-right text-[10px] font-bold uppercase text-gray-500 w-32">P.U. HT *</th><th className="px-2 py-2 text-center text-[10px] font-bold uppercase text-gray-500 w-[85px]">TVA</th><th className="px-2 py-2 text-right text-[10px] font-bold uppercase text-gray-500 w-28">Total HT</th><th className="px-2 py-2 text-right text-[10px] font-bold uppercase text-[#1D6F42] w-28">Total TTC</th><th className="w-10"></th></tr></thead><tbody>{(form.lignes || []).map((ligne, i) => (<CataloguePickerRow key={ligne.id} index={i} ligne={ligne} onUpdate={(field, value) => { setForm(p => { const lignes = [...(p.lignes || [])]; lignes[i] = { ...lignes[i], [field]: value as never }; return { ...p, lignes }; }); }} onRemove={() => { setForm(p => ({ ...p, lignes: (p.lignes || []).filter((_, idx) => idx !== i) })); }} canRemove={(form.lignes || []).length > 1} formErrors={formErrors} produitsCatalogue={produitsCatalogue} tvaOptions={tvaOptions} />))}</tbody></table></div>
              <div className="flex justify-end gap-8 pt-2 border-t border-gray-100 text-sm font-bold text-gray-700"><span>Total HT : <span className="text-[#1D6F42]">{fmtNumber((form.lignes || []).reduce((s, l) => s + calcLigneHT(l), 0))} MAD</span></span><span>Total TTC : <span className="text-gray-900">{fmtNumber((form.lignes || []).reduce((s, l) => s + calcLigneTTC(l), 0))} MAD</span></span></div>
            </section>
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5"/>Documents joints (BCs, factures, BL…)</h3><DocumentsJointsSection documents={form.documents || []} onChange={docs => setForm(p => ({ ...p, documents: docs }))} /></section>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex-shrink-0 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl border-gray-200 font-bold">Annuler</Button>
            <Button onClick={saveForm} className="rounded-xl bg-[#1D6F42] text-white hover:bg-[#155430] font-bold shadow-sm gap-2"><CheckCircle2 className="w-4 h-4" /> Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL IMPORT */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 border-gray-100 max-h-[85vh] flex flex-col [&>button.absolute]:hidden [&>button]:hidden">
          <DialogTitle className="sr-only">Importer des commandes</DialogTitle>
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 rounded-t-3xl flex-shrink-0 flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-gray-900">Importer des commandes</h2><p className="text-sm text-gray-500 mt-1">Chargez un fichier Excel (.xlsx) ou CSV (format détaillé uniquement).</p></div>
            <button onClick={() => setShowImportModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">
            <div
              className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-[#E8F5E9] hover:border-[#1D6F42] transition-colors cursor-pointer group"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file'; input.accept = '.csv,.xlsx';
                input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) handleImportFile(file); };
                input.click();
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"><UploadCloud className="w-7 h-7 text-[#1D6F42]" /></div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Cliquez ou glissez votre fichier</h3>
              <p className="text-xs text-gray-500">.xlsx, .csv — Max 5 Mo</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowImportModal(false); setImportInfoOpen(true); }} className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:bg-gray-50 hover:text-[#1D6F42] hover:border-[#1D6F42] transition-colors"><Info className="w-3.5 h-3.5" /> Voir la structure</button>
              <button type="button" onClick={downloadDetailModel} className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:bg-gray-50 hover:text-[#1D6F42] hover:border-[#1D6F42] transition-colors"><Download className="w-3.5 h-3.5" /> Télécharger modèle</button>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end gap-2 flex-shrink-0">
            <Button variant="outline" onClick={() => setShowImportModal(false)} className="rounded-xl border-gray-200 font-bold">Annuler</Button>
            <Button disabled={importLoading} onClick={() => {}} className="rounded-xl bg-[#1D6F42] text-white hover:bg-[#155430] font-bold">
              {importLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FileInput className="w-4 h-4 mr-2" />} Importer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
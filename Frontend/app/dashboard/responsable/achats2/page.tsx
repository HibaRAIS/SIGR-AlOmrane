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

// ──────────────────────────── TYPES ────────────────────────────

export type MethodeCommande = 'Marché Public' | 'Bon de Commande';
export type StatutCommande = 'En cours' | 'Reçue' | 'Annulé';

export interface LigneCommande {
  id: string;
  designation: string;
  codeArticle?: string;
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: number;
}

export interface DocumentJoint {
  id: string;
  nom: string;
  type: 'BON_COMMANDE' | 'FACTURE' | 'BON_LIVRAISON' | 'AUTRE';
  dataUrl: string;
  dateAjout: string;
}

export interface AchatCommande {
  id: string;
  reference: string;
  description?: string;
  objetMarche?: string;
  fournisseur: string;
  lignes: LigneCommande[];
  montantHT: number;
  montantTTC: number;
  dateCommande?: string;
  statut: StatutCommande;
  methode: MethodeCommande;
  numeroMarche?: string;
  montantMarche?: number;
  documents?: DocumentJoint[];
  createdAt: string;
  motifAnnulation?: string;
}

// ──────────────────────────── CATALOGUE / FOURNISSEURS ─────────────────────

interface ProduitCatalogue {
  codeArticle: string;
  designation: string;
  prixUnitaireHT: number;
  tauxTVA: number;
  unite: string;
}

const CATALOGUE_PRODUITS: ProduitCatalogue[] = [
  { codeArticle: 'USB-001', designation: 'Adaptateur USB-C Hub',      prixUnitaireHT: 150,   tauxTVA: 20, unite: 'Pcs' },
  { codeArticle: 'CLV-042', designation: 'Clavier mécanique',          prixUnitaireHT: 220,   tauxTVA: 20, unite: 'Pcs' },
  { codeArticle: 'SCR-099', designation: 'Écran 24 pouces',            prixUnitaireHT: 890,   tauxTVA: 20, unite: 'Pcs' },
  { codeArticle: 'HDMI-02', designation: 'Câble HDMI 2m',              prixUnitaireHT: 45,    tauxTVA: 20, unite: 'Pcs' },
  { codeArticle: 'MS-007',  designation: 'Souris ergonomique',         prixUnitaireHT: 65,    tauxTVA: 20, unite: 'Pcs' },
  { codeArticle: 'PPR-A4',  designation: 'Ramettes de papier A4',      prixUnitaireHT: 45,    tauxTVA: 20, unite: 'Paquet' },
  { codeArticle: 'STY-BLU', designation: 'Stylos bille bleus (boîte)', prixUnitaireHT: 35,    tauxTVA: 20, unite: 'Boîte' },
  { codeArticle: 'DLL-LAP', designation: 'Ordinateur portable Dell',   prixUnitaireHT: 15000, tauxTVA: 20, unite: 'Pcs' },
  { codeArticle: 'LCD-24',  designation: 'Écran 24" LCD',              prixUnitaireHT: 2500,  tauxTVA: 20, unite: 'Pcs' },
  { codeArticle: 'CLM-SRV', designation: 'Maintenance climatisation',  prixUnitaireHT: 15000, tauxTVA: 10, unite: 'Forfait' },
  { codeArticle: 'GRO-OEU', designation: 'Gros œuvre – fondations',   prixUnitaireHT: 1200000, tauxTVA: 14, unite: 'Forfait' },
  { codeArticle: 'PNT-INT', designation: 'Peinture intérieure',        prixUnitaireHT: 200000, tauxTVA: 14, unite: 'Forfait' },
  { codeArticle: 'BRO-A5',  designation: 'Brochures A5 couleur',       prixUnitaireHT: 6.4,   tauxTVA: 7,  unite: 'Pcs' },
];

const FOURNISSEURS_REF = [
  'TechSupply SARL',
  'ClimService',
  'Batipro SA',
  'Papeterie Centrale',
  'Imprimerie Moderne',
  'Énergie Plus',
  'BTP Express',
  'InfoTech Maroc',
  'Mobilier Pro',
  'Sécurité & Co',
];

// ──────────────────────────── HELPERS ─────────────────────────

const calcLigneHT  = (l: LigneCommande) => l.quantite * l.prixUnitaireHT;
const calcLigneTTC = (l: LigneCommande) => calcLigneHT(l) * (1 + l.tauxTVA / 100);

const fmtNumber = (n: number) =>
  new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('fr-FR') : '—';

const toYMD = (d: Date) => d.toISOString().split('T')[0];

const genNextReference = (commandes: AchatCommande[]): string => {
  const year = new Date().getFullYear();
  const sameYear = commandes.filter(c => c.reference.startsWith(`${year}/`));
  const maxSeq = sameYear.reduce((max, c) => {
    const seq = parseInt(c.reference.split('/')[1] || '0', 10);
    return seq > max ? seq : max;
  }, 0);
  return `${year}/${String(maxSeq + 1).padStart(4, '0')}`;
};

// ──────────────────────── DONNÉES MOCK ─────────────────────────

const MOCK_COMMANDES_RAW: Omit<AchatCommande, 'montantHT' | 'montantTTC'>[] = [
  {
    id: '1', reference: '2026/0001', description: 'Matériel informatique pour les écoles', objetMarche: 'Fourniture de matériel pédagogique numérique',
    fournisseur: 'TechSupply SARL', lignes: [
      { id: 'l1-1', designation: 'Ordinateur portable Dell', codeArticle: 'DLL-LAP', quantite: 10, prixUnitaireHT: 15000, tauxTVA: 20 },
      { id: 'l1-2', designation: 'Écran 24" LCD',            codeArticle: 'LCD-24',  quantite: 20, prixUnitaireHT: 2500,  tauxTVA: 20 },
    ], dateCommande: '2026-06-10', statut: 'En cours', methode: 'Marché Public', numeroMarche: 'AO-14/2026/ME', montantMarche: 8500000, documents: [], createdAt: '2026-06-10T09:00:00Z',
  },
  {
    id: '2', reference: '2026/0002', description: 'Maintenance des climatisations', fournisseur: 'ClimService',
    lignes: [
      { id: 'l2-1', designation: 'Maintenance trimestrielle', codeArticle: 'CLM-SRV', quantite: 1, prixUnitaireHT: 45000, tauxTVA: 10 },
    ], dateCommande: '2026-05-20', statut: 'Reçue', methode: 'Bon de Commande', documents: [], createdAt: '2026-05-20T10:00:00Z',
  },
  {
    id: '3', reference: '2026/0003', description: 'Travaux de rénovation du centre de santé', objetMarche: 'Rénovation complète des espaces soins',
    fournisseur: 'Batipro SA', lignes: [
      { id: 'l3-1', designation: 'Gros œuvre – fondations', codeArticle: 'GRO-OEU', quantite: 1, prixUnitaireHT: 1200000, tauxTVA: 14 },
      { id: 'l3-2', designation: 'Peinture intérieure',     codeArticle: 'PNT-INT', quantite: 3, prixUnitaireHT: 200000,  tauxTVA: 14 },
    ], dateCommande: '2026-04-12', statut: 'Reçue', methode: 'Marché Public', numeroMarche: 'AO-11/2025/MS', montantMarche: 2100000, documents: [], createdAt: '2026-04-12T08:00:00Z',
  },
  {
    id: '4', reference: '2026/0004', description: 'Fournitures de bureau', fournisseur: 'Papeterie Centrale',
    lignes: [
      { id: 'l4-1', designation: 'Ramettes de papier A4',   codeArticle: 'PPR-A4',  quantite: 50,  prixUnitaireHT: 45,  tauxTVA: 20 },
      { id: 'l4-2', designation: 'Stylos bille bleus',       codeArticle: 'STY-BLU', quantite: 200, prixUnitaireHT: 6.5, tauxTVA: 20 },
    ], dateCommande: '2026-07-02', statut: 'En cours', methode: 'Bon de Commande', documents: [], createdAt: '2026-07-02T11:00:00Z',
  },
  {
    id: '5', reference: '2026/0005', description: 'Impression de supports pédagogiques', fournisseur: 'Imprimerie Moderne',
    lignes: [
      { id: 'l5-1', designation: 'Brochures A5 couleur', codeArticle: 'BRO-A5', quantite: 5000, prixUnitaireHT: 6.4, tauxTVA: 7 },
    ], statut: 'Annulé', methode: 'Bon de Commande', motifAnnulation: 'Budget révisé – report au prochain exercice.', documents: [], createdAt: '2026-06-28T14:00:00Z',
  },
];

const MOCK_COMMANDES: AchatCommande[] = MOCK_COMMANDES_RAW.map(c => ({
  ...c,
  montantHT:  (c as AchatCommande).lignes.reduce((s, l) => s + calcLigneHT(l), 0),
  montantTTC: (c as AchatCommande).lignes.reduce((s, l) => s + calcLigneTTC(l), 0),
})) as AchatCommande[];

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

/**
 * Calcul dynamique du portail pour éviter les conflits avec Radix FocusScope.
 * Si déclenché dans une modale, on insère le menu DANS la modale (position absolute).
 * Sinon, dans le body (position fixed).
 */
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
      // 150px largeur minimum pour un select classique
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

// ── FournisseurSelect (Refait avec Smart Portal) ──────────────────────────────────
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
            {query && !fournisseurs.some(f => f.toLowerCase() === query.toLowerCase()) && (
              <button
                type="button"
                onClick={() => { onChange(query); setOpen(false); setQuery(''); }}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-amber-50 text-amber-700 border-t border-gray-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter « {query} »
              </button>
            )}
          </div>
        </div>,
        portalConfig.target
      )}
    </div>
  );
}

// ── CataloguePickerRow (Smart Portal) ───────────────────────────
function CataloguePickerRow({
  index,
  ligne,
  onUpdate,
  onRemove,
  canRemove,
  formErrors,
}: {
  index: number;
  ligne: LigneCommande;
  onUpdate: (field: keyof LigneCommande, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
  formErrors: Record<string, string>;
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
    () => CATALOGUE_PRODUITS.filter(
      p =>
        p.designation.toLowerCase().includes(catQuery.toLowerCase()) ||
        p.codeArticle.toLowerCase().includes(catQuery.toLowerCase()),
    ),
    [catQuery],
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
          options={[
            { value: 0, label: '0%' },
            { value: 7, label: '7%' },
            { value: 10, label: '10%' },
            { value: 14, label: '14%' },
            { value: 20, label: '20%' },
          ]}
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
const getStatutBadge = (statut: StatutCommande) => {
  switch (statut) {
    case 'Reçue':    return <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-emerald-50 border-emerald-200 text-emerald-700"><Truck className="w-3 h-3"/>Reçue</span>;
    case 'En cours': return <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-amber-50 border-amber-200 text-amber-700"><Clock className="w-3 h-3"/>En cours</span>;
    case 'Annulé':   return <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold bg-gray-100 border-gray-200 text-gray-500"><XOctagon className="w-3 h-3"/>Annulé</span>;
  }
};

const getMethodeBadge = (methode: MethodeCommande) => {
  if (methode === 'Marché Public')
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
const DOC_TYPE_LABELS: Record<DocumentJoint['type'], string> = {
  BON_COMMANDE: 'Bon de commande',
  FACTURE:      'Facture',
  BON_LIVRAISON: 'Bon de livraison',
  AUTRE:        'Autre',
};
const DOC_TYPE_COLORS: Record<DocumentJoint['type'], string> = {
  BON_COMMANDE:  'bg-violet-50 text-violet-700 border-violet-200',
  FACTURE:       'bg-amber-50 text-amber-700 border-amber-200',
  BON_LIVRAISON: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  AUTRE:         'bg-gray-100 text-gray-600 border-gray-200',
};

function DocumentsJointsSection({
  documents,
  onChange,
  readonly = false,
}: {
  documents: DocumentJoint[];
  onChange?: (docs: DocumentJoint[]) => void;
  readonly?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingType, setPendingType] = useState<DocumentJoint['type']>('BON_COMMANDE');
  const [viewDoc, setViewDoc] = useState<DocumentJoint | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onChange) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const newDoc: DocumentJoint = {
        id: `doc-${Date.now()}`,
        nom: file.name,
        type: pendingType,
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
              onChange={(v) => setPendingType(v as DocumentJoint['type'])}
              options={(Object.keys(DOC_TYPE_LABELS) as DocumentJoint['type'][]).map(t => ({ value: t, label: DOC_TYPE_LABELS[t] }))}
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
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', DOC_TYPE_COLORS[doc.type])}>
                  {DOC_TYPE_LABELS[doc.type]}
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

// ─── Confirmation livraison dialog (simplifié, sans bon d'entrée) ─────────────
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
            Cette action modifiera le statut en « R ».
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Annuler</Button>
          <Button className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={onConfirm}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmer la livraison
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Import infos dialog (uniquement détaillé, sans X) ────────────────────────
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
        {/* En-tête SANS bouton X */}
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
  const [commandes, setCommandes] = useState<AchatCommande[]>(MOCK_COMMANDES);
  const [fournisseursList] = useState<string[]>(FOURNISSEURS_REF);

  // Filtres
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<'all' | StatutCommande>('all');
  const [methodeFilter, setMethodeFilter] = useState<'all' | MethodeCommande>('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [kpiFilter, setKpiFilter] = useState<'all' | 'enCours' | 'livres' | 'marche' | 'bc'>('all');

  // Pagination / tri
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof AchatCommande | null>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const perPage = 10;

  // Modals
  const [detailCmd, setDetailCmd] = useState<AchatCommande | null>(null);
  const [editCmd, setEditCmd] = useState<AchatCommande | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [annulationId, setAnnulationId] = useState<string | null>(null);
  const [livraisonId, setLivraisonId] = useState<string | null>(null);
  const [importInfoOpen, setImportInfoOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // Formulaire
  const [form, setForm] = useState<Partial<AchatCommande>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // KPIs
  const stats = useMemo(() => {
    const enCours = commandes.filter(c => c.statut === 'En cours');
    const livres  = commandes.filter(c => c.statut === 'Reçue');
    const annules = commandes.filter(c => c.statut === 'Annulé');
    const marche  = commandes.filter(c => c.methode === 'Marché Public');
    const bc      = commandes.filter(c => c.methode === 'Bon de Commande');
    const montantEnCours = enCours.reduce((s, c) => s + c.montantTTC, 0);
    const montantLivre   = livres.reduce((s, c) => s + c.montantTTC, 0);
    return {
      total: commandes.length,
      enCours: enCours.length,
      livres: livres.length,
      annules: annules.length,
      nbMarche: marche.length,
      nbBC: bc.length,
      montantEnCours,
      montantLivre,
    };
  }, [commandes]);

  // Données filtrées
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const debutTs = dateDebut ? new Date(`${dateDebut}T00:00:00`).getTime() : null;
    const finTs   = dateFin   ? new Date(`${dateFin}T23:59:59`).getTime()   : null;

    let res = commandes.filter(c => {
      if (q && ![c.reference, c.description, c.fournisseur, c.objetMarche, c.numeroMarche]
        .filter(Boolean).join(' ').toLowerCase().includes(q)) return false;
      if (statutFilter !== 'all' && c.statut !== statutFilter) return false;
      if (methodeFilter !== 'all' && c.methode !== methodeFilter) return false;
      if (kpiFilter === 'enCours' && c.statut !== 'En cours') return false;
      if (kpiFilter === 'livres'  && c.statut !== 'Reçue')    return false;
      if (kpiFilter === 'marche'  && c.methode !== 'Marché Public')    return false;
      if (kpiFilter === 'bc'      && c.methode !== 'Bon de Commande')  return false;
      if (c.dateCommande) {
        const ts = new Date(c.dateCommande).getTime();
        if (debutTs && ts < debutTs) return false;
        if (finTs   && ts > finTs)   return false;
      }
      return true;
    });

    if (sortKey) {
      res = [...res].sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sortKey] ?? '';
        const bv = (b as unknown as Record<string, unknown>)[sortKey] ?? '';
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return res;
  }, [commandes, search, statutFilter, methodeFilter, kpiFilter, dateDebut, dateFin, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { setPage(1); }, [search, statutFilter, methodeFilter, kpiFilter, dateDebut, dateFin]);

  const handleSort = (k: keyof AchatCommande) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
    setPage(1);
  };

  const SortIcon = ({ k }: { k: keyof AchatCommande }) => (
    <span className="ml-0.5 inline-flex">
      {sortKey === k
        ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[#1D6F42]" /> : <ChevronDown className="w-3 h-3 text-[#1D6F42]" />
        : <ChevronsUpDown className="w-3 h-3 text-gray-300" />}
    </span>
  );

  // Gestion du formulaire
  const newLigne = (): LigneCommande => ({
    id: `tmp-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
    designation: '', quantite: 1, prixUnitaireHT: 0, tauxTVA: 20,
  });

  const openForm = (cmd?: AchatCommande) => {
    setFormErrors({});
    if (cmd) {
      setEditCmd(cmd);
      setForm({ ...cmd, lignes: cmd.lignes.map(l => ({ ...l })), documents: cmd.documents ? [...cmd.documents] : [] });
    } else {
      setEditCmd(null);
      setForm({
        description: '',
        objetMarche: '',
        fournisseur: '',
        lignes: [newLigne()],
        statut: 'En cours',
        methode: 'Bon de Commande',
        numeroMarche: '',
        montantMarche: undefined,
        documents: [],
      });
    }
    setFormOpen(true);
  };

  const computedTotals = useMemo(() => {
    const ht  = (form.lignes || []).reduce((s, l) => s + calcLigneHT(l), 0);
    const ttc = (form.lignes || []).reduce((s, l) => s + calcLigneTTC(l), 0);
    return { ht, ttc };
  }, [form.lignes]);

  // Validation temps réel
  const realTimeErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!form.fournisseur?.trim()) errs.fournisseur = 'Fournisseur obligatoire';
    if (form.methode === 'Marché Public' && !form.numeroMarche?.trim()) errs.numeroMarche = 'N° marché public obligatoire';
    if (form.methode === 'Marché Public' && form.numeroMarche?.trim()) {
      const alreadyExists = commandes.some(c => c.numeroMarche === form.numeroMarche && c.id !== (editCmd?.id || ''));
      if (alreadyExists) errs.numeroMarche = 'Ce numéro de marché existe déjà.';
    }
    (form.lignes || []).forEach((l, i) => {
      if (!l.designation.trim()) errs[`ligne-${i}-designation`] = 'Requis';
      if (l.quantite <= 0) errs[`ligne-${i}-quantite`] = '> 0';
      if (l.prixUnitaireHT <= 0) errs[`ligne-${i}-prix`] = '> 0';
    });
    if ((form.lignes || []).length === 0) errs.lignes = 'Au moins une ligne';
    return errs;
  }, [form, commandes, editCmd]);

  useEffect(() => {
    setFormErrors(realTimeErrors);
  }, [realTimeErrors]);

  const validateForm = (): boolean => {
    const hasErrors = Object.keys(realTimeErrors).length > 0;
    if (hasErrors) {
      toast.error('Corrigez les erreurs avant d’enregistrer.');
      return false;
    }
    return true;
  };

  const saveForm = () => {
    if (!validateForm()) return;
    const lignes = form.lignes || [];
    const montantHT  = lignes.reduce((s, l) => s + calcLigneHT(l), 0);
    const montantTTC = lignes.reduce((s, l) => s + calcLigneTTC(l), 0);

    if (editCmd) {
      const updated: AchatCommande = { ...editCmd, ...form, montantHT, montantTTC, lignes } as AchatCommande;
      setCommandes(prev => prev.map(c => c.id === editCmd.id ? updated : c));
      toast.success('Commande mise à jour.');
      if (detailCmd?.id === editCmd.id) setDetailCmd(updated);
    } else {
      const ref = genNextReference(commandes);
      const cmd: AchatCommande = {
        id: Date.now().toString(),
        reference: ref,
        description: form.description,
        objetMarche: form.objetMarche,
        fournisseur: form.fournisseur!,
        lignes,
        montantHT,
        montantTTC,
        dateCommande: form.dateCommande,
        statut: (form.statut as StatutCommande) || 'En cours',
        methode: (form.methode as MethodeCommande) || 'Bon de Commande',
        numeroMarche: form.methode === 'Marché Public' ? form.numeroMarche : undefined,
        montantMarche: form.methode === 'Marché Public' ? form.montantMarche : undefined,
        documents: form.documents || [],
        createdAt: new Date().toISOString(),
      };
      setCommandes(prev => [cmd, ...prev]);
      toast.success(`Commande créée : ${ref}`);
    }
    setFormOpen(false);
  };

  // Annulation
  const confirmAnnulation = useCallback((motif: string) => {
    if (!annulationId) return;
    setCommandes(prev => prev.map(c => c.id === annulationId
      ? { ...c, statut: 'Annulé', motifAnnulation: motif }
      : c
    ));
    if (detailCmd?.id === annulationId) setDetailCmd(prev => prev ? { ...prev, statut: 'Annulé', motifAnnulation: motif } : prev);
    toast.success('Commande annulée (traçabilité conservée).');
    setAnnulationId(null);
  }, [annulationId, detailCmd]);

  // Livraison simplifiée (statut “Livré” uniquement)
  const demanderLivraison = useCallback((id: string) => {
    setLivraisonId(id);
  }, []);

  const marquerLivre = useCallback(() => {
    if (!livraisonId) return;
    setCommandes(prev => prev.map(c => c.id === livraisonId ? { ...c, statut: 'Reçue' } : c));
    if (detailCmd?.id === livraisonId) setDetailCmd(prev => prev ? { ...prev, statut: 'Reçue' } : prev);
    toast.success('Commande marquée comme reçue.');
    setLivraisonId(null);
  }, [livraisonId, detailCmd]);

  // Reset filtres
  const resetFilters = useCallback(() => {
    setSearch(''); setStatutFilter('all'); setMethodeFilter('all');
    setDateDebut(''); setDateFin(''); setKpiFilter('all'); setPage(1);
  }, []);

  const filtersActifs = !!(search || statutFilter !== 'all' || methodeFilter !== 'all' || dateDebut || dateFin || kpiFilter !== 'all');

  // ─── Exports DÉTAILLÉS (une ligne par article) ──────────────────────────
  const handleExportCSV = useCallback(() => {
    if (filtered.length === 0) return;
    const BOM = '\uFEFF';
    const escape = (v: unknown) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };
    const headers = [
      'Réf Cde', 'Description Cde', 'Objet Marché', 'Fournisseur', 'Méthode', 'N° Marché',
      'Date Cde', 'Statut', 'Code Article', 'Désignation Article', 'Qté', 'PU HT', 'TVA',
      'Total HT ligne', 'Total TTC ligne',
    ];
    const rows: string[] = [];
    filtered.forEach(c =>
      c.lignes.forEach(l => {
        rows.push(
          [c.reference, c.description||'', c.objetMarche||'', c.fournisseur, c.methode,
           c.numeroMarche||'', c.dateCommande||'', c.statut,
           l.codeArticle||'', l.designation, l.quantite, l.prixUnitaireHT, l.tauxTVA,
           calcLigneHT(l).toFixed(2), calcLigneTTC(l).toFixed(2),
          ].map(escape).join(',')
        );
      })
    );
    const content = [headers.map(escape).join(','), ...rows].join('\r\n');
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `commandes_detail_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [filtered]);

  const handleExportExcel = useCallback(async () => {
    if (filtered.length === 0) return;
    const XLSX = await import('xlsx');
    const rows: any[] = [];
    filtered.forEach(c =>
      c.lignes.forEach(l => {
        rows.push({
          'Réf Cde': c.reference,
          'Description Cde': c.description || '',
          'Objet Marché': c.objetMarche || '',
          Fournisseur: c.fournisseur,
          Méthode: c.methode,
          'N° Marché': c.numeroMarche || '',
          'Date Cde': c.dateCommande ? fmtDate(c.dateCommande) : '',
          Statut: c.statut,
          'Code Article': l.codeArticle || '',
          'Désignation Article': l.designation,
          Qté: l.quantite,
          'PU HT': l.prixUnitaireHT,
          TVA: l.tauxTVA,
          'Total HT ligne': calcLigneHT(l),
          'Total TTC ligne': calcLigneTTC(l),
        });
      })
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commandes détail');
    XLSX.writeFile(wb, `commandes_detail_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [filtered]);

  const handleExportPDF = useCallback(async (): Promise<void> => {
    if (filtered.length === 0) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const logoUrl = '/images/alomrane-logo.png';

    let logoDataUrl = '';
    try {
      const img = new Image();
      img.src = logoUrl;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0);
      logoDataUrl = canvas.toDataURL('image/png');
    } catch (e) { /* logo manquant ignoré */ }

    const addHeaderFooter = (currentPage: number, totalPages: number) => {
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', margin, 5, 18, 14);
      }
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

    const headers = [
      'Réf Cde', 'Description', 'Fournisseur', 'Code Article', 'Désignation',
      'Qté', 'PU HT', 'TVA', 'Total HT', 'Total TTC',
    ];
    const data: any[][] = [];
    filtered.forEach(c =>
      c.lignes.forEach(l => {
        data.push([
          c.reference, c.description || '', c.fournisseur,
          l.codeArticle || '', l.designation, l.quantite,
          fmtNumber(l.prixUnitaireHT), `${l.tauxTVA}%`,
          fmtNumber(calcLigneHT(l)), fmtNumber(calcLigneTTC(l)),
        ]);
      })
    );

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 35,
      margin: { top: 35, left: margin, right: margin, bottom: 20 },
      styles: { fontSize: 7, cellPadding: 2, valign: 'middle', halign: 'left', textColor: [50, 50, 50], lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: [27, 94, 32], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: (data) => addHeaderFooter(data.pageNumber, doc.getNumberOfPages()),
    });

    doc.save(`commandes_detail_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF détaillé exporté');
  }, [filtered]);

  // ─── Exports SYNTHÉTIQUES (une ligne par commande) ────────────────────────
  const handleExportCSVSynth = useCallback(() => {
    if (filtered.length === 0) return;
    const BOM = '\uFEFF';
    const escape = (v: unknown) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };
    const headers = [
      'Réf Cde', 'Description', 'Objet Marché', 'Fournisseur', 'Méthode', 'N° Marché',
      'Date Cde', 'Statut', 'Total HT', 'Total TTC',
    ];
    const rows = filtered.map(c =>
      [c.reference, c.description||'', c.objetMarche||'', c.fournisseur, c.methode,
       c.numeroMarche||'', c.dateCommande||'', c.statut,
       c.montantHT.toFixed(2), c.montantTTC.toFixed(2),
      ].map(escape).join(',')
    );
    const content = [headers.map(escape).join(','), ...rows].join('\r\n');
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `commandes_synthese_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [filtered]);

  const handleExportExcelSynth = useCallback(async () => {
    if (filtered.length === 0) return;
    const XLSX = await import('xlsx');
    const rows = filtered.map(c => ({
      'Réf Cde': c.reference,
      'Description': c.description || '',
      'Objet Marché': c.objetMarche || '',
      Fournisseur: c.fournisseur,
      Méthode: c.methode,
      'N° Marché': c.numeroMarche || '',
      'Date Cde': c.dateCommande ? fmtDate(c.dateCommande) : '',
      Statut: c.statut,
      'Total HT': c.montantHT,
      'Total TTC': c.montantTTC,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Synthèse commandes');
    XLSX.writeFile(wb, `commandes_synthese_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [filtered]);

  const handleExportPDFSynth = useCallback(async (): Promise<void> => {
    if (filtered.length === 0) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const logoUrl = '/images/alomrane-logo.png';

    let logoDataUrl = '';
    try {
      const img = new Image();
      img.src = logoUrl;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0);
      logoDataUrl = canvas.toDataURL('image/png');
    } catch (e) { /* logo manquant ignoré */ }

    const addHeaderFooter = (currentPage: number, totalPages: number) => {
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', margin, 5, 18, 14);
      }
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

    const headers = [
      'Réf Cde', 'Description', 'Fournisseur', 'Méthode', 'N° Marché',
      'Date', 'Statut', 'Total HT', 'Total TTC',
    ];
    const data = filtered.map(c => [
      c.reference, c.description || '', c.fournisseur, c.methode,
      c.numeroMarche || '', c.dateCommande ? fmtDate(c.dateCommande) : '', c.statut,
      fmtNumber(c.montantHT), fmtNumber(c.montantTTC),
    ]);

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 35,
      margin: { top: 35, left: margin, right: margin, bottom: 20 },
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle', halign: 'left', textColor: [50, 50, 50], lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: [27, 94, 32], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didDrawPage: (data) => addHeaderFooter(data.pageNumber, doc.getNumberOfPages()),
    });

    doc.save(`commandes_synthese_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF synthétique exporté');
  }, [filtered]);

  // ─── Import (format détaillé uniquement) ────────────────────────────────────
  const handleImportFile = async (file: File) => {
    setImportLoading(true);
    try {
      let rows: any[] = [];
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) throw new Error('Fichier vide');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        if (!headers.includes('designation_ligne')) {
          throw new Error('Format non supporté : seul le format détaillé (avec colonne "designation_ligne") est accepté.');
        }
        rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = values[i] || ''; });
          return obj;
        });
      } else if (file.name.endsWith('.xlsx')) {
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (rows.length === 0 || !('designation_ligne' in rows[0])) {
          throw new Error('Format non supporté : le fichier doit contenir la colonne "designation_ligne".');
        }
      } else {
        throw new Error('Format non supporté (.csv ou .xlsx)');
      }

      if (rows.length === 0) throw new Error('Aucune donnée');

      // Traitement détaillé uniquement
      const grouped: Record<string, any> = {};
      rows.forEach((r, i) => {
        const fournisseur = r.fournisseur || '';
        if (!fournisseur) throw new Error(`Ligne ${i+1}: fournisseur manquant`);
        const designation = r.designation_ligne || '';
        if (!designation) throw new Error(`Ligne ${i+1}: désignation article manquante`);
        const qte = Number(r.quantite) || 0;
        if (qte <= 0) throw new Error(`Ligne ${i+1}: quantité invalide`);
        const pu = Number(r.prix_unitaire_ht) || 0;
        if (pu <= 0) throw new Error(`Ligne ${i+1}: prix invalide`);
        if (!grouped[fournisseur]) {
          grouped[fournisseur] = {
            fournisseur, lignes: [],
            desc: r.description || undefined,
            objet: r.objet_marche || undefined,
            methode: r.methode || 'Bon de Commande',
            numMarche: r.numero_marche || undefined,
            montantMarche: r.montant_marche ? Number(r.montant_marche) : undefined,
            date: r.date_commande || undefined,
            statut: r.statut || 'En cours',
          };
        }
        grouped[fournisseur].lignes.push({
          id: `imp-${Date.now()}-${i}`,
          designation,
          codeArticle: r.code_article || undefined,
          quantite: qte,
          prixUnitaireHT: pu,
          tauxTVA: Number(r.taux_tva) || 20,
        });
      });

      const nouvelles: AchatCommande[] = [];
      for (const key of Object.keys(grouped)) {
        const g = grouped[key];
        const ht = g.lignes.reduce((s: number, l: LigneCommande) => s + calcLigneHT(l), 0);
        const ttc = g.lignes.reduce((s: number, l: LigneCommande) => s + calcLigneTTC(l), 0);
        const ref = genNextReference([...commandes, ...nouvelles]);
        nouvelles.push({
          id: `import-${Date.now()}-${key}`,
          reference: ref,
          description: g.desc,
          objetMarche: g.objet,
          fournisseur: g.fournisseur,
          lignes: g.lignes,
          montantHT: ht,
          montantTTC: ttc,
          dateCommande: g.date,
          statut: g.statut,
          methode: g.methode,
          numeroMarche: g.methode === 'Marché Public' ? g.numMarche : undefined,
          montantMarche: g.methode === 'Marché Public' ? g.montantMarche : undefined,
          documents: [],
          createdAt: new Date().toISOString(),
        });
      }

      setCommandes(prev => [...nouvelles, ...prev]);
      toast.success(`${nouvelles.length} commande(s) importée(s)`);
      setShowImportModal(false);
    } catch (err: any) {
      toast.error(`Erreur d'import : ${err.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  // Téléchargement du modèle détaillé (le seul autorisé)
  const downloadDetailModel = useCallback(() => {
    const headers = 'description,objet_marche,fournisseur,methode,numero_marche,montant_marche,date_commande,statut,code_article,designation_ligne,quantite,prix_unitaire_ht,taux_tva';
    const rows = [
      'Matériel info,,TechSupply SARL,Marché Public,AO-14/2026/ME,8500000,2026-06-10,En cours,DLL-LAP,Ordinateur portable Dell,10,15000,20',
      ',TechSupply SARL,Marché Public,AO-14/2026/ME,8500000,2026-06-10,En cours,LCD-24,Écran 24" LCD,20,2500,20',
    ].join('\r\n');
    const blob = new Blob(['\uFEFF' + headers + '\r\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'modele_import_commandes.csv'; a.click();
  }, []);

  // ──────────────────────────── RENDU ────────────────────────────────
  return (
    <main className="flex-1 space-y-5 p-4 md:p-6 min-h-screen bg-gray-50/30">

      {/* Modals */}
      <AnnulationDialog open={!!annulationId} onClose={() => setAnnulationId(null)} onConfirm={confirmAnnulation} reference={commandes.find(c => c.id === annulationId)?.reference || ''} />
      <ConfirmationLivraisonDialog open={!!livraisonId} onClose={() => setLivraisonId(null)} onConfirm={marquerLivre} reference={commandes.find(c => c.id === livraisonId)?.reference || ''} />
      <ImportInfoDialog open={importInfoOpen} onClose={() => setImportInfoOpen(false)} onBack={() => { setImportInfoOpen(false); setShowImportModal(true); }} onDownloadDetail={downloadDetailModel} />

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
           Achats &amp; Commandes
          </h1>
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
            disabled={filtered.length === 0}
          />
          <Button onClick={() => openForm()} className="h-9 rounded-xl bg-[#1D6F42] text-white font-bold hover:bg-[#155430] gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nouvelle commande</span>
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={BarChart3} label="Toutes" value={stats.total} sub={`${stats.annules} annulée(s)`} colorBg="bg-[#E3F2FD]" colorText="text-[#1565C0]" isActive={kpiFilter==='all'} onClick={() => setKpiFilter('all')} />
        <KpiCard icon={Clock} label="En cours" value={stats.enCours} sub={`${(stats.montantEnCours/1000).toFixed(0)}k MAD`} colorBg="bg-amber-50" colorText="text-amber-700" isActive={kpiFilter==='enCours'} onClick={() => setKpiFilter('enCours')} />
        <KpiCard icon={Truck} label="Reçues" value={stats.livres} sub={`${(stats.montantLivre/1000).toFixed(0)}k MAD`} colorBg="bg-emerald-50" colorText="text-emerald-700" isActive={kpiFilter==='livres'} onClick={() => setKpiFilter('livres')} />
        <KpiCard icon={FileCheck} label="Marchés publics" value={stats.nbMarche} sub={`${stats.nbBC} BC`} colorBg="bg-violet-50" colorText="text-violet-700" isActive={kpiFilter==='marche'} onClick={() => setKpiFilter('marche')} />
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
                onChange={v => { setStatutFilter(v as typeof statutFilter); setPage(1); }}
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
                onChange={v => { setMethodeFilter(v as typeof methodeFilter); setPage(1); }}
                options={[
                  { value: 'all', label: 'Toutes méthodes' },
                  { value: 'Marché Public', label: 'Marché public' },
                  { value: 'Bon de Commande', label: 'Bon de commande' },
                ]}
                buttonClassName="h-9 text-xs"
              />
            </div>

            <DateRangePicker dateDebut={dateDebut} dateFin={dateFin} onDebutChange={v => { setDateDebut(v); setPage(1); }} onFinChange={v => { setDateFin(v); setPage(1); }} />
            {filtered.length > 0 && <span className="ml-auto text-[9px] font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>}
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
                ] as [string, (keyof AchatCommande)|null, string, boolean][]).map(([lbl, sk, cls, sortable]) => (
                  <th key={lbl} className={cn('px-2 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-400', cls, sortable && 'cursor-pointer hover:text-gray-600 select-none')} onClick={sortable && sk ? () => handleSort(sk) : undefined}>
                    <span className="inline-flex items-center gap-0.5">{lbl}{sortable && sk && <SortIcon k={sk} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-16 text-center"><div className="flex flex-col items-center gap-2"><Package className="w-10 h-10 text-gray-200" /><p className="text-sm font-semibold text-gray-400">Aucune commande trouvée</p><p className="text-xs text-gray-300">Modifiez vos filtres ou ajoutez une commande.</p></div></td></tr>
              ) : paginated.map(cmd => (
                <tr key={cmd.id} className={cn('group transition-colors cursor-pointer hover:bg-[#F1F8E9]/30', cmd.statut === 'Annulé' && 'opacity-60')} onClick={() => setDetailCmd(cmd)}>
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
                      {cmd.statut !== 'Annulé' && <button onClick={() => openForm(cmd)} title="Modifier" className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Edit className="w-3.5 h-3.5" /></button>}
                      {cmd.statut === 'En cours' && <button onClick={() => demanderLivraison(cmd.id)} title="Marquer reçue" className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><Truck className="w-3.5 h-3.5" /></button>}
                      {cmd.statut !== 'Annulé' && <button onClick={() => setAnnulationId(cmd.id)} title="Annuler" className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><XOctagon className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/40">
          <span className="text-[10px] text-gray-400">{filtered.length > 0 ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)} sur ${filtered.length}` : '0 commande'}</span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={cn('w-6 h-6 rounded-md text-[10px] font-semibold transition-all', page === p ? 'bg-[#1D6F42] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100')}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5" /></button>
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
                {detailCmd.statut !== 'Annulé' && <button onClick={() => openForm(detailCmd)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Edit className="w-4 h-4" /></button>}
                {detailCmd.statut === 'En cours' && <button onClick={() => demanderLivraison(detailCmd.id)} className="h-8 flex items-center gap-1 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"><Truck className="w-3.5 h-3.5" />Marquer reçue</button>}
                {detailCmd.statut !== 'Annulé' && <button onClick={() => setAnnulationId(detailCmd.id)} className="h-8 flex items-center gap-1 px-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 border border-red-200"><XOctagon className="w-3.5 h-3.5" /> Annuler</button>}
                <button onClick={() => setDetailCmd(null)} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[['Fournisseur', detailCmd.fournisseur], ['Date commande', fmtDate(detailCmd.dateCommande)], ['Statut', detailCmd.statut], ...(detailCmd.objetMarche ? [['Objet du marché', detailCmd.objetMarche]] : []), ...(detailCmd.description ? [['Description', detailCmd.description]] : []), ...(detailCmd.numeroMarche ? [['N° Marché', detailCmd.numeroMarche]] : []), ...(detailCmd.montantMarche ? [['Budget marché', `${fmtNumber(detailCmd.montantMarche)} MAD`]] : [])].map(([lbl, val]) => (<div key={lbl} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm"><p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{lbl}</p><p className="text-xs font-bold text-gray-900">{val}</p></div>))}
              </div>
              {detailCmd.statut === 'Annulé' && detailCmd.motifAnnulation && <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2"><XOctagon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" /><div><p className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-0.5">Motif d'annulation</p><p className="text-xs text-red-900 whitespace-pre-wrap">{detailCmd.motifAnnulation}</p></div></div>}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50"><h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-gray-400"/>Articles de la commande</h3></div>
                <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="bg-gray-50 border-b border-gray-100"><tr>{['Code', 'Désignation', 'Qté', 'P.U. HT (MAD)', 'TVA', 'Total HT', 'Total TTC'].map(h => (<th key={h} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-left">{h}</th>))}</tr></thead><tbody className="divide-y divide-gray-50">{detailCmd.lignes.map(l => (<tr key={l.id} className="hover:bg-gray-50/50"><td className="px-3 py-2 font-mono text-gray-500">{l.codeArticle || '—'}</td><td className="px-3 py-2 font-semibold text-gray-900">{l.designation}</td><td className="px-3 py-2 text-center font-bold">{l.quantite}</td><td className="px-3 py-2 text-right font-mono">{fmtNumber(l.prixUnitaireHT)}</td><td className="px-3 py-2 text-center">{l.tauxTVA}%</td><td className="px-3 py-2 text-right font-mono text-[#1D6F42]">{fmtNumber(calcLigneHT(l))}</td><td className="px-3 py-2 text-right font-bold font-mono">{fmtNumber(calcLigneTTC(l))}</td></tr>))}</tbody><tfoot className="bg-[#E8F5E9] border-t border-[#1D6F42]/30"><tr><td colSpan={5} className="px-3 py-2 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Totaux</td><td className="px-3 py-2 text-right font-bold font-mono text-[#1D6F42]">{fmtNumber(detailCmd.montantHT)} MAD</td><td className="px-3 py-2 text-right font-bold font-mono text-gray-900">{fmtNumber(detailCmd.montantTTC)} MAD</td></tr></tfoot></table></div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"><h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-3"><Paperclip className="w-3.5 h-3.5 text-gray-400"/>Documents joints</h3><DocumentsJointsSection documents={detailCmd.documents || []} readonly /></div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL FORMULAIRE */}
      <Dialog open={formOpen} onOpenChange={o => !o && setFormOpen(false)}>
        <DialogContent className="sm:max-w-4xl p-0 rounded-3xl border-gray-100 bg-white max-h-[92vh] flex flex-col [&>button.absolute]:hidden [&>button]:hidden">
          <DialogTitle className="sr-only">{editCmd ? 'Modifier' : 'Nouvelle commande'}</DialogTitle>
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl flex-shrink-0 flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-gray-900">{editCmd ? `Modifier — ${editCmd.reference}` : 'Nouvelle commande'}</h2>{!editCmd && <p className="text-xs text-gray-500 mt-0.5">La référence sera générée automatiquement ({new Date().getFullYear()}/XXXX).</p>}</div>
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
                    onChange={v => setForm(p => ({ ...p, methode: v as MethodeCommande, numeroMarche: '', montantMarche: undefined }))}
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
                    onChange={v => setForm(p => ({ ...p, statut: v as StatutCommande }))}
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
              <div className="overflow-x-auto rounded-xl border border-gray-100"><table className="w-full min-w-[700px] text-xs"><thead className="bg-gray-50 border-b border-gray-100"><tr><th className="px-3 py-2 text-left text-[10px] font-bold uppercase text-gray-500">Désignation <span className="text-gray-400 text-[9px]">(+ catalogue)</span> *</th><th className="px-2 py-2 text-center text-[10px] font-bold uppercase text-gray-500 w-20">Qté *</th><th className="px-2 py-2 text-right text-[10px] font-bold uppercase text-gray-500 w-32">P.U. HT *</th><th className="px-2 py-2 text-center text-[10px] font-bold uppercase text-gray-500 w-[85px]">TVA</th><th className="px-2 py-2 text-right text-[10px] font-bold uppercase text-gray-500 w-28">Total HT</th><th className="px-2 py-2 text-right text-[10px] font-bold uppercase text-[#1D6F42] w-28">Total TTC</th><th className="w-10"></th></tr></thead><tbody>{(form.lignes || []).map((ligne, i) => (<CataloguePickerRow key={ligne.id} index={i} ligne={ligne} onUpdate={(field, value) => { setForm(p => { const lignes = [...(p.lignes || [])]; lignes[i] = { ...lignes[i], [field]: value }; return { ...p, lignes }; }); }} onRemove={() => { setForm(p => ({ ...p, lignes: (p.lignes || []).filter((_, idx) => idx !== i) })); }} canRemove={(form.lignes || []).length > 1} formErrors={formErrors} />))}</tbody></table></div>
              <div className="flex justify-end gap-8 pt-2 border-t border-gray-100 text-sm font-bold text-gray-700"><span>Total HT : <span className="text-[#1D6F42]">{fmtNumber(computedTotals.ht)} MAD</span></span><span>Total TTC : <span className="text-gray-900">{fmtNumber(computedTotals.ttc)} MAD</span></span></div>
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

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  UploadCloud, CheckCircle2, AlertTriangle, Info, Download,
  ChevronRight as ChevronRightIcon, X, ChevronLeft, Loader2, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product } from '@/types/catalogue';
import { generateProductCode } from '@/lib/catalogue/mock-data';

/** Structure d'une ligne importée (avant conversion en Product). */
export interface ImportRow {
  lineNumber: number;
  code: string;
  name: string;
  category: string;
  subcategory: string;
  location: string;
  currentStock: number;
  minThreshold: number;
  avgPrice: number;
  supplier: string;
  warrantyMonths: number;
  description: string;
  weight: string;
  dimensions: string;
  material: string;
  safetyInstructions: string;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

/** Alias de noms de colonnes pour le mapping automatique. */
const COLUMN_ALIASES: Record<string, string[]> = {
  code: ['code', 'ref', 'reference', 'sku', 'article'],
  name: ['nom', 'designation', 'libelle', 'name', 'article', 'produit', 'description_courte'],
  category: ['categorie', 'category', 'famille', 'famille_article'],
  subcategory: ['sous_categorie', 'subcategory', 'sous_famille', 'type'],
  location: ['emplacement', 'location', 'rayon', 'zone', 'localisation'],
  currentStock: ['stock', 'quantite', 'qty', 'qte', 'current_stock', 'stock_actuel', 'stock_initial'],
  minThreshold: ['seuil', 'seuil_alerte', 'min', 'min_stock', 'minimum', 'threshold'],
  avgPrice: ['prix', 'price', 'pmp', 'prix_ht', 'prix_unitaire', 'tarif', 'cout'],
  supplier: ['fournisseur', 'supplier', 'vendor', 'prestataire'],
  warrantyMonths: ['garantie', 'warranty', 'warranty_months', 'garantie_mois'],
  description: ['description', 'desc', 'details', 'remarques'],
  weight: ['poids', 'weight', 'masse'],
  dimensions: ['dimensions', 'taille', 'size', 'dim'],
  material: ['matiere', 'material', 'composition', 'matériau'],
  safetyInstructions: ['consignes', 'safety', 'securite', 'precautions'],
};

// Normalise un nom d'en-tête pour la comparaison
function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[ùûü]/g, 'u')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/ç/g, 'c');
}

/** Cherche la valeur d'un champ à partir des alias. */
function mapRowToField(row: Record<string, unknown>, fieldKey: string): string {
  const aliases = COLUMN_ALIASES[fieldKey] ?? [fieldKey];
  for (const alias of aliases) {
    for (const key of Object.keys(row)) {
      if (normalizeHeader(key) === normalizeHeader(alias)) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
      }
    }
  }
  return '';
}

/** Valide une ligne brute et retourne un ImportRow. */
export function validateImportRow(
  raw: Record<string, unknown>,
  lineNumber: number,
  existingCodes: Set<string>
): ImportRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = mapRowToField(raw, 'name');
  if (!name) errors.push('Désignation manquante (obligatoire)');

  const stockRaw = mapRowToField(raw, 'currentStock');
  const currentStock = stockRaw !== '' ? Number(stockRaw) : 0;
  if (stockRaw !== '' && (isNaN(currentStock) || currentStock < 0))
    errors.push(`Quantité de stock invalide: "${stockRaw}"`);

  const code = mapRowToField(raw, 'code');
  if (!code) warnings.push('Code absent — sera auto-généré');
  else if (existingCodes.has(code)) errors.push(`Code "${code}" déjà présent dans le catalogue`);

  const category = mapRowToField(raw, 'category') || 'Général';
  if (!mapRowToField(raw, 'category')) warnings.push('Catégorie non définie');

  const thresholdRaw = mapRowToField(raw, 'minThreshold');
  const minThreshold = thresholdRaw !== '' ? Number(thresholdRaw) : 20;
  if (thresholdRaw !== '' && (isNaN(minThreshold) || minThreshold < 0))
    warnings.push(`Seuil invalide "${thresholdRaw}"`);

  const priceRaw = mapRowToField(raw, 'avgPrice');
  const avgPrice = priceRaw !== '' ? Number(priceRaw) : 0;
  if (priceRaw !== '' && (isNaN(avgPrice) || avgPrice < 0))
    warnings.push(`Prix invalide "${priceRaw}"`);

  const warrantyRaw = mapRowToField(raw, 'warrantyMonths');
  const warrantyMonths = warrantyRaw !== '' ? Number(warrantyRaw) : 0;

  return {
    lineNumber,
    code: code || '',
    name: name || '',
    category,
    subcategory: mapRowToField(raw, 'subcategory'),
    location: mapRowToField(raw, 'location'),
    currentStock: isNaN(currentStock) || currentStock < 0 ? 0 : currentStock,
    minThreshold: isNaN(minThreshold) || minThreshold < 0 ? 20 : minThreshold,
    avgPrice: isNaN(avgPrice) || avgPrice < 0 ? 0 : avgPrice,
    supplier: mapRowToField(raw, 'supplier'),
    warrantyMonths: isNaN(warrantyMonths) ? 0 : warrantyMonths,
    description: mapRowToField(raw, 'description'),
    weight: mapRowToField(raw, 'weight'),
    dimensions: mapRowToField(raw, 'dimensions'),
    material: mapRowToField(raw, 'material'),
    safetyInstructions: mapRowToField(raw, 'safetyInstructions'),
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}

/** Parse un fichier CSV ou Excel en tableau d'objets. */
async function parseFileToRows(file: File): Promise<Record<string, unknown>[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') {
    const text = await file.text();
    const content = text.replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error('Fichier CSV vide ou sans en-tête');
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += line[i];
        }
      }
      result.push(current.trim());
      return result;
    };
    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => { obj[h.trim()] = values[i] ?? ''; });
      return obj;
    }).filter((row) => Object.values(row).some((v) => String(v ?? '').trim() !== ''));
  } else if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = await import('xlsx');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  } else {
    throw new Error(`Format non supporté : ".${ext}"`);
  }
}

/**
 * Modal d'importation en trois étapes : dépôt du fichier, prévisualisation, confirmation.
 */
export default function ImportModal({
  open,
  onOpenChange,
  existingProducts,
  onImportConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingProducts: Product[];
  onImportConfirm: (rows: ImportRow[]) => void;
}) {
  type ImportStep = 'upload' | 'preview' | 'done';
  const [step, setStep] = useState<ImportStep>('upload');
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [importResult, setImportResult] = useState({ imported: 0, skipped: 0, warnings: 0 });

  const existingCodes = useMemo(() => new Set(existingProducts.map((p) => p.code)), [existingProducts]);
  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);
  const warnRows = parsedRows.filter((r) => r.isValid && r.warnings.length > 0);

  const reset = useCallback(() => {
    setStep('upload');
    setParsedRows([]);
    setFileName('');
    setParseError('');
    setLoading(false);
    setImportResult({ imported: 0, skipped: 0, warnings: 0 });
  }, []);
  useEffect(() => { if (!open) reset(); }, [open, reset]);

  const processFile = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setParseError('Le fichier dépasse 5 Mo'); return; }
    setLoading(true);
    setParseError('');
    try {
      const rawRows = await parseFileToRows(file);
      if (rawRows.length === 0) throw new Error('Aucune ligne de données');
      if (rawRows.length > 500) throw new Error(`Trop de lignes (${rawRows.length} - max 500)`);
      const validated = rawRows.map((row, i) => validateImportRow(row, i + 2, existingCodes));
      setParsedRows(validated);
      setFileName(file.name);
      setStep('preview');
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [existingCodes]);

    const handleConfirmImport = useCallback(() => {
      const toImport = validRows;
      onImportConfirm(toImport);
      setImportResult({
        imported: toImport.length,
        skipped:  invalidRows.length,
        warnings: warnRows.length,
      });
      setStep('done');
    }, [validRows, invalidRows, warnRows, onImportConfirm]);
  
    const downloadTemplate = useCallback(() => {
      const headers = 'code,nom,categorie,sous_categorie,emplacement,stock,seuil,prix,fournisseur,garantie,description,poids,dimensions,matiere,consignes';
      const example = 'PRD-100001,Ramette papier A4,Fournitures bureau,Papeterie > Papier & supports,Rayon A - A1,200,50,18.50,Acme Fournitures,0,Papier 80g qualité supérieure,2.5 kg,21x29.7 cm,Cellulose,Conserver à l\'abri de l\'humidité';
      const blob = new Blob(['\uFEFF' + headers + '\r\n' + example], { type: 'text/csv;charset=utf-8;' });
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = 'modele_import_articles.csv';
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('Modèle CSV téléchargé');
    }, []);
  
    return (
      <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset(); }}>
        <DialogContent
          onInteractOutside={(e) => {
            if ((e.target as Element).closest?.('.my-portal-dropdown')) e.preventDefault();
          }}
          onFocusOutside={(e) => {
            if ((e.target as Element).closest?.('.my-portal-dropdown')) e.preventDefault();
          }}
          className="sm:max-w-2xl rounded-2xl p-0 border-zinc-100 max-h-[90vh] flex flex-col [&>button.absolute]:hidden [&>button]:hidden"
        >
          <DialogTitle className="sr-only">Importer des articles</DialogTitle>
  
          <div className="px-6 py-4 border-b border-zinc-100 bg-white rounded-t-2xl flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1a4731] flex items-center justify-center flex-shrink-0">
                <UploadCloud className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Importer des articles</h2>
                <p className="text-xs text-zinc-500">
                  {step === 'upload'  && 'Chargez un fichier Excel ou CSV'}
                  {step === 'preview' && `${parsedRows.length} ligne(s) analysée(s) — ${validRows.length} valide(s)`}
                  {step === 'done'    && `Import terminé : ${importResult.imported} article(s) ajouté(s)`}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
  
          <div className="flex items-center px-6 py-3 bg-zinc-50 border-b border-zinc-100 gap-2 flex-shrink-0">
            {([
              { id: 'upload',  label: '1. Fichier'   },
              { id: 'preview', label: '2. Vérification' },
              { id: 'done',    label: '3. Résultat'  },
            ] as { id: ImportStep; label: string }[]).map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className={cn(
                  'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
                  step === s.id ? 'bg-[#1a4731] text-white' : 'text-zinc-400',
                )}>
                  <span className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black',
                    step === s.id ? 'bg-white text-[#1a4731]' : 'bg-zinc-200 text-zinc-500',
                  )}>{idx + 1}</span>
                  {s.label}
                </div>
                {idx < 2 && <ChevronRightIcon className="w-3 h-3 text-zinc-300 flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
  
          <div className="flex-1 overflow-y-auto">
  
            {step === 'upload' && (
              <div className="p-6 space-y-4">
                <div
                  className={cn(
                    'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group',
                    isDragOver ? 'border-[#1a4731] bg-[#E8F5E9]' : 'border-zinc-200 bg-zinc-50 hover:bg-[#E8F5E9] hover:border-[#1a4731]',
                    loading && 'pointer-events-none opacity-60',
                  )}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={e => {
                    e.preventDefault(); setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) processFile(file);
                  }}
                  onClick={() => {
                    if (loading) return;
                    const input = document.createElement('input');
                    input.type = 'file'; input.accept = '.csv,.xlsx,.xls';
                    input.onchange = e => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) processFile(file);
                    };
                    input.click();
                  }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    {loading
                      ? <Loader2 className="w-7 h-7 text-[#1a4731] animate-spin" />
                      : <UploadCloud className="w-7 h-7 text-[#1a4731]" />}
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">
                    {loading ? 'Analyse en cours…' : isDragOver ? 'Relâchez le fichier…' : 'Cliquez ou glissez votre fichier'}
                  </h3>
                  <p className="text-xs text-zinc-500">.xlsx, .xls, .csv — Max 5 Mo · 500 lignes max</p>
                </div>
  
                {parseError && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-100">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-medium">{parseError}</p>
                  </div>
                )}
  
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Champs obligatoires</p>
                  </div>
                  <div className="space-y-1">
                    {[
                      { field: 'nom / designation', desc: 'Désignation de l\'article' },
                    ].map(({ field, desc }) => (
                      <div key={field} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        <code className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{field}</code>
                        <span className="text-[10px] text-amber-700">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
  
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                    <p className="text-xs font-semibold text-zinc-600">Colonnes reconnues (optionnelles sauf nom)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {[
                      { col: 'code / ref / sku',                label: 'Référence article'  },
                      { col: 'nom / designation / libelle',     label: 'Désignation ★'      },
                      { col: 'categorie / famille',             label: 'Catégorie'           },
                      { col: 'sous_categorie',                  label: 'Sous-catégorie'      },
                      { col: 'stock / quantite / qty',          label: 'Quantité en stock'   },
                      { col: 'seuil / min',                     label: 'Seuil d\'alerte'     },
                      { col: 'prix / pmp / prix_ht',            label: 'Prix unitaire'       },
                      { col: 'fournisseur / supplier',          label: 'Fournisseur'         },
                      { col: 'emplacement / location',          label: 'Emplacement'         },
                      { col: 'garantie / warranty_months',      label: 'Garantie (mois)'     },
                      { col: 'description',                     label: 'Description'         },
                      { col: 'poids / weight',                  label: 'Poids'               },
                    ].map(({ col, label }) => (
                      <div key={col} className="flex items-start gap-1.5">
                        <span className={cn('text-[9px] font-black flex-shrink-0 mt-0.5', label.includes('★') ? 'text-amber-500' : 'text-zinc-400')}>
                          {label.includes('★') ? '★' : '·'}
                        </span>
                        <div>
                          <code className="text-[9px] font-mono text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded">{col}</code>
                          <span className="text-[9px] text-zinc-400 ml-1">{label.replace(' ★', '')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
  
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500 hover:bg-zinc-50 hover:text-[#1a4731] hover:border-[#1a4731] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Télécharger le modèle CSV
                </button>
              </div>
            )}
  
            {step === 'preview' && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <p className="text-xl font-black text-emerald-700">{validRows.length}</p>
                    <p className="text-[10px] font-semibold text-emerald-600">Valide(s)</p>
                  </div>
                  <div className={cn('p-3 rounded-xl border text-center', invalidRows.length > 0 ? 'bg-red-50 border-red-100' : 'bg-zinc-50 border-zinc-100')}>
                    <p className={cn('text-xl font-black', invalidRows.length > 0 ? 'text-red-700' : 'text-zinc-400')}>{invalidRows.length}</p>
                    <p className={cn('text-[10px] font-semibold', invalidRows.length > 0 ? 'text-red-600' : 'text-zinc-400')}>Invalide(s)</p>
                  </div>
                  <div className={cn('p-3 rounded-xl border text-center', warnRows.length > 0 ? 'bg-amber-50 border-amber-100' : 'bg-zinc-50 border-zinc-100')}>
                    <p className={cn('text-xl font-black', warnRows.length > 0 ? 'text-amber-700' : 'text-zinc-400')}>{warnRows.length}</p>
                    <p className={cn('text-[10px] font-semibold', warnRows.length > 0 ? 'text-amber-600' : 'text-zinc-400')}>Avec avertis.</p>
                  </div>
                </div>
  
                {validRows.length === 0 && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-100">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-medium">
                      Aucune ligne valide. Corrigez votre fichier et réessayez.
                    </p>
                  </div>
                )}
  
                <div className="rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Prévisualisation — {parsedRows.length} ligne(s) · fichier : {fileName}
                    </p>
                    <p className="text-[10px] text-zinc-400">Seules les lignes valides seront importées</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-zinc-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Ligne</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Désignation</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Catégorie</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Stock</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Seuil</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {parsedRows.map(row => (
                          <tr key={row.lineNumber} className={cn(
                            'hover:bg-zinc-50 transition-colors',
                            !row.isValid && 'bg-red-50/60',
                          )}>
                            <td className="px-3 py-2 text-zinc-400 font-mono">{row.lineNumber}</td>
                            <td className="px-3 py-2 font-medium text-zinc-800 max-w-[160px] truncate">
                              {row.name || <span className="italic text-red-400">manquant</span>}
                            </td>
                            <td className="px-3 py-2 text-zinc-500 max-w-[120px] truncate">{row.category}</td>
                            <td className="px-3 py-2 text-center font-semibold text-zinc-700">{row.currentStock}</td>
                            <td className="px-3 py-2 text-center text-zinc-500">{row.minThreshold}</td>
                            <td className="px-3 py-2 text-center">
                              {!row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
                                  <X className="w-2.5 h-2.5" />
                                  {row.errors.length} erreur(s)
                                </span>
                              ) : row.warnings.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {row.warnings.length} avert.
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                                  <Check className="w-2.5 h-2.5" />OK
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
  
                {invalidRows.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100 space-y-2">
                    <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Lignes avec erreurs (seront ignorées)
                    </p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {invalidRows.map(row => (
                        <div key={row.lineNumber} className="text-[10px] text-red-600">
                          <span className="font-bold">Ligne {row.lineNumber} :</span>{' '}
                          {row.errors.join(' · ')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
  
                {warnRows.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Avertissements (lignes importées avec valeurs corrigées)
                    </p>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {warnRows.map(row => (
                        <div key={row.lineNumber} className="text-[10px] text-amber-700">
                          <span className="font-bold">Ligne {row.lineNumber} :</span>{' '}
                          {row.warnings.join(' · ')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
  
            {step === 'done' && (
              <div className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">Import terminé</h3>
                  <p className="text-sm text-zinc-500">
                    {importResult.imported} article(s) ajouté(s) avec succès
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <p className="text-xl font-black text-emerald-700">{importResult.imported}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">Importé(s)</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                    <p className="text-xl font-black text-red-600">{importResult.skipped}</p>
                    <p className="text-[10px] text-red-500 font-semibold">Ignoré(s)</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                    <p className="text-xl font-black text-amber-700">{importResult.warnings}</p>
                    <p className="text-[10px] text-amber-600 font-semibold">Avertis.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
  
          <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/80 rounded-b-2xl flex items-center justify-between flex-shrink-0">
            <div>
              {step === 'preview' && (
                <button
                  type="button"
                  onClick={reset}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Retour
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-zinc-200 font-bold text-sm h-9"
              >
                {step === 'done' ? 'Fermer' : 'Annuler'}
              </Button>
              {step === 'preview' && (
                <Button
                  disabled={validRows.length === 0}
                  onClick={handleConfirmImport}
                  className="rounded-xl h-9 bg-[#1a4731] hover:bg-[#153d28] text-white text-sm font-bold px-5 disabled:opacity-40 flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  Importer {validRows.length} article(s)
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }